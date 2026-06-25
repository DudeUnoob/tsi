import { createClient } from '@supabase/supabase-js';
import { mockSiteSettings, mockEvents, mockResources, mockStoreProducts, Event, Resource, StoreProduct, SiteSettings } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

// Local database backups in-memory for forms
const localSubscribers: Array<{ id: number; email: string; subscribed_at: string }> = [];
const localMessages: Array<{ id: number; name: string; email: string; message: string; reviewed: boolean; submitted_at: string }> = [];

interface DbSettingsRow {
  key: string;
  value: unknown;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) {
    return mockSiteSettings;
  }
  try {
    const { data, error } = await supabase!
      .from('site_settings')
      .select('*');
    if (error || !data || data.length === 0) {
      return mockSiteSettings;
    }
    const settings = { ...mockSiteSettings };
    (data as DbSettingsRow[]).forEach(item => {
      if (item.key in settings) {
        (settings as Record<string, unknown>)[item.key] = item.value;
      }
    });
    return settings;
  } catch (e) {
    console.error("Supabase getSiteSettings error:", e);
    return mockSiteSettings;
  }
}

interface DBEventHighlight {
  highlight: string;
}

interface DBScheduleItem {
  id: number;
  time_label: string;
  title: string;
  description: string;
}

interface DBFaq {
  id: number;
  question: string;
  answer: string;
}

interface DBPerson {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
}

interface DBEventRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  age_range: string;
  start_date: string;
  end_date: string;
  location: string;
  price: string;
  status: 'draft' | 'open' | 'coming-soon' | 'closed' | 'sold-out' | 'past';
  short_description: string;
  long_description: string;
  registration_url?: string;
  payment_url?: string;
  external_checkout_url?: string;
  liability_form_url?: string;
  application_url?: string;
  scholarship_contact_url?: string;
  hero_image: string;
  gallery_images: string[];
  featured_on_homepage: boolean;
  published: boolean;
  seo_title?: string;
  seo_description?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  highlights: DBEventHighlight[];
  schedule: DBScheduleItem[];
  faqs: DBFaq[];
  people: DBPerson[];
}

export async function getEvents(options?: { featuredOnly?: boolean; publishedOnly?: boolean }): Promise<Event[]> {
  if (!isSupabaseConfigured) {
    let events = [...mockEvents];
    if (options?.featuredOnly) {
      events = events.filter(e => e.featured_on_homepage);
    }
    if (options?.publishedOnly) {
      events = events.filter(e => e.published);
    }
    return events;
  }
  try {
    let query = supabase!
      .from('events')
      .select(`
        *,
        highlights:event_highlights(highlight),
        schedule:event_schedule_items(id, time_label, title, description),
        faqs:event_faqs(id, question, answer),
        people:event_people(id, name, role, bio, image_url)
      `);
    
    if (options?.featuredOnly) {
      query = query.eq('featured_on_homepage', true);
    }
    if (options?.publishedOnly) {
      query = query.eq('published', true);
    }
    
    const { data, error } = await query.order('start_date', { ascending: true });
    if (error || !data) throw error;
    
    const rows = data as unknown as DBEventRow[];
    return rows.map(item => ({
      ...item,
      highlights: item.highlights?.map(h => h.highlight) || [],
      schedule: item.schedule?.sort((a, b) => a.id - b.id) || [],
      faqs: item.faqs?.sort((a, b) => a.id - b.id) || [],
      people: item.people?.sort((a, b) => a.id - b.id) || []
    }));
  } catch (e) {
    console.error("Supabase getEvents error, falling back to mock:", e);
    let events = [...mockEvents];
    if (options?.featuredOnly) {
      events = events.filter(e => e.featured_on_homepage);
    }
    if (options?.publishedOnly) {
      events = events.filter(e => e.published);
    }
    return events;
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!isSupabaseConfigured) {
    const event = mockEvents.find(e => e.slug === slug);
    return event ? { ...event } : null;
  }
  try {
    const { data, error } = await supabase!
      .from('events')
      .select(`
        *,
        highlights:event_highlights(highlight),
        schedule:event_schedule_items(id, time_label, title, description),
        faqs:event_faqs(id, question, answer),
        people:event_people(id, name, role, bio, image_url)
      `)
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    
    const item = data as unknown as DBEventRow;
    return {
      ...item,
      highlights: item.highlights?.map(h => h.highlight) || [],
      schedule: item.schedule?.sort((a, b) => a.id - b.id) || [],
      faqs: item.faqs?.sort((a, b) => a.id - b.id) || [],
      people: item.people?.sort((a, b) => a.id - b.id) || []
    };
  } catch (e) {
    console.error("Supabase getEventBySlug error, falling back to mock:", e);
    const event = mockEvents.find(e => e.slug === slug);
    return event ? { ...event } : null;
  }
}

export async function getResources(options?: { publishedOnly?: boolean }): Promise<Resource[]> {
  const publishedOnly = options?.publishedOnly ?? true;
  if (!isSupabaseConfigured) {
    let list = [...mockResources];
    if (publishedOnly) {
      list = list.filter(r => r.published);
    }
    return list.sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    let query = supabase!.from('resources').select('*');
    if (publishedOnly) {
      query = query.eq('published', true);
    }
    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error || !data) {
      let list = [...mockResources];
      if (publishedOnly) {
        list = list.filter(r => r.published);
      }
      return list;
    }
    return data;
  } catch (e) {
    console.error("Supabase getResources error:", e);
    let list = [...mockResources];
    if (publishedOnly) {
      list = list.filter(r => r.published);
    }
    return list;
  }
}

