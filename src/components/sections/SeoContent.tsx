import Container from "@/components/ui/Container";
import { seoBlocks as staticSeoBlocks } from "@/data/home";
import type { SeoBlockDTO } from "@/types";

/**
 * SEO body copy. DB-backed (`SeoBlock` table) when available, falls back to
 * the static blocks otherwise — rendered server-side (English) so it stays
 * crawlable.
 */
export default function SeoContent({ blocks }: { blocks?: SeoBlockDTO[] }) {
  const resolved =
    blocks && blocks.length > 0
      ? blocks.map((b) => ({
          title: b.title.en,
          sections: b.sections.map((s) => ({ h: s.heading.en, p: s.body.en })),
        }))
      : staticSeoBlocks;

  return (
    <section className="bg-canvas">
      <Container className="space-y-10 py-12">
        {resolved.map((block) => (
          <div key={block.title}>
            <h2 className="mb-5 text-xl font-extrabold text-ink md:text-2xl">
              {block.title}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {block.sections.map((s) => (
                <div key={s.h}>
                  <h3 className="mb-2 text-base font-bold text-ink">{s.h}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.p}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="mb-3 text-xl font-extrabold text-ink md:text-2xl">
            Book Cheap Flight Tickets to Your Favorite Destinations
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Planning your next getaway has never been easier. Compare fares
            across airlines, pick the schedule that fits your plans, and lock in
            the best price for domestic and international routes. Whether you are
            travelling for business or leisure, you will find flexible options,
            transparent pricing, and secure payment — all in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-10">
          <div className="max-w-md">
            <h2 className="mb-2 text-lg font-bold text-ink">
              Easy and Simple Installment
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Split your booking into affordable monthly payments and travel
              now, pay later.{" "}
              <a href="#" className="font-semibold text-brand">
                More
              </a>
            </p>
          </div>
          <div className="max-w-md">
            <h2 className="mb-2 text-lg font-bold text-ink">Our Partners</h2>
            <p className="text-sm leading-relaxed text-muted">
              We work with trusted airlines, hotels and travel providers to bring
              you reliable service everywhere you go.{" "}
              <a href="#" className="font-semibold text-brand">
                More
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
