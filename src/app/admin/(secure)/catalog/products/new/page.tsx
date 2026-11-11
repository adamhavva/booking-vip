import type { Metadata } from "next";
import ProductsForm from "../ProductsForm";

export const metadata: Metadata = {
  title: "Tambah Produk · Admin",
  robots: { index: false, follow: false },
};

export default function AdminProductsNewPage() {
  return <ProductsForm mode="create" />;
}
