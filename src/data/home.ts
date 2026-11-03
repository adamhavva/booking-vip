// Placeholder data — original content for a VIP travel concierge.
// Only four services: Airport VIP Service, Transport, Tour Package, eVOA.
// Prices/ratings are dummy values for layout demonstration only (in USD).

import type {
  Article,
  Category,
  Destination,
  EvoaPlan,
  FooterColumns,
  LinkItem,
  Promo,
  Tour,
  Transport,
  VipService,
} from "@/types";

export const utilityLinks: LinkItem[] = [
  { label: "About Us", href: "#" },
  { label: "How It Works", href: "#" },
  { label: "Help Center", href: "#" },
];

export const navLinks: LinkItem[] = [
  { label: "Airport VIP Service", href: "#" },
  { label: "Transport", href: "#" },
  { label: "Tour Package", href: "#" },
  { label: "eVOA", href: "#" },
];

export const searchPlaceholders = [
  "VIP service at Soekarno-Hatta",
  "Private transfer in Bali",
  "Tour package to Lombok",
  "eVOA for Indonesia",
];

export const categories: Category[] = [
  { label: "Airport VIP Service", short: "VIP", tone: "from-sky-400 to-blue-600" },
  { label: "Transport", short: "Car", tone: "from-emerald-400 to-teal-600" },
  { label: "Tour Package", short: "Tour", tone: "from-amber-300 to-orange-500" },
  { label: "eVOA", short: "Visa", badge: "e-Visa", tone: "from-violet-400 to-purple-600" },
];

/* ---- Airport VIP services ---- */
export const vipServices: VipService[] = [
  { title: "Meet & Greet", desc: "A personal greeter escorts you from curbside to the gate.", airport: "Soekarno-Hatta (CGK)", priceFrom: 120, priceNet: 85, ribbon: "Best seller", tone: "from-sky-400 to-blue-600" },
  { title: "Fast Track Immigration", desc: "Skip the queues at immigration and customs.", airport: "Ngurah Rai, Bali (DPS)", priceFrom: 90, priceNet: 65, tone: "from-indigo-400 to-indigo-700" },
  { title: "Premium Lounge Access", desc: "Relax in a private lounge before departure.", airport: "Soekarno-Hatta (CGK)", priceNet: 45, tone: "from-amber-300 to-orange-500" },
  { title: "Baggage & Porter Assistance", desc: "Travel hands-free with dedicated porter help.", airport: "Juanda, Surabaya (SUB)", priceNet: 30, tone: "from-emerald-400 to-teal-600" },
  { title: "VIP Terminal & Buggy", desc: "Private buggy transfer across the terminal.", airport: "Kualanamu, Medan (KNO)", priceFrom: 75, priceNet: 50, ribbon: "New", tone: "from-rose-400 to-pink-600" },
  { title: "Family VIP Package", desc: "Meet & greet plus lounge for the whole family.", airport: "Soekarno-Hatta (CGK)", priceFrom: 240, priceNet: 175, tone: "from-fuchsia-400 to-purple-600" },
];

/* ---- Transport (private transfers) ---- */
export const transports: Transport[] = [
  { model: "Executive Sedan", category: "Private Transfer", seats: 3, bags: 2, priceFrom: 65, priceNet: 45, ribbon: "Popular", tone: "from-slate-400 to-slate-700" },
  { model: "Premium SUV", category: "Private Transfer", seats: 5, bags: 4, priceFrom: 85, priceNet: 62, tone: "from-sky-400 to-blue-600" },
  { model: "Luxury Van", category: "Group Transfer", seats: 9, bags: 8, priceFrom: 110, priceNet: 82, tone: "from-emerald-400 to-teal-600" },
  { model: "First-Class Limousine", category: "Chauffeur Service", seats: 3, bags: 3, priceFrom: 190, priceNet: 145, ribbon: "VIP", tone: "from-indigo-400 to-indigo-700" },
  { model: "City Hourly Hire", category: "By the Hour", seats: 4, bags: 2, priceNet: 35, tone: "from-amber-300 to-orange-500" },
];

/* ---- Tour packages ---- */
export const tours: Tour[] = [
  { title: "Bali Highlights", location: "Bali", duration: "3D2N", rating: 4.8, reviews: 1240, priceFrom: 350, priceNet: 265, ribbon: "Best seller", tone: "from-amber-300 to-orange-500" },
  { title: "Komodo Island Sailing", location: "Labuan Bajo", duration: "4D3N", rating: 4.9, reviews: 860, priceFrom: 620, priceNet: 490, tone: "from-cyan-400 to-blue-600" },
  { title: "Yogyakarta Heritage", location: "Yogyakarta", duration: "3D2N", rating: 4.7, reviews: 640, priceFrom: 280, priceNet: 210, tone: "from-rose-400 to-pink-600" },
  { title: "Lombok & Gili Escape", location: "Lombok", duration: "4D3N", rating: 4.6, reviews: 520, priceFrom: 410, priceNet: 320, tone: "from-emerald-400 to-teal-600" },
  { title: "Bromo Sunrise Tour", location: "East Java", duration: "2D1N", rating: 4.8, reviews: 980, priceFrom: 190, priceNet: 145, ribbon: "Popular", tone: "from-indigo-400 to-indigo-700" },
  { title: "Raja Ampat Explorer", location: "West Papua", duration: "5D4N", rating: 4.9, reviews: 410, priceFrom: 1150, priceNet: 920, tone: "from-teal-300 to-cyan-600" },
];

