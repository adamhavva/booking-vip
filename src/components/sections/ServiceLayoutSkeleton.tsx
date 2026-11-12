import Container from "@/components/ui/Container";

/** The placeholder shown while a service page's DB copy streams in. */
export default function ServiceLayoutSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-20 lg:pb-0">
      <section className="bg-gradient-to-b from-hero-from via-hero-via to-hero-to py-12 md:py-16">
        <Container>
          <div className="h-4 w-24 rounded bg-white/20" />
          <div className="mt-4 h-9 w-80 rounded-lg bg-white/20" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded bg-white/15" />
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {[0, 1, 2].map((row) => (
              <div key={row}>
                <div className="h-6 w-56 rounded-lg bg-canvas" />
                <div className="mt-3 h-4 w-full rounded bg-canvas" />
                <div className="mt-2 h-4 w-3/4 rounded bg-canvas" />
              </div>
            ))}
          </div>
          <div className="h-80 rounded-2xl border border-line bg-white" />
        </div>
      </Container>
    </div>
  );
}
