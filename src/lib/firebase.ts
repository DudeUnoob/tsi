import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, orderBy, where, writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { 
  SiteSettings, Event, StoreProduct, Resource
} from './types';
export type { SiteSettings, Event, StoreProduct, Resource };

export interface Order {
  id: number;
  order_ref: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  items: Array<{
    id: number;
    product_title: string;
    price: string;
    quantity: number;
    size: string;
  }>;
  created_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  event_title?: string;
  full_name: string;
  email: string;
  age: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  dietary_restrictions: string;
  medical_info: string;
  status: 'registered' | 'cancelled' | 'attended';
  created_at: string;
}



const defaultMockOrders: Order[] = [
  {
    id: 1,
    order_ref: "mock_1718000000001",
    customer_name: "Gauranga Dasa",
    customer_email: "gauranga@gmail.com",
    shipping_address: "108 Bhakti Way, Gita Town, PA 19525",
    total_amount: 47.50,
    status: 'paid',
    items: [
      { id: 1, product_title: "Sanga Classic Tee", price: "$25.00", quantity: 1, size: "L" },
      { id: 2, product_title: "Sanga Rebrand Cap", price: "$15.00", quantity: 1, size: "One Size" }
    ],
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    order_ref: "mock_1718000000002",
    customer_name: "Radha Devi",
    customer_email: "radha.devi@gmail.com",
    shipping_address: "24 Vrindavan Garden, Los Angeles, CA 90034",
    total_amount: 85.00,
    status: 'completed',
    items: [
      { id: 3, product_title: "Sanga Cozy Hoodie", price: "$50.00", quantity: 1, size: "M" },
      { id: 1, product_title: "Sanga Classic Tee", price: "$25.00", quantity: 1, size: "S" }
    ],
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

const defaultMockRegistrations: EventRegistration[] = [
  {
    id: 1,
    event_id: 1,
    event_title: "Camp Ignite (11–17)",
    full_name: "Krishna Dasa",
    email: "krishna.dasa@outlook.com",
    age: "15",
    phone: "215-555-0199",
    emergency_contact_name: "Balarama Dasa",
    emergency_contact_phone: "215-555-0108",
    dietary_restrictions: "Nut allergy, vegetarian (no onions/garlic)",
    medical_info: "Carries an EpiPen",
    status: 'registered',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    event_id: 2,
    event_title: "Heartspace",
    full_name: "Vishnu Sharma",
    email: "vishnu.sharma@yahoo.com",
    age: "24",
    phone: "415-555-0177",
    emergency_contact_name: "Sarasvati Devi",
    emergency_contact_phone: "415-555-0122",
    dietary_restrictions: "None, vegan preferred",
    medical_info: "None",
    status: 'registered',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];


// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your-firebase-api-key' &&
  firebaseConfig.projectId !== 'your-firebase-project-id'
);

const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined) {
        clean[key] = null;
      } else {
        clean[key] = sanitizeObject(val);
      }
    }
    return clean;
  }
  return obj;
}

const defaultSiteSettings: SiteSettings = {
  hero_headline: "Connecting Young Adults to Ancient Bhakti Wisdom",
  hero_subheadline: "Sanga Initiative hosts residential retreats, kirtan gatherings, and spiritual education camps designed for seekers aged 18 to 35.",
  primary_cta_label: "Join a Gathering",
  primary_cta_url: "/gatherings",
  secondary_cta_label: "See Details",
  secondary_cta_url: "#details",
  intro_headline: "Connecting Vaishnava Youth",
  intro_text: "",
  community_headline: "",
  community_text: "",
  support_headline: "Support Sanga",
  support_text: "",
  whatsapp_url: "",
  instagram_url: "",
  facebook_url: "",
  contact_email: "",
  one_time_donation_url: "",
  monthly_donation_url: "",
  color_palette: "default",
  hero_slideshow_images: [],
  hero_slideshow_labels: [],
  hero_slideshow_hidden: false
};

// Helper: Safe LocalStorage operations
function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setLocalStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

