"use client";

import CardImage from "@/components/ui/CardImage";
import { copyText } from "@/lib/content";
import { useMountedLocale } from "@/lib/useMountedLocale";
import type { ArticleDTO } from "@/types";

/** An article/guide tile — DB-backed (`Article` table), bilingual. */
export default function ArticleCard({ article }: { article: ArticleDTO }) {
  const { lang } = useMountedLocale();

  return (
    <div className="flex h-full w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardImage
        src={article.imageUrl}
        tone={article.tone}
        alt={copyText(article.title, lang)}
        className="h-32 w-full"
      />
      <div className="flex-1 p-3">
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
