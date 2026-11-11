"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import {
  listMyOrders,
  listMyVisaApplications,
  type MyOrderDTO,
  type VisaApplicationDTO,
} from "@/app/actions/account";

/**
 * The order history.
 *
 * A table of the bookings (the e-VOA applications get their own table
 * below) and a link to the downloadable invoice of every order.
 */
export default function OrdersPanel() {
  const [orders, setOrders] = useState<MyOrderDTO[]>([]);
  const [applications, setApplications] = useState<VisaApplicationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [orderRows, visaRows] = await Promise.all([
        listMyOrders(),
        listMyVisaApplications(),
      ]);
      setOrders(orderRows);
      setApplications(visaRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AccountPageHeader
        title="Pesanan"
        description="Riwayat pesanan kamu. Invoice bisa diunduh kapan saja."
      />

      {/* Orders table */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Riwayat pesanan
          </h2>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted">Memuat…</p>
        ) : orders.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted">
            Belum ada pesanan. Pesanan yang kamu buat akan muncul di sini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Kode
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Layanan
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Total
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-canvas/40">
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-[12px] font-semibold text-ink">
                        {order.code}
                      </p>
                      {order.invoiceNumber ? (
                        <p className="mt-0.5 font-mono text-[11px] text-muted">
                          {order.invoiceNumber}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-muted">
                      {new Date(order.serviceAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-ink">{order.itemLabel}</td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold text-ink">
                      ${(order.totalUsdCents / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-muted">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.code)}/invoice`}
                        className="text-[12px] font-semibold text-brand transition-opacity hover:opacity-80"
                      >
                        Unduh invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Visa applications */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Pengajuan e-VOA
          </h2>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted">Memuat…</p>
        ) : applications.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted">
            Belum ada pengajuan visa.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Nomor
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Nama
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Paspor
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Kedatangan
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-ink">
                      {application.code}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-ink">
                      {application.fullName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-muted">
                      {application.passportNumber}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-muted">
                      {new Date(application.arrivalDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-muted">
                        {application.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