// ----------------------------------------------------
// Custom Store Product Inventory Model
// ----------------------------------------------------
export interface ProductInventory {
  id?: number;
  product_id: number;
  size: string;
  stock: number;
}

const defaultMockInventory: ProductInventory[] = [
  // Product ID 1 (Hoodie)
  { product_id: 1, size: 'S', stock: 5 },
  { product_id: 1, size: 'M', stock: 10 },
  { product_id: 1, size: 'L', stock: 15 },
  { product_id: 1, size: 'XL', stock: 3 },
  // Product ID 2 (Beanie)
  { product_id: 2, size: 'OS', stock: 25 },
  // Product ID 3 (Tote Bag)
  { product_id: 3, size: 'OS', stock: 20 },
  // Product ID 4 (T-Shirt Linen)
  { product_id: 4, size: 'S', stock: 8 },
  { product_id: 4, size: 'M', stock: 12 },
  { product_id: 4, size: 'L', stock: 10 },
  { product_id: 4, size: 'XL', stock: 5 },
  // Product ID 5 (T-Shirt Plum)
  { product_id: 5, size: 'S', stock: 6 },
  { product_id: 5, size: 'M', stock: 10 },
  { product_id: 5, size: 'L', stock: 8 },
  { product_id: 5, size: 'XL', stock: 4 }
];

// ----------------------------------------------------
// Core Database Read Operations
// ----------------------------------------------------

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isFirebaseConfigured) {
    return defaultSiteSettings;
  }
  try {
    const colRef = collection(db!, 'site_settings');
    const snap = await getDocs(colRef);
    const settings = { ...defaultSiteSettings };
    snap.forEach(docSnap => {
      const key = docSnap.id;
      const val = docSnap.data().value;
      if (key in settings) {
        (settings as any)[key] = val;
      }
    });
    return settings;
  } catch (e) {
    console.error("Firebase getSiteSettings error:", e);
    return defaultSiteSettings;
  }
}

export async function getEvents(options?: { featuredOnly?: boolean; all?: boolean }): Promise<Event[]> {
  if (!isFirebaseConfigured) {
    let list: Event[] = [];
    const stored = getLocalStorageItem('sanga_mock_events');
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    if (options?.featuredOnly) {
      list = list.filter(e => e.featured_on_homepage);
    }
    if (!options?.all) {
      list = list.filter(e => e.published);
    }
    return list;
  }
  try {
    const colRef = collection(db!, 'events');
    const snap = await getDocs(colRef);
    let list: Event[] = [];
    snap.forEach(docSnap => {
      list.push({ id: Number(docSnap.id), ...docSnap.data() } as Event);
    });
    if (options?.featuredOnly) {
      list = list.filter(e => e.featured_on_homepage);
    }
    if (!options?.all) {
      list = list.filter(e => e.published);
    }
    return list;
  } catch (e) {
    console.error("Firebase getEvents error:", e);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
  try {
    const events = await getEvents({ all: true });
    return events.find(e => e.slug === slug);
  } catch {
    return undefined;
  }
}

export async function getProducts(options?: { featuredOnly?: boolean; all?: boolean }): Promise<StoreProduct[]> {
  if (!isFirebaseConfigured) {
    let products: StoreProduct[] = [];
    const stored = getLocalStorageItem('sanga_mock_products');
    if (stored) {
      try { products = JSON.parse(stored); } catch {}
    }
    if (options?.featuredOnly) {
      products = products.filter(p => p.featured);
    }
    if (!options?.all) {
      products = products.filter(p => p.published);
    }
    return products;
  }
  try {
    const colRef = collection(db!, 'store_products');
    const snap = await getDocs(colRef);
    let list: StoreProduct[] = [];
    snap.forEach(docSnap => {
      list.push({ id: Number(docSnap.id), ...docSnap.data() } as StoreProduct);
    });
    if (options?.featuredOnly) {
      list = list.filter(p => p.featured);
    }
    if (!options?.all) {
      list = list.filter(p => p.published);
    }
    return list;
  } catch (e) {
    console.error("Firebase getProducts error:", e);
    return [];
  }
}

export async function getResources(options?: { publishedOnly?: boolean }): Promise<Resource[]> {
  if (!isFirebaseConfigured) {
    let list: Resource[] = [];
    const stored = getLocalStorageItem('sanga_mock_resources');
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    if (options?.publishedOnly) {
      list = list.filter(r => r.published);
    }
    return list;
  }
  try {
    const colRef = collection(db!, 'resources');
    const snap = await getDocs(colRef);
    let list: Resource[] = [];
    snap.forEach(docSnap => {
      list.push({ id: Number(docSnap.id), ...docSnap.data() } as Resource);
    });
    if (options?.publishedOnly) {
      list = list.filter(r => r.published);
    }
    return list;
  } catch (e) {
    console.error("Firebase getResources error:", e);
    return [];
  }
}

// ----------------------------------------------------
// Public Forms and Signups
// ----------------------------------------------------

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_subscribers');
    let list = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    if (list.some((s: any) => s.email === email)) {
      return { success: true, message: "Already subscribed (Local Mode)" };
    }
    list.push({ email, subscribed_at: new Date().toISOString() });
    setLocalStorageItem('sanga_mock_subscribers', JSON.stringify(list));
    return { success: true, message: "Subscribed successfully (Local Mode)" };
  }
  try {
    const docRef = doc(db!, 'newsletter_subscribers', email.toLowerCase().trim());
    await setDoc(docRef, {
      email: email.toLowerCase().trim(),
      subscribed_at: new Date().toISOString()
    });
    return { success: true, message: "Subscribed successfully" };
  } catch (e) {
    console.error("Firebase subscribeNewsletter error:", e);
    return { success: false, message: "Subscription failed" };
  }
}

