import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const cairo = Cairo({
  variable: "--font-sans",
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Zenith OS | نظام تشغيل حياتك الذكي",
  description:
    "Life Operating System for Multi-Passionate Creatives - حوّل شغفك المتعدد إلى قوة خارقة",
  keywords: [
    "Brainhance",
    "Life OS",
    "Ikigai",
    "Multi-Passionate",
    "متعددي الشغف",
    "إيكيغاي",
    "عجلة الحياة",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
