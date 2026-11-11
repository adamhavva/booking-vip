import CatalogTabs from "./CatalogTabs";

/** Layout of the catalog section — tab navigation plus the active table. */
export default function AdminCatalogLayout({ children }: LayoutProps<"/admin/catalog">) {
  return (
    <div>
      <CatalogTabs />
      {children}
    </div>
  );
}