export async function submitContactForm(name: string, email: string, message: string): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_messages');
    let list = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    list.push({
      id: `msg_${Date.now()}`,
      name,
      email,
      message,
      reviewed: false,
      submitted_at: new Date().toISOString()
    });
    setLocalStorageItem('sanga_mock_messages', JSON.stringify(list));
    return { success: true, message: "Feedback sent (Local Mode)" };
  }
  try {
    const colRef = collection(db!, 'contact_messages');
    const docRef = doc(colRef);
    await setDoc(docRef, {
      name,
      email,
      message,
      reviewed: false,
      submitted_at: new Date().toISOString()
    });
    return { success: true, message: "Message sent successfully" };
  } catch (e) {
    console.error("Firebase submitContactForm error:", e);
    return { success: false, message: "Failed to send message" };
  }
}

// ----------------------------------------------------
// Orders & Registrations Management
// ----------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_orders');
    if (!stored) {
      setLocalStorageItem('sanga_mock_orders', JSON.stringify(defaultMockOrders));
      return defaultMockOrders;
    }
    try { return JSON.parse(stored); } catch { return defaultMockOrders; }
  }
  try {
    const colRef = collection(db!, 'orders');
    const snap = await getDocs(colRef);
    const list: Order[] = [];
    snap.forEach(docSnap => {
      list.push({ ...docSnap.data(), id: Number(docSnap.id) || 0 } as Order);
    });
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (e) {
    console.error("Firebase getOrders error:", e);
    return defaultMockOrders;
  }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<{ success: boolean; order?: Order; message?: string }> {
  if (!isFirebaseConfigured) {
    const orders = await getOrders();
    const newOrder: Order = {
      ...orderData,
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    setLocalStorageItem('sanga_mock_orders', JSON.stringify([newOrder, ...orders]));
    return { success: true, order: newOrder };
  }
  try {
    const docRef = doc(db!, 'orders', orderData.order_ref);
    const newOrder = {
      ...orderData,
      created_at: new Date().toISOString()
    };
    await setDoc(docRef, newOrder);
    return { success: true, order: { ...newOrder, id: Date.now() } as any };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase createOrder error:", err);
    return { success: false, message: err.message };
  }
}

export async function updateOrderStatus(orderRef: string, status: Order['status']): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    const orders = await getOrders();
    const idx = orders.findIndex(o => o.order_ref === orderRef);
    if (idx !== -1) {
      const oldStatus = orders[idx].status;
      orders[idx].status = status;
      setLocalStorageItem('sanga_mock_orders', JSON.stringify(orders));
      if (status === 'paid' && oldStatus !== 'paid') {
        for (const item of orders[idx].items) {
          await decrementProductInventory(item.id, item.size, item.quantity);
        }
      }
      return { success: true };
    }
    return { success: false, message: "Order not found" };
  }
  try {
    const docRef = doc(db!, 'orders', orderRef);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, message: "Order not found" };
    
    const order = docSnap.data() as Order;
    const oldStatus = order.status;
    
    await updateDoc(docRef, { status });
    
    if (status === 'paid' && oldStatus !== 'paid' && order.items) {
      for (const item of order.items) {
        await decrementProductInventory(item.id, item.size, item.quantity);
      }
    }
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase updateOrderStatus error:", err);
    return { success: false, message: err.message };
  }
}

