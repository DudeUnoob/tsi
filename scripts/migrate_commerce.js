/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

loadEnvConfig(process.cwd());

const apply = process.argv.includes('--apply');

function initializeAdmin() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const service = JSON.parse(raw);
    return initializeApp({
      credential: cert({
        projectId: service.project_id,
        clientEmail: service.client_email,
        privateKey: service.private_key.replace(/\\n/g, '\n'),
      }),
      projectId: service.project_id,
    });
  }
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function priceToCents(value) {
  const numeric = Number(String(value || '0').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error(`Invalid price: ${value}`);
  return Math.round(numeric * 100);
}

async function main() {
  const db = getFirestore(initializeAdmin());
  const [products, inventory, orders] = await Promise.all([
    db.collection('store_products').get(),
    db.collection('product_inventory').get(),
    db.collection('orders').get(),
  ]);

  const backup = {
    created_at: new Date().toISOString(),
    products: products.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    inventory: inventory.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    orders: orders.docs.map(doc => ({ id: doc.id, ...doc.data() })),
  };
  const changes = [];
  const inventoryByProduct = new Map();
  for (const doc of inventory.docs) {
    const data = doc.data();
    const productId = Number(data.product_id);
    const variants = inventoryByProduct.get(productId) || [];
    variants.push(String(data.variant || data.size || 'OS').toUpperCase());
    inventoryByProduct.set(productId, variants);
  }

  for (const doc of products.docs) {
    const data = doc.data();
    const productId = Number(data.id || doc.id);
    const variants = inventoryByProduct.get(productId) || [];
    const update = {
      price_cents: Number.isInteger(data.price_cents) ? data.price_cents : priceToCents(data.price),
      currency: 'usd',
      variant_type: variants.length > 0 && variants.every(variant => variant === 'OS') ? 'one_size' : 'size',
      status: data.status === 'unavailable' ? 'unavailable' : 'available',
      updated_at: new Date().toISOString(),
    };
    changes.push({ collection: 'store_products', id: doc.id, update });
  }

  for (const doc of inventory.docs) {
    const data = doc.data();
    const onHand = Number(data.on_hand ?? data.stock ?? 0);
    const reserved = Number(data.reserved ?? 0);
    const variant = String(data.variant || data.size || 'OS').toUpperCase();
    const update = {
      variant,
      size: variant,
      on_hand: onHand,
      reserved,
      sold: Number(data.sold ?? 0),
      stock: Math.max(0, onHand - reserved),
      updated_at: new Date().toISOString(),
    };
    changes.push({ collection: 'product_inventory', id: doc.id, update });
  }

  for (const doc of orders.docs) {
    const data = doc.data();
    if (data.payment_status) continue;
    const paid = data.status === 'paid' || data.status === 'completed';
    const update = {
      payment_status: paid ? 'paid' : data.status === 'cancelled' ? 'failed' : 'pending',
      fulfillment_status: data.status === 'completed'
        ? 'completed'
        : data.status === 'cancelled'
          ? 'cancelled'
          : 'unfulfilled',
      reservation_status: paid ? 'committed' : 'released',
      total_cents: Math.round(Number(data.total_amount || 0) * 100),
      shipping_cents: 500,
      legacy_import: true,
      updated_at: new Date().toISOString(),
    };
    changes.push({ collection: 'orders', id: doc.id, update });
  }

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', changes }, null, 2));
  if (!apply) return;

  const backupDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `commerce-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  for (let offset = 0; offset < changes.length; offset += 450) {
    const batch = db.batch();
    for (const change of changes.slice(offset, offset + 450)) {
      batch.set(
        db.collection(change.collection).doc(change.id),
        change.update,
        { merge: true },
      );
    }
    await batch.commit();
  }
  console.log(`Backup: ${backupPath}`);
  console.log(`Applied ${changes.length} commerce migrations.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
