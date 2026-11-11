# Plan 05 — Review Saya (komentar + balasan parent → child)

Goal: "Review Kamu" lists every comment the customer wrote on the places they visited,
in card style, with the views / likes / reply counters, and the replies as
**parent → child → child**.

## Scope
- Schema: `Review` (`userId`, `subjectType`, `subjectId`, `rating`, `body`, `views`,
  `likes`, `parentId` self relation, `createdAt`).
- `src/app/actions/account.ts`:
  - `listMyReviews()` — the customer's own reviews, newest first, with their replies
    (one level of children, and the children may have children).
  - `listMyReviewStats()` — how many reviews, views and likes the customer has.
- `src/app/account/reviews/page.tsx` — one card per review: the subject (product /
  service line), the rating stars, the body, `dilihat N · suka N · balasan N` and the
  nested replies (child cards, indented, with their own replies).
- Empty state: "Belum ada review".

## Done when
- Reviews render as cards with the counters and the nested replies.
