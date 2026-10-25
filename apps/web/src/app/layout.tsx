import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "E-Commerce App - Modern & Premium Shopping Store",
  description:
    "Explore carefully curated goods, artisanal homeware, and everyday essentials designed for modern living.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
