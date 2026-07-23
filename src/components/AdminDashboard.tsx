'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  isFirebaseConfigured as isSupabaseConfigured, getSiteSettings, getEvents, getProducts, getResources,
  getLocalSubscribers, getLocalMessages, Order, EventRegistration, getOrders, getEventRegistrations, 
  getProductInventory, saveProductInventory, saveEvent, deleteEvent, saveProduct,
  deleteProduct, saveResource, deleteResource, saveSiteSettings, getNewsletterSubscribers,
  getContactMessages, loginAdmin, logoutAdmin, onAdminAuthStateChange, uploadFile, deleteFile,
  getAdminIdToken,
} from '@/lib/firebase';
import {
  SiteSettings, Event, StoreProduct, Resource
} from '@/lib/types';
import {
  LayoutDashboard, Home, Calendar, ShoppingBag, Heart,
  MessageCircle, FileText, Image as ImageIcon, LogOut,
  Users, Plus, Trash2, Edit, Check, Download, AlertTriangle, Settings as SettingsIcon,
  Video, Eye, Lock, FileUp, ExternalLink, Search, Info, X, Upload
} from 'lucide-react';
type Session = any;
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CURRENCY, formatMoney, legacyPriceToCents } from '@/lib/commerce';

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

async function commerceAdminRequest(method: 'GET' | 'PATCH', body?: unknown) {
  const token = await getAdminIdToken();
  const response = await fetch('/api/admin/commerce', {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Commerce request failed.');
  return data;
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
    hero_slideshow_hidden: false
  };

  // Loaded site states
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [slideshowUrls, setSlideshowUrls] = useState<string[]>(['', '', '']);
  const [slideshowLabels, setSlideshowLabels] = useState<string[]>(['', '', '']);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() =>
    !isSupabaseConfigured ? getLocalSubscribers() : []
  );
  const [messages, setMessages] = useState<ContactMessage[]>(() =>
    !isSupabaseConfigured ? getLocalMessages() : []
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [allInventories, setAllInventories] = useState<Record<number, ProductInventoryView[]>>({});
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [subTab, setSubTab] = useState<'mailing' | 'contact' | 'orders' | 'registrations'>('mailing');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [regEventFilter, setRegEventFilter] = useState<number | 'all'>('all');

  const [toastMessage, setToastMessage] = useState('');

  interface ProductInventoryView {
    product_id: number;
    size: string;
    stock: number;
    on_hand: number;
    reserved: number;
    sold: number;
  }

  // Helper to count how many items were sold for a product & size
  const getSoldQuantity = (productId: number, size: string): number => {
    let count = 0;
    orders.forEach(o => {
      if (o.status === 'paid' || o.status === 'completed') {
        o.items?.forEach(item => {
          if (item.id === productId && item.size?.toUpperCase() === size.toUpperCase()) {
            count += item.quantity || 0;
          }
        });
      }
    });
    return count;
  };

  // Form edit states (for Gatherings, Store, and Resources edit modals)
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null);
  const [editingInventory, setEditingInventory] = useState<{ size: string; stock: number }[]>([]);

  useEffect(() => {
    if (editingProduct && editingProduct.id) {
      getProductInventory(editingProduct.id).then(data => {
        const defaultSizes = ['S', 'M', 'L', 'XL', 'OS'];
        const list = defaultSizes.map(size => {
          const found = data.find(item => item.size.toUpperCase() === size.toUpperCase());
          return { size, stock: found ? found.stock : 0 };
        });
        setEditingInventory(list);
      });
    } else if (editingProduct) {
      setEditingInventory([
        { size: 'S', stock: 0 },
        { size: 'M', stock: 0 },
        { size: 'L', stock: 0 },
        { size: 'XL', stock: 0 },
        { size: 'OS', stock: 0 }
      ]);
    }
  }, [editingProduct]);

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

  // Firebase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAdminAuthStateChange((user) => {
      setSession(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch data lists from database
  useEffect(() => {
    const loadData = async () => {
      const s = await getSiteSettings();
      setSiteSettings(s);
      setSlideshowUrls(s.hero_slideshow_images ?? ['', '', '']);
      setSlideshowLabels(s.hero_slideshow_labels ?? ['', '', '']);

      const e = await getEvents({ all: true });
      setEvents(e);

      if (isSupabaseConfigured) {
        const commerce = await commerceAdminRequest('GET');
        setProducts(commerce.products as StoreProduct[]);
        const invs: Record<number, ProductInventoryView[]> = {};
        for (const item of commerce.inventory as Array<{
          product_id: number;
          variant: string;
          available: number;
          on_hand: number;
          reserved: number;
          sold: number;
        }>) {
          (invs[item.product_id] ||= []).push({
            product_id: item.product_id,
            size: item.variant,
            stock: item.available,
            on_hand: item.on_hand,
            reserved: item.reserved,
            sold: item.sold,
          });
        }
        setAllInventories(invs);
        setOrders(commerce.orders as Order[]);
      } else {
        const p = await getProducts({ all: true });
        setProducts(p);
        const invs: Record<number, ProductInventoryView[]> = {};
        for (const pr of p) {
          const inv = await getProductInventory(pr.id);
          invs[pr.id] = inv.map(item => ({
            product_id: item.product_id,
            size: item.size,
            stock: item.stock,
            on_hand: item.on_hand ?? item.stock,
            reserved: item.reserved ?? 0,
            sold: item.sold ?? 0,
          }));
        }
        setAllInventories(invs);
      }

      const r = await getResources({ publishedOnly: false });
      setResources(r);

      if (isSupabaseConfigured) {
        // Fetch newsletter subscribers
        const subs = await getNewsletterSubscribers();
        setSubscribers(subs);

        // Fetch contact messages
        const msgs = await getContactMessages();
        setMessages(msgs);

        // Fetch registrations
        const regs = await getEventRegistrations();
        if (regs) setRegistrations(regs);
      } else {
        setSubscribers(getLocalSubscribers());
        setMessages(getLocalMessages());

        const ords = await getOrders();
        if (ords) setOrders(ords);

        const regs = await getEventRegistrations();
        if (regs) setRegistrations(regs);
      }
    };

    if (!authLoading && (session || !isSupabaseConfigured)) {
      loadData();
    }
  }, [authLoading, session]);

  // Auth handles
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    if (!isSupabaseConfigured) {
      setSession({ email: 'mock-admin@example.com' });
      return;
    }

    try {
      setAuthLoading(true);
      const res = await loginAdmin();
      setAuthLoading(false);
      if (!res.success) throw new Error(res.message);
      setSession(res.session);
    } catch (err) {
      setAuthLoading(false);
      const error = err as Error;
      setAuthError(error.message || 'Google Sign-In failed.');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await logoutAdmin();
    }
    setSession(null);
  };

  // Toast indicator
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Reusable Image Uploader component
  const ImageUploader = ({
    label,
    value,
    onChange,
    folder = 'general'
  }: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    folder?: string;
  }) => {
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        const res = await uploadFile(folder, file);
        setUploading(false);
        if (res.success && res.url) {
          onChange(res.url);
          triggerToast('Image uploaded successfully!');
        } else {
          alert(res.message || 'Failed to upload image.');
        }
      } catch (err) {
        setUploading(false);
        console.error(err);
        alert('An error occurred during upload.');
      }
    };

    const handleDelete = async () => {
      if (!value) return;
      if (!confirm('Are you sure you want to delete this image?')) return;
      
      try {
        setUploading(true);
        await deleteFile(value);
        setUploading(false);
        onChange('');
        triggerToast('Image deleted!');
      } catch (err) {
        setUploading(false);
        console.error(err);
        triggerToast('Error deleting image.');
      }
    };

    return (
      <div className="space-y-2 text-left">
        {label && <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">{label}</label>}
        
        {value ? (
          <div className="relative group rounded-2xl overflow-hidden border border-plum/15 bg-plum/5 p-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-plum/10 shadow-sm" />
              <div className="space-y-1 overflow-hidden">
                <span className="text-[10px] text-plum/60 font-semibold block truncate max-w-[200px]">{value.split('/').pop()}</span>
                <span className="text-[8px] font-mono text-warm-black/40 block truncate max-w-[200px]">{value}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white hover:bg-[var(--color-sunshine)] text-plum hover:text-plum border border-plum/10 rounded-xl transition-all shadow-sm cursor-pointer"
                title="Change Image"
              >
                <Upload className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 bg-white hover:bg-[var(--color-pink)] hover:text-white text-[var(--color-pink)] border border-plum/10 rounded-xl transition-all shadow-sm cursor-pointer"
                title="Delete Image"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-plum/15 hover:border-[var(--color-sunshine)] bg-plum/5/20 hover:bg-plum/5 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 group"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-plum border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-plum/40 group-hover:text-plum transition-colors" />
            )}
            <span className="text-xs font-semibold text-plum/60 group-hover:text-plum transition-colors">
              {uploading ? 'Uploading image...' : 'Click to upload image'}
            </span>
            <span className="text-[9px] text-warm-black/40">PNG, JPG, or WEBP</span>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[9px] font-semibold text-plum/50 hover:text-plum transition-colors underline"
          >
            {showUrlInput ? 'Hide manual URL input' : 'Or paste an image URL instead'}
          </button>
        </div>

        {showUrlInput && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL here..."
            className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl focus:outline-none focus:border-[var(--color-sunshine)] text-xs text-plum font-mono"
          />
        )}
      </div>
    );
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
      await saveSiteSettings(updatedSettings);
      triggerToast('Settings updated successfully!');
      router.refresh();
    } catch (err) {
      console.error(err);
      triggerToast(`Error saving settings: ${err instanceof Error ? err.message : String(err)}`);
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
      const res = await saveEvent(finalEvent);
      if (!res.success) throw new Error(res.message);

      // Reload
      const e = await getEvents({ all: true });
      setEvents(e);
      setEditingEvent(null);
      triggerToast('Gathering updated successfully!');
    } catch (err) {
      console.error(err);
      triggerToast(`Error saving gathering: ${err instanceof Error ? err.message : String(err)}`);
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
      await deleteEvent(id);
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
      let savedId = editingProduct.id;
      if (isNew) {
        const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newPr = { ...(editingProduct as StoreProduct), id: nextId };
        setProducts([...products, newPr]);
        savedId = nextId;
      } else {
        setProducts(products.map(pr => pr.id === editingProduct.id ? (editingProduct as StoreProduct) : pr));
      }
      if (savedId) {
        await saveProductInventory(savedId, editingInventory);
      }
      setEditingProduct(null);
      triggerToast('Local Mode: Product and inventory mock-saved!');
      return;
    }

    try {
      const savedId = editingProduct.id
        || (products.length > 0 ? Math.max(...products.map(product => product.id)) + 1 : 1);
      const priceCents = editingProduct.price_cents
        ?? legacyPriceToCents(editingProduct.price || '0');
      const payload: StoreProduct = {
        id: savedId,
        product_title: editingProduct.product_title,
        slug: editingProduct.slug,
        description: editingProduct.description || '',
        image: editingProduct.image || '',
        price_cents: priceCents,
        price: formatMoney(priceCents),
        currency: CURRENCY,
        variant_type: editingProduct.variant_type || 'size',
        status: editingProduct.status || 'available',
        featured: Boolean(editingProduct.featured),
        published: Boolean(editingProduct.published),
      };

      await commerceAdminRequest('PATCH', {
        action: 'save_product',
        product: payload,
        inventory: editingInventory
          .filter(item => payload.variant_type === 'size' ? item.size !== 'OS' : item.size === 'OS')
          .map(item => ({ variant: item.size, on_hand: item.stock })),
      });
      const commerce = await commerceAdminRequest('GET');
      setProducts(commerce.products as StoreProduct[]);
      const invs: Record<number, ProductInventoryView[]> = {};
      for (const item of commerce.inventory as Array<{
        product_id: number;
        variant: string;
        available: number;
        on_hand: number;
        reserved: number;
        sold: number;
      }>) {
        (invs[item.product_id] ||= []).push({
          product_id: item.product_id,
          size: item.variant,
          stock: item.available,
          on_hand: item.on_hand,
          reserved: item.reserved,
          sold: item.sold,
        });
      }
      setAllInventories(invs);
      setEditingProduct(null);
      triggerToast('Store product and inventory updated!');
    } catch (err) {
      console.error(err);
      triggerToast(`Error saving product: ${err instanceof Error ? err.message : String(err)}`);
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
      await commerceAdminRequest('PATCH', { action: 'archive_product', productId: id });
      setProducts(products.map(product =>
        product.id === id
          ? { ...product, published: false, status: 'unavailable' }
          : product,
      ));
      triggerToast('Product archived.');
    } catch {
      triggerToast('Failed to delete product.');
    }
  };

  const handleReconcileReservations = async () => {
    if (!isSupabaseConfigured) {
      triggerToast('Reservation reconciliation requires Firebase.');
      return;
    }
    try {
      const result = await commerceAdminRequest('PATCH', { action: 'reconcile' });
      const commerce = await commerceAdminRequest('GET');
      setOrders(commerce.orders as Order[]);
      triggerToast(
        `Checked ${result.scanned} expired reservations; released ${result.released}.`,
      );
    } catch (err) {
      console.error(err);
      triggerToast('Failed to reconcile expired reservations.');
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

      const res = await saveResource({ ...payload, id: editingResource.id });
      if (!res.success) throw new Error(res.message);

      const r = await getResources({ publishedOnly: false });
      setResources(r);
      setEditingResource(null);
      triggerToast('Resource updated successfully!');
    } catch (err) {
      console.error(err);
      triggerToast(`Error saving resource: ${err instanceof Error ? err.message : String(err)}`);
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
      await deleteResource(id);
      setResources(resources.filter(r => r.id !== id));
      triggerToast('Resource deleted.');
    } catch {
      triggerToast('Failed to delete resource.');
    }
  };

  // CSV Exporter
  const exportToCSV = (type: 'subscribers' | 'messages' | 'orders' | 'registrations', eventFilterId?: number) => {
    let headers = '';
    let rows: string[] = [];
    let filename = '';

    if (type === 'subscribers') {
      headers = 'Email,Date Subscribed';
      rows = subscribers.map(s => `"${s.email}","${s.subscribed_at || ''}"`);
      filename = 'newsletter_subscribers.csv';
    } else if (type === 'messages') {
      headers = 'Name,Email,Message,Submitted At,Reviewed';
      rows = messages.map(m => `"${m.name || ''}","${m.email}","${(m.message || '').replace(/"/g, '""')}","${m.submitted_at || ''}","${m.reviewed ? 'Yes' : 'No'}"`);
      filename = 'contact_submissions.csv';
    } else if (type === 'orders') {
      headers = 'Order Ref,Customer Name,Customer Email,Shipping Address,Total Amount,Status,Items,Created At';
      rows = orders.map(o => {
        const itemsSummary = o.items.map(i => `${i.product_title} x${i.quantity} (${i.size})`).join('; ');
        return `"${o.order_ref}","${(o.customer_name || '').replace(/"/g, '""')}","${o.customer_email}","${(o.shipping_address || '').replace(/"/g, '""')}","${o.total_amount.toFixed(2)}","${o.status}","${itemsSummary.replace(/"/g, '""')}","${o.created_at || ''}"`;
      });
      filename = 'store_orders.csv';
    } else if (type === 'registrations') {
      headers = 'Event Title,Full Name,Email,Age,Phone,Emergency Contact,Emergency Phone,Dietary Restrictions,Medical Info,Status,Created At';
      const filteredRegs = eventFilterId
        ? registrations.filter(r => r.event_id === eventFilterId)
        : registrations;
      rows = filteredRegs.map(r => {
        return `"${(r.event_title || '').replace(/"/g, '""')}","${(r.full_name || '').replace(/"/g, '""')}","${r.email}","${r.age}","${r.phone}","${(r.emergency_contact_name || '').replace(/"/g, '""')}","${r.emergency_contact_phone}","${(r.dietary_restrictions || '').replace(/"/g, '""')}","${(r.medical_info || '').replace(/"/g, '""')}","${r.status}","${r.created_at || ''}"`;
      });
      filename = eventFilterId
        ? `registrations_event_${eventFilterId}.csv`
        : 'event_registrations.csv';
    }

    const csvString = [headers].concat(rows).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${type} to CSV!`);
  };

  // Render Login state if unauthenticated and Supabase is configured
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-linen)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-plum border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-plum tracking-wide uppercase">Loading Sanga Portal...</p>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="min-h-screen bg-[var(--color-linen)] flex items-center justify-center font-sans px-6 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-[var(--color-sunshine)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-[var(--color-pink)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[var(--color-linen)] p-10 rounded-[2.5rem] border border-plum/15 shadow-2xl flex flex-col space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <span className="font-display text-4xl font-bold text-plum block tracking-tight">sanga</span>
            <span className="text-[10px] tracking-wider uppercase text-plum/60 font-bold block">Staff & Volunteer Login</span>
          </div>

          {authError && (
            <div className="bg-[var(--color-pink)]/5 border border-[var(--color-pink)]/10 text-[var(--color-pink)] text-xs p-4 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {authError}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleLogin()}
              className="w-full py-4 bg-white border border-plum/15 hover:border-[var(--color-sunshine)] text-plum hover:bg-[var(--color-sunshine)]/5 font-bold uppercase tracking-wider rounded-full text-xs shadow-md transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Sign In with Google</span>
            </button>
            <p className="text-[10px] text-warm-black/50 text-center leading-relaxed mt-4">
              Access is restricted to authorized Sanga Initiative administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-linen)] flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden font-sans">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-plum text-[var(--color-linen)] px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl flex items-center animate-fadeIn border border-[var(--color-linen)]/10">
          <Check className="mr-2 h-4 w-4 text-[#66CC6E]" /> {toastMessage}
        </div>
      )}

      {/* Sidebar navigation — desktop only */}
      <aside className="w-64 bg-plum text-[var(--color-linen)] p-8 flex-col justify-between hidden lg:flex border-r border-[var(--color-linen)]/5 h-full overflow-y-auto flex-shrink-0">
        <div className="space-y-10">
          <Link href="/" className="space-y-1 block hover:opacity-90 transition-opacity">
            <span className="font-display text-3xl font-bold text-white tracking-tight block">sanga</span>
            <span className="text-[10px] tracking-wider uppercase text-[var(--color-sunshine)] block font-bold">Volunteer Admin Portal</span>
          </Link>

          {!isSupabaseConfigured && (
            <div className="bg-[var(--color-sunshine)]/10 border border-[var(--color-sunshine)]/20 rounded-2xl p-4 text-[10px] text-[var(--color-sunshine)] leading-relaxed flex items-start">
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isSelected
                      ? 'bg-[var(--color-sunshine)] text-plum font-bold shadow-md'
                      : 'text-[var(--color-linen)]/75 hover:bg-[var(--color-linen)]/5 hover:text-white'
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
          className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-[var(--color-linen)]/60 hover:text-[var(--color-pink)] hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider border-t border-[var(--color-linen)]/5 pt-4 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> <span>Log Out</span>
        </button>
      </aside>

      {/* Mobile top bar — visible below lg */}
      <div className="lg:hidden flex-shrink-0 bg-plum text-[var(--color-linen)]">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <Link href="/" className="font-display text-2xl font-bold text-white tracking-tight">
            sanga
            <span className="block text-[9px] tracking-wider uppercase text-[var(--color-sunshine)] font-bold leading-none">Admin Portal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[var(--color-linen)]/60 hover:text-[var(--color-pink)] text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
        {/* Scrollable tab strip */}
        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="flex gap-1 px-3 pb-2 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'homepage', label: 'Homepage', icon: Home },
              { id: 'gatherings', label: 'Gatherings', icon: Calendar },
              { id: 'store', label: 'Store', icon: ShoppingBag },
              { id: 'support', label: 'Support', icon: Heart },
              { id: 'community', label: 'Community', icon: MessageCircle },
              { id: 'resources', label: 'Resources', icon: FileText },
              { id: 'media', label: 'Media', icon: ImageIcon },
              { id: 'submissions', label: 'Submissions', icon: Users },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all cursor-pointer flex-shrink-0 ${isSelected
                      ? 'bg-[var(--color-sunshine)] text-plum'
                      : 'text-[var(--color-linen)]/60 hover:bg-[var(--color-linen)]/10 hover:text-white'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <main className="flex-grow p-5 md:p-8 lg:p-12 overflow-y-auto lg:h-full">

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
                <div key={i} className={`bg-[var(--color-linen)] border ${metric.color} rounded-3xl p-6 shadow-md transition-all duration-300 hover:shadow-lg`}>
                  <span className="text-[10px] font-bold text-plum/60 uppercase tracking-wider block">{metric.name}</span>
                  <span className="text-4xl font-display font-bold text-plum block mt-2">{metric.count}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions / Recent elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recent Messages */}
              <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 shadow-md">
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
              <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 shadow-md flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-plum border-b border-plum/5 pb-3">Welcome Sanga Coordinator</h3>
                  <p className="text-sm text-warm-black/80 leading-relaxed font-sans font-light">
                    Use this panel to manage, re-theme, and configure website copy without writing any code. All changes are synchronized in real-time. For custom configurations, adjust details inside the settings panels.
                  </p>
                </div>
                <div className="pt-8 flex gap-3 mt-6">
                  <button onClick={() => setActiveTab('homepage')} className="px-5 py-3 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all duration-300">
                    Edit Home Folds
                  </button>
                  <button onClick={() => setActiveTab('gatherings')} className="px-5 py-3 bg-[var(--color-linen)] border border-plum text-plum hover:bg-plum/5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300">
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
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Hero Fold Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.hero_headline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_headline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    defaultValue={siteSettings.hero_subheadline}
                    onBlur={(e) => handleSaveSettings('hero', { hero_subheadline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Primary CTA Label</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_label}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_label: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Primary CTA Target URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.primary_cta_url}
                    onBlur={(e) => handleSaveSettings('hero', { primary_cta_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>

                <div className="md:col-span-2 space-y-4 pt-2 border-t border-plum/5">
                  {/* Hide/show toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Hero Photo Slideshow</label>
                      <p className="text-xs text-plum/40 mt-0.5">Rotating card stack shown on the homepage hero.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSettings('hero', { hero_slideshow_hidden: !siteSettings.hero_slideshow_hidden })}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 ${siteSettings.hero_slideshow_hidden ? 'bg-plum/20' : 'bg-[#66CC6E]'
                        }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${siteSettings.hero_slideshow_hidden ? 'left-0.5' : 'left-6'
                        }`} />
                    </button>
                  </div>

                  {/* Dynamic image list */}
                  {!siteSettings.hero_slideshow_hidden && (
                    <div className="space-y-4">
                      {slideshowUrls.map((url, i) => (
                        <div key={i} className="relative group bg-plum/5 border border-plum/10 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-plum/5 pb-2">
                            <span className="text-[10px] font-black text-plum uppercase tracking-wider">Slideshow Image {i + 1}</span>
                            <button
                              onClick={() => {
                                const updatedUrls = slideshowUrls.filter((_, idx) => idx !== i);
                                const updatedLabels = slideshowLabels.filter((_, idx) => idx !== i);
                                setSlideshowUrls(updatedUrls);
                                setSlideshowLabels(updatedLabels);
                                handleSaveSettings('hero', { 
                                  hero_slideshow_images: updatedUrls.filter(Boolean),
                                  hero_slideshow_labels: updatedLabels
                                });
                              }}
                              className="p-1.5 rounded-lg text-[var(--color-pink)] hover:bg-[var(--color-pink)]/10 transition-all cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-plum/60">Image Upload</label>
                            <ImageUploader
                              label=""
                              value={url}
                              onChange={(newUrl) => {
                                const updated = [...slideshowUrls];
                                updated[i] = newUrl;
                                setSlideshowUrls(updated);
                                handleSaveSettings('hero', { hero_slideshow_images: updated.filter(Boolean) });
                              }}
                              folder="homepage/slideshow"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-plum/60">Caption Label</label>
                            <input
                              type="text"
                              value={slideshowLabels[i] ?? ''}
                              onChange={(e) => {
                                const updated = [...slideshowLabels];
                                updated[i] = e.target.value;
                                setSlideshowLabels(updated);
                              }}
                              onBlur={() => {
                                handleSaveSettings('hero', { hero_slideshow_labels: slideshowLabels });
                              }}
                              placeholder="Caption label (e.g. Summer Camp '26)"
                              className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs focus:outline-none focus:border-[var(--color-sunshine)] font-sans"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add image button */}
                      <button
                        onClick={() => {
                          setSlideshowUrls([...slideshowUrls, '']);
                          setSlideshowLabels([...slideshowLabels, '']);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-plum/60 hover:text-plum uppercase tracking-wider transition-all cursor-pointer px-4 py-2.5 border border-dashed border-plum/20 hover:border-plum/40 rounded-2xl w-full justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Video fold editor */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Moments Video Highlights</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Main Promo Video URL (YouTube watch or embed URL)</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.promo_video_url}
                    onBlur={(e) => handleSaveSettings('video', { promo_video_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                    placeholder="e.g. https://www.youtube.com/watch?v=bEBlO9HGTvQ"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Video Cover Poster Image URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.promo_video_cover_url}
                    onBlur={(e) => handleSaveSettings('video', { promo_video_cover_url: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                    placeholder="https://images.squarespace-cdn.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Intro fold editor */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">About & Mission Copy</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">About Section Headline</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.intro_headline}
                    onBlur={(e) => handleSaveSettings('intro', { intro_headline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">About Section Description</label>
                  <textarea
                    rows={5}
                    defaultValue={siteSettings.intro_text}
                    onBlur={(e) => handleSaveSettings('intro', { intro_text: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] resize-none leading-relaxed"
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
                className="px-6 py-3.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Gathering
              </button>
            </div>

            {/* List catalog of events */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
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
                        <td className="p-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-pink)]">{ev.category}</td>
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
                            className="p-2.5 hover:bg-[var(--color-pink)]/10 rounded-xl text-[var(--color-pink)] transition-all border border-[var(--color-pink)]/5"
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
              <div className="fixed inset-0 z-50 bg-[var(--color-warm-black)]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="max-w-4xl w-full bg-[var(--color-linen)] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 md:p-8 bg-plum text-[var(--color-linen)] flex items-center justify-between border-b border-plum/10">
                    <div className="space-y-1">
                      <h3 className="font-display text-2xl font-bold text-white">{editingEvent.id ? 'Edit Gathering Details' : 'Create New Gathering'}</h3>
                      <p className="text-xs text-[var(--color-linen)]/70 font-light">Set highlights, schedules, FAQs, and organizer bios.</p>
                    </div>
                    <button onClick={() => setEditingEvent(null)} className="text-3xl text-[var(--color-linen)]/75 hover:text-white cursor-pointer">&times;</button>
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 focus:border-[var(--color-sunshine)] rounded-2xl focus:outline-none"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 focus:border-[var(--color-sunshine)] rounded-2xl focus:outline-none font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Category</label>
                          <select
                            value={editingEvent.category || 'retreat'}
                            onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Status</label>
                          <select
                            value={editingEvent.status || 'draft'}
                            onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as Event['status'] })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">End Date</label>
                          <input
                            type="date"
                            value={editingEvent.end_date || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Price Details Label</label>
                          <input
                            type="text"
                            placeholder="e.g. $250 or Free"
                            value={editingEvent.price || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, price: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Location / Address</label>
                          <input
                            type="text"
                            value={editingEvent.location || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                            placeholder="e.g. Shenandoah Meadows, VA"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Short Preview Text</label>
                          <input
                            type="text"
                            value={editingEvent.short_description || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, short_description: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                            placeholder="A concise, one-sentence description shown in lists and catalogs."
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Long Details Overview</label>
                          <textarea
                            rows={4}
                            value={editingEvent.long_description || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, long_description: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none resize-none leading-relaxed"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none font-mono text-xs"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <ImageUploader
                            label="Cover/Hero Image"
                            value={editingEvent.hero_image || ''}
                            onChange={(url) => setEditingEvent({ ...editingEvent, hero_image: url })}
                            folder="events"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Stripe Price ID</label>
                          <input
                            type="text"
                            placeholder="price_..."
                            value={editingEvent.stripe_price_id || ''}
                            onChange={(e) => setEditingEvent({ ...editingEvent, stripe_price_id: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none font-mono text-xs"
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
                          className="flex-grow px-4 py-3 bg-[var(--color-linen)] border border-plum/15 focus:border-[var(--color-sunshine)] rounded-2xl focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newHighlight.trim()) return;
                            const cur = editingEvent.highlights || [];
                            setEditingEvent({ ...editingEvent, highlights: [...cur, newHighlight.trim()] });
                            setNewHighlight('');
                          }}
                          className="px-5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase rounded-2xl shadow-sm transition-all"
                        >
                          Add
                        </button>
                      </div>

                      {/* Display highlights list */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {editingEvent.highlights && editingEvent.highlights.map((hl, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-sunshine)]/25 text-plum rounded-full text-xs font-semibold">
                            <span>{hl}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.highlights || [];
                                setEditingEvent({ ...editingEvent, highlights: cur.filter((_, i) => i !== idx) });
                              }}
                              className="text-plum hover:text-[var(--color-pink)] font-black text-sm cursor-pointer ml-1"
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
                            className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-9">
                          <input
                            type="text"
                            placeholder="Schedule Event Title (e.g. Morning Kirtan & Reflection)"
                            value={newSchedTitle}
                            onChange={(e) => setNewSchedTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
                          />
                        </div>
                        <div className="sm:col-span-10">
                          <input
                            type="text"
                            placeholder="Brief description (optional)"
                            value={newSchedDesc}
                            onChange={(e) => setNewSchedDesc(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
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
                            className="w-full h-full py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Display schedule list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingEvent.schedule && editingEvent.schedule.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-[var(--color-linen)] border border-plum/10 rounded-xl">
                            <div className="text-xs">
                              <span className="font-bold text-[var(--color-pink)] mr-2">[{item.time_label}]</span>
                              <span className="font-bold text-plum">{item.title}</span>
                              {item.description && <span className="text-warm-black/60 font-light block mt-0.5">{item.description}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.schedule || [];
                                setEditingEvent({ ...editingEvent, schedule: cur.filter((_, i) => i !== idx) });
                              }}
                              className="text-xs text-[var(--color-pink)] hover:text-red-700 font-bold px-2 py-1"
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
                          className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer details..."
                          value={newFaqAnswer}
                          onChange={(e) => setNewFaqAnswer(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs resize-none"
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
                            className="px-5 py-2 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add FAQ
                          </button>
                        </div>
                      </div>

                      {/* Display FAQs list */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingEvent.faqs && editingEvent.faqs.map((faq, idx) => (
                          <div key={idx} className="p-3 bg-[var(--color-linen)] border border-plum/10 rounded-xl space-y-1 relative pr-16">
                            <h5 className="font-bold text-plum text-xs">Q: {faq.question}</h5>
                            <p className="text-xs text-warm-black/70 font-light">A: {faq.answer}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.faqs || [];
                                setEditingEvent({ ...editingEvent, faqs: cur.filter((_, i) => i !== idx) });
                              }}
                              className="absolute top-3 right-3 text-xs text-[var(--color-pink)] hover:text-red-700 font-bold px-2 py-1"
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
                          className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Kirtan Lead & Counselor)"
                          value={newPersonRole}
                          onChange={(e) => setNewPersonRole(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs"
                        />
                        <div className="md:col-span-2">
                          <ImageUploader
                            label="Avatar Image"
                            value={newPersonImage}
                            onChange={(url) => setNewPersonImage(url)}
                            folder="events/people"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Bio details (1-2 sentences about them)..."
                          value={newPersonBio}
                          onChange={(e) => setNewPersonBio(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[var(--color-linen)] border border-plum/15 rounded-xl text-xs md:col-span-2 resize-none"
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
                            className="px-5 py-2 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-[10px] font-bold uppercase rounded-xl shadow-sm transition-all"
                          >
                            Add Team Member
                          </button>
                        </div>
                      </div>

                      {/* Display people list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                        {editingEvent.people && editingEvent.people.map((p, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--color-linen)] border border-plum/10 rounded-xl relative pr-14">
                            <div className="w-10 h-10 rounded-full bg-plum/10 relative overflow-hidden flex-shrink-0">
                              <Image src={p.image_url || '/placeholder.jpg'} alt="" fill className="object-cover" />
                            </div>
                            <div className="text-xs space-y-0.5">
                              <h5 className="font-bold text-plum">{p.name}</h5>
                              <p className="text-[10px] uppercase tracking-wide text-[var(--color-pink)] font-semibold">{p.role}</p>
                              <p className="text-[10px] text-warm-black/65 font-light line-clamp-2">{p.bio}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = editingEvent.people || [];
                                setEditingEvent({ ...editingEvent, people: cur.filter((_, i) => i !== idx) });
                              }}
                              className="absolute top-2 right-2 text-xs text-[var(--color-pink)] hover:text-red-700 font-bold px-1.5 py-0.5"
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
                      className="px-6 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300"
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
                <p className="text-sm text-warm-black/60">Manage physical merchandise, trusted prices, and transactional variant inventory.</p>
              </div>
              <button
                onClick={() => setEditingProduct({
                  product_title: '', slug: '', description: '', price: '$0.00',
                  price_cents: 0, currency: 'usd', variant_type: 'size',
                  image: '', status: 'available', featured: false, published: true
                })}
                className="px-6 py-3.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Product
              </button>
            </div>

            {/* List products */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-plum/5 text-plum uppercase text-[10px] font-bold tracking-wider border-b border-plum/10">
                      <th className="p-5">Item Name</th>
                      <th className="p-5">Price</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Featured</th>
                      <th className="p-5">Inventory (On hand / Reserved / Available)</th>
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
                        <td className="p-5">
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            {['S', 'M', 'L', 'XL', 'OS'].map(size => {
                              const productInvs = allInventories[pr.id] || [];
                              const match = productInvs.find(inv => inv.size.toUpperCase() === size.toUpperCase());
                              const left = match ? match.stock : 0;
                              const onHand = match ? match.on_hand : 0;
                              const reserved = match ? match.reserved : 0;
                              
                              if (size === 'OS' && onHand === 0 && reserved === 0) return null;
                              const hasOsOnly = productInvs.some(inv => inv.size.toUpperCase() === 'OS' && inv.stock > 0);
                              if (hasOsOnly && ['S', 'M', 'L', 'XL'].includes(size)) return null;

                              return (
                                <span key={size} className="px-2 py-1 bg-plum/5 border border-plum/10 rounded-lg text-[11px] text-plum">
                                  <strong>{size}:</strong> {onHand} / {reserved} / <span className={left === 0 ? 'text-[var(--color-pink)] font-black' : ''}>{left}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-5 text-right flex justify-end space-x-3">
                          <button
                            onClick={() => setEditingProduct({ ...pr })}
                            className="p-2.5 hover:bg-plum/15 rounded-xl text-plum transition-all border border-plum/5"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(pr.id)}
                            className="p-2.5 hover:bg-[var(--color-pink)]/10 rounded-xl text-[var(--color-pink)] transition-all border border-[var(--color-pink)]/5"
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
              <div className="fixed inset-0 z-50 bg-[var(--color-warm-black)]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="max-w-xl w-full bg-[var(--color-linen)] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-plum text-[var(--color-linen)] flex items-center justify-between border-b border-plum/10">
                    <h3 className="font-display text-xl font-bold text-white">{editingProduct.id ? 'Edit Product Details' : 'New Merchandise Product'}</h3>
                    <button onClick={() => setEditingProduct(null)} className="text-3xl text-[var(--color-linen)]/75 hover:text-white cursor-pointer">&times;</button>
                  </div>

                  <div className="p-8 space-y-6 text-sm overflow-y-auto">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Product Title</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.product_title || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, product_title: e.target.value })}
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] transition-all"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Price (USD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="25.00"
                            value={(editingProduct.price_cents ?? legacyPriceToCents(editingProduct.price || '0')) / 100}
                            onChange={(e) => {
                              const cents = Math.max(0, Math.round(Number(e.target.value || 0) * 100));
                              setEditingProduct({ ...editingProduct, price_cents: cents, price: formatMoney(cents) });
                            }}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Description Details</label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] resize-none leading-relaxed"
                        />
                      </div>

                      <ImageUploader
                        label="Product Image"
                        value={editingProduct.image || ''}
                        onChange={(url) => setEditingProduct({ ...editingProduct, image: url })}
                        folder="merchandise"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Availability Status</label>
                          <select
                            value={editingProduct.status || 'available'}
                            onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as StoreProduct['status'] })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          >
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Variant Type</label>
                          <select
                            value={editingProduct.variant_type || 'size'}
                            onChange={(e) => setEditingProduct({ ...editingProduct, variant_type: e.target.value as StoreProduct['variant_type'] })}
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none"
                          >
                            <option value="size">Apparel Sizes</option>
                            <option value="one_size">One Size</option>
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

                      {/* Size-based Inventory Manager */}
                      <div className="space-y-3 border-t border-plum/10 pt-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Size Inventory Stock Levels</label>
                        <div className="grid grid-cols-5 gap-3">
                          {editingInventory.map((item, index) => (
                            ((editingProduct.variant_type || 'size') === 'size' ? item.size !== 'OS' : item.size === 'OS') && (
                            <div key={item.size} className="bg-plum/5 border border-plum/10 rounded-2xl p-3 text-center flex flex-col items-center justify-between space-y-1.5">
                              <span className="block text-xs font-black text-plum uppercase">{item.size}</span>
                              <div className="text-[10px] text-warm-black/60">
                                Reserved: <strong>{editingProduct?.id ? (allInventories[editingProduct.id]?.find(inv => inv.size === item.size)?.reserved || 0) : 0}</strong>
                              </div>
                              <div className="w-full">
                                <label className="block text-[8px] font-bold text-plum/50 uppercase mb-0.5">On hand</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.stock}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    const updated = [...editingInventory];
                                    updated[index] = { size: item.size, stock: val };
                                    setEditingInventory(updated);
                                  }}
                                  className="w-full text-center py-1 bg-[var(--color-linen)] border border-plum/15 rounded-lg focus:outline-none focus:border-[var(--color-sunshine)] text-xs font-semibold text-plum"
                                />
                              </div>
                            </div>
                            )
                          ))}
                        </div>
                        <p className="text-[9px] text-warm-black/50 italic">Available stock is calculated as on-hand minus active checkout reservations.</p>
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
                      className="px-5 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-all duration-300"
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

            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Donation Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">One-Time Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.one_time_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { one_time_donation_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Monthly Donation URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.monthly_donation_url}
                    onBlur={(e) => handleSaveSettings('support', { monthly_donation_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Support Folds Copy</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Support Title</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.support_headline}
                    onBlur={(e) => handleSaveSettings('support', { support_headline: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Support Description</label>
                  <textarea
                    rows={4}
                    defaultValue={siteSettings.support_text}
                    onBlur={(e) => handleSaveSettings('support', { support_text: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl text-sm focus:outline-none focus:border-[var(--color-sunshine)] resize-none leading-relaxed"
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

            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/5 pb-3">Social Connections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">WhatsApp Community Invite URL</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.whatsapp_url}
                    onBlur={(e) => handleSaveSettings('comms', { whatsapp_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Instagram Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.instagram_url}
                    onBlur={(e) => handleSaveSettings('comms', { instagram_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Facebook Link</label>
                  <input
                    type="text"
                    defaultValue={siteSettings.facebook_url}
                    onBlur={(e) => handleSaveSettings('comms', { facebook_url: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-plum/60">Contact Email Address</label>
                  <input
                    type="email"
                    defaultValue={siteSettings.contact_email}
                    onBlur={(e) => handleSaveSettings('comms', { contact_email: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
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
                className="px-6 py-3.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="mr-2 h-4.5 w-4.5" /> Add Resource
              </button>
            </div>

            {/* List resources */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] overflow-hidden shadow-md">
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-sunshine)]/10 text-plum border border-[var(--color-sunshine)]/20">
                            {res.category || 'General'}
                          </span>
                        </td>
                        <td className="p-5 font-light text-warm-black/70">{res.sort_order}</td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${res.published
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
                              className="p-2.5 hover:bg-[var(--color-sunshine)]/10 rounded-xl text-plum transition-all border border-[var(--color-sunshine)]/5 flex items-center justify-center"
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
                            className="p-2.5 hover:bg-[var(--color-pink)]/10 rounded-xl text-[var(--color-pink)] transition-all border border-[var(--color-pink)]/5"
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
              <div className="fixed inset-0 z-50 bg-[var(--color-warm-black)]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 text-warm-black">
                <div className="max-w-xl w-full bg-[var(--color-linen)] border border-plum/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-plum">
                  <div className="p-6 bg-plum text-[var(--color-linen)] flex items-center justify-between border-b border-plum/10">
                    <h3 className="font-display text-xl font-bold text-white">{editingResource.id ? 'Edit Resource Details' : 'New Reading Resource'}</h3>
                    <button onClick={() => setEditingResource(null)} className="text-3xl text-[var(--color-linen)]/75 hover:text-white cursor-pointer">&times;</button>
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
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] transition-all"
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
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
                        />
                        {Array.from(new Set(resources.map(r => r.category).filter(Boolean))).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5 justify-start">
                            <span className="text-[10px] text-plum/50 font-bold self-center mr-1">Suggestions:</span>
                            {Array.from(new Set(resources.map(r => r.category).filter(Boolean))).map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setEditingResource({ ...editingResource, category: cat })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${editingResource.category === cat
                                    ? 'bg-plum text-[var(--color-linen)] border-plum'
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
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] resize-none leading-relaxed text-warm-black"
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
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
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
                          className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)] font-mono text-xs"
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
                            className="w-full px-4 py-3 bg-[var(--color-linen)] border border-plum/15 rounded-2xl focus:outline-none focus:border-[var(--color-sunshine)]"
                          />
                        </div>

                        {/* Published */}
                        <div className="flex items-center space-x-2 pt-6">
                          <input
                            type="checkbox"
                            id="published"
                            checked={!!editingResource.published}
                            onChange={(e) => setEditingResource({ ...editingResource, published: e.target.checked })}
                            className="h-5 w-5 rounded border-plum/15 text-plum focus:ring-[var(--color-sunshine)]"
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
                      className="px-6 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum font-bold rounded-full text-xs uppercase tracking-wider transition-all shadow cursor-pointer"
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
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
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
                      className="text-[10px] bg-[var(--color-linen)] border border-plum/10 p-2 rounded-xl mt-2 truncate cursor-pointer focus:outline-none font-mono text-plum/70"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Form Submissions */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">Submissions & Records</h1>
              <p className="text-sm text-warm-black/60">View mailing lists, contact inquiries, store orders, and gathering signups.</p>
            </div>

            {/* Sub Tabs Selection */}
            <div className="flex flex-wrap gap-2 border-b border-plum/10 pb-4">
              <button
                onClick={() => setSubTab('mailing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${subTab === 'mailing'
                    ? 'bg-plum text-[var(--color-linen)] shadow'
                    : 'bg-[var(--color-linen)] border border-plum/10 text-plum/70 hover:bg-plum/5'
                  }`}
              >
                Mailing List ({subscribers.length})
              </button>
              <button
                onClick={() => setSubTab('contact')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${subTab === 'contact'
                    ? 'bg-plum text-[var(--color-linen)] shadow'
                    : 'bg-[var(--color-linen)] border border-plum/10 text-plum/70 hover:bg-plum/5'
                  }`}
              >
                Contact Forms ({messages.length})
              </button>
              <button
                onClick={() => setSubTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${subTab === 'orders'
                    ? 'bg-plum text-[var(--color-linen)] shadow'
                    : 'bg-[var(--color-linen)] border border-plum/10 text-plum/70 hover:bg-plum/5'
                  }`}
              >
                Store Orders ({orders.length})
              </button>
              <button
                onClick={() => setSubTab('registrations')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${subTab === 'registrations'
                    ? 'bg-plum text-[var(--color-linen)] shadow'
                    : 'bg-[var(--color-linen)] border border-plum/10 text-plum/70 hover:bg-plum/5'
                  }`}
              >
                Event Registrants ({registrations.length})
              </button>
            </div>

            {/* Subsection 1: Subscribers */}
            {subTab === 'mailing' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-plum">Newsletter Subscribers</h2>
                    <p className="text-xs text-warm-black/60">Mailing list signups collected from footer forms.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV('subscribers')}
                    className="px-4 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export (CSV)
                  </button>
                </div>

                <div className="bg-[var(--color-linen)] border border-plum/10 rounded-2xl overflow-hidden shadow-sm text-xs font-sans max-h-[50vh] overflow-y-auto">
                  {subscribers.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-plum/5 text-plum uppercase text-[9px] font-black tracking-wider border-b border-plum/10">
                          <th className="p-4">Email</th>
                          <th className="p-4">Date Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-plum/5">
                        {subscribers.map((sub, i) => (
                          <tr key={i} className="hover:bg-plum/5/20 transition-colors">
                            <td className="p-4 font-bold text-plum">{sub.email}</td>
                            <td className="p-4 text-warm-black/55">{new Date(sub.subscribed_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-warm-black/50 italic py-8 text-center">No mailing list signups found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Subsection 2: Contact Forms */}
            {subTab === 'contact' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-plum">Contact Messages</h2>
                    <p className="text-xs text-warm-black/60">Inquiries submitted from the contact page.</p>
                  </div>
                  <button
                    onClick={() => exportToCSV('messages')}
                    className="px-4 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export (CSV)
                  </button>
                </div>

                <div className="bg-[var(--color-linen)] border border-plum/10 rounded-2xl overflow-hidden shadow-sm text-xs font-sans max-h-[50vh] overflow-y-auto">
                  {messages.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-plum/5 text-plum uppercase text-[9px] font-black tracking-wider border-b border-plum/10">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Message</th>
                          <th className="p-4">Date Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-plum/5">
                        {messages.map((msg, i) => (
                          <tr key={i} className="hover:bg-plum/5/20 transition-colors">
                            <td className="p-4 font-bold text-plum">{msg.name || 'Anonymous'}</td>
                            <td className="p-4 text-warm-black/60">{msg.email}</td>
                            <td className="p-4 text-warm-black/75 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                            <td className="p-4 text-warm-black/55">{new Date(msg.submitted_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-warm-black/50 italic py-8 text-center">No contact submissions received yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Subsection 3: Store Orders */}
            {subTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-plum">Store Checkouts</h2>
                    <p className="text-xs text-warm-black/60">Purchases logged from merchandise shopping cart.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleReconcileReservations}
                      className="px-4 py-2.5 bg-[var(--color-linen)] hover:bg-plum/5 text-plum border border-plum/20 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center cursor-pointer transition-all duration-300"
                    >
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Release Expired
                    </button>
                    <button
                      onClick={() => exportToCSV('orders')}
                      className="px-4 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export All (CSV)
                    </button>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-plum/5 p-4 rounded-2xl border border-plum/10 text-plum">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-plum/40" />
                    <input
                      type="text"
                      placeholder="Search by customer, email, or item..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-linen)] rounded-xl border border-plum/15 text-xs focus:outline-none focus:border-plum font-sans text-plum"
                    />
                  </div>
                  <div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[var(--color-linen)] rounded-xl border border-plum/15 text-xs focus:outline-none focus:border-plum font-sans text-plum"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[var(--color-linen)] border border-plum/10 rounded-2xl overflow-hidden shadow-sm text-xs font-sans max-h-[50vh] overflow-y-auto">
                  {(() => {
                    const filtered = orders.filter(o => {
                      const searchLower = orderSearch.toLowerCase();
                      const matchQuery =
                        o.customer_name.toLowerCase().includes(searchLower) ||
                        o.customer_email.toLowerCase().includes(searchLower) ||
                        o.order_ref.toLowerCase().includes(searchLower) ||
                        o.items.some(i => i.product_title.toLowerCase().includes(searchLower));

                      const matchStatus =
                        orderStatusFilter === 'all'
                        || (o.payment_status || o.status) === orderStatusFilter;

                      return matchQuery && matchStatus;
                    });

                    return filtered.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-plum/5 text-plum uppercase text-[9px] font-black tracking-wider border-b border-plum/10">
                            <th className="p-4">Ref / Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Items Summary</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Payment / Fulfillment</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-plum/5">
                          {filtered.map((ord) => (
                            <tr key={ord.id} className="hover:bg-plum/5/20 transition-colors">
                              <td className="p-4">
                                <span className="font-bold text-plum block">{ord.order_ref}</span>
                                <span className="text-[10px] text-warm-black/55">{new Date(ord.created_at).toLocaleDateString()}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold block text-plum">{ord.customer_name}</span>
                                <span className="text-[10px] text-warm-black/55">{ord.customer_email}</span>
                              </td>
                              <td className="p-4 max-w-xs truncate">
                                {ord.items.map(i => `${i.product_title} x${i.quantity} (${i.size})`).join(', ')}
                              </td>
                              <td className="p-4 font-bold text-[var(--color-pink)]">${ord.total_amount.toFixed(2)}</td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black tracking-wide uppercase border ${(ord.payment_status || ord.status) === 'paid' ? 'bg-[#66CC6E]/10 border-[#66CC6E]/20 text-[#66CC6E]' :
                                    (ord.payment_status || ord.status) === 'refunded' ? 'bg-plum/10 border-plum/20 text-plum' :
                                      (ord.payment_status || ord.status) === 'pending' ? 'bg-[var(--color-sunshine)]/10 border-[var(--color-sunshine)]/20 text-[var(--color-sunshine)]' :
                                        'bg-red-500/10 border-red-500/20 text-red-500'
                                  }`}>
                                  {ord.payment_status || ord.status}
                                </span>
                                <span className="block mt-1 text-[9px] font-bold uppercase text-plum/55">
                                  {ord.fulfillment_status || 'unfulfilled'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="px-3 py-1.5 bg-plum/5 hover:bg-plum hover:text-[var(--color-linen)] border border-plum/10 text-plum text-[10px] font-bold rounded-xl cursor-pointer transition-colors"
                                >
                                  View Detail
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-warm-black/50 italic py-8 text-center">No orders match filter criteria.</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Subsection 4: Event Registrations */}
            {subTab === 'registrations' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-plum">Gathering Registrants</h2>
                    <p className="text-xs text-warm-black/60">Applications submitted for Sanga retreats and trips.</p>
                  </div>
                  <div>
                    <button
                      onClick={() => exportToCSV('registrations', regEventFilter === 'all' ? undefined : regEventFilter)}
                      className="px-4 py-2.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-300"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export Filtered (CSV)
                    </button>
                  </div>
                </div>

                {/* Filter Selector */}
                <div className="bg-plum/5 p-4 rounded-2xl border border-plum/10 text-xs text-plum">
                  <div className="flex flex-col gap-1">
                    <label className="uppercase tracking-widest font-black text-[9px] text-plum/60">Filter by Event</label>
                    <select
                      value={regEventFilter}
                      onChange={(e) => setRegEventFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[var(--color-linen)] rounded-xl border border-plum/15 text-xs focus:outline-none focus:border-plum font-sans text-plum"
                    >
                      <option value="all">All Events</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[var(--color-linen)] border border-plum/10 rounded-2xl overflow-hidden shadow-sm text-xs font-sans max-h-[50vh] overflow-y-auto">
                  {(() => {
                    const filtered = registrations.filter(r => regEventFilter === 'all' || r.event_id === regEventFilter);

                    return filtered.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-plum/5 text-plum uppercase text-[9px] font-black tracking-wider border-b border-plum/10">
                            <th className="p-4">Event</th>
                            <th className="p-4">Participant</th>
                            <th className="p-4">Age</th>
                            <th className="p-4">Phone / Contact</th>
                            <th className="p-4">Dietary restrictions</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-plum/5">
                          {filtered.map((reg) => (
                            <tr key={reg.id} className="hover:bg-plum/5/20 transition-colors">
                              <td className="p-4 font-bold text-plum">{reg.event_title || `Event #${reg.event_id}`}</td>
                              <td className="p-4">
                                <span className="font-bold block text-plum">{reg.full_name}</span>
                                <span className="text-[10px] text-warm-black/55">{reg.email}</span>
                              </td>
                              <td className="p-4 font-semibold text-plum">{reg.age}</td>
                              <td className="p-4">
                                <span className="block">{reg.phone}</span>
                                <span className="text-[10px] text-warm-black/55 italic">Emergency: {reg.emergency_contact_name} ({reg.emergency_contact_phone})</span>
                              </td>
                              <td className="p-4 max-w-xs truncate">
                                {reg.dietary_restrictions ? (
                                  <span className="text-[var(--color-pink)] font-bold text-[10px]" title={reg.dietary_restrictions}>
                                    ⚠️ {reg.dietary_restrictions}
                                  </span>
                                ) : (
                                  <span className="text-warm-black/40 italic">None logged</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setSelectedRegistration(reg)}
                                  className="px-3 py-1.5 bg-plum/5 hover:bg-plum hover:text-[var(--color-linen)] border border-plum/10 text-plum text-[10px] font-bold rounded-xl cursor-pointer transition-colors"
                                >
                                  View Card
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-warm-black/50 italic py-8 text-center">No registrants found for this event selection.</p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 10: General Settings & Themes */}
        {activeTab === 'settings' && (
          <div className="space-y-10 max-w-4xl">
            <div>
              <h1 className="font-display text-4xl font-bold text-plum tracking-tight">General Settings</h1>
              <p className="text-sm text-warm-black/60">Configure integrations, payment options, and website themes.</p>
            </div>

            {/* Theme Settings Info Panel */}
            <div className="bg-plum/5 border border-plum/10 rounded-[2rem] p-8 space-y-3 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-plum">Website Palette Theme</h2>
              <p className="text-xs text-warm-black/75">
                The Sanga website has been fully unified under the official <strong className="text-pink">Sunset Gradient</strong> brand aesthetic. Curated palette selection is locked to Sunset Gradient.
              </p>
            </div>

            {/* Stripe Settings Panel */}
            <div className="bg-[var(--color-linen)] border border-plum/10 rounded-[2rem] p-8 space-y-6 shadow-md">
              <h2 className="font-display text-2xl font-bold text-plum border-b border-plum/15 pb-3">Stripe Integration Settings</h2>
              <p className="text-xs text-warm-black/60 -mt-3">
                Stripe credentials are managed as server environment variables and are never stored in Firebase or exposed in this dashboard.
              </p>

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

                <div className="rounded-2xl border border-plum/10 bg-plum/5 p-5 text-xs text-warm-black/70">
                  Configure <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> in the deployment environment.
                  Use Stripe test/sandbox credentials until the integration has been verified end to end.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Order Details Popup Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-[var(--color-warm-black)]/60 backdrop-blur-xs" />
            <div className="relative w-full max-w-lg bg-[var(--color-linen)] rounded-3xl border border-plum/15 p-6 shadow-2xl font-sans text-xs text-plum z-10 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-plum/10 flex-shrink-0">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-pink)]">Order Reference</span>
                  <h4 className="font-display font-black text-lg text-plum leading-tight">{selectedOrder.order_ref}</h4>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-plum/5 rounded-full text-plum/60 hover:text-plum cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-grow py-4 space-y-4 pr-1">
                {/* Shipping info */}
                <div className="space-y-1 bg-plum/5 p-4 rounded-2xl border border-plum/5">
                  <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Shipping Destination</h5>
                  <p className="font-bold text-sm text-plum">{selectedOrder.customer_name}</p>
                  <p className="text-[11px] font-light">{selectedOrder.shipping_address}</p>
                  <p className="text-[10px] font-light text-plum/60 mt-1">Email: {selectedOrder.customer_email}</p>
                </div>

                {/* Payment and fulfillment manager */}
                <div className="bg-[var(--color-sunshine)]/5 border border-[var(--color-sunshine)]/20 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Stripe Payment</h5>
                      <span className="text-[11px] font-bold uppercase">{selectedOrder.payment_status || selectedOrder.status}</span>
                    </div>
                    <select
                      value={selectedOrder.fulfillment_status || (selectedOrder.status === 'completed' ? 'completed' : 'unfulfilled')}
                      onChange={(e) => setSelectedOrder({
                        ...selectedOrder,
                        fulfillment_status: e.target.value as NonNullable<Order['fulfillment_status']>,
                      })}
                      className="px-3 py-1.5 bg-[var(--color-linen)] rounded-xl border border-plum/15 text-xs font-bold text-plum focus:outline-none"
                    >
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={selectedOrder.carrier || ''}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, carrier: e.target.value })}
                      placeholder="Carrier"
                      className="px-3 py-2 bg-linen rounded-xl border border-plum/15 text-xs"
                    />
                    <input
                      value={selectedOrder.tracking_number || ''}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, tracking_number: e.target.value })}
                      placeholder="Tracking number"
                      className="px-3 py-2 bg-linen rounded-xl border border-plum/15 text-xs"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await commerceAdminRequest('PATCH', {
                          action: 'update_fulfillment',
                          orderId: String(selectedOrder.id),
                          fulfillmentStatus: selectedOrder.fulfillment_status || 'unfulfilled',
                          carrier: selectedOrder.carrier || '',
                          trackingNumber: selectedOrder.tracking_number || '',
                        });
                        setOrders(previous => previous.map(order =>
                          order.id === selectedOrder.id ? selectedOrder : order,
                        ));
                        triggerToast('Fulfillment updated!');
                      } catch (error) {
                        triggerToast(error instanceof Error ? error.message : 'Fulfillment update failed.');
                      }
                    }}
                    className="w-full px-3 py-2 bg-plum text-linen rounded-xl text-[10px] font-black uppercase tracking-wider"
                  >
                    Save Fulfillment
                  </button>
                </div>

                {/* Purchased items table */}
                <div className="space-y-2">
                  <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Cart Items</h5>
                  <div className="border border-plum/10 rounded-2xl overflow-hidden divide-y divide-plum/5">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-plum">{it.product_title}</span>
                          <span className="text-[10px] text-warm-black/55 block">Size: {it.size}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-warm-black/55 mr-3">x{it.quantity}</span>
                          <span className="font-bold text-[var(--color-pink)]">{it.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-plum/10 flex justify-between items-center text-xs flex-shrink-0">
                <span className="font-display font-bold text-plum">Total Paid</span>
                <span className="font-display font-black text-sm text-[var(--color-pink)]">${selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Registration Card Modal */}
        {selectedRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setSelectedRegistration(null)} className="fixed inset-0 bg-[var(--color-warm-black)]/60 backdrop-blur-xs" />
            <div className="relative w-full max-w-lg bg-[var(--color-linen)] rounded-3xl border border-plum/15 p-6 shadow-2xl font-sans text-xs text-plum z-10 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-plum/10 flex-shrink-0">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-pink)] block">Registrant Card</span>
                  <h4 className="font-display font-black text-lg text-plum leading-tight">{selectedRegistration.full_name}</h4>
                </div>
                <button onClick={() => setSelectedRegistration(null)} className="p-2 hover:bg-plum/5 rounded-full text-plum/60 hover:text-plum cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-grow py-4 space-y-4 pr-1">
                <div className="bg-plum/5 p-4 rounded-2xl border border-plum/5 space-y-2">
                  <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Applied Event</h5>
                  <p className="font-bold text-sm text-plum">{selectedRegistration.event_title || `Event #${selectedRegistration.event_id}`}</p>
                  <div className="flex gap-4 text-[10px] text-plum/60 pt-1">
                    <span>Age: <strong>{selectedRegistration.age}</strong></span>
                    <span>Registered: <strong>{new Date(selectedRegistration.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-plum/5 p-3.5 rounded-xl border border-plum/5">
                    <span className="text-[9px] uppercase tracking-widest font-black text-plum/60 block mb-0.5">Email</span>
                    <span className="font-bold text-[11px] truncate block">{selectedRegistration.email}</span>
                  </div>
                  <div className="bg-plum/5 p-3.5 rounded-xl border border-plum/5">
                    <span className="text-[9px] uppercase tracking-widest font-black text-plum/60 block mb-0.5">Phone</span>
                    <span className="font-bold text-[11px] block">{selectedRegistration.phone}</span>
                  </div>
                </div>

                <div className="bg-plum/5 p-4 rounded-2xl border border-plum/5 space-y-1">
                  <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Emergency Contact</h5>
                  <p className="font-bold text-[11px]">{selectedRegistration.emergency_contact_name}</p>
                  <p className="text-[10px] font-light text-plum/70">Phone: {selectedRegistration.emergency_contact_phone}</p>
                </div>

                {selectedRegistration.dietary_restrictions && (
                  <div className="bg-[var(--color-pink)]/5 p-4 rounded-2xl border border-[var(--color-pink)]/25 space-y-1">
                    <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-[var(--color-pink)]">⚠️ Dietary Needs & Allergies</h5>
                    <p className="text-[11px] font-medium text-[var(--color-pink)]">{selectedRegistration.dietary_restrictions}</p>
                  </div>
                )}

                {selectedRegistration.medical_info && (
                  <div className="bg-plum/5 p-4 rounded-2xl border border-plum/5 space-y-1">
                    <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-plum/60">Medical Information</h5>
                    <p className="text-[11px] font-light">{selectedRegistration.medical_info}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-plum/10 flex justify-between items-center text-xs flex-shrink-0">
                <span className="font-display font-bold text-plum">Registration Status</span>
                <span className="px-2.5 py-0.5 bg-[#66CC6E]/10 border border-[#66CC6E]/20 text-[#66CC6E] rounded-md text-[9px] font-black uppercase tracking-wider">
                  {selectedRegistration.status}
                </span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
