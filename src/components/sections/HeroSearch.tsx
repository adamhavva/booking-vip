"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import {
  CalendarIcon,
  PinIcon,
  PlaneIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { categories } from "@/data/home";
import { serviceNav, serviceSearchFields } from "@/data/services";
import { loadDraft, rememberSearch } from "@/lib/searchDraft";
import { logSearch } from "@/app/actions/search";
import type { Category, SearchFieldIcon } from "@/types";

const ICONS: Record<SearchFieldIcon, ReactNode> = {
  plane: <PlaneIcon width={18} height={18} />,
  pin: <PinIcon width={18} height={18} />,
  cal: <CalendarIcon width={18} height={18} />,
  users: <UsersIcon width={18} height={18} />,
  star: <StarIcon width={18} height={18} />,
};

const SERVICE_ROUTES = Object.fromEntries(
  serviceNav.map((s) => [s.label, s.href])
);

type Values = Record<string, Record<string, string>>;

function Field({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-canvas px-4 py-2.5">
      <span className="text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-muted">{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
        />
      </span>
    </div>
  );
}

/** Rail entry — picks the service whose form is shown below. */
function ServiceTab({
  category,
  active,
  onClick,
}: {
  category: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
        active ? "bg-brand-soft" : "hover:bg-canvas"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${category.tone} text-[11px] font-bold text-white shadow-sm`}
      >
        {category.short}
      </span>
      <span
        className={`whitespace-nowrap text-sm font-bold ${
          active ? "text-brand" : "text-ink"
        }`}
      >
        {category.label}
      </span>
      {category.badge && <Badge variant="pill">{category.badge}</Badge>}
    </button>
  );
}

export default function HeroSearch() {
  const router = useRouter();
  const [service, setService] = useState(categories[0].label);
  const [values, setValues] = useState<Values>({});
  const [resume, setResume] = useState<{ href: string; label: string } | null>(
    null
  );

  const fields = serviceSearchFields[service] ?? [];

  // Restore the last submitted search (persisted on this device).
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setResume({ href: draft.href, label: draft.service });
    if (draft.values && serviceSearchFields[draft.service]) {
      setService(draft.service);
      setValues((v) => ({ ...v, [draft.service]: draft.values }));
    }
  }, []);

  const currentValues = useMemo(() => {
    const stored = values[service];
    if (stored) return stored;
    return Object.fromEntries(
      (serviceSearchFields[service] ?? []).map((f) => [f.key, f.defaultValue])
    );
  }, [service, values]);

  const setField = (key: string, value: string) =>
    setValues((v) => ({
      ...v,
      [service]: { ...currentValues, [key]: value },
    }));

  const submit = () => {
    const href = SERVICE_ROUTES[service] ?? "/";
    const params = new URLSearchParams();
    for (const f of fields) {
      const v = currentValues[f.key];
      if (v) params.set(f.key, v);
    }
    params.set("service", service);

    rememberSearch({
      service,
      href,
      values: currentValues,
      savedAt: Date.now(),
    });

    // Also store it in the database (cross-device history). Failures are
    // ignored on purpose — the local copy above is enough to keep going.
    logSearch({ service, href, values: currentValues });

    router.push(`${href}?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-hero-from via-hero-via to-hero-to pb-10 pt-44 md:pt-44">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent" />
      <Container className="relative">
        {/* Heading */}
        <div className="hidden py-6 text-center md:block">
          <h1 className="text-[34px] font-normal text-white">
            Hey there,{" "}
            <span className="font-extrabold">travelling in style?</span>
          </h1>
          <p className="mt-2 text-sm text-white/85">
            Booking VIP - Airport VIP, transport, tours & eVOA in one place.
          </p>
        </div>

        {/* Search card with a centered tab rail straddling its top edge */}
        <div className="relative mx-auto max-w-[1120px]">
          {/* Service selector tabs */}
          <div className="no-scrollbar relative z-10 mx-auto -mb-5 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white px-2 py-2 shadow-lg">
            {categories.map((c) => (
              <ServiceTab
                key={c.label}
                category={c}
                active={c.label === service}
                onClick={() => setService(c.label)}
              />
            ))}
          </div>

          {/* Search card */}
          <div className="relative rounded-2xl bg-white p-4 shadow-xl md:p-6 md:pt-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    icon={ICONS[f.icon]}
                    value={currentValues[f.key] ?? ""}
                    onChange={(v) => setField(f.key, v)}
                  />
                ))}
              </div>
              <button
                onClick={submit}
                className="shrink-0 rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm hover:bg-brand-dark lg:self-stretch"
              >
                Search
              </button>
            </div>

            {/* Resume the last search saved on this device */}
            {resume && (
              <p className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 text-sm text-ink">
                <span className="mr-1">🕘</span>
                Terakhir searched:{" "}
                <Link
                  href={resume.href}
                  className="font-semibold text-brand hover:underline"
                >
                  {resume.label}
                </Link>
                <span className="text-muted">— di perangkat ini</span>
              </p>
            )}

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
      </Container>
    </section>
  );
}
