'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase, getSiteSettings, getEvents, getProducts, getResources, getLocalSubscribers, getLocalMessages } from '@/lib/supabase';
import { 
  mockSiteSettings, mockEvents, mockResources, mockStoreProducts, 
  SiteSettings, Event, StoreProduct, Resource 
} from '@/lib/mockData';
import { 
  LayoutDashboard, Home, Calendar, ShoppingBag, Heart, 
  MessageCircle, FileText, Image as ImageIcon, LogOut, 
  Users, Plus, Trash2, Edit, Check, Download, AlertTriangle, Settings as SettingsIcon,
  Video, Eye, Lock, FileUp, ExternalLink
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subscriber {
  email: string;
  subscribed_at: string;
}

interface ContactMessage {
  id: number | string;
  name: string;
  email: string;
  message: string;
  reviewed: boolean;
  submitted_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  // Authentication state
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'homepage' | 'gatherings' | 'store' | 'support' | 'community' | 'resources' | 'media' | 'submissions' | 'settings'>('overview');

  // Loaded site states
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(mockSiteSettings);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [products, setProducts] = useState<StoreProduct[]>(mockStoreProducts);
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => 
    !isSupabaseConfigured ? getLocalSubscribers() : []
  );
  const [messages, setMessages] = useState<ContactMessage[]>(() => 
    !isSupabaseConfigured ? getLocalMessages() : []
  );
  
  const [toastMessage, setToastMessage] = useState('');

  // Form edit states (for Gatherings, Store, and Resources edit modals)
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null);

  // New subcomponent editor states
  const [newHighlight, setNewHighlight] = useState('');
  
  const [newSchedTime, setNewSchedTime] = useState('');
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedDesc, setNewSchedDesc] = useState('');
  
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('');
  const [newPersonBio, setNewPersonBio] = useState('');
  const [newPersonImage, setNewPersonImage] = useState('');

  // Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data lists from database
  useEffect(() => {
    const loadData = async () => {
      const s = await getSiteSettings();
      setSiteSettings(s);
      
      const e = await getEvents();
      setEvents(e);
      
      const p = await getProducts();
      setProducts(p);
      
      const r = await getResources({ publishedOnly: false });
      setResources(r);

      if (isSupabaseConfigured) {
        // Fetch newsletter subscribers
        const { data: subs } = await supabase!.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
        if (subs) setSubscribers(subs);

        // Fetch contact messages
        const { data: msgs } = await supabase!.from('contact_messages').select('*').order('submitted_at', { ascending: false });
        if (msgs) setMessages(msgs);
      }
    };

    if (!authLoading && (session || !isSupabaseConfigured)) {
      loadData();
    }
  }, [authLoading, session]);

  // Auth handles
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
    } catch (err) {
      const error = err as Error;
      setAuthError(error.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
    setSession(null);
  };

  // Toast indicator
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Settings Save
  const handleSaveSettings = async (section: string, updatedSettings: Partial<SiteSettings>) => {
    if (updatedSettings.color_palette) {
      document.cookie = `sanga_palette=${updatedSettings.color_palette}; path=/; max-age=31536000; SameSite=Lax`;
    }

    const nextSettings = { ...siteSettings, ...updatedSettings };
    setSiteSettings(nextSettings);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        triggerToast(`Local Mode: Settings mock-saved!`);
        router.refresh();
      }, 800);
      return;
    }

    try {
      // settings are stored key-by-key in settings table
      for (const [key, val] of Object.entries(updatedSettings)) {
        await supabase!
          .from('site_settings')
          .upsert({ key, value: val }, { onConflict: 'key' });
      }
      triggerToast('Settings updated successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      triggerToast('Error saving settings.');
    }
  };

  // Event Save
  const handleSaveEvent = async () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.slug) return;
    
    const isNew = !editingEvent.id;
    const finalEvent = {
      ...editingEvent,
      highlights: editingEvent.highlights || [],
      schedule: editingEvent.schedule || [],
      faqs: editingEvent.faqs || [],
      people: editingEvent.people || []
    };

    if (!isSupabaseConfigured) {
      if (isNew) {
        const newEv = { ...(finalEvent as Event), id: events.length + 1 };
        setEvents([...events, newEv]);
      } else {
        setEvents(events.map(ev => ev.id === finalEvent.id ? (finalEvent as Event) : ev));
      }
      setEditingEvent(null);
      triggerToast('Local Mode: Gathering mock-saved!');
      return;
    }

    try {
      let savedId = finalEvent.id;
      
      const payload = {
        title: finalEvent.title,
        slug: finalEvent.slug,
        category: finalEvent.category,
        age_range: finalEvent.age_range,
        start_date: finalEvent.start_date,
        end_date: finalEvent.end_date,
        location: finalEvent.location,
        price: finalEvent.price,
        status: finalEvent.status,
        short_description: finalEvent.short_description,
        long_description: finalEvent.long_description,
        registration_url: finalEvent.registration_url,
        payment_url: finalEvent.payment_url,
        external_checkout_url: finalEvent.external_checkout_url,
        liability_form_url: finalEvent.liability_form_url,
        application_url: finalEvent.application_url,
        scholarship_contact_url: finalEvent.scholarship_contact_url,
        hero_image: finalEvent.hero_image,
        featured_on_homepage: finalEvent.featured_on_homepage,
        published: finalEvent.published,
        seo_title: finalEvent.seo_title,
        seo_description: finalEvent.seo_description,
        stripe_price_id: finalEvent.stripe_price_id,
        stripe_product_id: finalEvent.stripe_product_id
      };

      if (isNew) {
        const { data, error } = await supabase!.from('events').insert([payload]).select().single();
        if (error) throw error;
        savedId = data.id;
      } else {
        const { error } = await supabase!.from('events').update(payload).eq('id', finalEvent.id);
        if (error) throw error;
      }

      // Re-insert subcomponents
      if (savedId) {
        // Clear sub-tables
        await supabase!.from('event_highlights').delete().eq('event_id', savedId);
        await supabase!.from('event_schedule_items').delete().eq('event_id', savedId);
        await supabase!.from('event_faqs').delete().eq('event_id', savedId);
        await supabase!.from('event_people').delete().eq('event_id', savedId);

        // Insert new sub-items
        if (finalEvent.highlights && finalEvent.highlights.length > 0) {
          const highlightsPayload = finalEvent.highlights.map(h => ({ event_id: savedId, highlight: h }));
          await supabase!.from('event_highlights').insert(highlightsPayload);
        }
        if (finalEvent.schedule && finalEvent.schedule.length > 0) {
          const schedulePayload = finalEvent.schedule.map(s => ({ ...s, event_id: savedId }));
          await supabase!.from('event_schedule_items').insert(schedulePayload);
        }
        if (finalEvent.faqs && finalEvent.faqs.length > 0) {
          const faqsPayload = finalEvent.faqs.map(f => ({ ...f, event_id: savedId }));
          await supabase!.from('event_faqs').insert(faqsPayload);
        }
        if (finalEvent.people && finalEvent.people.length > 0) {
          const peoplePayload = finalEvent.people.map(p => ({ ...p, event_id: savedId }));
          await supabase!.from('event_people').insert(peoplePayload);
        }
      }

      // Reload
      const e = await getEvents();
      setEvents(e);
      setEditingEvent(null);
      triggerToast('Gathering updated successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Error saving gathering.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gathering?')) return;

    if (!isSupabaseConfigured) {
      setEvents(events.filter(e => e.id !== id));
      triggerToast('Local Mode: Event deleted!');
      return;
    }

    try {
      await supabase!.from('events').delete().eq('id', id);
      setEvents(events.filter(e => e.id !== id));
      triggerToast('Gathering deleted successfully.');
    } catch {
      triggerToast('Failed to delete gathering.');
    }
  };

  // Product Save
  const handleSaveProduct = async () => {
    if (!editingProduct || !editingProduct.product_title || !editingProduct.slug) return;
    
    const isNew = !editingProduct.id;

    if (!isSupabaseConfigured) {
      if (isNew) {
        const newPr = { ...(editingProduct as StoreProduct), id: products.length + 1 };
        setProducts([...products, newPr]);
      } else {
        setProducts(products.map(pr => pr.id === editingProduct.id ? (editingProduct as StoreProduct) : pr));
      }
      setEditingProduct(null);
      triggerToast('Local Mode: Product mock-saved!');
      return;
    }

    try {
      const payload = {
        product_title: editingProduct.product_title,
        slug: editingProduct.slug,
        description: editingProduct.description,
        image: editingProduct.image,
        price: editingProduct.price,
        status: editingProduct.status,
        external_checkout_url: editingProduct.external_checkout_url,
        external_product_url: editingProduct.external_product_url,
        stripe_price_id: editingProduct.stripe_price_id,
        stripe_product_id: editingProduct.stripe_product_id,
        featured: editingProduct.featured,
        published: editingProduct.published
      };

      if (isNew) {
        await supabase!.from('store_products').insert([payload]);
      } else {
        await supabase!.from('store_products').update(payload).eq('id', editingProduct.id);
      }

      const p = await getProducts();
      setProducts(p);
      setEditingProduct(null);
      triggerToast('Store product updated!');
    } catch {
      triggerToast('Error saving product.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    if (!isSupabaseConfigured) {
      setProducts(products.filter(p => p.id !== id));
      triggerToast('Local Mode: Product deleted!');
      return;
    }

    try {
      await supabase!.from('store_products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
      triggerToast('Product deleted.');
    } catch {
      triggerToast('Failed to delete product.');
    }
  };

  // Resource Save
  const handleSaveResource = async () => {
    if (!editingResource || !editingResource.title) return;

    const isNew = !editingResource.id;

    if (!isSupabaseConfigured) {
      if (isNew) {
        const newRes = { ...(editingResource as Resource), id: resources.length + 1 };
        setResources([...resources, newRes]);
      } else {
        setResources(resources.map(r => r.id === editingResource.id ? (editingResource as Resource) : r));
      }
      setEditingResource(null);
      triggerToast('Local Mode: Resource mock-saved!');
      return;
    }

    try {
      const payload = {
        title: editingResource.title,
        category: editingResource.category || 'General',
        description: editingResource.description || '',
        external_url: editingResource.external_url || '',
        uploaded_file_url: editingResource.uploaded_file_url || '',
        published: editingResource.published ?? true,
        sort_order: editingResource.sort_order ?? 0
      };

      if (isNew) {
        await supabase!.from('resources').insert([payload]);
      } else {
        await supabase!.from('resources').update(payload).eq('id', editingResource.id);
      }

      const r = await getResources({ publishedOnly: false });
      setResources(r);
      setEditingResource(null);
      triggerToast('Resource updated successfully!');
    } catch (e) {
      console.error(e);
      triggerToast('Error saving resource.');
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    if (!isSupabaseConfigured) {
      setResources(resources.filter(r => r.id !== id));
      triggerToast('Local Mode: Resource deleted!');
      return;
    }

    try {
      await supabase!.from('resources').delete().eq('id', id);
      setResources(resources.filter(r => r.id !== id));
      triggerToast('Resource deleted.');
    } catch {
      triggerToast('Failed to delete resource.');
    }
  };

  // CSV Exporter
  const exportToCSV = (type: 'subscribers' | 'messages') => {
    let headers = '';
    let rows: string[] = [];
    let filename = '';

    if (type === 'subscribers') {
      headers = 'Email,Date Subscribed';
      rows = subscribers.map(s => `"${s.email}","${s.subscribed_at || ''}"`);
      filename = 'newsletter_subscribers.csv';
    } else {
      headers = 'Name,Email,Message,Submitted At,Reviewed';
      rows = messages.map(m => `"${m.name || ''}","${m.email}","${(m.message || '').replace(/"/g, '""')}","${m.submitted_at || ''}","${m.reviewed ? 'Yes' : 'No'}"`);
      filename = 'contact_submissions.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers].concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Exported ${type} to CSV!`);
  };

  // Render Login state if unauthenticated and Supabase is configured
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFEFBF] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-plum border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-plum tracking-wide uppercase">Loading Sanga Portal...</p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="min-h-screen bg-[#FFEFBF] flex items-center justify-center font-sans px-6 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-[#FFA526]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#FF7DB4]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#FFEFBF] p-10 rounded-[2.5rem] border border-plum/15 shadow-2xl flex flex-col space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <span className="font-display text-4xl font-bold text-plum block tracking-tight">sanga</span>
            <span className="text-[10px] tracking-wider uppercase text-plum/60 font-bold block">Staff & Volunteer Login</span>
          </div>

          {authError && (
            <div className="bg-[#E65C17]/5 border border-[#E65C17]/10 text-[#E65C17] text-xs p-4 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 text-sm">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 focus:border-[#FFA526] rounded-2xl text-plum placeholder-plum/30 focus:outline-none transition-all duration-200"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 focus:border-[#FFA526] rounded-2xl text-plum placeholder-plum/30 focus:outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum font-bold uppercase tracking-wider rounded-full text-xs shadow-md transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FFEFBF] flex font-sans">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-plum text-[#FFEFBF] px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl flex items-center animate-fadeIn border border-[#FFEFBF]/10">
          <Check className="mr-2 h-4 w-4 text-[#66CC6E]" /> {toastMessage}
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-64 bg-plum text-[#FFEFBF] p-8 flex flex-col justify-between hidden lg:flex border-r border-[#FFEFBF]/5 h-full overflow-y-auto flex-shrink-0">
        <div className="space-y-10">
          <Link href="/" className="space-y-1 block hover:opacity-90 transition-opacity">
            <span className="font-display text-3xl font-bold text-white tracking-tight block">sanga</span>
            <span className="text-[10px] tracking-wider uppercase text-[#FFA526] block font-bold">Volunteer Admin Portal</span>
          </Link>

          {!isSupabaseConfigured && (
            <div className="bg-[#FFA526]/10 border border-[#FFA526]/20 rounded-2xl p-4 text-[10px] text-[#FFA526] leading-relaxed flex items-start">
              <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Local Fallback Mode</strong><br />
                Credentials missing. Changes will mock-save locally.
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-1 text-sm">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'homepage', label: 'Homepage Editor', icon: Home },
              { id: 'gatherings', label: 'Gatherings', icon: Calendar },
              { id: 'store', label: 'Merch Store', icon: ShoppingBag },
              { id: 'support', label: 'Support & Copy', icon: Heart },
              { id: 'community', label: 'Community Links', icon: MessageCircle },
              { id: 'resources', label: 'Resources', icon: FileText },
              { id: 'media', label: 'Media Library', icon: ImageIcon },
              { id: 'submissions', label: 'Submissions', icon: Users },
              { id: 'settings', label: 'General & Themes', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#FFA526] text-plum font-bold shadow-md' 
                      : 'text-[#FFEFBF]/75 hover:bg-[#FFEFBF]/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" /> 
                  <span className="text-xs uppercase tracking-wider font-bold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-[#FFEFBF]/60 hover:text-[#FF7DB4] hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider border-t border-[#FFEFBF]/5 pt-4 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> <span>Log Out</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow p-8 md:p-12 overflow-y-auto h-full">
        
        {/* Active Tab render checks */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Console Overview</h1>
              <p className="text-sm text-warm-black/60">Live metrics, user feedback, and status updates for Sanga.</p>
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Active Gatherings', count: events.length, color: 'border-plum/10' },
                { name: 'Subscribers Joined', count: subscribers.length, color: 'border-plum/10' },
                { name: 'Feedback Received', count: messages.length, color: 'border-plum/10' },
                { name: 'Catalog items', count: products.length, color: 'border-plum/10' }
              ].map((metric, i) => (
                <div key={i} className={`bg-[#FFEFBF] border ${metric.color} rounded-3xl p-6 shadow-md transition-all duration-300 hover:shadow-lg`}>
                  <span className="text-[10px] font-bold text-plum/60 uppercase tracking-wider block">{metric.name}</span>
                  <span className="text-4xl font-display font-bold text-plum block mt-2">{metric.count}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions / Recent elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recent Messages */}
              <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 shadow-md">
                <h3 className="font-display text-xl font-bold text-plum mb-6 border-b border-plum/5 pb-3">Recent Feedback</h3>
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.slice(0, 3).map((m, i) => (
                      <div key={i} className="text-xs p-4 bg-plum/5 rounded-2xl border border-plum/5 space-y-2">
                        <div className="flex justify-between font-bold text-plum">
                          <span>{m.name || 'Anonymous'} ({m.email})</span>
                          <span className="font-normal text-warm-black/40">{new Date(m.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-warm-black/85 leading-relaxed italic font-light">&ldquo;{m.message}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-8 text-center">No submissions received yet.</p>
                )}
              </div>

              {/* Page Settings guide */}
              <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 shadow-md flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-3">Welcome Sanga Coordinator</h3>
                  <p className="text-sm text-warm-black/80 leading-relaxed font-sans font-light">
                    Use this panel to manage, re-theme, and configure website copy without writing any code. All changes are synchronized in real-time. For custom configurations, adjust details inside the settings panels.
                  </p>
                </div>
                <div className="pt-8 flex gap-3 mt-6">
                  <button onClick={() => setActiveTab('homepage')} className="px-5 py-3 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all duration-300">
                    Edit Home Folds
                  </button>
                  <button onClick={() => setActiveTab('gatherings')} className="px-5 py-3 bg-[#FFEFBF] border border-plum text-plum hover:bg-plum/5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300">
                    Manage Retreats
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Homepage Settings Editor */}
        {activeTab === 'homepage' && (
          <div className="space-y-10 max-w-4xl">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Homepage Configuration</h1>
              <p className="text-sm text-warm-black/60">Modify the text, imagery, headlines, and video assets on Sanga&apos;s main landing page.</p>
            </div>

            {/* Hero fold editor */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Hero Fold Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.hero_headline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_headline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    defaultValue={siteSettings.hero_subheadline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_subheadline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] transition-all resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Primary CTA Label</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_label}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_label: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Primary CTA Target URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_url}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526]"
                  />
                </div>

                <div className="md:col-span-2 space-y-2 pt-2 border-t border-plum/5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Cover Photo Image URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.hero_image_url}
                    onBlur={(e) => handleSaveSettings('hero', { hero_image_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                    placeholder="https://images.squarespace-cdn.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Video fold editor */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Moments Video Highlights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Main Promo Video URL (YouTube watch or embed URL)</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.promo_video_url}
                    onBlur={(e) => handleSaveSettings('video', { promo_video_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                    placeholder="e.g. https://www.youtube.com/watch?v=bEBlO9HGTvQ"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Video Cover Poster Image URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.promo_video_cover_url}
                    onBlur={(e) => handleSaveSettings('video', { promo_video_cover_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                    placeholder="https://images.squarespace-cdn.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Intro fold editor */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">About & Mission Copy</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">About Section Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.intro_headline}
                    onBlur={(e) => handleSaveSettings('intro', { intro_headline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">About Section Description</label>
                  <textarea
                    rows={5}
                    defaultValue={siteSettings.intro_text}
                    onBlur={(e) => handleSaveSettings('intro', { intro_text: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Gatherings / Events Editor */}
        {activeTab === 'gatherings' && (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Gatherings Manager</h1>
                <p className="text-sm text-warm-black/60">Create, edit, and configure retreats, camps, pilgrimage trips, and online sessions.</p>
              </div>
              <button
                onClick={() => {
                  setNewHighlight('');
                  setNewSchedTime('');
                  setNewSchedTitle('');
                  setNewSchedDesc('');
                  setNewFaqQuestion('');
                  setNewFaqAnswer('');
                  setNewPersonName('');
                  setNewPersonRole('');
                  setNewPersonBio('');
                  setNewPersonImage('');
                  setEditingEvent({
                    title: '', slug: '', category: 'retreat', status: 'draft',
                    price: '', location: '', start_date: '', end_date: '', age_range: '',
                    short_description: '', long_description: '',
                    highlights: [], schedule: [], faqs: [], people: [],
                    featured_on_homepage: false, published: false
                  });
                }}
                className="px-6 py-3.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Gathering
              </button>
            </div>

            {/* List catalog of events */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-5">Title</th>
                      <th className="p-5">Category</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Dates</th>
                      <th className="p-5">Homepage</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/5">
                    {events.map(ev => (
                      <tr key={ev.id} className="hover:bg-plum/5/20 transition-colors">
                        <td className="p-5 font-bold text-plum">{ev.title}</td>
                        <td className="p-5 text-xs font-semibold uppercase tracking-wider text-[#E65C17]">{ev.category}</td>
                        <td className="p-5">
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-plum/5 border border-plum/10 text-plum">
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-5 text-xs text-warm-black/60">{new Date(ev.start_date).toLocaleDateString()}</td>
                        <td className="p-5 text-xs font-bold text-plum">{ev.featured_on_homepage ? 'Yes' : 'No'}</td>
                        <td className="p-5 text-right flex justify-end space-x-3">
                          <button 
                            onClick={() => {
                              setNewHighlight('');
                              setNewSchedTime('');
                              setNewSchedTitle('');
                              setNewSchedDesc('');
                              setNewFaqQuestion('');
                              setNewFaqAnswer('');
                              setNewPersonName('');
                              setNewPersonRole('');
                              setNewPersonBio('');
                              setNewPersonImage('');
                              setEditingEvent({ ...ev });
                            }}
                            className="p-2.5 hover:bg-plum/15 rounded-xl text-plum transition-all border border-plum/5"
                            title="Edit Event"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-2.5 hover:bg-[#E65C17]/10 rounded-xl text-[#E65C17] transition-all border border-[#E65C17]/5"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Event Form modal overlay */}
            {editingEvent && (
              <div className="fixed inset-0 z-50 bg-[#1E1D1B]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="max-w-4xl w-full bg-[#FFEFBF] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 md:p-8 bg-plum text-[#FFEFBF] flex items-center justify-between border-b border-plum/10">
                    <div className="space-y-1">
                      <h3 className="font-display text-2xl font-bold text-white">{editingEvent.id ? 'Edit Gathering Details' : 'Create New Gathering'}</h3>
                      <p className="text-xs text-[#FFEFBF]/70 font-light">Set highlights, schedules, FAQs, and organizer bios.</p>
                    </div>
                    <button onClick={() => setEditingEvent(null)} className="text-3xl text-[#FFEFBF]/75 hover:text-white cursor-pointer">&times;</button>
                  </div>
                  
                  {/* Modal body scrollable */}
                  <div className="p-8 space-y-8 overflow-y-auto text-sm">
                    {/* Part 1: Primary Details */}
                    <div className="space-y-6">
                      <h4 className="font-display text-lg font-bold text-plum border-b border-plum/5 pb-2">1. Core Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Retreat / Gathering Title</label>
                          <input
                            type="text"
                            required
                            value={editingEvent.title || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 focus:border-[#FFA526] rounded-2xl focus:outline-none"
                            placeholder="e.g. Sanga Summer Summit 2026"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">URL Slug</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. summer-summit-2026"
                            value={editingEvent.slug || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 focus:border-[#FFA526] rounded-2xl focus:outline-none font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Category</label>
                          <select
                            value={editingEvent.category || 'retreat'}
                            onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          >
                            <option value="retreat">Retreat</option>
                            <option value="camp">Camp</option>
                            <option value="trip">Trip</option>
                            <option value="talk">Talk</option>
                            <option value="online">Online</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Age Limit Range</label>
                          <input
                            type="text"
                            placeholder="e.g. 18-35 or 15+"
                            value={editingEvent.age_range || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, age_range: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Status</label>
                          <select
                            value={editingEvent.status || 'draft'}
                            onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as Event['status'] })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          >
                            <option value="draft">Draft</option>
                            <option value="open">Registration Open</option>
                            <option value="coming-soon">Coming Soon</option>
                            <option value="closed">Closed</option>
                            <option value="sold-out">Sold Out</option>
                            <option value="past">Past Event</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Start Date</label>
                          <input
                            type="date"
                            value={editingEvent.start_date || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">End Date</label>
                          <input
                            type="date"
                            value={editingEvent.end_date || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Price Details Label</label>
                          <input
                            type="text"
                            placeholder="e.g. $250 or Free"
                            value={editingEvent.price || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Location / Address</label>
                          <input
                            type="text"
                            value={editingEvent.location || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                            placeholder="e.g. Shenandoah Meadows, VA"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Short Preview Text</label>
                          <input
                            type="text"
                            value={editingEvent.short_description || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, short_description: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                            placeholder="A concise, one-sentence description shown in lists and catalogs."
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Long Details Overview</label>
                          <textarea
                            rows={4}
                            value={editingEvent.long_description || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, long_description: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none resize-none leading-relaxed"
                            placeholder="Detailed introductory paragraphs about what makes this retreat special..."
                          />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">External Registration / Checkout URL</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={editingEvent.external_checkout_url || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, external_checkout_url: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none font-mono text-xs"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Cover/Hero Image URL</label>
                          <input
                            type="text"
                            value={editingEvent.hero_image || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, hero_image: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none font-mono text-xs"
                            placeholder="https://images.squarespace-cdn.com/..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Stripe Price ID</label>
                          <input
                            type="text"
                            placeholder="price_..."
                            value={editingEvent.stripe_price_id || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, stripe_price_id: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center space-x-6 md:col-span-2 pt-6">
                          <label className="flex items-center space-x-2 cursor-pointer font-bold text-plum text-xs uppercase tracking-wide">
                            <input
                              type="checkbox"
                              checked={!!editingEvent.featured_on_homepage}
                              onChange={(e) => setEditingEvent({ ...editingEvent, featured_on_homepage: e.target.checked })}
                              className="w-4 h-4 rounded text-plum border-plum/15 focus:ring-plum"
                            />
                            <span>Featured on Home</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer font-bold text-plum text-xs uppercase tracking-wide">
                            <input
                              type="checkbox"
                              checked={!!editingEvent.published}
                              onChange={(e) => setEditingEvent({ ...editingEvent, published: e.target.checked })}
                              className="w-4 h-4 rounded text-plum border-plum/15 focus:ring-plum"
                            />
                            <span>Published (Live)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Highlights Editor */}
                    <div className="space-y-4 pt-6 border-t border-plum/10">
                      <div className="space-y-1">
                        <h4 className="font-display text-lg font-bold text-plum">2. Retreat Highlights</h4>
                        <p className="text-xs text-warm-black/60 font-light">Add key details that make this experience outstanding (e.g. Daily Outdoor Yoga, Interactive Workshops, Dynamic Kirtans).</p>
                      </div>
                      
                      {/* Add new Highlight */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          placeholder="Type a highlight..."
                          className="flex-grow px-4 py-3 bg-[#FFEFBF] border border-plum/15 focus:border-[#FFA526] rounded-2xl focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newHighlight.trim()) return;
                            const cur = editingEvent.highlights || [];
                            setEditingEvent({ ...editingEvent, highlights: [...cur, newHighlight.trim()] });
                            setNewHighlight('');
                          }}
                          className="px-5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase rounded-2xl shadow-sm transition-all"
                        >
                          Add
                        </button>
                      </div>

                      {/* Display highlights list */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {editingEvent.highlights && editingEvent.highlights.map((hl, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFA526]/25 text-plum rounded-full text-xs font-semibold">
                            <span>{hl}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.highlights || [];
                                setEditingEvent({ ...editingEvent, highlights: cur.filter((_, i) => i !== idx) });
                              }}
                              className="text-plum hover:text-[#E65C17] font-black text-sm cursor-pointer ml-1"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        {(!editingEvent.highlights || editingEvent.highlights.length === 0) && (
                          <span className="text-xs text-warm-black/40 italic">No highlights added yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Part 3: Schedule Items List */}
                    <div className="space-y-4 pt-6 border-t border-plum/10">
                      <div className="space-y-1">
                        <h4 className="font-display text-lg font-bold text-plum">3. Daily Schedule Timeline</h4>
                        <p className="text-xs text-warm-black/60 font-light">Structure a sample daily program so attendees know what to expect.</p>
                      </div>
                      
                      {/* Schedule inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-plum/5 p-4 rounded-2xl border border-plum/5">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="e.g. 7:30 AM"
                            value={newSchedTime}
                            onChange={(e) => setNewSchedTime(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-9">
                          <input
                            type="text"
                            placeholder="Schedule Event Title (e.g. Morning Kirtan & Reflection)"
                            value={newSchedTitle}
                            onChange={(e) => setNewSchedTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-10">
                          <input
                            type="text"
                            placeholder="Brief description (optional)"
                            value={newSchedDesc}
                            onChange={(e) => setNewSchedDesc(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newSchedTime || !newSchedTitle) return;
                              const cur = editingEvent.schedule || [];
                              setEditingEvent({
                                ...editingEvent,
                                schedule: [...cur, { time_label: newSchedTime, title: newSchedTitle, description: newSchedDesc }]
                              });
                              setNewSchedTime('');
                              setNewSchedTitle('');
                              setNewSchedDesc('');
                            }}
                            className="w-full h-full py-2.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display schedule list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingEvent.schedule && editingEvent.schedule.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-[#FFEFBF] border border-plum/10 rounded-xl">
                            <div className="text-xs">
                              <span className="font-bold text-[#E65C17] mr-2">[{item.time_label}]</span>
                              <span className="font-bold text-plum">{item.title}</span>
                              {item.description && <span className="text-warm-black/60 font-light block mt-0.5">{item.description}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.schedule || [];
                                setEditingEvent({ ...editingEvent, schedule: cur.filter((_, i) => i !== idx) });
                              }}
                              className="text-xs text-[#E65C17] hover:text-red-700 font-bold px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {(!editingEvent.schedule || editingEvent.schedule.length === 0) && (
                          <p className="text-xs text-warm-black/40 italic py-2 text-center">No schedule items added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Part 4: FAQs Editor */}
                    <div className="space-y-4 pt-6 border-t border-plum/10">
                      <div className="space-y-1">
                        <h4 className="font-display text-lg font-bold text-plum">4. Frequently Asked Questions</h4>
                        <p className="text-xs text-warm-black/60 font-light">Add custom questions and answers to build clarity (e.g. Packing guidelines, transport assistance).</p>
                      </div>

                      {/* FAQ inputs */}
                      <div className="space-y-3 bg-plum/5 p-4 rounded-2xl border border-plum/5">
                        <input
                          type="text"
                          placeholder="Question (e.g. Is transport provided?)"
                          value={newFaqQuestion}
                          onChange={(e) => setNewFaqQuestion(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer details..."
                          value={newFaqAnswer}
                          onChange={(e) => setNewFaqAnswer(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newFaqQuestion || !newFaqAnswer) return;
                              const cur = editingEvent.faqs || [];
                              setEditingEvent({
                                ...editingEvent,
                                faqs: [...cur, { question: newFaqQuestion, answer: newFaqAnswer }]
                              });
                              setNewFaqQuestion('');
                              setNewFaqAnswer('');
                            }}
                            className="px-5 py-2 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add FAQ
                          </button>
                        </div>
                      </div>

                      {/* Display FAQs list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingEvent.faqs && editingEvent.faqs.map((faq, idx) => (
                          <div key={idx} className="p-3 bg-[#FFEFBF] border border-plum/10 rounded-xl space-y-1 relative pr-16">
                            <h5 className="font-bold text-plum text-xs">Q: {faq.question}</h5>
                            <p className="text-xs text-warm-black/70 font-light">A: {faq.answer}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.faqs || [];
                                setEditingEvent({ ...editingEvent, faqs: cur.filter((_, i) => i !== idx) });
                              }}
                              className="absolute top-3 right-3 text-xs text-[#E65C17] hover:text-red-700 font-bold px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {(!editingEvent.faqs || editingEvent.faqs.length === 0) && (
                          <p className="text-xs text-warm-black/40 italic py-2 text-center">No FAQs added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Part 5: Organizers / Speakers Bios */}
                    <div className="space-y-4 pt-6 border-t border-plum/10">
                      <div className="space-y-1">
                        <h4 className="font-display text-lg font-bold text-plum">5. Host / Organizer Bio Uploads</h4>
                        <p className="text-xs text-warm-black/60 font-light">Link team members, spiritual guides, and facilitators along with roles and short descriptions.</p>
                      </div>

                      {/* Organizer inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-plum/5 p-4 rounded-2xl border border-plum/5">
                        <input
                          type="text"
                          placeholder="Full Name (e.g. Radhika Devi dasi)"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Kirtan Lead & Counselor)"
                          value={newPersonRole}
                          onChange={(e) => setNewPersonRole(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Image URL (Squarespace or CDN link)"
                          value={newPersonImage}
                          onChange={(e) => setNewPersonImage(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs md:col-span-2"
                        />
                        <textarea
                          rows={2}
                          placeholder="Bio details (1-2 sentences about them)..."
                          value={newPersonBio}
                          onChange={(e) => setNewPersonBio(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFEFBF] border border-plum/15 rounded-xl text-xs md:col-span-2 resize-none"
                        />
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPersonName || !newPersonRole) return;
                              const cur = editingEvent.people || [];
                              setEditingEvent({
                                ...editingEvent,
                                people: [...cur, { name: newPersonName, role: newPersonRole, bio: newPersonBio, image_url: newPersonImage || 'https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg' }]
                              });
                              setNewPersonName('');
                              setNewPersonRole('');
                              setNewPersonBio('');
                              setNewPersonImage('');
                            }}
                            className="px-5 py-2 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add Team Member
                          </button>
                        </div>
                      </div>

                      {/* Display people list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                        {editingEvent.people && editingEvent.people.map((p, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-[#FFEFBF] border border-plum/10 rounded-xl relative pr-14">
                            <div className="w-10 h-10 rounded-full bg-plum/10 relative overflow-hidden flex-shrink-0">
                              <Image src={p.image_url || '/placeholder.jpg'} alt="" fill className="object-cover" />
                            </div>
                            <div className="text-xs space-y-0.5">
                              <h5 className="font-bold text-plum">{p.name}</h5>
                              <p className="text-[10px] uppercase tracking-wide text-[#E65C17] font-semibold">{p.role}</p>
                              <p className="text-[10px] text-warm-black/65 font-light line-clamp-2">{p.bio}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.people || [];
                                setEditingEvent({ ...editingEvent, people: cur.filter((_, i) => i !== idx) });
                              }}
                              className="absolute top-2 right-2 text-xs text-[#E65C17] hover:text-red-700 font-bold px-1.5 py-0.5"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {(!editingEvent.people || editingEvent.people.length === 0) && (
                          <p className="text-xs text-warm-black/40 italic py-2 text-center col-span-2">No organizers added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-plum/5 border-t border-plum/10 flex justify-end space-x-3">
                    <button 
                      onClick={() => setEditingEvent(null)}
                      className="px-6 py-2.5 bg-linen border border-plum/20 hover:bg-plum/5 text-plum rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEvent}
                      className="px-6 py-2.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300"
                    >
                      Save Gathering
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Store products manager */}
        {activeTab === 'store' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Store Products Editor</h1>
                <p className="text-sm text-warm-black/60">Manage merchandise cards, details, pricing, and external checkout routes.</p>
              </div>
              <button
                onClick={() => setEditingProduct({
                  product_title: '', slug: '', description: '', price: '',
                  image: '', status: 'available', external_checkout_url: '',
                  featured: false, published: true
                })}
                className="px-6 py-3.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Product
              </button>
            </div>

            {/* List products */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-5">Item Name</th>
                      <th className="p-5">Price</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Featured</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/5">
                    {products.map(pr => (
                      <tr key={pr.id} className="hover:bg-plum/5/20 transition-colors">
                        <td className="p-5 font-bold text-plum">{pr.product_title}</td>
                        <td className="p-5 font-semibold text-plum">{pr.price}</td>
                        <td className="p-5">
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-plum/5 text-plum border border-plum/5">
                            {pr.status}
                          </span>
                        </td>
                        <td className="p-5 text-xs font-bold text-plum">{pr.featured ? 'Yes' : 'No'}</td>
                        <td className="p-5 text-right flex justify-end space-x-3">
                          <button 
                            onClick={() => setEditingProduct({ ...pr })}
                            className="p-2.5 hover:bg-plum/15 rounded-xl text-plum transition-all border border-plum/5"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(pr.id)}
                            className="p-2.5 hover:bg-[#E65C17]/10 rounded-xl text-[#E65C17] transition-all border border-[#E65C17]/5"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product form modal overlay */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 bg-[#1E1D1B]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                <div className="max-w-xl w-full bg-[#FFEFBF] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 bg-plum text-[#FFEFBF] flex items-center justify-between border-b border-plum/10">
                    <h3 className="font-display text-xl font-bold text-white">{editingProduct.id ? 'Edit Product Details' : 'New Merchandise Product'}</h3>
                    <button onClick={() => setEditingProduct(null)} className="text-3xl text-[#FFEFBF]/75 hover:text-white cursor-pointer">&times;</button>
                  </div>
                  
                  <div className="p-8 space-y-6 text-sm">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Product Title</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.product_title || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, product_title: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] transition-all"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">URL Slug</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. classic-tee"
                            value={editingProduct.slug || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Price Label</label>
                          <input
                            type="text"
                            placeholder="e.g. $25"
                            value={editingProduct.price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Description Details</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Stripe Price Checkout Link / URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editingProduct.external_checkout_url || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, external_checkout_url: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Product Image URL</label>
                        <input
                          type="text"
                          value={editingProduct.image || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                          placeholder="https://images.squarespace-cdn.com/..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Availability Status</label>
                          <select
                            value={editingProduct.status || 'available'}
                            onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as StoreProduct['status'] })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none"
                          >
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="sold-out">Sold Out</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <label className="flex items-center space-x-2 cursor-pointer font-bold text-plum text-xs uppercase tracking-wide">
                            <input
                              type="checkbox"
                              checked={!!editingProduct.featured}
                              onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                              className="rounded text-plum border-plum/15 focus:ring-plum w-4 h-4"
                            />
                            <span>Featured Product</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-plum/5 border-t border-plum/10 flex justify-end space-x-3">
                    <button 
                      onClick={() => setEditingProduct(null)}
                      className="px-5 py-2.5 bg-linen border border-plum/20 hover:bg-plum/5 text-plum rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProduct}
                      className="px-5 py-2.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Support & Donations Editor */}
        {activeTab === 'support' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Donations & Support Settings</h1>
              <p className="text-sm text-warm-black/60">Configure the donation checkout links and copy on the support page.</p>
            </div>

            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Donation Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">One-Time Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.one_time_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { one_time_donation_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Monthly Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.monthly_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { monthly_donation_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Support Folds Copy</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Support Title</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.support_headline}
                    onBlur={(e) => handleSaveSettings('support', { support_headline: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Support Description</label>
                  <textarea
                    rows={4}
                    defaultValue={siteSettings.support_text}
                    onBlur={(e) => handleSaveSettings('support', { support_text: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[#FFA526] resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Community Links */}
        {activeTab === 'community' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Community Connections</h1>
              <p className="text-sm text-warm-black/60">Configure public URLs for community WhatsApp, Instagram, Facebook, and mail endpoints.</p>
            </div>

            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Social Connections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">WhatsApp Community Invite URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.whatsapp_url}
                    onBlur={(e) => handleSaveSettings('comms', { whatsapp_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Instagram Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.instagram_url}
                    onBlur={(e) => handleSaveSettings('comms', { instagram_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Facebook Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.facebook_url}
                    onBlur={(e) => handleSaveSettings('comms', { facebook_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Contact Email Address</label>
                  <input
                    type="email"
                    defaultValue={siteSettings.contact_email}
                    onBlur={(e) => handleSaveSettings('comms', { contact_email: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Reading Resources</h1>
                <p className="text-sm text-warm-black/60">Configure public downloads and reading references cards.</p>
              </div>
              <button
                onClick={() => setEditingResource({
                  title: '', category: '', description: '',
                  external_url: '', uploaded_file_url: '',
                  published: true, sort_order: resources.length + 1
                })}
                className="px-6 py-3.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Resource
              </button>
            </div>

            {/* List resources */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
              <div className="overflow-x-auto text-sm font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-5">Title</th>
                      <th className="p-5">Category</th>
                      <th className="p-5">Sort Order</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/5">
                    {resources.map(res => (
                      <tr key={res.id} className="hover:bg-plum/5/20 transition-colors">
                        <td className="p-5 font-bold text-plum">{res.title}</td>
                        <td className="p-5 font-semibold text-plum">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFA526]/10 text-plum border border-[#FFA526]/20">
                            {res.category || 'General'}
                          </span>
                        </td>
                        <td className="p-5 font-light text-warm-black/70">{res.sort_order}</td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                            res.published 
                              ? 'bg-plum/5 text-plum border-plum/5' 
                              : 'bg-warm-black/5 text-warm-black/40 border-warm-black/5'
                          }`}>
                            {res.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-5 text-right flex justify-end space-x-3 items-center">
                          {(res.external_url || res.uploaded_file_url) && (
                            <a 
                              href={res.external_url || res.uploaded_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2.5 hover:bg-[#FFA526]/10 rounded-xl text-plum transition-all border border-[#FFA526]/5 flex items-center justify-center"
                              title="View Document"
                            >
                              <ExternalLink className="h-4.5 w-4.5" />
                            </a>
                          )}
                          <button 
                            onClick={() => setEditingResource({ ...res })}
                            className="p-2.5 hover:bg-plum/15 rounded-xl text-plum transition-all border border-plum/5"
                            title="Edit Resource"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteResource(res.id)}
                            className="p-2.5 hover:bg-[#E65C17]/10 rounded-xl text-[#E65C17] transition-all border border-[#E65C17]/5"
                            title="Delete Resource"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resource form modal overlay */}
            {editingResource && (
              <div className="fixed inset-0 z-50 bg-[#1E1D1B]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 text-warm-black">
                <div className="max-w-xl w-full bg-[#FFEFBF] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-plum">
                  <div className="p-6 bg-plum text-[#FFEFBF] flex items-center justify-between border-b border-plum/10">
                    <h3 className="font-display text-xl font-bold text-white">{editingResource.id ? 'Edit Resource Details' : 'New Reading Resource'}</h3>
                    <button onClick={() => setEditingResource(null)} className="text-3xl text-[#FFEFBF]/75 hover:text-white cursor-pointer">&times;</button>
                  </div>
                  
                  <div className="p-8 space-y-6 text-sm overflow-y-auto max-h-[70vh] text-left">
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">Resource Title</label>
                        <input
                          type="text"
                          required
                          value={editingResource.title || ''}
                          onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] transition-all"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">Category</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Study Guides, Practices"
                          value={editingResource.category || ''}
                          onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                        />
                        {Array.from(new Set(resources.map(r => r.category).filter(Boolean))).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5 justify-start">
                            <span className="text-[10px] text-plum/50 font-bold self-center mr-1">Suggestions:</span>
                            {Array.from(new Set(resources.map(r => r.category).filter(Boolean))).map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setEditingResource({ ...editingResource, category: cat })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                  editingResource.category === cat 
                                    ? 'bg-plum text-[#FFEFBF] border-plum' 
                                    : 'bg-plum/5 text-plum border-plum/10 hover:bg-plum/10'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">Description Details</label>
                        <textarea
                          rows={3}
                          required
                          value={editingResource.description || ''}
                          onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] resize-none leading-relaxed text-warm-black"
                        />
                      </div>

                      {/* External URL */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">External Document URL (optional)</label>
                        <input
                          type="text"
                          placeholder="https://docs.google.com/..."
                          value={editingResource.external_url || ''}
                          onChange={(e) => setEditingResource({ ...editingResource, external_url: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                        />
                      </div>

                      {/* Uploaded File URL */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">Uploaded File Path/URL (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. /my-guide.pdf"
                          value={editingResource.uploaded_file_url || ''}
                          onChange={(e) => setEditingResource({ ...editingResource, uploaded_file_url: e.target.value })}
                          className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {/* Sort Order */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60 text-left">Sort Order</label>
                          <input
                            type="number"
                            value={editingResource.sort_order ?? 0}
                            onChange={(e) => setEditingResource({ ...editingResource, sort_order: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526]"
                          />
                        </div>

                        {/* Published */}
                        <div className="flex items-center space-x-2 pt-6">
                          <input
                            type="checkbox"
                            id="published"
                            checked={!!editingResource.published}
                            onChange={(e) => setEditingResource({ ...editingResource, published: e.target.checked })}
                            className="h-5 w-5 rounded border-plum/15 text-plum focus:ring-[#FFA526]"
                          />
                          <label htmlFor="published" className="text-xs font-bold uppercase tracking-wider text-plum/70 cursor-pointer">
                            Published Live
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-plum/5 border-t border-plum/10 flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingResource(null)}
                      className="px-5 py-2.5 border border-plum/15 hover:border-plum text-plum font-semibold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResource}
                      className="px-6 py-2.5 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum font-bold rounded-full text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
                    >
                      Save Resource
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Tab 8: Media Manager */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Media Manager</h1>
              <p className="text-sm text-warm-black/60">View and upload image references. Copy paths to use inside event cards.</p>
            </div>

            {/* List of images */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {events.map((ev, i) => (
                  <div key={i} className="flex flex-col border border-plum/10 bg-plum/5 rounded-2xl overflow-hidden p-3 text-xs shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-plum/5 relative">
                      <Image src={ev.hero_image} alt="" fill className="object-cover" />
                    </div>
                    <span className="font-bold text-plum mt-3 truncate">{ev.title} Cover</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={ev.hero_image} 
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        document.execCommand('copy');
                        triggerToast('Copied Image Link to clipboard!');
                      }}
                      className="text-[10px] bg-[#FFEFBF] border border-plum/10 p-2 rounded-xl mt-2 truncate cursor-pointer focus:outline-none font-mono text-plum/70" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Form Submissions */}
        {activeTab === 'submissions' && (
          <div className="space-y-10">
            {/* Subsection: Subscribers */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-plum">Newsletter Subscribers</h2>
                  <p className="text-sm text-warm-black/60">Users who signed up to receive mailing letters.</p>
                </div>
                <button
                  onClick={() => exportToCSV('subscribers')}
                  className="px-5 py-3 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Download className="mr-1.5 h-4 w-4" /> Export Subscribers (CSV)
                </button>
              </div>

              <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md text-sm font-sans max-h-60 overflow-y-auto">
                {subscribers.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                        <th className="p-5">Email</th>
                        <th className="p-5">Date Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-plum/5">
                      {subscribers.map((sub, i) => (
                        <tr key={i} className="hover:bg-plum/5/20 transition-colors">
                          <td className="p-5 font-bold text-plum">{sub.email}</td>
                          <td className="p-5 text-xs text-warm-black/55">{new Date(sub.subscribed_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-8 text-center">No mailing list signups found.</p>
                )}
              </div>
            </div>

            {/* Subsection: Feedback Messages */}
            <div className="space-y-4 pt-10 border-t border-plum/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-plum">Contact Forms Received</h2>
                  <p className="text-sm text-warm-black/60">Feedback submissions sent from the Contact page.</p>
                </div>
                <button
                  onClick={() => exportToCSV('messages')}
                  className="px-5 py-3 bg-plum hover:bg-[#FFA526] text-[#FFEFBF] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Download className="mr-1.5 h-4 w-4" /> Export Forms (CSV)
                </button>
              </div>

              <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md text-sm font-sans max-h-80 overflow-y-auto">
                {messages.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                        <th className="p-5">Name</th>
                        <th className="p-5">Email</th>
                        <th className="p-5">Message</th>
                        <th className="p-5">Date Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-plum/5">
                      {messages.map((msg, i) => (
                        <tr key={i} className="hover:bg-plum/5/20 transition-colors">
                          <td className="p-5 font-bold text-plum">{msg.name || 'Anonymous'}</td>
                          <td className="p-5 text-xs text-warm-black/60">{msg.email}</td>
                          <td className="p-5 text-xs text-warm-black/75 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                          <td className="p-5 text-xs text-warm-black/55">{new Date(msg.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-8 text-center">No contact submissions received yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: General Settings & Themes */}
        {activeTab === 'settings' && (
          <div className="space-y-10 max-w-4xl">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">General Settings</h1>
              <p className="text-sm text-warm-black/60">Configure integrations, payment options, and website themes.</p>
            </div>

            {/* Theme Settings Panel */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/15 pb-3">Website Palette Theme</h2>
              <p className="text-xs text-warm-black/60 -mt-3">Choose one of the curated design color schemes for the live website.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'default', name: 'Linen & Plum (Rebrand Default)', bg: '#FFEFBF', text: '#1E1D1B', primary: '#6E0B64', secondary: '#FF7DB4', accent: '#FFA526' },
                  { id: 'ocean', name: 'Ocean Breeze', bg: '#E0F2FE', text: '#0F172A', primary: '#0369A1', secondary: '#38BDF8', accent: '#F43F5E' },
                  { id: 'forest', name: 'Forest Sage', bg: '#E8F5E9', text: '#1B5E20', primary: '#2E7D32', secondary: '#81C784', accent: '#E65C17' },
                  { id: 'dark', name: 'Midnight Glow (Dark Theme)', bg: '#121214', text: '#F4F4F6', primary: '#BF3078', secondary: '#FFA526', accent: '#8B5CF6' }
                ].map((pal) => (
                  <button
                    key={pal.id}
                    onClick={() => handleSaveSettings('theme', { color_palette: pal.id })}
                    className={`flex flex-col text-left border rounded-2xl p-5 transition-all duration-300 hover:shadow-md cursor-pointer ${
                      (siteSettings.color_palette || 'default') === pal.id 
                        ? 'border-plum bg-plum/5 ring-2 ring-plum shadow-md' 
                        : 'border-plum/15 bg-[#FFEFBF] hover:border-plum/45'
                    }`}
                  >
                    <span className="font-bold text-plum text-sm">{pal.name}</span>
                    
                    {/* Swatch grid */}
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="w-7 h-7 rounded-full border border-plum/10" style={{ backgroundColor: pal.bg }} title="Background" />
                      <div className="w-7 h-7 rounded-full border border-plum/10" style={{ backgroundColor: pal.text }} title="Text color" />
                      <div className="w-7 h-7 rounded-full" style={{ backgroundColor: pal.primary }} title="Primary Accent (Plum)" />
                      <div className="w-7 h-7 rounded-full" style={{ backgroundColor: pal.secondary }} title="Secondary Accent (Pink)" />
                      <div className="w-7 h-7 rounded-full" style={{ backgroundColor: pal.accent }} title="Accent (Sunshine)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stripe Settings Panel */}
            <div className="bg-[#FFEFBF] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/15 pb-3">Stripe Integration Settings</h2>
              <p className="text-xs text-warm-black/60 -mt-3">Configure secure payment checkouts. (Changes apply automatically when keys are entered).</p>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between p-5 bg-plum/5 rounded-2xl border border-plum/10">
                  <div className="space-y-1 max-w-lg">
                    <label className="font-bold text-plum text-sm block">Direct Stripe Checkout Mode</label>
                    <span className="text-xs text-warm-black/65">
                      Toggle whether bookings and donations go directly to Sanga&apos;s native Stripe Checkout page or redirect to Squarespace pages.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!siteSettings.stripe_checkout_enabled}
                    onChange={(e) => handleSaveSettings('stripe', { stripe_checkout_enabled: e.target.checked })}
                    className="w-5 h-5 accent-plum cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      value={siteSettings.stripe_publishable_key || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, stripe_publishable_key: e.target.value })}
                      onBlur={(e) => handleSaveSettings('stripe', { stripe_publishable_key: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs text-plum"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      value={siteSettings.stripe_secret_key || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, stripe_secret_key: e.target.value })}
                      onBlur={(e) => handleSaveSettings('stripe', { stripe_secret_key: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FFEFBF] border border-plum/15 rounded-2xl focus:outline-none focus:border-[#FFA526] font-mono text-xs text-plum"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
