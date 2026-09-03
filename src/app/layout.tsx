import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Madni Advertiser — Signage & Display Advertising in Lahore, Pakistan",
    template: "%s | Madni Advertiser",
  },
  description:
    "Madni Advertiser designs, manufactures and installs 3D signs, LED signs, acrylic signage, digital signage and exhibition stands across Pakistan. Shop ready-made signs online or request a free custom quote.",
  keywords: [
    "signage Lahore",
    "3D signs Pakistan",
    "LED signs",
    "acrylic signs",
    "digital signage",
    "shop sign board",
    "exhibition stands",
    "Madni Advertiser",
  ],
  authors: [{ name: "Madni Advertiser" }],
  openGraph: {
    title: "Madni Advertiser — Signs That Make Your Business Shine",
    description:
      "3D, LED, acrylic and digital signage designed, fabricated and installed across Pakistan. Shop online or get a free quote.",
    siteName: "Madni Advertiser",
    type: "website",
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Madni Advertiser — Signs That Make Your Business Shine",
    description: "3D, LED, acrylic and digital signage across Pakistan. Shop online or get a free quote.",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
