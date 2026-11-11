import type { Metadata } from "next";
import ProductsManager from "./ProductsManager";

export const metadata: Metadata = {
  title: "Produk · Admin",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return <ProductsManager />;
}
