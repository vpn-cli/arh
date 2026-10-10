import type { Metadata, Viewport } from "next";
import QueryProvider from "@/providers/QueryProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "A Little Corner of the Internet for You ✦ Happy Birthday!",
  description: "A personal handmade indie-web birthday scrapbook filled with memories, memes, and pixel magic.",
  keywords: ["birthday", "pixel art", "scrapbook", "indie web", "hamster"],
  authors: [{ name: "Your Best Friend" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <QueryProvider>
          <ServiceWorkerRegister />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
