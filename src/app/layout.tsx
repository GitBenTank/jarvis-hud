import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TraceProviderWrapper from "@/components/TraceProviderWrapper";
import HudOriginMismatchBanner from "@/components/HudOriginMismatchBanner";
import HudIntegrationReadinessBanner from "@/components/HudIntegrationReadinessBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jarvis HUD",
  description: "AI control plane for governed automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TraceProviderWrapper>
          <HudOriginMismatchBanner />
          <HudIntegrationReadinessBanner />
          {children}
        </TraceProviderWrapper>
      </body>
    </html>
  );
}
