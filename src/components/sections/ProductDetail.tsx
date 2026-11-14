"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import TabPills from "@/components/ui/TabPills";
import Thumb from "@/components/ui/Thumb";
import type { ProductDetailDTO } from "@/types";
import { getProduct } from "@/app/actions/catalog";
import BookingBox from "@/components/booking/BookingBox";
import { pickLang } from "@/lib/content";
import { SERVICE_SLUG_KEYS } from "@/lib/serviceLabels";
import { useLocale } from "@/components/providers/LocaleProvider";

function DirectionBadge({ direction }: { direction: string }) {
  const { t } = useLocale();
  if (direction === "arrival") return <span>{t("product.arrival")}</span>;
  if (direction === "departure") return <span>{t("product.departure")}</span>;
  return <span>{t("product.bothDirections")}</span>;
}

function LeadTimeLabel({ hours, days }: { hours: number; days: number }) {
  const { t } = useLocale();
  if (days > 0) return <span>{t("product.leadTimeDays", { n: days, plural: days > 1 ? "s" : "" })}</span>;
  if (hours > 0) return <span>{t("product.leadTimeHours", { n: hours, plural: hours > 1 ? "s" : "" })}</span>;
  return <span>{t("product.availableNow")}</span>;
}

/**
 * Product detail content — fetched client-side from the DB.
 */
export default function ProductDetail({ lineSlug }: { lineSlug: string }) {
  const params = useParams();
  const slug = params.slug as string;
  const { t, lang } = useLocale();
  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoTab, setInfoTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    getProduct(slug).then((data) => {
      setProduct(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 rounded bg-canvas" />
          <div className="h-4 w-1/2 rounded bg-canvas" />
          <div className="h-64 rounded bg-canvas" />
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-10">
        <div className="rounded-xl border border-line bg-canvas p-8 text-center">
          <p className="text-lg font-semibold text-ink">{t("product.notFoundTitle")}</p>
          <p className="mt-2 text-sm text-muted">
            {t("product.notFoundDesc")}
          </p>
          <Link
            href={`/${lineSlug}`}
            className="mt-4 inline-block rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            {t("product.backTo", { line: lineSlug })}
          </Link>
        </div>
      </Container>
    );
  }

  // Bilingual copy — the Indonesian variant is picked on the client;
  // English is used when it is absent (static fallbacks, missing ID columns).
  const title = pickLang(product.title, product.titleId, lang);
  const typeLabel = pickLang(product.typeLabel, product.typeLabelId, lang);
  const placeLabel = pickLang(product.placeLabel, product.placeLabelId, lang);
  const description = pickLang(product.description, product.descriptionId, lang);
  const ribbon = product.ribbon
    ? pickLang(product.ribbon, product.ribbonId, lang)
    : undefined;
  const requirements =
    lang === "id" && product.requirementsId?.length
      ? product.requirementsId
      : product.requirements;
  const included =
    lang === "id" && product.includedId?.length ? product.includedId : product.included;
  const notIncluded =
    lang === "id" && product.notIncludedId?.length
      ? product.notIncludedId
      : product.notIncluded;

  const infoTabs = [t("product.included"), t("product.notIncluded")];
  const infoLists = [included, notIncluded];

  return (
    <Container className="py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-brand">{t("product.home")}</Link>
        <span>›</span>
        <Link
          href={`/${lineSlug}`}
          className={
            SERVICE_SLUG_KEYS[lineSlug]
              ? "hover:text-brand"
              : "capitalize hover:text-brand"
          }
        >
          {SERVICE_SLUG_KEYS[lineSlug]
            ? t(SERVICE_SLUG_KEYS[lineSlug])
            : lineSlug.replace("-", " ")}
        </Link>
        <span>›</span>
        <span className="text-ink">{title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Left column: content */}
        <div>
          {/* Title + badges */}
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold text-ink md:text-3xl">
              {title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {typeLabel && (
                <Badge variant="soft">{typeLabel}</Badge>
              )}
              {ribbon && (
                <Badge variant="danger">{ribbon}</Badge>
              )}
            </div>
          </div>

          {/* Attribute row */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted">
            {typeLabel && (
              <span className="flex items-center gap-1">
                ✈️ {typeLabel}
              </span>
            )}
            {placeLabel && (
              <span className="flex items-center gap-1">
                📍 {placeLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <DirectionBadge direction={product.direction} />
            </span>
            <span className="flex items-center gap-1">
              ⏱️ <LeadTimeLabel hours={product.leadTimeHours} days={product.leadTimeDays} />
            </span>
          </div>

          {/* Hero image */}
          <Thumb tone={product.tone} className="mb-6 h-64 w-full rounded-xl md:h-80" />

          {/* Description */}
          {description && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-extrabold text-ink">{t("product.about")}</h2>
              <p className="text-sm leading-relaxed text-muted">{description}</p>
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-extrabold text-ink">{t("product.requirements")}</h2>
              <ul className="space-y-1.5 text-sm text-muted">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Included / Not Included tabs */}
          {(included.length > 0 || notIncluded.length > 0) && (
            <div className="mb-6">
              <TabPills
                items={infoTabs}
                active={infoTab}
                onChange={setInfoTab}
                variant="bordered"
                className="mb-3"
              />
              <ul className="space-y-1.5 text-sm text-muted">
                {infoLists[infoTab]?.length ? (
                  infoLists[infoTab].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={infoTab === 0 ? "text-success" : "text-danger"}>
                        {infoTab === 0 ? "✓" : "✗"}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted">{t("product.none")}</li>
                )}
              </ul>
            </div>
          )}

          {/* Add-ons */}
          {product.addOns.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-extrabold text-ink">{t("product.canAdd")}</h2>
              <div className="flex flex-wrap gap-2">
                {product.addOns.map((a) => (
                  <Badge key={a.slug} variant="light">
                    {pickLang(a.label, a.labelId, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: booking box */}
        <div>
          <BookingBox product={product} />
        </div>
      </div>
    </Container>
  );
}
