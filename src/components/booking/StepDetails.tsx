"use client";

import { useEffect, useState } from "react";
import { getOptions } from "@/app/actions/catalog";
import type { OptionDTO } from "@/types";

type ContactData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  isGuestSelf: boolean;
  notes?: string;
};

type FlightData = {
  airportName: string;
  location: string;
  airline: string;
  flightCode: string;
};

type Props = {
  date: string;
  time: string;
  airportName: string;
  adults: number;
  children: number;
  contact: ContactData;
  flight: FlightData;
  travelers: { fullName: string; kind: string }[];
  onContactChange: (c: ContactData) => void;
  onFlightChange: (f: FlightData) => void;
  onTravelersChange: (t: { fullName: string; kind: string }[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function StepDetails({
  date,
  time,
  airportName,
  adults,
  children,
  contact,
  flight,
  travelers,
  onContactChange,
  onFlightChange,
  onTravelersChange,
  onBack,
  onContinue,
}: Props) {
  const [airlines, setAirlines] = useState<OptionDTO[]>([]);
  const [countries, setCountries] = useState<OptionDTO[]>([]);

  useEffect(() => {
    getOptions("airline").then(setAirlines);
    getOptions("country").then(setCountries);
  }, []);

  const totalTravelers = adults + children;

  // Ensure travelers array matches expected count
  useEffect(() => {
    if (travelers.length !== totalTravelers) {
      const newTravelers = Array.from({ length: totalTravelers }, (_, i) => ({
        fullName: travelers[i]?.fullName ?? "",
        kind: i < adults ? "adult" : "child",
      }));
      onTravelersChange(newTravelers);
    }
  }, [totalTravelers, adults]);

  const handleTravelerChange = (idx: number, fullName: string) => {
    const updated = travelers.map((t, i) =>
      i === idx ? { ...t, fullName } : t
    );
    onTravelersChange(updated);
  };

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const canContinue =
    contact.firstName &&
    contact.lastName &&
    contact.email &&
    contact.phone &&
    travelers.every((t) => t.fullName.trim() !== "");

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-ink">Booking Details</h2>

      {/* Other Details */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-ink">Other Details</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Airport
            </label>
            <input
              type="text"
              value={airportName}
              readOnly
              className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Location (optional)
            </label>
            <input
              type="text"
              value={flight.location}
              onChange={(e) =>
                onFlightChange({ ...flight, location: e.target.value })
              }
              placeholder="Hotel name, address, etc."
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Airline
              </label>
              <select
                value={flight.airline}
                onChange={(e) =>
                  onFlightChange({ ...flight, airline: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              >
                <option value="">Select airline</option>
                {airlines.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Flight Code
              </label>
              <input
                type="text"
                value={flight.flightCode}
                onChange={(e) =>
                  onFlightChange({ ...flight, flightCode: e.target.value })
                }
                placeholder="e.g. GA123"
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Date
              </label>
              <input
                type="text"
                value={formattedDate}
                readOnly
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Time
              </label>
              <input
                type="text"
                value={time}
                readOnly
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-ink">Contact Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                First Name
              </label>
              <input
                type="text"
                value={contact.firstName}
                onChange={(e) =>
                  onContactChange({ ...contact, firstName: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Last Name
              </label>
              <input
                type="text"
                value={contact.lastName}
                onChange={(e) =>
                  onContactChange({ ...contact, lastName: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Email
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) =>
                onContactChange({ ...contact, email: e.target.value })
              }
              placeholder="your@email.com"
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Country
              </label>
              <select
                value={contact.phoneCountryCode}
                onChange={(e) =>
                  onContactChange({
                    ...contact,
                    phoneCountryCode: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
              >
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Phone
              </label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) =>
                  onContactChange({ ...contact, phone: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Notes (optional)
            </label>
            <textarea
              value={contact.notes ?? ""}
              onChange={(e) =>
                onContactChange({ ...contact, notes: e.target.value })
              }
              rows={2}
              placeholder="Special requests..."
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="bookingFor"
                checked={contact.isGuestSelf}
                onChange={() =>
                  onContactChange({ ...contact, isGuestSelf: true })
                }
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm font-semibold text-ink">
                I am the guest
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="bookingFor"
                checked={!contact.isGuestSelf}
                onChange={() =>
                  onContactChange({ ...contact, isGuestSelf: false })
                }
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm font-semibold text-ink">
                I&apos;m booking another person
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Traveler Details */}
      {totalTravelers > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-ink">
            Traveler Details
          </h3>
          <div className="space-y-3">
            {travelers.map((t, i) => (
              <div key={i}>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  Traveler {i + 1} ({t.kind})
                </label>
                <input
                  type="text"
                  value={t.fullName}
                  onChange={(e) => handleTravelerChange(i, e.target.value)}
                  placeholder="Full name as on ID"
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-line bg-white px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-canvas"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
