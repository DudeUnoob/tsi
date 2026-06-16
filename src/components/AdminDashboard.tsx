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
  Users, Plus, Trash2, Edit, Check, Download, AlertTriangle, Settings as SettingsIcon
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';

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

  // Form edit states (for Gatherings and Store edit modals)
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);

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
      
      const r = await getResources();
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
    const nextSettings = { ...siteSettings, ...updatedSettings };
    setSiteSettings(nextSettings);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        triggerToast(`Local Mode: Settings mock-saved!`);
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
      <div className="min-h-screen bg-linen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-plum border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-plum">Loading Staff Portal...</p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center font-sans px-6">
        <div className="max-w-md w-full bg-linen p-8 rounded-3xl border border-plum/15 shadow-lg flex flex-col space-y-6">
          <div className="text-center">
            <span className="font-display text-2xl font-bold text-plum">Sanga Portal</span>
            <p className="text-xs text-warm-black/60 mt-1">Staff & Volunteer Login</p>
          </div>

          {authError && (
            <div className="bg-tangerine/5 border border-tangerine/10 text-tangerine text-xs p-3 rounded-xl flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" /> {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-plum hover:bg-tangerine text-linen font-bold uppercase tracking-wider rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linen flex font-sans">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-plum text-linen px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center animate-fadeIn">
          <Check className="mr-2 h-4 w-4 text-mint-green" /> {toastMessage}
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-64 bg-warm-black text-linen p-6 flex flex-col justify-between hidden md:flex border-r border-linen/5">
        <div className="space-y-8">
          <div>
            <span className="font-display text-2xl font-bold text-linen">Sanga</span>
            <span className="text-[10px] tracking-wider uppercase text-linen/40 block -mt-1 font-bold">Staff Control Panel</span>
          </div>

          {!isSupabaseConfigured && (
            <div className="bg-sunshine/10 border border-sunshine/20 rounded-2xl p-3 text-[10px] text-sunshine leading-relaxed flex items-start">
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Local Fallback Mode</strong><br />
                Supabase credentials missing. Changes are temporary.
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-1.5 text-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <LayoutDashboard className="h-4 w-4" /> <span>Overview</span>
            </button>
            <button 
              onClick={() => setActiveTab('homepage')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'homepage' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <Home className="h-4 w-4" /> <span>Homepage Editor</span>
            </button>
            <button 
              onClick={() => setActiveTab('gatherings')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'gatherings' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <Calendar className="h-4 w-4" /> <span>Gatherings</span>
            </button>
            <button 
              onClick={() => setActiveTab('store')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'store' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <ShoppingBag className="h-4 w-4" /> <span>Merch Store</span>
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'support' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <Heart className="h-4 w-4" /> <span>Support & Copy</span>
            </button>
            <button 
              onClick={() => setActiveTab('community')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'community' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <MessageCircle className="h-4 w-4" /> <span>Community Links</span>
            </button>
            <button 
              onClick={() => setActiveTab('resources')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'resources' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <FileText className="h-4 w-4" /> <span>Resources</span>
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'media' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <ImageIcon className="h-4 w-4" /> <span>Media Library</span>
            </button>
             <button 
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'submissions' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <Users className="h-4 w-4" /> <span>Submissions</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-linen/10 text-pink font-bold' : 'text-linen/75 hover:bg-linen/5'}`}
            >
              <SettingsIcon className="h-4 w-4" /> <span>Settings</span>
            </button>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-linen/60 hover:text-pink transition-all text-sm w-full border-t border-linen/5 pt-4 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> <span>Log Out</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow p-8 md:p-12 overflow-y-auto max-h-screen">
        
        {/* Active Tab render checks */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-plum">Console Overview</h1>
              <p className="text-sm text-warm-black/60">Live metrics and updates for Sanga pages.</p>
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-linen border border-plum/10 rounded-2xl p-6">
                <span className="text-xs font-bold text-warm-black/55 uppercase tracking-wide block">Active Gatherings</span>
                <span className="text-3xl font-display font-bold text-plum block mt-2">{events.length}</span>
              </div>
              <div className="bg-linen border border-plum/10 rounded-2xl p-6">
                <span className="text-xs font-bold text-warm-black/55 uppercase tracking-wide block">Subscribers</span>
                <span className="text-3xl font-display font-bold text-plum block mt-2">{subscribers.length}</span>
              </div>
              <div className="bg-linen border border-plum/10 rounded-2xl p-6">
                <span className="text-xs font-bold text-warm-black/55 uppercase tracking-wide block">Messages Received</span>
                <span className="text-3xl font-display font-bold text-plum block mt-2">{messages.length}</span>
              </div>
              <div className="bg-linen border border-plum/10 rounded-2xl p-6">
                <span className="text-xs font-bold text-warm-black/55 uppercase tracking-wide block">Store items</span>
                <span className="text-3xl font-display font-bold text-plum block mt-2">{products.length}</span>
              </div>
            </div>

            {/* Quick Actions / Recent elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Recent Messages */}
              <div className="bg-linen border border-plum/10 rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-plum mb-4 border-b border-plum/5 pb-2">Recent Feedback</h3>
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.slice(0, 3).map((m, i) => (
                      <div key={i} className="text-xs font-sans p-3 bg-plum/5 rounded-xl border border-plum/5">
                        <div className="flex justify-between font-bold text-plum mb-1">
                          <span>{m.name || 'Anonymous'} ({m.email})</span>
                          <span className="font-normal text-warm-black/40">{new Date(m.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-warm-black/85 leading-relaxed italic">&ldquo;{m.message}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-4">No submissions received yet.</p>
                )}
              </div>

              {/* Page Settings guide */}
              <div className="bg-linen border border-plum/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-plum mb-4 border-b border-plum/5 pb-2">Welcome Sanga Coordinator</h3>
                  <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
                    Use this panel to manage and rebrand content without code. Settings updates are live immediately. For guides and tips on publishing items, refer to the staff files.
                  </p>
                </div>
                <div className="pt-6 border-t border-plum/5 mt-6 flex gap-3">
                  <button onClick={() => setActiveTab('homepage')} className="px-4 py-2 bg-plum hover:bg-tangerine text-linen text-xs font-bold uppercase rounded-full shadow-sm">
                    Edit Home Folds
                  </button>
                  <button onClick={() => setActiveTab('gatherings')} className="px-4 py-2 bg-linen border border-plum text-plum hover:bg-plum/5 text-xs font-bold uppercase rounded-full">
                    Manage Retreats
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Homepage Settings Editor */}
        {activeTab === 'homepage' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="font-display text-3xl font-bold text-plum">Homepage Configuration</h1>
              <p className="text-sm text-warm-black/60">Modify the text, headlines, and call-to-action buttons on the landing page.</p>
            </div>

            {/* Hero fold editor */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-2">Hero Fold Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Hero Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.hero_headline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_headline: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    defaultValue={siteSettings.hero_subheadline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_subheadline: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Primary CTA Label</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_label}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_label: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Primary CTA Target URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_url}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
                  />
                </div>
              </div>
            </div>

            {/* Intro fold editor */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-2">About / Intro Copy</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">About Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.intro_headline}
                    onBlur={(e) => handleSaveSettings('intro', { intro_headline: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">About Description</label>
                  <textarea
                    rows={5}
                    defaultValue={siteSettings.intro_text}
                    onBlur={(e) => handleSaveSettings('intro', { intro_text: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-plum resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Gatherings / Events Editor */}
        {activeTab === 'gatherings' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-plum">Gatherings & Events Manager</h1>
                <p className="text-sm text-warm-black/60">Create, edit, or delete retreats, camps, pilgrimage trips, and online sessions.</p>
              </div>
              <button
                onClick={() => setEditingEvent({
                  title: '', slug: '', category: 'retreat', status: 'draft',
                  price: '', location: '', start_date: '', end_date: '', age_range: '',
                  short_description: '', long_description: '',
                  highlights: [], schedule: [], faqs: [], people: [],
                  featured_on_homepage: false, published: false
                })}
                className="px-5 py-3 bg-plum hover:bg-tangerine text-linen text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Gathering
              </button>
            </div>

            {/* List catalog of events */}
            <div className="bg-linen border border-plum/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-4">Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Homepage</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/5">
                    {events.map(ev => (
                      <tr key={ev.id} className="hover:bg-plum/5/20">
                        <td className="p-4 font-bold text-plum">{ev.title}</td>
                        <td className="p-4 text-xs font-semibold uppercase tracking-wider text-tangerine">{ev.category}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-plum/5 border border-plum/10 text-plum">
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-warm-black/60">{new Date(ev.start_date).toLocaleDateString()}</td>
                        <td className="p-4 text-xs font-bold text-plum">{ev.featured_on_homepage ? 'Yes' : 'No'}</td>
                        <td className="p-4 text-right flex justify-end space-x-2">
                          <button 
                            onClick={() => setEditingEvent({ ...ev })}
                            className="p-2 hover:bg-plum/10 rounded-xl text-plum transition-all"
                            title="Edit Event"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-2 hover:bg-tangerine/10 rounded-xl text-tangerine transition-all"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4 w-4" />
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
              <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
                <div className="max-w-4xl w-full bg-linen border border-plum/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-6 bg-plum text-linen flex items-center justify-between border-b border-linen/10">
                    <h3 className="font-display text-xl font-bold">{editingEvent.id ? 'Edit Gathering' : 'New Gathering'}</h3>
                    <button onClick={() => setEditingEvent(null)} className="text-linen/75 hover:text-linen">&times;</button>
                  </div>
                  
                  {/* Modal body scrollable */}
                  <div className="p-8 space-y-6 overflow-y-auto text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Title</label>
                        <input
                          type="text"
                          required
                          value={editingEvent.title || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Slug</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. camp-ignite-2026"
                          value={editingEvent.slug || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, slug: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Category</label>
                        <select
                          value={editingEvent.category || 'retreat'}
                          onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        >
                          <option value="retreat">Retreat</option>
                          <option value="camp">Camp</option>
                          <option value="trip">Trip</option>
                          <option value="talk">Talk</option>
                          <option value="online">Online</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Age Range</label>
                        <input
                          type="text"
                          placeholder="e.g. 11-17 or 18-35"
                          value={editingEvent.age_range || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, age_range: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Status</label>
                        <select
                          value={editingEvent.status || 'draft'}
                          onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as Event['status'] })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        >
                          <option value="draft">Draft</option>
                          <option value="open">Open</option>
                          <option value="coming-soon">Coming Soon</option>
                          <option value="closed">Closed</option>
                          <option value="sold-out">Sold Out</option>
                          <option value="past">Past</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Start Date</label>
                        <input
                          type="date"
                          value={editingEvent.start_date || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">End Date</label>
                        <input
                          type="date"
                          value={editingEvent.end_date || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Price Label</label>
                        <input
                          type="text"
                          placeholder="e.g. $250 or Free"
                          value={editingEvent.price || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Location Address</label>
                        <input
                          type="text"
                          value={editingEvent.location || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Short Description</label>
                        <input
                          type="text"
                          value={editingEvent.short_description || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, short_description: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Long Details Overview</label>
                        <textarea
                          rows={4}
                          value={editingEvent.long_description || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, long_description: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none resize-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">External Registration / Checkout URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editingEvent.external_checkout_url || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, external_checkout_url: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Hero Image URL</label>
                        <input
                          type="text"
                          value={editingEvent.hero_image || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, hero_image: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Stripe Price ID (Future)</label>
                        <input
                          type="text"
                          placeholder="price_..."
                          value={editingEvent.stripe_price_id || ''}
                          onChange={(e) => setEditingEvent({ ...editingEvent, stripe_price_id: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-6 md:col-span-2 pt-6">
                        <label className="flex items-center space-x-2 cursor-pointer font-bold text-plum text-xs uppercase tracking-wide">
                          <input
                            type="checkbox"
                            checked={!!editingEvent.featured_on_homepage}
                            onChange={(e) => setEditingEvent({ ...editingEvent, featured_on_homepage: e.target.checked })}
                            className="rounded text-plum border-plum/15 focus:ring-plum"
                          />
                          <span>Show Featured on Home</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 cursor-pointer font-bold text-plum text-xs uppercase tracking-wide">
                          <input
                            type="checkbox"
                            checked={!!editingEvent.published}
                            onChange={(e) => setEditingEvent({ ...editingEvent, published: e.target.checked })}
                            className="rounded text-plum border-plum/15 focus:ring-plum"
                          />
                          <span>Publish Immediately</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-plum/5 border-t border-plum/10 flex justify-end space-x-3">
                    <button 
                      onClick={() => setEditingEvent(null)}
                      className="px-5 py-2 bg-linen border border-plum/20 hover:bg-plum/5 text-plum rounded-full font-bold text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEvent}
                      className="px-5 py-2 bg-plum hover:bg-tangerine text-linen rounded-full font-bold text-xs uppercase tracking-wider"
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
                <h1 className="font-display text-3xl font-bold text-plum">Store Products Editor</h1>
                <p className="text-sm text-warm-black/60">Manage merchandise cards, cabin upgrades, descriptions, and registration links.</p>
              </div>
              <button
                onClick={() => setEditingProduct({
                  product_title: '', slug: '', description: '', price: '',
                  image: '', status: 'available', external_checkout_url: '',
                  featured: false, published: true
                })}
                className="px-5 py-3 bg-plum hover:bg-tangerine text-linen text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Product
              </button>
            </div>

            {/* List products */}
            <div className="bg-linen border border-plum/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/5">
                    {products.map(pr => (
                      <tr key={pr.id} className="hover:bg-plum/5/20">
                        <td className="p-4 font-bold text-plum">{pr.product_title}</td>
                        <td className="p-4 font-semibold text-plum">{pr.price}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-plum/5 text-plum">
                            {pr.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold text-plum">{pr.featured ? 'Yes' : 'No'}</td>
                        <td className="p-4 text-right flex justify-end space-x-2">
                          <button 
                            onClick={() => setEditingProduct({ ...pr })}
                            className="p-2 hover:bg-plum/10 rounded-xl text-plum transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(pr.id)}
                            className="p-2 hover:bg-tangerine/10 rounded-xl text-tangerine transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
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
              <div className="fixed inset-0 z-50 bg-warm-black/40 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-linen border border-plum/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 bg-plum text-linen flex items-center justify-between border-b border-linen/10">
                    <h3 className="font-display text-xl font-bold">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                    <button onClick={() => setEditingProduct(null)} className="text-linen/75 hover:text-linen">&times;</button>
                  </div>
                  
                  <div className="p-8 space-y-6 text-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Product Title</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.product_title || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, product_title: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Slug</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. standard-tshirt"
                            value={editingProduct.slug || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                            className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Price Label</label>
                          <input
                            type="text"
                            placeholder="e.g. $25"
                            value={editingProduct.price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                            className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">External Checkout URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editingProduct.external_checkout_url || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, external_checkout_url: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Product Image URL</label>
                        <input
                          type="text"
                          value={editingProduct.image || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Status</label>
                          <select
                            value={editingProduct.status || 'available'}
                            onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as StoreProduct['status'] })}
                            className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
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
                              className="rounded text-plum border-plum/15 focus:ring-plum"
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
                      className="px-5 py-2 bg-linen border border-plum/20 hover:bg-plum/5 text-plum rounded-full font-bold text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProduct}
                      className="px-5 py-2 bg-plum hover:bg-tangerine text-linen rounded-full font-bold text-xs uppercase tracking-wider"
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
              <h1 className="font-display text-3xl font-bold text-plum">Donations & Support Settings</h1>
              <p className="text-sm text-warm-black/60">Configure the donation checkout links and copy on the support page.</p>
            </div>

            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-2">Donation Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">One-Time Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.one_time_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { one_time_donation_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Monthly Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.monthly_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { monthly_donation_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-2">Support Folds Copy</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Support Title</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.support_headline}
                    onBlur={(e) => handleSaveSettings('support', { support_headline: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Support Description</label>
                  <textarea
                    rows={4}
                    defaultValue={siteSettings.support_text}
                    onBlur={(e) => handleSaveSettings('support', { support_text: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm focus:outline-none resize-none"
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
              <h1 className="font-display text-3xl font-bold text-plum">Community Connections</h1>
              <p className="text-sm text-warm-black/60">Configure public URLs for community WhatsApp, Instagram, Facebook, and mail endpoints.</p>
            </div>

            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-2">Social Connections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">WhatsApp Community Invite URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.whatsapp_url}
                    onBlur={(e) => handleSaveSettings('comms', { whatsapp_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Instagram Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.instagram_url}
                    onBlur={(e) => handleSaveSettings('comms', { instagram_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Facebook Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.facebook_url}
                    onBlur={(e) => handleSaveSettings('comms', { facebook_url: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">Contact Email Address</label>
                  <input
                    type="email"
                    defaultValue={siteSettings.contact_email}
                    onBlur={(e) => handleSaveSettings('comms', { contact_email: e.target.value })}
                    className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Resources */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-plum">Reading Resources</h1>
              <p className="text-sm text-warm-black/60">Configure public downloads and reading references cards.</p>
            </div>
            
            {/* List and edit resources in place */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-6 space-y-4">
              {resources.map((res) => (
                <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-plum/5 rounded-2xl border border-plum/5 text-sm font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-tangerine uppercase tracking-wider block">{res.category}</span>
                    <h4 className="font-bold text-plum text-base">{res.title}</h4>
                    <p className="text-xs text-warm-black/60">{res.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a 
                      href={res.external_url || res.uploaded_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-plum/10 hover:bg-plum/20 text-plum font-semibold rounded-lg text-xs"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 8: Media Manager */}
        {activeTab === 'media' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-plum">Media Manager</h1>
              <p className="text-sm text-warm-black/60">View and upload image references. Copy paths to use inside event cards.</p>
            </div>

            {/* List of images */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {events.map((ev, i) => (
                  <div key={i} className="flex flex-col border border-plum/10 bg-plum/5 rounded-2xl overflow-hidden p-2 text-xs">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-plum/5 relative">
                      <Image src={ev.hero_image} alt="" fill className="object-cover" />
                    </div>
                    <span className="font-bold text-plum mt-2 truncate">{ev.title} Cover</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={ev.hero_image} 
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        document.execCommand('copy');
                        triggerToast('Copied Image Link to clipboard!');
                      }}
                      className="text-[10px] bg-linen border border-plum/10 p-1 rounded mt-1 truncate cursor-pointer focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Form Submissions */}
        {activeTab === 'submissions' && (
          <div className="space-y-8">
            {/* Subsection: Subscribers */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-plum">Newsletter Subscribers</h2>
                  <p className="text-sm text-warm-black/60">Users who signed up to receive mailing letters.</p>
                </div>
                <button
                  onClick={() => exportToCSV('subscribers')}
                  className="px-4 py-2.5 bg-plum hover:bg-tangerine text-linen text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center cursor-pointer"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export Subscribers to CSV
                </button>
              </div>

              <div className="bg-linen border border-plum/10 rounded-3xl overflow-hidden shadow-sm text-sm font-sans max-h-60 overflow-y-auto">
                {subscribers.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                        <th className="p-4">Email</th>
                        <th className="p-4">Date Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-plum/5">
                      {subscribers.map((sub, i) => (
                        <tr key={i} className="hover:bg-plum/5/20">
                          <td className="p-4 font-bold text-plum">{sub.email}</td>
                          <td className="p-4 text-xs text-warm-black/55">{new Date(sub.subscribed_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-6 text-center">No mailing list signups found.</p>
                )}
              </div>
            </div>

            {/* Subsection: Feedback Messages */}
            <div className="space-y-4 pt-6 border-t border-plum/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-plum">Contact Forms Received</h2>
                  <p className="text-sm text-warm-black/60">Feedback submissions sent from the Contact page.</p>
                </div>
                <button
                  onClick={() => exportToCSV('messages')}
                  className="px-4 py-2.5 bg-plum hover:bg-tangerine text-linen text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center cursor-pointer"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export Forms to CSV
                </button>
              </div>

              <div className="bg-linen border border-plum/10 rounded-3xl overflow-hidden shadow-sm text-sm font-sans max-h-80 overflow-y-auto">
                {messages.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Message</th>
                        <th className="p-4">Date Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-plum/5">
                      {messages.map((msg, i) => (
                        <tr key={i} className="hover:bg-plum/5/20">
                          <td className="p-4 font-bold text-plum">{msg.name || 'Anonymous'}</td>
                          <td className="p-4 text-xs text-warm-black/60">{msg.email}</td>
                          <td className="p-4 text-xs text-warm-black/75 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                          <td className="p-4 text-xs text-warm-black/55">{new Date(msg.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-warm-black/50 italic py-6 text-center">No contact submissions received yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: General Settings & Themes */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="font-display text-3xl font-bold text-plum">General Settings</h1>
              <p className="text-sm text-warm-black/60">Configure integrations, payment options, and website themes.</p>
            </div>

            {/* Theme Settings Panel */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/15 pb-3">Website Palette Theme</h2>
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
                    className={`flex flex-col text-left border rounded-2xl p-4 transition-all hover:scale-101 active:scale-99 cursor-pointer ${
                      (siteSettings.color_palette || 'default') === pal.id 
                        ? 'border-plum bg-plum/5 ring-1 ring-plum shadow-md' 
                        : 'border-plum/15 bg-linen hover:border-plum/45'
                    }`}
                  >
                    <span className="font-bold text-plum text-sm">{pal.name}</span>
                    
                    {/* Swatch grid */}
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="w-6 h-6 rounded-full border border-plum/10" style={{ backgroundColor: pal.bg }} title="Background" />
                      <div className="w-6 h-6 rounded-full border border-plum/10" style={{ backgroundColor: pal.text }} title="Text color" />
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: pal.primary }} title="Primary Accent (Plum)" />
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: pal.secondary }} title="Secondary Accent (Pink)" />
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: pal.accent }} title="Accent (Sunshine)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stripe Settings Panel */}
            <div className="bg-linen border border-plum/10 rounded-3xl p-8 space-y-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-plum border-b border-plum/15 pb-3">Stripe Integration Settings</h2>
              <p className="text-xs text-warm-black/60 -mt-3">Configure secure payment checkouts. (Changes apply automatically when keys are entered).</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-plum/5 rounded-2xl border border-plum/10">
                  <div className="space-y-1">
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
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      value={siteSettings.stripe_publishable_key || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, stripe_publishable_key: e.target.value })}
                      onBlur={(e) => handleSaveSettings('stripe', { stripe_publishable_key: e.target.value })}
                      className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum font-mono text-xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      value={siteSettings.stripe_secret_key || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, stripe_secret_key: e.target.value })}
                      onBlur={(e) => handleSaveSettings('stripe', { stripe_secret_key: e.target.value })}
                      className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl focus:outline-none focus:border-plum font-mono text-xs"
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
