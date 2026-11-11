"use client";

import type { ReactNode } from "react";
import { adminClass } from "./tokens";
import EmptyState from "./EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

/**
 * Generic admin table.
 *
 * Monochrome by design: hairline row borders, no zebra striping, no rounded
 * cells. `columns` are supplied by the caller so each catalog table decides
 * its own cell content.
 */
export default function DataTable<T>({
  columns,
  rows,
  getKey,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`${adminClass.tableHead} ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)} className={adminClass.tableRow}>
              {columns.map((c) => (
                <td key={c.key} className={`${adminClass.tableCell} ${c.className ?? ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