export async function getEventRegistrations(eventId?: number): Promise<EventRegistration[]> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_registrations');
    let list = defaultMockRegistrations;
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    } else {
      setLocalStorageItem('sanga_mock_registrations', JSON.stringify(defaultMockRegistrations));
    }
    const listWithTitles = list.map(reg => {
      return {
        ...reg,
        event_title: `Event #${reg.event_id}`
      };
    });
    if (eventId) {
      return listWithTitles.filter(r => r.event_id === eventId);
    }
    return listWithTitles;
  }
  try {
    const colRef = collection(db!, 'registrations');
    const snap = await getDocs(colRef);
    const list: EventRegistration[] = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as EventRegistration;
      const evDoc = await getDoc(doc(db!, 'events', String(data.event_id)));
      const event_title = evDoc.exists() ? (evDoc.data()?.title as string) : `Event #${data.event_id}`;
      list.push({
        ...data,
        id: Number(docSnap.id) || Date.now(),
        event_title
      });
    }
    if (eventId) {
      return list.filter(r => r.event_id === eventId);
    }
    return list;
  } catch (e) {
    console.error("Firebase getEventRegistrations error:", e);
    return defaultMockRegistrations;
  }
}

export async function createEventRegistration(regData: Omit<EventRegistration, 'id' | 'created_at'>): Promise<{ success: boolean; registration?: EventRegistration; message?: string }> {
  if (!isFirebaseConfigured) {
    const registrations = await getEventRegistrations();
    const newReg: EventRegistration = {
      ...regData,
      id: registrations.length > 0 ? Math.max(...registrations.map(r => r.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };
    setLocalStorageItem('sanga_mock_registrations', JSON.stringify([newReg, ...registrations]));
    return { success: true, registration: newReg };
  }
  try {
    const colRef = collection(db!, 'registrations');
    const docRef = doc(colRef);
    const newReg = {
      ...regData,
      created_at: new Date().toISOString()
    };
    await setDoc(docRef, newReg);
    return { success: true, registration: { ...newReg, id: Date.now() } as any };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase createEventRegistration error:", err);
    return { success: false, message: err.message };
  }
}

// ----------------------------------------------------
// Store Product Size Inventory Management
// ----------------------------------------------------

export async function getProductInventory(productId: number): Promise<ProductInventory[]> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_inventory');
    let list = defaultMockInventory;
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    } else {
      setLocalStorageItem('sanga_mock_inventory', JSON.stringify(defaultMockInventory));
    }
    return list.filter(item => item.product_id === productId);
  }
  try {
    const colRef = collection(db!, 'product_inventory');
    const snap = await getDocs(colRef);
    const list: ProductInventory[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (Number(data.product_id) === productId) {
        list.push({
          product_id: Number(data.product_id),
          size: String(data.size),
          stock: Number(data.stock)
        });
      }
    });
    return list;
  } catch (e) {
    console.error("Firebase getProductInventory error:", e);
    return defaultMockInventory.filter(item => item.product_id === productId);
  }
}

