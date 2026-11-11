"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { listMyReviews, type MyReviewDTO, type ReviewReplyDTO } from "@/app/actions/account";
import { StarIcon } from "@/components/icons";

/**
 * "Review Kamu" — the comments the customer wrote on the places they visited.
 *
 * The replies form a parent → child → child tree, so a reply is rendered
 * inside its parent and its own replies are rendered inside it.
 */
export default function ReviewsPanel() {
  const [reviews, setReviews] = useState<MyReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setReviews(await listMyReviews());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = reviews.reduce(
    (acc, review) => ({
      reviews: acc.reviews + 1,
      likes: acc.likes + review.likes,
      views: acc.views + review.views,
      replies: acc.replies + review.replyCount,
    }),
    { reviews: 0, likes: 0, views: 0, replies: 0 },
  );

  return (
    <div>
      <AccountPageHeader
        title="Review Saya"
        description="Komentar kamu di setiap tempat yang dikunjungi, lengkap dengan jumlah dilihat, suka dan balasan."
      />

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Review", value: totals.reviews },
          { label: "Dilihat", value: totals.views },
          { label: "Suka", value: totals.likes },
          { label: "Balasan", value: totals.replies },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              {item.label}
            </p>
            <p className="mt-1 text-[22px] font-bold leading-none tracking-[-0.02em] text-ink">
              {loading ? "—" : item.value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {/* Review list */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-[13px] text-muted">Memuat…</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Belum ada review</p>
            <p className="mt-1 text-[13px] text-muted">
              Komentar kamu di setiap tempat yang dikunjungi akan muncul di sini.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-line bg-white p-5">
              {/* Subject */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                    {review.subjectLabel}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon
                        key={i}
                        width={14}
                        height={14}
                        className={
                          i < review.rating ? "text-amber-500" : "text-line"
                        }
                      />
                    ))}
                    <span className="ml-1 text-[12px] text-muted">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <time className="text-[12px] text-muted" dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>

              {/* Body */}
              <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink">
                {review.body}
              </p>

              {/* Counters */}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[12px] text-muted">
                <span>{review.views.toLocaleString("id-ID")} dilihat</span>
                <span>{review.likes.toLocaleString("id-ID")} suka</span>
                <span>{review.replyCount} balasan</span>
              </div>

              {/* Replies */}
              {review.replies.length > 0 ? (
                <div className="mt-4 space-y-3 border-l-2 border-line pl-4">
                  {review.replies.map((reply) => (
                    <ReplyBlock key={reply.id} reply={reply} depth={0} />
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

/** A reply — nested one level deeper for its own replies. */
function ReplyBlock({ reply, depth }: { reply: ReviewReplyDTO; depth: number }) {
  return (
    <div
      className={
        depth > 0
          ? "rounded-xl border border-line bg-canvas/40 p-4"
          : "rounded-xl border border-line bg-canvas/40 p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-ink">Balasan</span>
        <time className="text-[11px] text-muted" dateTime={reply.createdAt}>
          {new Date(reply.createdAt).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>

      <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">
        {reply.body}
      </p>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted">
        <span>{reply.views.toLocaleString("id-ID")} dilihat</span>
        <span>{reply.likes.toLocaleString("id-ID")} suka</span>
      </div>

      {reply.replies.length > 0 ? (
        <div className="mt-3 space-y-3 border-l-2 border-line pl-4">
          {reply.replies.map((child) => (
            <ReplyBlock key={child.id} reply={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