export async function getProducts(options?: { featuredOnly?: boolean }): Promise<StoreProduct[]> {
  if (!isSupabaseConfigured) {
    let products = [...mockStoreProducts];
    if (options?.featuredOnly) {
      products = products.filter(p => p.featured);
    }
    return products.filter(p => p.published);
  }
  try {
    let query = supabase!.from('store_products').select('*').eq('published', true);
    if (options?.featuredOnly) {
      query = query.eq('featured', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return mockStoreProducts.filter(p => p.published);
    return data;
  } catch (e) {
    console.error("Supabase getProducts error:", e);
    return mockStoreProducts.filter(p => p.published);
  }
}

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    if (localSubscribers.some(s => s.email === email)) {
      return { success: true, message: "Already subscribed (Local mock data)" };
    }
    localSubscribers.push({
      id: localSubscribers.length + 1,
      email,
      subscribed_at: new Date().toISOString()
    });
    return { success: true, message: "Subscribed successfully (Local mock data)" };
  }
  try {
    const { error } = await supabase!
      .from('newsletter_subscribers')
      .insert([{ email }]);
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return { success: true, message: "Already subscribed" };
      }
      throw error;
    }
    return { success: true, message: "Subscribed successfully" };
  } catch (e) {
    const err = e as Error;
    return { success: false, message: err.message || "Subscription failed" };
  }
}

export async function submitContactForm(name: string, email: string, message: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    localMessages.push({
      id: localMessages.length + 1,
      name,
      email,
      message,
      reviewed: false,
      submitted_at: new Date().toISOString()
    });
    return { success: true, message: "Message sent! (Local mock data)" };
  }
  try {
    const { error } = await supabase!
      .from('contact_messages')
      .insert([{ name, email, message }]);
    if (error) throw error;
    return { success: true, message: "Message sent successfully" };
  } catch (e) {
    const err = e as Error;
    return { success: false, message: err.message || "Failed to send message" };
  }
}

// Admin mock dashboard query methods
export function getLocalSubscribers() {
  return localSubscribers;
}

export function getLocalMessages() {
  return localMessages;
}

export function     reviewLocalMessage(id: number) {
  const msgIndex = localMessages.findIndex(m => m.id === id);
  if (msgIndex !== -1) {
    localMessages[msgIndex] = { ...localMessages[msgIndex], reviewed: true };
  }
}

// ----------------------------------------------------
// New Models & Data Operations for Orders & Registrations
// ----------------------------------------------------

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

const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

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

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_orders');
    if (!stored) {
      setLocalStorageItem('sanga_mock_orders', JSON.stringify(defaultMockOrders));
      return defaultMockOrders;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return defaultMockOrders;
    }
  }
  try {
    const { data, error } = await supabase!
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Supabase getOrders error:", e);
    return defaultMockOrders;
  }
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<{ success: boolean; order?: Order; message?: string }> {
  if (!isSupabaseConfigured) {
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
    const { data, error } = await supabase!
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (error) throw error;
    return { success: true, order: data };
  } catch (e) {
    const err = e as Error;
    console.error("Supabase createOrder error:", err);
    return { success: false, message: err.message };
  }
}

export async function updateOrderStatus(orderRef: string, status: Order['status']): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    const orders = await getOrders();
    const idx = orders.findIndex(o => o.order_ref === orderRef);
    if (idx !== -1) {
      orders[idx].status = status;
      setLocalStorageItem('sanga_mock_orders', JSON.stringify(orders));
      return { success: true };
    }
    return { success: false, message: "Order not found" };
  }
  try {
    const { error } = await supabase!
      .from('orders')
      .update({ status })
      .eq('order_ref', orderRef);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error("Supabase updateOrderStatus error:", err);
    return { success: false, message: err.message };
  }
}

export async function getEventRegistrations(eventId?: number): Promise<EventRegistration[]> {
  if (!isSupabaseConfigured) {
    const stored = getLocalStorageItem('sanga_mock_registrations');
    let list: EventRegistration[] = defaultMockRegistrations;
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch {
        list = defaultMockRegistrations;
      }
    } else {
      setLocalStorageItem('sanga_mock_registrations', JSON.stringify(defaultMockRegistrations));
    }
    
    // Inject event_title helper for mock events
    const listWithTitles = list.map(reg => {
      const ev = mockEvents.find(e => e.id === reg.event_id);
      return {
        ...reg,
        event_title: ev ? ev.title : `Event #${reg.event_id}`
      };
    });

    if (eventId) {
      return listWithTitles.filter(r => r.event_id === eventId);
    }
    return listWithTitles;
  }
  try {
    let query = supabase!
      .from('registrations')
      .select('*, event:events(title)');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      ...item,
      event_title: item.event?.title || `Event #${item.event_id}`
    }));
  } catch (e) {
    console.error("Supabase getEventRegistrations error:", e);
    return defaultMockRegistrations;
  }
}

export async function createEventRegistration(regData: Omit<EventRegistration, 'id' | 'created_at'>): Promise<{ success: boolean; registration?: EventRegistration; message?: string }> {
  if (!isSupabaseConfigured) {
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
    const { data, error } = await supabase!
      .from('registrations')
      .insert([regData])
      .select()
      .single();
    if (error) throw error;
    return { success: true, registration: data };
  } catch (e) {
    const err = e as Error;
    console.error("Supabase createEventRegistration error:", err);
    return { success: false, message: err.message };
  }
}
