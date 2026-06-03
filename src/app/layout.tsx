import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileMenu from "./lib/MobileMenu";
import Sidebar from "@/components/Sidebar";
import MainLayout from "@/components/MainLayout";
import AIAssistant from "@/components/AIAssistant";
import SettingsMenu from "@/components/SettingsMenu";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "DG Business",
  description: "Application mobile et desktop de gestion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DG Business",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-screen w-screen overflow-x-hidden antialiased overflow-hidden`}
    >
      <head />
      <body className="h-screen w-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col">
        {/* Service Worker Registration */}
        <ServiceWorkerRegister />

        {/* Sidebar - Desktop only */}
        <Sidebar />

        {/* Main Content with responsive layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainLayout>
            {children}
          </MainLayout>

          {/* Mobile Bottom Menu */}
          <MobileMenu />
        </div>
        

        {/* AI Assistant */}
        <AIAssistant />

        {/* Settings Menu */}
        <SettingsMenu />
      </body>
    </html>
  );
}