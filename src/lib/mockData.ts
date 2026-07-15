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
  hero_slideshow_hidden?: boolean;
}

export const mockSiteSettings: SiteSettings = {
  hero_headline: "Sanga is a Vaishnava Youth Collective",
  hero_subheadline: "For friendship, growth, and shared experience",
  primary_cta_label: "Join a Retreat",
  primary_cta_url: "/gatherings",
  secondary_cta_label: "See What's Happening",
  secondary_cta_url: "#experiences",
  intro_headline: "Built Through People, Not Programmes",
  intro_text: "Sanga brings together young people exploring Krishna consciousness through friendship, conversation, and shared experience. Through retreats, gatherings, and ongoing connection, members build relationships that carry into everyday life. Sanga is not built around performance, image, or recruitment. It exists to create meaningful association between people navigating spiritual life together.",
  community_headline: "The Connection Continues",
  community_text: "Sanga doesn't begin and end with major events. Smaller gatherings, conversations, online sessions, and ongoing friendships continue throughout the year and across different stages of life. We stay in touch day-to-day to support each other's journeys, share inspirations, and stay connected.",
  support_headline: "Support the Future of Sanga",
  support_text: "Sanga is built through the time, energy, and generosity of the community around it. Ongoing support helps keep retreats accessible, expand programmes, and create more opportunities for young devotees across North America. Every contribution helps seed spaces for association.",
  whatsapp_url: "https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx?s=cl&p=a&ilr=1",
  instagram_url: "https://www.instagram.com/thesangainitiative/?hl=en",
  facebook_url: "http://www.facebook.com/sangainitiative",
  contact_email: "info@sangainitiative.org",
  one_time_donation_url: "https://sanga-initiative.squarespace.com/donate",
  monthly_donation_url: "https://www.sangainitiative.org/monthly-donors",
  stripe_publishable_key: "",
  stripe_secret_key: "",
  stripe_checkout_enabled: false,
  color_palette: "default",
  promo_video_url: "https://www.youtube.com/embed/bEBlO9HGTvQ?autoplay=1",
  hero_image_url: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
  promo_video_cover_url: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg",
  hero_slideshow_images: [
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/42af22d1-ea73-4806-ba7b-17c7c415afa5/DSCF0624.jpeg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg"
  ],
  hero_slideshow_hidden: false
};

export const mockEvents: Event[] = [
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

export const mockResources: Resource[] = [
  {
    id: 1,
    title: "Bhagavad Gita Study Guide",
    category: "Study Guides",
    description: "A structured, beginner-friendly reading guide to understanding the main chapters and themes of the Bhagavad Gita.",
    external_url: "https://docs.google.com/document/d/1Jjg2j4tRrMb50y0roJdnrbLOgFh6_qA06KQolWPz64o/edit?usp=sharing",
    published: true,
    sort_order: 1
  },
  {
    id: 2,
    title: "Vrindavana Pilgrimage Guide",
    category: "Travel Guides",
    description: "Essential tips, packing lists, and temple details for preparing for a spiritual journey to Vrindavana, India.",
    external_url: "https://docs.google.com/document/d/1CWdqOWSBmeHYm3P8y_qPcnZWjYTIp0nx333TBoU-3Tg/edit?usp=sharing",
    published: true,
    sort_order: 2
  },
  {
    id: 3,
    title: "Mantra Chanting Handbook",
    category: "Practices",
    description: "Reflections on japa practice, instructions on pronouncing Sanskrit mantras, and recommended readings on the holy name.",
    external_url: "https://docs.google.com/document/d/1buSUGiT-voofCDjLYUFBH5obrMgUoZAhY5tbPBd_GXQ/edit?usp=sharing",
    published: true,
    sort_order: 3
  }
];

export const mockStoreProducts: StoreProduct[] = [
  {
    id: 1,
    product_title: "Sanga Rebrand Hoodie",
    slug: "sanga-hoodie",
    description: "Premium heavy-blend cotton hoodie featuring the clean classic logo on the chest. Designed to keep you warm and cozy at outdoor kirtans.",
    image: "/merch-hoodie.png",
    price: "$45",
    status: "available",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    shopify_embed_code: `<div id='product-component-1783021973912'></div>
<script type="text/javascript">
/*<![CDATA[*/
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript();
    }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: '3tcih5-pv.myshopify.com',
      storefrontAccessToken: 'dcfbffee074a1abd122a380e32ca7ad6',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: '8152250122309',
        node: document.getElementById('product-component-1783021973912'),
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
  "product": {
    "styles": {
      "product": {
        "@media (min-width: 601px)": {
          "max-width": "calc(25% - 20px)",
          "margin-left": "20px",
          "margin-bottom": "50px"
        }
      },
      "button": {
        "font-family": "Arial, sans-serif",
        ":hover": {
          "background-color": "#da6323"
        },
        "background-color": "#f26e27",
        ":focus": {
          "background-color": "#da6323"
        },
        "border-radius": "25px"
      }
    },
    "contents": {
      "img": false,
      "title": false,
      "price": false
    },
    "text": {
      "button": "Add to cart"
    }
  },
  "productSet": {
    "styles": {
      "products": {
        "@media (min-width: 601px)": {
          "margin-left": "-20px"
        }
      }
    }
  },
  "modalProduct": {
    "contents": {
      "img": false,
      "imgWithCarousel": true,
      "button": false,
      "buttonWithQuantity": true
    },
    "styles": {
      "product": {
        "@media (min-width: 601px)": {
          "max-width": "100%",
          "margin-left": "0px",
          "margin-bottom": "0px"
        }
      },
      "button": {
        "font-family": "Arial, sans-serif",
        ":hover": {
          "background-color": "#da6323"
        },
        "background-color": "#f26e27",
        ":focus": {
          "background-color": "#da6323"
        },
        "border-radius": "25px"
      }
    },
    "text": {
      "button": "Add to cart"
    }
  },
  "option": {},
  "cart": {
    "styles": {
      "button": {
        "font-family": "Arial, sans-serif",
        ":hover": {
          "background-color": "#da6323"
        },
        "background-color": "#f26e27",
        ":focus": {
          "background-color": "#da6323"
        },
        "border-radius": "25px"
      }
    },
    "text": {
      "total": "Subtotal",
      "button": "Checkout"
    }
  },
  "toggle": {
    "styles": {
      "toggle": {
        "font-family": "Arial, sans-serif",
        "background-color": "#f26e27",
        ":hover": {
          "background-color": "#da6323"
        },
        ":focus": {
          "background-color": "#da6323"
        }
      }
    }
  }
},
      });
    });
  }
})();
/*]]>*/
</script>`,
    featured: true,
    published: true
  }
];