export async function saveProductInventory(productId: number, inventoryItems: { size: string; stock: number }[]): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_inventory');
    let list = defaultMockInventory;
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    const other = list.filter(item => item.product_id !== productId);
    const added = inventoryItems.map(item => ({
      product_id: productId,
      size: item.size.toUpperCase(),
      stock: item.stock
    }));
    setLocalStorageItem('sanga_mock_inventory', JSON.stringify([...other, ...added]));
    return { success: true };
  }
  try {
    const batch = writeBatch(db!);
    const sizes = ['S', 'M', 'L', 'XL', 'OS'];
    
    // Clear old variant records
    for (const size of sizes) {
      const docRef = doc(db!, 'product_inventory', `${productId}_${size}`);
      batch.delete(docRef);
    }
    
    // Set new variants
    for (const item of inventoryItems) {
      const sizeKey = item.size.toUpperCase();
      const docRef = doc(db!, 'product_inventory', `${productId}_${sizeKey}`);
      batch.set(docRef, {
        product_id: productId,
        size: sizeKey,
        stock: item.stock
      });
    }
    await batch.commit();
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase saveProductInventory error:", err);
    return { success: false, message: err.message };
  }
}

export async function decrementProductInventory(productId: number, size: string, quantity: number): Promise<boolean> {
  const sizeKey = size.toUpperCase();
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_inventory');
    let list = defaultMockInventory;
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    const idx = list.findIndex(item => item.product_id === productId && item.size === sizeKey);
    if (idx !== -1) {
      list[idx].stock = Math.max(0, list[idx].stock - quantity);
      setLocalStorageItem('sanga_mock_inventory', JSON.stringify(list));
      return true;
    }
    return false;
  }
  try {
    const docRef = doc(db!, 'product_inventory', `${productId}_${sizeKey}`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const currentStock = docSnap.data().stock || 0;
    const newStock = Math.max(0, currentStock - quantity);
    await updateDoc(docRef, { stock: newStock });
    return true;
  } catch (e) {
    console.error("Firebase decrementProductInventory error:", e);
    return false;
  }
}

// ----------------------------------------------------
// Admin Mutations (Abstract Data Actions)
// ----------------------------------------------------

export async function saveEvent(event: Partial<Event> & { id?: number }): Promise<{ success: boolean; event?: Event; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_events');
    let list: Event[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    let savedId = event.id;
    if (!savedId) {
      savedId = list.length > 0 ? Math.max(...list.map(e => e.id)) + 1 : 1;
      const newEv = { ...event, id: savedId } as Event;
      list.push(newEv);
      setLocalStorageItem('sanga_mock_events', JSON.stringify(list));
      return { success: true, event: newEv };
    } else {
      const updatedList = list.map(e => e.id === savedId ? ({ ...e, ...event } as Event) : e);
      setLocalStorageItem('sanga_mock_events', JSON.stringify(updatedList));
      return { success: true, event: { ...event, id: savedId } as Event };
    }
  }
  try {
    let savedId = event.id;
    if (!savedId) {
      savedId = Date.now();
    }
    const docRef = doc(db!, 'events', String(savedId));
    const payload = sanitizeObject({ ...event, id: savedId });
    await setDoc(docRef, payload);
    return { success: true, event: payload as Event };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase saveEvent error:", err);
    return { success: false, message: err.message };
  }
}

export async function deleteEvent(id: number): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_events');
    let list: Event[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    const filtered = list.filter(e => e.id !== id);
    setLocalStorageItem('sanga_mock_events', JSON.stringify(filtered));
    return { success: true };
  }
  try {
    await deleteDoc(doc(db!, 'events', String(id)));
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase deleteEvent error:", err);
    return { success: false, message: err.message };
  }
}

