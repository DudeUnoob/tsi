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
    name: "Linen & Plum (Rebrand Default)",
    background: "#FFEFBF",
    foreground: "#1E1D1B",
    primary: "#6E0B64",
    secondary: "#FF7DB4",
    accent: "#FFA526"
  },
  berry: {
    name: "Berry Blast",
    background: "#FFEFBF",
    foreground: "#1E1D1B",
    primary: "#6E0B64",
    secondary: "#BF3078",
    accent: "#17B2E6"
  },
  sunset: {
    name: "Sunset Gradient",
    background: "#FFEFBF",
    foreground: "#1E1D1B",
    primary: "#E65C17",
    secondary: "#FF7DB4",
    accent: "#6E0B64"
  },
  mint: {
    name: "Minty Fresh",
    background: "#FFEFBF",
    foreground: "#1E1D1B",
    primary: "#66CC6E",
    secondary: "#17B2E6",
    accent: "#FFEFBF"
  },
  golden: {
    name: "Golden Hour",
    background: "#FFEFBB",
    foreground: "#1E1D1B",
    primary: "#8C3123",
    secondary: "#A67F08",
    accent: "#FFEFBB"
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
    title: "Camp Ignite",
    slug: "camp-ignite",
    category: "camp",
    age_range: "11–17",
    start_date: "2026-07-03",
    end_date: "2026-07-07",
    location: "Shenandoah Meadows, VA",
    price: "$250",
    status: "open",
    short_description: "A summer camp for ages 11-17 exploring friendship and kirtan.",
    long_description: "Camp Ignite is Sanga's premier summer camp for teenagers. Enjoy a week of nature, workshops, sports, kirtan, and deep discussions on Krishna consciousness. Guided by experienced counselors, it's a place to make lifelong friends and build a solid spiritual foundation.",
    external_checkout_url: "https://www.sangainitiative.org/camp-registration09/camp-ignite-2025",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
    gallery_images: [
      "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105062504-DL0ISKN110VIOHCM4RPP/image-asset.jpeg",
      "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105188234-XCZMXLUCMMPFYV4F7GBN/image-asset.jpeg"
    ],
    featured_on_homepage: true,
    published: true,
    highlights: [
      "Outdoor sports, hiking & canoeing",
      "Interactive Krishna-conscious workshops",
      "Daily campfire kirtans & evening singing",
      "Grounded mentoring with senior youth counselors"
    ],
    schedule: [
      { time_label: "7:00 AM", title: "Morning Practice", description: "Mantra meditation, morning reflections, and interactive reading." },
      { time_label: "9:00 AM", title: "Breakfast", description: "Healthy vegetarian breakfast served in the hall." },
      { time_label: "10:30 AM", title: "Morning Seminar", description: "Interactive discussions exploring spiritual life in practice." },
      { time_label: "1:00 PM", title: "Lunch & Recreation", description: "Free time for sports, swimming, and exploring the forest." },
      { time_label: "7:00 PM", title: "Dinner & Kirtan", description: "A evening of musical chanting, stories, and connections." }
    ],
    faqs: [
      { question: "Is transport provided?", answer: "Sanga can help coordinate carpools from major hubs (DC, Philly, NYC). Reach out to us upon registration." },
      { question: "What should I pack?", answer: "A detailed packing list including sleeping bag, warm clothes, personal toiletries, and mosquito repellent will be emailed to you." }
    ],
    people: [
      { name: "Vraja Bihari Das", role: "Organizer & Speaker", bio: "Vraja has been leading camps for over a decade and focuses on bringing spiritual texts to life.", image_url: "" },
      { name: "Kasturi Manjari", role: "Counselor coordinator", bio: "Kasturi coordinates counselors and leads team activities with a focus on art and devotion.", image_url: "" }
    ]
  },
  {
    id: 2,
    title: "Heartspace Talk",
    slug: "heartspace",
    category: "online",
    age_range: "18–35",
    start_date: "2026-10-15",
    end_date: "2026-10-15",
    location: "Online (Zoom Session)",
    price: "Free / Donation",
    status: "open",
    short_description: "Online check-ins, discussions and reflections with the Sanga family.",
    long_description: "Heartspace is Sanga's monthly digital gathering. A warm virtual space to step away, ask questions, and share reflections. Guided by special guest speakers, we dive into contemporary issues faced by young practitioners navigating spiritual life.",
    external_checkout_url: "https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx?s=cl&p=a&ilr=1",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    gallery_images: [],
    featured_on_homepage: true,
    published: true,
    highlights: [
      "Open Q&A panel",
      "Smaller breakout rooms for personal sharing",
      "Short acoustic bhajan session",
      "Recorded library access for later listening"
    ],
    schedule: [
      { time_label: "8:00 PM EST", title: "Welcome & Musical Meditation", description: "Opening chants to settle in." },
      { time_label: "8:15 PM EST", title: "Guest Speaker Discussion", description: "Curated talk and open questions." },
      { time_label: "9:00 PM EST", title: "Breakout Reflections", description: "Small circles talking through insights." }
    ],
    faqs: [
      { question: "Do I need to keep my camera on?", answer: "While we encourage it to build a warm presence, it is not mandatory. Feel free to participate as you are comfortable." }
    ],
    people: [
      { name: "Deva Madhava Das", role: "Host", bio: "Deva Madhava hosts Heartspace talks, fostering conversational discussions and sharing practical insights.", image_url: "" }
    ]
  },
  {
    id: 3,
    title: "Vrindavana Yatra",
    slug: "vrindavana-yatra",
    category: "trip",
    age_range: "21–30",
    start_date: "2026-12-24",
    end_date: "2026-12-31",
    location: "Vrindavana, India",
    price: "$600",
    status: "coming-soon",
    short_description: "A pilgrimage of connection, service and chanting in the holy land.",
    long_description: "Vrindavana Yatra is Sanga's intentional travel pilgrimage. We spend a week walking holy paths (parikrama), assisting local ashrams in service projects, chanting in sacred temples, and building tight-knit connections with other young devotees from across the globe.",
    external_checkout_url: "https://www.sangainitiative.org/currently-unavailable",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1515990475221-G6PMK88KDKEZBVPTKG5Q/20449208_1382154528538531_900680314886261379_o.jpg",
    gallery_images: [],
    featured_on_homepage: true,
    published: true,
    highlights: [
      "Guided temple visits and parikramas",
      "Chanting kirtan in forest forests & Yamuna banks",
      "Daily classes and association with senior mentors",
      "Meaningful seva (voluntary service) opportunities"
    ]
  },
  {
    id: 4,
    title: "East Coast Retreat",
    slug: "east-coast-retreat",
    category: "retreat",
    age_range: "18–35",
    start_date: "2026-05-29",
    end_date: "2026-06-01",
    location: "Gita Nagari Farm, PA",
    price: "$200",
    status: "past",
    short_description: "A long weekend of association, farm-fresh meals, and long kirtans.",
    long_description: "The Sanga East Coast retreat gathered over 100 youth at Gita Nagari eco-farm. Over four days, participants stepped away to experience spiritual life together through workshops, mantra chanting, kirtan in the temple, and farm walks. This retreat is now finished, but keep an eye out for next year's schedule!",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/42af22d1-ea73-4806-ba7b-17c7c415afa5/DSCF0624.jpeg",
    gallery_images: [],
    featured_on_homepage: false,
    published: true
  },
  {
    id: 5,
    title: "TSI Summit",
    slug: "tsi-summit",
    category: "retreat",
    age_range: "18–35",
    start_date: "2026-08-15",
    end_date: "2026-08-19",
    location: "Palace Lodge, PA",
    price: "$299",
    status: "open",
    short_description: "Sanga's premiere national retreat gathering young devotees from across North America.",
    long_description: "The TSI Summit is our core national gathering. Over five days, we create an intentional space for Vaishnava youth to build friendships, explore scripture, sing kirtan, and discuss navigating modern life while keeping spiritual practice central. Includes workshops, panel discussions, and organic connection.",
    external_checkout_url: "https://www.sangainitiative.org/retreat-registration/tsi-summit-2025",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/3da960ee-0e14-4ffa-9e31-2808e5e925ee/Summit26+Reg+Open+1x1.png",
    gallery_images: [
      "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg"
    ],
    featured_on_homepage: true,
    published: true,
    highlights: [
      "Inspiring workshops and discussion panels",
      "Ecstatic night kirtans",
      "Organic farm-fresh vegetarian meals",
      "Tight-knit youth association"
    ]
  },
  {
    id: 6,
    title: "Midwest Retreat",
    slug: "midwest-retreat",
    category: "retreat",
    age_range: "18–35",
    start_date: "2026-09-11",
    end_date: "2026-09-14",
    location: "Sand Dunes, MI",
    price: "$200",
    status: "open",
    short_description: "A regional gathering in the Midwest for connection, outdoor kirtan, and study.",
    long_description: "Sanga's regional Midwest Retreat brings together youth from Chicago, Detroit, Ohio, and surrounding areas. Experience a cozy weekend of farm life, chanting, campfires, and collaborative readings on the shores of Lake Michigan.",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/cb2418ed-47e3-4cc4-80db-e0f26530aaa1/MW26+Reg+Open+Post+45.png",
    gallery_images: [],
    featured_on_homepage: false,
    published: true,
    highlights: [
      "Campfires and outdoor kirtan sessions",
      "Gita studies and text analysis",
      "Regional community building"
    ]
  },
  {
    id: 7,
    title: "Reconnect Retreat",
    slug: "tsi-reconnect-1",
    category: "retreat",
    age_range: "21–40",
    start_date: "2026-11-20",
    end_date: "2026-11-23",
    location: "Gita Nagari Farm, PA",
    price: "$150",
    status: "open",
    short_description: "A retreat focused on reconnecting older youth and families in a warm bhakti environment.",
    long_description: "Sanga Reconnect is designed for alumni, young families, and devotees in transitions of life. With cabin accommodations, child-friendly spaces, and mature discussion circles, we create a supportive environment to reconnect with old friends and share current realizations.",
    external_checkout_url: "https://www.sangainitiative.org/tsi-reconnect-1/tsi-30-retreat-premium-cabin-6c2sg",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/24f4d1b2-d8b6-451a-9eb5-5d0fceca8616/3.png",
    gallery_images: [
      "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/f1d1c411-95f8-4755-80a8-2afc7ffd537b/4.png"
    ],
    featured_on_homepage: false,
    published: true,
    highlights: [
      "Premium cabin accommodation upgrades available",
      "Childcare-supported study workshops",
      "Grounded, supportive devotional discussions"
    ]
  },
  {
    id: 8,
    title: "Brazil Mission Trip",
    slug: "tsi-mission-trip",
    category: "trip",
    age_range: "18–35",
    start_date: "2026-03-12",
    end_date: "2026-03-22",
    location: "Nova Gokula, Brazil",
    price: "$500",
    status: "coming-soon",
    short_description: "An international service and kirtan expedition to the heart of Brazil's eco-communities.",
    long_description: "Join Sanga for an intentional mission trip. We'll be traveling to Brazil's renowned eco-farming communities to help with local construction projects, distribute prasadam, participate in massive street Harinamas, and experience deep kirtans in beautiful natural reserves.",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/aca2ad4f-66ca-4068-8f63-ab6a20bdbb67/1000133787.png",
    gallery_images: [],
    featured_on_homepage: false,
    published: true,
    highlights: [
      "Voluntary agricultural & building service",
      "Massive local street Harinamas",
      "Stunning forest and waterfall trails",
      "Pilgrimage association with local practitioners"
    ]
  },
  {
    id: 9,
    title: "Men's Sanga Digital Circle",
    slug: "mens-sanga-june",
    category: "mens-sanga",
    age_range: "18–35",
    start_date: "2026-06-25",
    end_date: "2026-06-25",
    location: "Online Zoom Session",
    price: "Free",
    status: "open",
    short_description: "A monthly digital space for Vaishnava men to connect, share realizations, and read.",
    long_description: "Men's Sanga is an online discussion circle centered around build solid brotherhood, reading spiritual texts, and discussing the practical application of bhakti in daily life.",
    registration_url: "/community",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Interactive discussion circle", "Alumni and youth association"]
  },
  {
    id: 10,
    title: "Ladies' Sanga Connection",
    slug: "ladies-sanga-june",
    category: "ladies-sanga",
    age_range: "18–35",
    start_date: "2026-06-28",
    end_date: "2026-06-28",
    location: "Online Zoom Session",
    price: "Free",
    status: "open",
    short_description: "A digital space for Vaishnava ladies to connect, read, and discuss spiritual growth.",
    long_description: "Ladies' Sanga provides a warm, digital circle for connecting with sisters, reading devotional commentaries, and sharing realizations in a supportive space.",
    registration_url: "/community",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Sanskrit text study", "Guided peer discussions"]
  },
  {
    id: 11,
    title: "Men's Sanga Wilderness Hike",
    slug: "mens-sanga-wilderness",
    category: "mens-sanga",
    age_range: "18–35",
    start_date: "2026-07-18",
    end_date: "2026-07-20",
    location: "Shenandoah Forest, VA",
    price: "$75",
    status: "open",
    short_description: "A weekend backpacking expedition and campfire kirtan for men.",
    long_description: "Join the Men's Sanga for a rugged weekend of outdoor backpacking, group cooking, swimming, outdoor kirtan, and Gita studies in the Shenandoah wilderness.",
    registration_url: "/community",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Hiking and outdoor camping", "Campfire kirtan & discussions"]
  },
  {
    id: 12,
    title: "Ladies' Sanga Farm Weekend",
    slug: "ladies-sanga-farm",
    category: "ladies-sanga",
    age_range: "18–35",
    start_date: "2026-09-25",
    end_date: "2026-09-27",
    location: "Gita Nagari Farm, PA",
    price: "$120",
    status: "open",
    short_description: "A cozy weekend of cow care, agricultural service, and kirtan for ladies.",
    long_description: "Spend a relaxing weekend with the Ladies' Sanga at the Gita Nagari Farm. Enjoy farm walks, cow protection seva, healthy vegetarian cooking workshops, and nightly kirtan circles.",
    registration_url: "/community",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/42af22d1-ea73-4806-ba7b-17c7c415afa5/DSCF0624.jpeg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Cow protection seva", "Devotional music workshops"]
  },
  {
    id: 13,
    title: "Heartspace: Bhakti in Action",
    slug: "heartspace-august",
    category: "online",
    age_range: "18–35",
    start_date: "2026-08-08",
    end_date: "2026-08-08",
    location: "Online Zoom Session",
    price: "Free",
    status: "open",
    short_description: "Digital check-in, guest talk, and breakout reflection rooms.",
    long_description: "A monthly digital check-in. In this session, we discuss active seva, community contribution, and how to practice dynamic spiritual life in busy city environments.",
    external_checkout_url: "https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Guest speaker seminar", "Interactive breakout reflections"]
  },
  {
    id: 14,
    title: "Heartspace: Kirtan & Meditations",
    slug: "heartspace-november",
    category: "online",
    age_range: "18–35",
    start_date: "2026-11-12",
    end_date: "2026-11-12",
    location: "Online Zoom Session",
    price: "Free",
    status: "open",
    short_description: "Monthly digital kirtan gathering and interactive meditation workshop.",
    long_description: "Explore the internal practices of kirtan and holy name meditations. Guided by senior mentors, we will walk through practical techniques for focused chanting.",
    external_checkout_url: "https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx",
    hero_image: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    published: true,
    gallery_images: [],
    featured_on_homepage: false,
    highlights: ["Guided mantra chanting session", "Q&A with kirtan leaders"]
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
    featured: true,
    published: true
  },
  {
    id: 2,
    product_title: "Sanga Classic Knit Beanie",
    slug: "sanga-beanie",
    description: "Soft, warm rib-knit beanie with embroidered brand lettering. Available in multiple autumn rebrand colors.",
    image: "/merch-beanie.png",
    price: "$20",
    status: "available",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    featured: true,
    published: true
  },
  {
    id: 3,
    product_title: "Sanga Bhakti Tote Bag",
    slug: "sanga-tote",
    description: "Heavy-duty canvas tote bag featuring motivational quotes. Large enough to carry your books, japa beads, and daily travel essentials.",
    image: "/merch-tote.png",
    price: "$15",
    status: "available",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    featured: true,
    published: true
  },
  {
    id: 4,
    product_title: "Sanga Plum Classic Tee",
    slug: "sanga-plum-tshirt",
    description: "Classic premium heavy-weight cotton t-shirt in our brand Plum purple, featuring the signature 'sanga' logo in vibrant Sunshine Yellow. Durable, soft, and built to last.",
    image: "/merch-plum-tshirt.png",
    price: "$28",
    status: "available",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    featured: true,
    published: true
  },
  {
    id: 5,
    product_title: "Sanga Linen Logo Tee",
    slug: "sanga-linen-tshirt",
    description: "Comfortable light-weight organic cotton t-shirt in Linen off-white, featuring the minimalist 'sanga' brand name printed in deep Plum purple.",
    image: "/merch-linen-tshirt.png",
    price: "$28",
    status: "available",
    external_checkout_url: "https://sanga-initiative.squarespace.com/donate",
    featured: true,
    published: true
  }
];
