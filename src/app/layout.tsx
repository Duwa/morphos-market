import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MORPHOS — Robot Morphology Prediction Market",
  description:
    "Trade on how automation will actually take shape. Binary milestone markets on robot form factors, sensing, mobility, and manipulation.",
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border mt-16">
          <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-2 label">
            <span>MORPHOS · play-money research market</span>
            <span>morphology &gt; anthropomorphism</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
