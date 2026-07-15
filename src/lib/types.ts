export interface EventHighlight {
  id: number;
  event_id: number;
  highlight: string;
}

export interface EventScheduleItem {
  id: number;
  event_id: number;
  time_label: string;
  title: string;
  description: string;
}

export interface EventFaq {
  id: number;
  event_id: number;
  question: string;
  answer: string;
}

export interface EventPerson {
  id: number;
  event_id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
}

export interface Event {
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
  highlights?: string[];
  schedule?: Omit<EventScheduleItem, 'id' | 'event_id'>[];
  faqs?: Omit<EventFaq, 'id' | 'event_id'>[];
  people?: Omit<EventPerson, 'id' | 'event_id'>[];
}

export interface Resource {
  id: number;
  title: string;
  category: string;
  description: string;
  external_url?: string;
  uploaded_file_url?: string;
  published: boolean;
  sort_order: number;
}

export interface StoreProduct {
  id: number;
  product_title: string;
  slug: string;
  description: string;
  image: string;
  price: string;
  status: 'available' | 'unavailable' | 'sold-out';
  external_checkout_url?: string;
  external_product_url?: string;
  shopify_embed_code?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  featured: boolean;
  published: boolean;
}

export interface ThemePalette {
  name: string;
  background: string;
  foreground: string;
  primary: string;    // plum mapping
  secondary: string;  // pink mapping
  accent: string;     // sunshine mapping
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  default: {
    name: "Sunset Gradient",
    background: "#FFFBEB",
    foreground: "#1E1D1B",
    primary: "#D9480F",
    secondary: "#F59E0B",
    accent: "#FF8A65"
  },
  berry: {
    name: "Sunset Gradient",
    background: "#FFFBEB",
    foreground: "#1E1D1B",
    primary: "#D9480F",
    secondary: "#F59E0B",
    accent: "#FF8A65"
  },
  sunset: {
    name: "Sunset Gradient",
    background: "#FFFBEB",
    foreground: "#1E1D1B",
    primary: "#D9480F",
    secondary: "#F59E0B",
    accent: "#FF8A65"
  },
  mint: {
    name: "Sunset Gradient",
    background: "#FFFBEB",
    foreground: "#1E1D1B",
    primary: "#D9480F",
    secondary: "#F59E0B",
    accent: "#FF8A65"
  },
  golden: {
    name: "Sunset Gradient",
    background: "#FFFBEB",
    foreground: "#1E1D1B",
    primary: "#D9480F",
    secondary: "#F59E0B",
    accent: "#FF8A65"
  }
};

export interface SiteSettings {
  hero_headline: string;
  hero_subheadline: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  intro_headline: string;
  intro_text: string;
  community_headline: string;
  community_text: string;
  support_headline: string;
  support_text: string;
  whatsapp_url: string;
  instagram_url: string;
  facebook_url: string;
  contact_email: string;
  one_time_donation_url: string;
  monthly_donation_url: string;
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  stripe_checkout_enabled?: boolean;
  color_palette?: string;
  promo_video_url?: string;
  hero_image_url?: string;
  promo_video_cover_url?: string;
  hero_slideshow_images?: string[];
  hero_slideshow_labels?: string[];
  hero_slideshow_hidden?: boolean;
}
