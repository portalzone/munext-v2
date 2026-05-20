import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MUNext — Job Board Portal",
  description: "Job board platform connecting Memorial University students and alumni with employers across Newfoundland.",
  metadataBase: new URL("https://munext.basepan.com"),
  openGraph: {
    title: "MUNext — Job Board Portal",
    description: "Job board platform connecting Memorial University students and alumni with employers across Newfoundland.",
    url: "https://munext.basepan.com",
    siteName: "MUNext",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MUNext Job Board",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUNext — Job Board Portal",
    description: "Job board platform connecting Memorial University students and alumni with employers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