/* ---- eVOA plans ---- */
export const evoaPlans: EvoaPlan[] = [
  { name: "Tourist eVOA", destination: "Indonesia", stay: "30 days", processing: "24 hours", priceNet: 50, ribbon: "Most popular", tone: "from-violet-400 to-purple-600" },
  { name: "Extendable eVOA", destination: "Indonesia", stay: "30 + 30 days", processing: "24 hours", priceNet: 75, tone: "from-sky-400 to-blue-600" },
  { name: "Business eVOA", destination: "Indonesia", stay: "60 days", processing: "48 hours", priceNet: 120, tone: "from-emerald-400 to-teal-600" },
  { name: "Express eVOA", destination: "Indonesia", stay: "30 days", processing: "4 hours", priceNet: 90, ribbon: "Fastest", tone: "from-rose-400 to-pink-600" },
  { name: "Transit eVOA", destination: "Indonesia", stay: "7 days", processing: "24 hours", priceNet: 35, tone: "from-amber-300 to-orange-500" },
];

/* ---- Destinations & promos (shared) ---- */
export const destinations: Destination[] = [
  { name: "Bali", country: "Indonesia", tone: "from-rose-400 to-red-600" },
  { name: "Labuan Bajo", country: "Indonesia", tone: "from-sky-400 to-blue-600" },
  { name: "Yogyakarta", country: "Indonesia", tone: "from-amber-300 to-orange-500" },
  { name: "Lombok", country: "Indonesia", tone: "from-emerald-400 to-teal-600" },
  { name: "Raja Ampat", country: "Indonesia", tone: "from-teal-300 to-cyan-600" },
  { name: "Bromo", country: "Indonesia", tone: "from-indigo-400 to-indigo-700" },
  { name: "Jakarta", country: "Indonesia", tone: "from-fuchsia-400 to-purple-600" },
  { name: "Bandung", country: "Indonesia", tone: "from-violet-400 to-indigo-600" },
];

export const articles: Article[] = [
  { title: "What to Expect from an Airport Meet & Greet", category: "VIP Travel", tone: "from-sky-400 to-blue-600" },
  { title: "A Guide to Indonesia's eVOA for First-Timers", category: "Visa & Entry", tone: "from-violet-400 to-purple-600" },
  { title: "Choosing the Right Private Transfer", category: "Transport", tone: "from-emerald-400 to-teal-600" },
  { title: "Five Tours Worth Taking This Year", category: "Tour Package", tone: "from-amber-300 to-orange-500" },
  { title: "Fast Track vs. Standard Immigration", category: "VIP Travel", tone: "from-rose-400 to-pink-600" },
];

export const promoTabs = ["All", "Airport VIP", "Transport", "Tour Package", "eVOA"];

export const promos: Promo[] = [
  { title: "VIP Welcome Offer", subtitle: "20% off your first Meet & Greet", tone: "from-blue-500 to-indigo-700" },
  { title: "Transfer Bundle", subtitle: "Save when you add a private transfer", tone: "from-emerald-500 to-teal-700" },
  { title: "Tour Early Bird", subtitle: "Book 30 days ahead and save more", tone: "from-amber-400 to-orange-600" },
  { title: "eVOA Express Deal", subtitle: "Priority processing at a special rate", tone: "from-violet-500 to-purple-700" },
  { title: "Family VIP Cashback", subtitle: "Extra cashback for family packages", tone: "from-rose-500 to-red-700" },
];

/* ---- SEO content ---- */
export const seoBlocks = [
  {
    title: "Travel Like a VIP, From Arrival to Departure",
    sections: [
      { h: "Seamless Airport Experience", p: "Let our team handle the queues, paperwork and luggage so you can glide through the airport with ease." },
      { h: "Private, On-Time Transport", p: "Professional chauffeurs and well-maintained vehicles get you where you need to be, comfortably and on schedule." },
      { h: "Curated Tour Packages", p: "Explore Indonesia's best destinations with itineraries designed for comfort, discovery and great value." },
    ],
  },
  {
    title: "Simple eVOA, Stress-Free Entry",
    sections: [
      { h: "Apply Online in Minutes", p: "Submit your details and documents from anywhere — no embassy visit required." },
      { h: "Fast Processing", p: "Choose standard or express processing and receive your eVOA by email, ready to show on arrival." },
      { h: "24/7 Support", p: "Our concierge team is available around the clock to help with every step of your trip." },
    ],
  },
];

export const recommendationTabs = ["Airport VIP", "Transport", "Tour Package", "eVOA", "Bali", "Jakarta"];

export const recommendationLinks = [
  "Meet & Greet at Soekarno-Hatta", "Fast Track at Ngurah Rai Bali", "Premium Lounge Jakarta", "Family VIP Package",
  "Private Transfer in Bali", "Airport Transfer Jakarta", "Chauffeur Service Surabaya", "Hourly Car Hire",
  "Bali Highlights Tour", "Komodo Sailing Trip", "Yogyakarta Heritage Tour", "Tourist eVOA Indonesia",
];

export const serviceSeoLinks = [
  "Airport VIP Service Jakarta", "Airport VIP Service Bali", "Airport VIP Service Surabaya", "Airport VIP Service Medan",
  "Private Transport Bali", "Private Transport Jakarta", "Group Van Transfer", "Luxury Limousine Service",
  "Tour Package Bali", "Tour Package Lombok", "Tour Package Labuan Bajo", "Tour Package Yogyakarta",
  "eVOA Indonesia 30 Days", "Business eVOA", "Express eVOA", "Transit eVOA",
];

export const footerColumns: FooterColumns = {
  Services: ["Airport VIP Service", "Transport", "Tour Package", "eVOA"],
  Company: ["About Us", "How It Works", "Careers", "Partners", "Contact"],
  Support: ["Help Center", "FAQ", "Privacy Policy", "Terms & Conditions", "Refund Policy"],
};

export const socials = ["Facebook", "Twitter", "LinkedIn", "YouTube", "Instagram", "TikTok"];