export async function saveProduct(product: Partial<StoreProduct> & { id?: number }): Promise<{ success: boolean; product?: StoreProduct; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_products');
    let list: StoreProduct[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    let savedId = product.id;
    if (!savedId) {
      savedId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const newPr = { ...product, id: savedId } as StoreProduct;
      list.push(newPr);
      setLocalStorageItem('sanga_mock_products', JSON.stringify(list));
      return { success: true, product: newPr };
    } else {
      const updatedList = list.map(p => p.id === savedId ? ({ ...p, ...product } as StoreProduct) : p);
      setLocalStorageItem('sanga_mock_products', JSON.stringify(updatedList));
      return { success: true, product: { ...product, id: savedId } as StoreProduct };
    }
  }
  try {
    let savedId = product.id;
    if (!savedId) {
      savedId = Date.now();
    }
    const docRef = doc(db!, 'store_products', String(savedId));
    const payload = sanitizeObject({ ...product, id: savedId });
    await setDoc(docRef, payload);
    return { success: true, product: payload as StoreProduct };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase saveProduct error:", err);
    return { success: false, message: err.message };
  }
}

export async function deleteProduct(id: number): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_products');
    let list: StoreProduct[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    const filtered = list.filter(p => p.id !== id);
    setLocalStorageItem('sanga_mock_products', JSON.stringify(filtered));
    return { success: true };
  }
  try {
    await deleteDoc(doc(db!, 'store_products', String(id)));
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase deleteProduct error:", err);
    return { success: false, message: err.message };
  }
}

export async function saveResource(resource: Partial<Resource> & { id?: number }): Promise<{ success: boolean; resource?: Resource; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_resources');
    let list: Resource[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    let savedId = resource.id;
    if (!savedId) {
      savedId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
      const newRes = { ...resource, id: savedId } as Resource;
      list.push(newRes);
      setLocalStorageItem('sanga_mock_resources', JSON.stringify(list));
      return { success: true, resource: newRes };
    } else {
      const updatedList = list.map(r => r.id === savedId ? ({ ...r, ...resource } as Resource) : r);
      setLocalStorageItem('sanga_mock_resources', JSON.stringify(updatedList));
      return { success: true, resource: { ...resource, id: savedId } as Resource };
    }
  }
  try {
    let savedId = resource.id;
    if (!savedId) {
      savedId = Date.now();
    }
    const docRef = doc(db!, 'resources', String(savedId));
    const payload = sanitizeObject({ ...resource, id: savedId });
    await setDoc(docRef, payload);
    return { success: true, resource: payload as Resource };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase saveResource error:", err);
    return { success: false, message: err.message };
  }
}

export async function deleteResource(id: number): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_resources');
    let list: Resource[] = [];
    if (stored) {
      try { list = JSON.parse(stored); } catch {}
    }
    const filtered = list.filter(r => r.id !== id);
    setLocalStorageItem('sanga_mock_resources', JSON.stringify(filtered));
    return { success: true };
  }
  try {
    await deleteDoc(doc(db!, 'resources', String(id)));
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase deleteResource error:", err);
    return { success: false, message: err.message };
  }
}

export async function saveSiteSettings(updatedSettings: Partial<SiteSettings>): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    return { success: true };
  }
  try {
    const batch = writeBatch(db!);
    const cleanSettings = sanitizeObject(updatedSettings);
    for (const [key, val] of Object.entries(cleanSettings)) {
      const docRef = doc(db!, 'site_settings', key);
      batch.set(docRef, { value: val }, { merge: true });
    }
    await batch.commit();
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase saveSiteSettings error:", err);
    return { success: false, message: err.message };
  }
}

export async function getNewsletterSubscribers(): Promise<Array<{ email: string; subscribed_at: string }>> {
  if (!isFirebaseConfigured) {
    return getLocalSubscribers();
  }
  try {
    const colRef = collection(db!, 'newsletter_subscribers');
    const snap = await getDocs(colRef);
    const list: Array<{ email: string; subscribed_at: string }> = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        email: String(data.email),
        subscribed_at: String(data.subscribed_at)
      });
    });
    return list.sort((a, b) => new Date(b.subscribed_at).getTime() - new Date(a.subscribed_at).getTime());
  } catch (e) {
    console.error("Firebase getNewsletterSubscribers error:", e);
    return [];
  }
}

