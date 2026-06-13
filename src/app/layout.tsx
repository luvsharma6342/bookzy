import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookzy — WhatsApp-First Storefront & Booking Platform",
  description: "Get a branded online storefront and booking page for your salon, gym, clinic, or service business in India. Let customers book instantly via WhatsApp.",
  keywords: ["booking system", "whatsapp booking", "storefront", "india business", "salon booking", "appointment software", "whatsapp bot", "hyperlocal CRM"],
  authors: [{ name: "Bookzy Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
