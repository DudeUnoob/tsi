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

export async function getResources(): Promise<Resource[]> {
  if (!isSupabaseConfigured) {
    return mockResources.filter(r => r.published).sort((a, b) => a.sort_order - b.sort_order);
  }
  try {
    const { data, error } = await supabase!
      .from('resources')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    if (error || !data) return mockResources.filter(r => r.published);
    return data;
  } catch (e) {
    console.error("Supabase getResources error:", e);
    return mockResources.filter(r => r.published);
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

export function reviewLocalMessage(id: number) {
  const msgIndex = localMessages.findIndex(m => m.id === id);
  if (msgIndex !== -1) {
    localMessages[msgIndex] = { ...localMessages[msgIndex], reviewed: true };
  }
}
