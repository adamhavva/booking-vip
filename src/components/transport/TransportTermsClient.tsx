"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/** The rental terms & conditions — the target of the T&C link on the detail. */
export default function TransportTermsClient() {
  const { t } = useLocale();

  const sections: { heading: string; body: string }[] = [
    { heading: t("transport.terms1Title"), body: t("transport.terms1Body") },
    { heading: t("transport.terms2Title"), body: t("transport.terms2Body") },
    { heading: t("transport.terms3Title"), body: t("transport.terms3Body") },
    { heading: t("transport.terms4Title"), body: t("transport.terms4Body") },
    { heading: t("transport.terms5Title"), body: t("transport.terms5Body") },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
        {t("transport.termsHeading")}
      </h1>
      <p className="mt-2 text-[13px] text-muted">{t("transport.termsIntro")}</p>
      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[15px] font-bold text-ink">{section.heading}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}