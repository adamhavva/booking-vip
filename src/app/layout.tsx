import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "tiket.com - One App for Your Holiday Needs",
  description:
    "Book flights, hotels, villas, things to do, trains and more. One app for your holiday needs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} h-full`}>
      <body className="min-h-full bg-white text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
