import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Spend Audit · Credex",
    template: "%s · AI Spend Audit",
  },
  description:
    "Benchmark Cursor, Copilot, Claude, ChatGPT, Gemini, Windsurf, and AI APIs against transparent pricing data.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "AI Spend Audit — benchmark AI subscriptions in minutes",
    description:
      "Find duplicate seats, enterprise mismatch, and API leakage before renewals. Shareable reports with OG previews.",
    url: siteUrl,
    siteName: "AI Spend Audit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Spend Audit",
    description: "Rule-based AI spend benchmarking with shareable reports.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
