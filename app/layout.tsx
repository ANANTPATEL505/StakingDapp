import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toasts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stake & Earn",
  description: "Stake STK and earn RWT rewards.",
};

export const viewport: Viewport = {
  themeColor: "#070b16",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-slate-200 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
