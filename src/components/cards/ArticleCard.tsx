"use client";

import CardImage from "@/components/ui/CardImage";
import { copyText } from "@/lib/content";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { ArticleDTO } from "@/types";

/** An article/guide tile — DB-backed (`Article` table), bilingual. */
export default function ArticleCard({ article }: { article: ArticleDTO }) {
  const { lang } = useLocale();

  return (
    <div className="w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-white">
      <CardImage
        src={article.imageUrl}
        tone={article.tone}
        alt={copyText(article.title, lang)}
        className="h-32 w-full"
      />
      <div className="p-3">
        {article.category ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
            {copyText(article.category, lang)}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">
          {copyText(article.title, lang)}
        </h3>
      </div>
    </div>
  );
}
