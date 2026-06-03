"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && pathname && pathname !== "/") {
        // Replace the visible URL to root without changing history navigation
        const from = window.location.pathname;
        window.history.replaceState({}, "", "/");
        console.debug("MainLayout: replaced URL", { from, to: window.location.pathname, pathname });
      }
    } catch (e) {
      // silent
    }
  }, [pathname]);

  // Don't apply sidebar layout on auth pages
  const excludedPaths = ["/login", "/signup"];
  const shouldHideSidebar = pathname && excludedPaths.includes(pathname);

  return (
    <main
      className={`flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 ${
        !shouldHideSidebar ? "md:ml-64" : ""
      }`}
    >
      {/* Scrollable content area */}
      <div className="min-h-full pb-20 md:pb-8">
        {children}
      </div>
    </main>
  );
}
