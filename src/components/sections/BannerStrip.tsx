import Container from "@/components/ui/Container";

export default function BannerStrip({
  title,
  subtitle,
  cta,
  tone = "from-blue-600 to-indigo-800",
  compact = false,
}: {
  title: string;
  subtitle?: string;
  cta?: string;
  tone?: string;
  compact?: boolean;
}) {
  return (
    <Container className="py-4">
      <div
        className={`flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r ${tone} p-6 text-white ${
          compact ? "md:p-6" : "md:p-10"
        }`}
      >
        <div>
          <h3 className="text-lg font-extrabold md:text-2xl">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-white/90 md:text-base">{subtitle}</p>
          )}
        </div>
        {cta && (
          <button className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand hover:bg-white/90">
            {cta}
          </button>
        )}
      </div>
    </Container>
  );
}