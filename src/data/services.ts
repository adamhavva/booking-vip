// Service navigation + sub-page content for the four services.
// Copy is placeholder copy; catalog items (prices, cards) come from home.ts.

import type {
  ServiceNavItem,
  ServicePage,
  ServiceSearchField,
} from "@/types";

export const serviceNav: ServiceNavItem[] = [
  {
    label: "Airport VIP Service",
    href: "/vip-service",
    short: "VIP",
    tone: "from-sky-400 to-blue-600",
  },
  {
    label: "Transport",
    href: "/transport",
    short: "Car",
    tone: "from-emerald-400 to-teal-600",
  },
  {
    label: "Tour Package",
    href: "/tour-package",
    short: "Tour",
    tone: "from-amber-300 to-orange-500",
  },
  {
    label: "eVOA",
    href: "/evoa",
    short: "Visa",
    tone: "from-violet-400 to-purple-600",
  },
];

/**
 * Fields of the home search form, per service. `key` is the query-string
 * key used when the form is submitted, so the sub-page can read the values
 * back from the URL.
 */
export const serviceSearchFields: Record<string, ServiceSearchField[]> = {
  "Airport VIP Service": [
    {
      key: "airport",
      label: "Airport",
      defaultValue: "Soekarno-Hatta (CGK)",
      icon: "plane",
    },
    {
      key: "type",
      label: "Service Type",
      defaultValue: "Arrival Meet & Greet",
      icon: "star",
    },
    { key: "date", label: "Date", defaultValue: "Tue, 3 Nov 26", icon: "cal" },
    {
      key: "pax",
      label: "Passengers",
      defaultValue: "2 Adults",
      icon: "users",
    },
  ],
  Transport: [
    {
      key: "pickup",
      label: "Pickup",
      defaultValue: "Ngurah Rai Airport",
      icon: "pin",
    },
    {
      key: "dropoff",
      label: "Drop-off",
      defaultValue: "Seminyak, Bali",
      icon: "pin",
    },
    {
      key: "datetime",
      label: "Date & Time",
      defaultValue: "Tue, 3 Nov 26 · 14:00",
      icon: "cal",
    },
    {
      key: "pax",
      label: "Passengers",
      defaultValue: "3 People",
      icon: "users",
    },
  ],
  "Tour Package": [
    {
      key: "destination",
      label: "Destination",
      defaultValue: "Bali",
      icon: "pin",
    },
    {
      key: "startDate",
      label: "Start Date",
      defaultValue: "Tue, 3 Nov 26",
      icon: "cal",
    },
    {
      key: "travelers",
      label: "Travelers",
      defaultValue: "2 Adults",
      icon: "users",
    },
  ],
  eVOA: [
    {
      key: "nationality",
      label: "Nationality",
      defaultValue: "Select your country",
      icon: "users",
    },
    {
      key: "destination",
      label: "Destination",
      defaultValue: "Indonesia",
      icon: "pin",
    },
    {
      key: "arrivalDate",
      label: "Arrival Date",
      defaultValue: "Tue, 3 Nov 26",
      icon: "cal",
    },
  ],
};

export const servicePages: Record<string, ServicePage> = {
  "vip-service": {
    slug: "vip-service",
    eyebrow: "Airport VIP Service",
    title: "Airport VIP Service",
    intro:
      "Skip the long queues at the airport. Our greeters meet you at the arrival gate, fast-track immigration, and escort you straight to your terminal or private lounge.",
    sections: [
      {
        heading: "What you get",
        body: "Meet & Greet at the aircraft door, priority immigration and security lanes, and a dedicated greeter who stays with you until you reach the gate.",
      },
      {
        heading: "Where we operate",
        body: "Soekarno-Hatta, Juanda, Ngurah Rai, Kualanamu, Polonia, and selected regional airports across Indonesia.",
      },
      {
        heading: "How to book",
        body: "Pick your airport, service type, date and number of passengers in the search bar above. Confirmation is sent instantly to your email.",
      },
    ],
    highlights: [
      "Meet & Greet",
      "Fast Track",
      "Airport Lounge",
      "Porter & Baggage",
    ],
    tabs: ["All", "Meet & Greet", "Fast Track", "Lounge", "Porter"],
    catalog: "vip",
  },

  transport: {
    slug: "transport",
    eyebrow: "Transport",
    title: "Transport",
    intro:
      "Private transfers, chauffeur service, and airport pick-ups with fixed rates and professional drivers. Travel from the airport to your hotel without the haggling.",
    sections: [
      {
        heading: "Our fleet",
        body: "Sedan, SUV, van, and limousine options for solo travellers, families, and groups. Every vehicle comes with a driver, fuel, and tolls included.",
      },
      {
        heading: "Fixed price, no surprises",
        body: "The price you see is the price you pay. Flight tracking is included, so your driver waits when your flight is delayed.",
      },
      {
        heading: "Popular routes",
        body: "Airport to hotel, hotel to restaurant, city to city, and multi-day chauffeur hire by the hour or by the day.",
      },
    ],
    highlights: ["Sedan", "SUV", "Van", "Limousine"],
    tabs: ["All", "Sedan", "SUV", "Van", "Limousine"],
    catalog: "transport",
  },

  "tour-package": {
    slug: "tour-package",
    eyebrow: "Tour Package",
    title: "Tour Package",
    intro:
      "Curated tours across Indonesia with private guides, entrance tickets, and transfers already arranged — from a weekend in Bali to a multi-day journey to Labuan Bajo.",
    sections: [
      {
        heading: "Private and small group",
        body: "Every tour can be taken privately or shared with a small group of up to eight travellers. Custom itineraries are available on request.",
      },
      {
        heading: "What's included",
        body: "Hotel pickup, private guide, entrance tickets, and lunch at local highlights are bundled into a single transparent price.",
      },
      {
        heading: "Destinations",
        body: "Bali, Lombok, Yogyakarta, Labuan Bajo, Komodo, Raja Ampat, and Papua. Multi-day itineraries cover the highlights without the rush.",
      },
    ],
    highlights: ["Bali", "Lombok", "Yogyakarta", "Labuan Bajo", "Papua"],
    tabs: ["All", "Bali", "Labuan Bajo", "Yogyakarta", "Lombok", "Papua"],
    catalog: "tour",
  },

  evoa: {
    slug: "evoa",
    eyebrow: "eVOA",
    title: "eVOA — Electronic Visa on Arrival",
    intro:
      "Apply for your Indonesian visa online in minutes. No embassy visit, no paperwork — receive your eVOA by email and show the QR code at immigration.",
    sections: [
      {
        heading: "Who can apply",
        body: "Tourists and business visitors from eligible countries, staying up to 60 days. Single and multiple entry options are available.",
      },
      {
        heading: "How it works",
        body: "Fill in the online form, upload your passport photo, and pay online. Most applications are reviewed and approved within one working day.",
      },
      {
        heading: "On arrival",
        body: "Print or save the eVOA on your phone, then go straight to the immigration counter for a smooth entry.",
      },
    ],
    highlights: ["Tourist", "Business", "Express", "Transit"],
    tabs: ["All", "Tourist", "Business", "Express", "Transit"],
    catalog: "evoa",
  },
};
