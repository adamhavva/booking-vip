"use client";

import { useEffect, useState } from "react";
import { getOptions } from "@/app/actions/catalog";
import PlaceSelect from "@/components/ui/PlaceSelect";
import type { PlaceNode } from "@/lib/places";
import type { OptionDTO } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

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
  /** The place hierarchy for the location field — empty keeps the text input. */
  places?: PlaceNode[];
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
  places,
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
  const { t } = useLocale();
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

  const dateValue = date ? new Date(date + "T00:00:00") : null;
  const formattedDate =
    dateValue && Number.isFinite(dateValue.getTime())
      ? dateValue.toLocaleDateString("en-US", {
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
    travelers.every((tr) => tr.fullName.trim() !== "");

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-ink">{t("wizard.details.title")}</h2>

      {/* Other Details */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-ink">{t("wizard.details.otherDetails")}</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              {t("wizard.details.airport")}
            </label>
            <input
              type="text"
              value={airportName}
              readOnly
              className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div>
            {places && places.length > 0 ? (
              /* Cascading place picker — the submitted value stays the place
                 label, so the booking payload is unchanged. PlaceSelect
                 renders its own label. */
              <PlaceSelect
                label={t("wizard.details.location")}
                places={places}
                value={flight.location}
                selectableKinds={["city", "area", "destination", "district", "village"]}
                placeholder={t("wizard.details.locationPlaceholder")}
                onSelect={(location) => onFlightChange({ ...flight, location })}
              />
            ) : (
              <>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  {t("wizard.details.location")}
                </label>
                <input
                  type="text"
                  value={flight.location}
                  onChange={(e) =>
                    onFlightChange({ ...flight, location: e.target.value })
                  }
                  placeholder={t("wizard.details.locationPlaceholder")}
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
                />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("wizard.details.airline")}
              </label>
              <select
                value={flight.airline}
                onChange={(e) =>
                  onFlightChange({ ...flight, airline: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              >
                <option value="">{t("wizard.details.selectAirline")}</option>
                {airlines.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("wizard.details.flightCode")}
              </label>
              <input
                type="text"
                value={flight.flightCode}
                onChange={(e) =>
                  onFlightChange({ ...flight, flightCode: e.target.value })
                }
                placeholder={t("wizard.details.flightCodePlaceholder")}
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("wizard.details.date")}
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
                {t("wizard.details.time")}
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
        <h3 className="mb-4 text-base font-bold text-ink">{t("wizard.details.contact")}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("wizard.details.firstName")}
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
                {t("wizard.details.lastName")}
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
              {t("wizard.details.email")}
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) =>
                onContactChange({ ...contact, email: e.target.value })
              }
              placeholder={t("wizard.details.emailPlaceholder")}
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
            />
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("wizard.details.country")}
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
                {t("wizard.details.phone")}
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
              {t("wizard.details.notes")}
            </label>
            <textarea
              value={contact.notes ?? ""}
              onChange={(e) =>
                onContactChange({ ...contact, notes: e.target.value })
              }
              rows={2}
              placeholder={t("wizard.details.notesPlaceholder")}
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
                {t("wizard.details.iAmGuest")}
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
                {t("wizard.details.bookingOther")}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Traveler Details */}
      {totalTravelers > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-ink">
            {t("wizard.details.travelers")}
          </h3>
          <div className="space-y-3">
            {travelers.map((traveler, i) => (
              <div key={i}>
                <label className="mb-1 block text-xs font-semibold text-muted">
                  {t("wizard.details.travelerN", { n: i + 1, kind: traveler.kind })}
                </label>
                <input
                  type="text"
                  value={traveler.fullName}
                  onChange={(e) => handleTravelerChange(i, e.target.value)}
                  placeholder={t("wizard.details.travelerPlaceholder")}
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
          {t("wizard.details.back")}
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("wizard.details.continueToPayment")}
        </button>
      </div>
    </div>
  );
}
