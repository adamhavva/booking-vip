import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getUserSession } from "@/lib/user/session";
import { getMyInvoice } from "@/app/actions/account";
import PrintInvoiceButton from "@/components/account/PrintInvoiceButton";

export const metadata: Metadata = {
  title: "Invoice · Booking VIP",
  description: "Invoice Booking VIP.",
};

/**
 * The printable invoice of one booking.
 *
 * The page is deliberately plain: a white sheet with thin borders, so
 * "Print → Save as PDF" produces a clean document.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await connection();

  const { code } = await params;
  const session = await getUserSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-10 text-center">
        <h1 className="text-[18px] font-bold text-ink">Sesi tidak valid</h1>
        <p className="mt-2 text-[13px] text-muted">
          Silakan masuk kembali untuk membuka invoice.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white"
        >
          Masuk
        </Link>
      </div>
    );
  }

  const invoice = await getMyInvoice(code);

  if (!invoice) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-10 text-center">
        <h1 className="text-[18px] font-bold text-ink">Invoice tidak ditemukan</h1>
        <p className="mt-2 text-[13px] text-muted">
          Pesanan ini tidak ada atau bukan milik akun kamu.
        </p>
        <Link
          href="/account/orders"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white"
        >
          Kembali ke pesanan
        </Link>
      </div>
    );
  }

  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/account/orders"
          className="text-[12px] font-medium text-muted transition-colors hover:text-ink"
        >
          ← Kembali ke pesanan
        </Link>
        <PrintInvoiceButton />
      </div>

      <article className="rounded-2xl border border-line bg-white p-8 print:rounded-none print:border-0 print:p-0">
        {/* Head */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">
              Booking VIP
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              Airport Transfer &amp; Travel Services
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              Invoice
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink">
              {invoice.invoiceNumber ?? invoice.code}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">Kode: {invoice.code}</p>
          </div>
        </header>

        {/* Meta */}
        <section className="grid gap-5 border-b border-line py-5 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Tanggal layanan
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">
              {new Date(invoice.serviceAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Dibuat
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">
              {new Date(invoice.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Status
            </p>
            <p className="mt-1 text-[13px] font-medium capitalize text-ink">
              {invoice.status.replace(/_/g, " ")}
            </p>
          </div>
        </section>

        {/* Contact */}
        {invoice.contact ? (
          <section className="grid gap-5 border-b border-line py-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                Pemesan
              </p>
              <p className="mt-1 text-[13px] font-medium text-ink">
                {invoice.contact.firstName} {invoice.contact.lastName}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">{invoice.contact.email}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {invoice.contact.phoneCountryCode} {invoice.contact.phone}
              </p>
            </div>
            {invoice.travelers.length > 0 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                  Penumpang ({invoice.travelers.length})
                </p>
                <ul className="mt-1 space-y-0.5">
                  {invoice.travelers.map((traveler, index) => (
                    <li key={`${traveler.fullName}-${index}`} className="text-[12px] text-ink">
                      {traveler.fullName}
                      <span className="ml-1 text-muted">({traveler.kind})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Items */}
        <section className="py-5">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Item
                </th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Harga
                </th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoice.items.map((item, index) => (
                <tr key={`${item.label}-${index}`}>
                  <td className="py-2.5 pr-3 text-[13px] text-ink">
                    {item.label}
                    {item.packageLabel ? (
                      <span className="block text-[11px] text-muted">{item.packageLabel}</span>
                    ) : null}
                    <span className="block text-[11px] text-muted">
                      {item.adultCount} dewasa · {item.childCount} anak · {item.infantCount} bayi
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[13px] text-muted">
                    {money(item.unitUsdCents)}
                  </td>
                  <td className="py-2.5 text-right text-[13px] font-medium text-ink">
                    {money(item.totalUsdCents)}
                  </td>
                </tr>
              ))}

              {invoice.addOns.map((addOn, index) => (
                <tr key={`${addOn.label}-add-${index}`}>
                  <td className="py-2.5 pr-3 text-[13px] text-ink">
                    {addOn.label}
                    <span className="block text-[11px] text-muted">
                      Tambahan ×{addOn.quantity}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[13px] text-muted">
                    {money(addOn.unitUsdCents)}
                  </td>
                  <td className="py-2.5 text-right text-[13px] font-medium text-ink">
                    {money(addOn.totalUsdCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="border-t border-line pt-4">
          <dl className="ml-auto w-full max-w-xs space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-ink">{money(invoice.subtotalUsdCents)}</dd>
            </div>

            {invoice.addOnsUsdCents > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">Tambahan</dt>
                <dd className="text-ink">{money(invoice.addOnsUsdCents)}</dd>
              </div>
            ) : null}

            {invoice.discountUsdCents > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">
                  Diskon{invoice.promoCode ? ` (${invoice.promoCode})` : ""}
                </dt>
                <dd className="text-success">-{money(invoice.discountUsdCents)}</dd>
              </div>
            ) : null}

            {invoice.taxes.map((tax) => (
              <div key={tax.key} className="flex justify-between">
                <dt className="text-muted">
                  {tax.label} ({tax.value})
                </dt>
                <dd className="text-ink">{money(tax.amountUsdCents)}</dd>
              </div>
            ))}

            <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold">
              <dt className="text-ink">Total</dt>
              <dd className="text-ink">{money(invoice.totalUsdCents)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-6 border-t border-line pt-4 text-[11px] text-muted">
          Invoice ini dibuat otomatis oleh sistem Booking VIP. Simpan sebagai PDF lewat
          tombol cetak di halaman.
        </footer>
      </article>
    </div>
  );
}
