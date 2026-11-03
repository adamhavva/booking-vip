"use client";

import { useState } from "react";
import { categories } from "@/data/home";
import { PinIcon, CalendarIcon, UsersIcon, StarIcon, PlaneIcon } from "./icons";
import type { ReactNode } from "react";

type FieldDef = { label: string; value: string; icon: ReactNode };

const ICONS = {
  plane: <PlaneIcon width={18} height={18} />,
  pin: <PinIcon width={18} height={18} />,
  cal: <CalendarIcon width={18} height={18} />,
  users: <UsersIcon width={18} height={18} />,
  star: <StarIcon width={18} height={18} />,
};

const SERVICE_FIELDS: Record<string, FieldDef[]> = {
  "Airport VIP Service": [
    { label: "Airport", value: "Soekarno-Hatta (CGK)", icon: ICONS.plane },
    { label: "Service Type", value: "Arrival Meet & Greet", icon: ICONS.star },
    { label: "Date", value: "Tue, 3 Nov 26", icon: ICONS.cal },
    { label: "Passengers", value: "2 Adults", icon: ICONS.users },
  ],
  Transport: [
    { label: "Pickup", value: "Ngurah Rai Airport", icon: ICONS.pin },
    { label: "Drop-off", value: "Seminyak, Bali", icon: ICONS.pin },
    { label: "Date & Time", value: "Tue, 3 Nov 26 · 14:00", icon: ICONS.cal },
    { label: "Passengers", value: "3 People", icon: ICONS.users },
  ],
  "Tour Package": [
    { label: "Destination", value: "Bali", icon: ICONS.pin },
    { label: "Start Date", value: "Tue, 3 Nov 26", icon: ICONS.cal },
    { label: "Travelers", value: "2 Adults", icon: ICONS.users },
  ],
  eVOA: [
    { label: "Nationality", value: "Select your country", icon: ICONS.users },
    { label: "Destination", value: "Indonesia", icon: ICONS.pin },
    { label: "Arrival Date", value: "Tue, 3 Nov 26", icon: ICONS.cal },
  ],
};

function Field({ label, value, icon }: FieldDef) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-canvas px-4 py-2.5">
      <span className="text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] text-muted">{label}</span>
        <span className="block truncate text-sm font-semibold text-ink">{value}</span>
      </span>
    </div>
  );
}

export default function HeroSearch() {
  const [service, setService] = useState(categories[0].label);
  const fields = SERVICE_FIELDS[service];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-hero-from via-hero-via to-hero-to pb-10 pt-24 md:pt-28">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        {/* Heading */}
        <div className="hidden py-6 text-center md:block">
          <h1 className="text-[34px] font-normal text-white">
            Hey there, <span className="font-extrabold">travelling in style?</span>
          </h1>
          <p className="mt-2 text-sm text-white/85">
            Booking VIP - Airport VIP, transport, tours & eVOA in one place.
          </p>
        </div>

        {/* Search card with the tab rail straddling its top edge */}
        <div className="relative mx-auto max-w-[1120px]">
          {/* Service selector tabs (pill rail overlapping the card) */}
          <div className="no-scrollbar relative z-10 mx-3 -mb-5 flex items-center gap-1 overflow-x-auto rounded-full bg-white px-2 py-2 shadow-lg md:mx-6">
            {categories.map((c) => {
              const active = c.label === service;
              return (
                <button
                  key={c.label}
                  onClick={() => setService(c.label)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                    active ? "bg-brand-soft" : "hover:bg-canvas"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${c.tone} text-[11px] font-bold text-white shadow-sm`}
                  >
                    {c.short}
                  </span>
                  <span
                    className={`whitespace-nowrap text-sm font-bold ${
                      active ? "text-brand" : "text-ink"
                    }`}
                  >
                    {c.label}
                  </span>
                  {c.badge && (
                    <span className="whitespace-nowrap rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {c.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search card */}
          <div className="relative rounded-2xl bg-white p-4 shadow-xl md:p-6 md:pt-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map((f) => (
                  <Field key={f.label} {...f} />
                ))}
              </div>
              <button className="shrink-0 rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm hover:bg-brand-dark lg:self-stretch">
                Search
              </button>
            </div>

            {/* Promo strip */}
            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 text-sm text-ink">
              <span className="mr-1">🏷️</span>
              Check the promos you can use to make your trip more rewarding.{" "}
              <a href="#" className="font-semibold text-brand">
                See promos now!
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
