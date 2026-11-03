/** Section header: optional eyebrow, title with emoji, and a desktop "see all" link. */
export default function SectionHeading({
  eyebrow,
  title,
  emoji,
  seeAll,
  seeAllHref = "#",
}: {
  eyebrow?: string;
  title: string;
  emoji?: string;
  seeAll?: string;
  seeAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-extrabold text-ink md:text-2xl">
          {title} {emoji}
        </h2>
      </div>
      {seeAll && (
        <a
          href={seeAllHref}
          className="hidden shrink-0 text-sm font-semibold text-brand hover:underline md:block"
        >
          {seeAll}
        </a>
      )}
    </div>
  );
}