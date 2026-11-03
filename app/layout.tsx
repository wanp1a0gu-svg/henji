import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traces - Eastern Wisdom for Modern Life",
  description: "Courses and personal readings in Chinese metaphysics.",
  // Search Console 验证：填了 lib/site-config.ts 的 GOOGLE_SITE_VERIFICATION 才会输出
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