export async function getContactMessages(): Promise<Array<{ id: string; name: string; email: string; message: string; reviewed: boolean; submitted_at: string }>> {
  if (!isFirebaseConfigured) {
    return getLocalMessages();
  }
  try {
    const colRef = collection(db!, 'contact_messages');
    const snap = await getDocs(colRef);
    const list: Array<{ id: string; name: string; email: string; message: string; reviewed: boolean; submitted_at: string }> = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: String(data.name || ''),
        email: String(data.email),
        message: String(data.message || ''),
        reviewed: Boolean(data.reviewed),
        submitted_at: String(data.submitted_at)
      });
    });
    return list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  } catch (e) {
    console.error("Firebase getContactMessages error:", e);
    return [];
  }
}

// ----------------------------------------------------
// Admin Authentication Wrappers
// ----------------------------------------------------

const ALLOWED_ADMIN_EMAILS = [
  'info@sangainitiative.org',
  'sangainitiative@gmail.com',
  'avanish@sangainitiative.org',
  'avanish600@gmail.com'
];

export const isEmailAllowed = (email: string | null): boolean => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase().trim();
  return (
    ALLOWED_ADMIN_EMAILS.includes(lowerEmail) ||
    lowerEmail.endsWith('@sangainitiative.org')
  );
};

export async function loginAdmin(): Promise<{ success: boolean; session?: any; message?: string }> {
  if (!isFirebaseConfigured) {
    // Local mock login logic (accept any email/password locally)
    return { success: true, session: { email: 'mock-admin@example.com' } };
  }
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth!, provider);
    const user = cred.user;

    if (!isEmailAllowed(user.email)) {
      await signOut(auth!);
      return { 
        success: false, 
        message: `Access denied. Email '${user.email}' is not whitelisted for administrator access.` 
      };
    }
    return { success: true, session: user };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase loginAdmin error:", err);
    return { success: false, message: err.message };
  }
}

export async function logoutAdmin(): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    return { success: true };
  }
  try {
    await signOut(auth!);
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase logoutAdmin error:", err);
    return { success: false, message: err.message };
  }
}

export function onAdminAuthStateChange(callback: (session: any | null) => void): () => void {
  if (!isFirebaseConfigured) {
    // Mock subscription
    callback({ email: 'mock-admin@example.com' });
    return () => {};
  }
  return onAuthStateChanged(auth!, async (user) => {
    if (user && !isEmailAllowed(user.email)) {
      await signOut(auth!);
      callback(null);
    } else {
      callback(user);
    }
  });
}

// Local Fallbacks
export function getLocalSubscribers(): Array<{ email: string; subscribed_at: string }> {
  const stored = getLocalStorageItem('sanga_mock_subscribers');
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

export function getLocalMessages(): Array<{ id: string; name: string; email: string; message: string; reviewed: boolean; submitted_at: string }> {
  const stored = getLocalStorageItem('sanga_mock_messages');
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

// ----------------------------------------------------
// File Upload & Delete Helpers (Firebase Storage)
// ----------------------------------------------------

export async function uploadFile(folderPath: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> {
  if (!isFirebaseConfigured || !storage) {
    // Local mock fallback: create a local object URL
    const mockUrl = URL.createObjectURL(file);
    return { success: true, url: mockUrl };
  }
  try {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileRef = ref(storage, `${folderPath}/${filename}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { success: true, url };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase uploadFile error:", err);
    return { success: false, message: err.message };
  }
}

export async function deleteFile(fileUrl: string): Promise<{ success: boolean; message?: string }> {
  if (!isFirebaseConfigured || !storage) {
    return { success: true };
  }
  try {
    // Only attempt to delete if it's a firebase storage url
    if (fileUrl.includes('firebasestorage.googleapis.com')) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    }
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Firebase deleteFile error:", err);
    return { success: false, message: err.message };
  }
}
