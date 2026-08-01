/**
 * Sanga Firestore Database Seeder Script
 * 
 * This script seeds the Firestore database collections with initial mock data:
 * - site_settings
 * - events (camps and gatherings)
 * - store_products
 * - product_inventory (sizing variants stock counts)
 * - resources
 * 
 * Usage:
 * 1. Ensure you have enabled Firestore Database in your Firebase Console.
 * 2. Create a local .env.local file with your Firebase configuration variables.
 * 3. Run: node scripts/seed_firestore.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { deleteDoc, doc, getFirestore, setDoc } from 'firebase/firestore';

// Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigured) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Firebase configuration variables not found in environment or .env.local!');
  console.log('Please define NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID inside .env.local first.');
  process.exit(1);
}

console.log('Initializing Firebase Client for Project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data Mock structures
const mockSiteSettings = {
  color_palette: "default",
  hero_headline: "Connecting Young Adults to Ancient Bhakti Wisdom",
  hero_subheadline: "Sanga Initiative hosts residential retreats, kirtan gatherings, and spiritual education camps designed for seekers aged 18 to 35.",
  hero_video_youtube_url: "https://www.youtube.com/watch?v=F087o5V0Gv8",
  hero_slideshow_images: [
    "/gathering-campfire.png",
    "/gathering-kirtan.png",
    "/gathering-group.png"
  ],
  support_headline: "Fuel the Kirtan Movement",
  support_body: "Sanga Initiative is a registered 501(c)(3) non-profit organization. Every dollar donated directly funds scholarships, camp accommodations, and book distribution for young adults.",
  support_stripe_donation_link: "https://donate.stripe.com/mock-sanga-donation",
  whatsapp_announcement_link: "https://chat.whatsapp.com/mock-announcements",
  whatsapp_study_link: "https://chat.whatsapp.com/mock-study-circle",
  whatsapp_regional_link: "https://chat.whatsapp.com/mock-regional-circles"
};

const mockEvents = [
  {
    id: 1,
    title: "TSI East Coast Summit 2026",
    slug: "tsi-east-coast-2026",
    category: "Retreat",
    age_range: "18-30",
    start_date: "2026-07-30",
    end_date: "2026-08-03",
    location: "New Vrindaban, WV",
    price: "$375",
    status: "open",
    short_description: "A deep dive kirtan and workshop retreat in West Virginia for young adults aged 18 to 30.",
    long_description: "The Summit Retreat is Sanga's landmark spiritual retreat for young adults aged 18–30. Running from Thursday evening through midday Monday in the peaceful hills of New Vrindaban, West Virginia, this retreat covers accommodations, organic prasadam meals, interactive seminars, complimentary merchandise, and supplies. It is designed to spark deep devotional connections, introspective workshops, and ecstatic community kirtans.",
    external_checkout_url: "https://www.sangainitiative.org/summit-retreat/tsi-east-coast-2026-5sxa6",
    hero_image: "http://static1.squarespace.com/static/55c3a641e4b01d44af64ae03/6a3d45657818225b42c98d27/6a3d42e826a7ae482e75f992/1783435829951/Summit26+Registration+1x1+%281%29.png?format=1500w",
    gallery_images: [
      "http://static1.squarespace.com/static/55c3a641e4b01d44af64ae03/6a3d45657818225b42c98d27/6a3d42e826a7ae482e75f992/1783435829951/Summit26+Registration+1x1+%281%29.png?format=1500w"
    ],
    featured_on_homepage: true,
    published: true,
    highlights: [
      "Ecstatic daily kirtans in the hills of West Virginia",
      "Interactive wisdom panels & philosophy workshops",
      "Delicious organic plant-based prasadam meals daily",
      "Includes complimentary Sanga Rebrand merchandise"
    ],
    schedule: [
      { time_label: "7:00 AM", title: "Morning meditation & reflections", description: "Quiet chanting and mantra meditation in the temple." },
      { time_label: "9:00 AM", title: "Healthy breakfast feast", description: "Fresh oatmeal, fruits, and hot herbal teas." },
      { time_label: "10:30 AM", title: "Morning wisdom panel", description: "Interactive philosophy seminars with guest speakers." },
      { time_label: "1:00 PM", title: "Lunch and outdoor recreation", description: "Enjoy nature trails and networking with attendees." }
    ],
    faqs: [
      { question: "Is transportation provided?", answer: "Carpools are coordinated from major East Coast hubs. Detail forms will be sent to all registrants." },
      { question: "What is the refund policy?", answer: "Full refunds are available until June 30, 2026. After that date, registrations are non-refundable." }
    ],
    people: [
      { name: "Govinda Dev", role: "Retreat Organizer", bio: "Leading young adult camps for years, focusing on community bhakti.", image_url: "" }
    ]
  }
];

const mockStoreProducts = [
  {
    id: 1,
    product_title: "Sanga Rebrand Hoodie",
    slug: "sanga-hoodie",
    description: "Premium heavy-blend cotton hoodie featuring the clean classic logo on the chest. Designed to keep you warm and cozy at outdoor kirtans.",
    image: "/merch-hoodie.png",
    price: "$45",
    status: "coming-soon",
    stripe_price_id: "",
    stripe_product_id: "",
    featured: true,
    published: true
  }
];

const mockResources = [
  {
    id: 1,
    title: "Introduction to Kirtan Guitar & Harmonium",
    category: "Music Guide",
    description: "Learn basic chord structures, transitions, and rhythm patterns for traditional and contemporary kirtan melodies.",
    external_url: "https://docs.google.com/document/d/1buSUGiT-voofCDjLYUFBH5obrMgUoZAhY5tbPBd_GXQ/edit?usp=sharing",
    published: true,
    sort_order: 1
  }
];

const productInventory = [
  // Product ID 1 (Hoodie)
  { product_id: 1, size: 'S', stock: 5 },
  { product_id: 1, size: 'M', stock: 10 },
  { product_id: 1, size: 'L', stock: 15 },
  { product_id: 1, size: 'XL', stock: 3 }
];

async function seed() {
  try {
    console.log('Cleaning up previous store products, events & inventory...');
    const productsToDelete = [1, 2, 3, 4, 5];
    const eventsToDelete = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const inventoryToDelete = [
      '1_S', '1_M', '1_L', '1_XL', '1_OS',
      '2_S', '2_M', '2_L', '2_XL', '2_OS',
      '3_S', '3_M', '3_L', '3_XL', '3_OS',
      '4_S', '4_M', '4_L', '4_XL', '4_OS',
      '5_S', '5_M', '5_L', '5_XL', '5_OS'
    ];
    for (const id of productsToDelete) {
      await deleteDoc(doc(db, 'store_products', String(id)));
    }
    for (const id of eventsToDelete) {
      await deleteDoc(doc(db, 'events', String(id)));
    }
    for (const key of inventoryToDelete) {
      await deleteDoc(doc(db, 'product_inventory', key));
    }
    console.log('Cleanup finished!');

    console.log('Seeding site_settings collection...');
    for (const [key, val] of Object.entries(mockSiteSettings)) {
      const docRef = doc(db, 'site_settings', key);
      await setDoc(docRef, { value: val }, { merge: true });
    }
    console.log('Site settings seeded successfully!');

    console.log('Seeding events collection...');
    for (const ev of mockEvents) {
      const docRef = doc(db, 'events', String(ev.id));
      await setDoc(docRef, ev);
    }
    console.log('Events seeded successfully!');

    console.log('Seeding store_products collection...');
    for (const pr of mockStoreProducts) {
      const docRef = doc(db, 'store_products', String(pr.id));
      await setDoc(docRef, pr);
    }
    console.log('Store products seeded successfully!');

    console.log('Seeding product_inventory collection...');
    for (const item of productInventory) {
      const docRef = doc(db, 'product_inventory', `${item.product_id}_${item.size}`);
      await setDoc(docRef, item);
    }
    console.log('Product inventory seeded successfully!');

    console.log('Seeding resources collection...');
    for (const res of mockResources) {
      const docRef = doc(db, 'resources', String(res.id));
      await setDoc(docRef, res);
    }
    console.log('Resources seeded successfully!');

    console.log('\x1b[32m%s\x1b[0m', 'Success: Database seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Seeding failed with error:');
    console.error(err);
    process.exit(1);
  }
}

seed();
