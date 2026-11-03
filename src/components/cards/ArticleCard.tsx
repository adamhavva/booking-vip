import Thumb from "@/components/ui/Thumb";
import type { Article } from "@/types";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-white">
      <Thumb tone={article.tone} className="h-32 w-full" />
      <div className="p-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
          {article.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">
          {article.title}
        </h3>
      </div>
    </div>
  );
}