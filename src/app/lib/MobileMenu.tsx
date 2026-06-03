"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LuLayoutDashboard, 
  LuCircleDollarSign, 
  LuBox, 
  LuTrendingDown,
  LuCircleAlert,
  LuChartBar 
} from "react-icons/lu";

// Les href ici pointent vers src/app/[nom-du-dossier]
const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/ventes", label: "Ventes", icon: LuCircleDollarSign },
  { href: "/stock", label: "Stock", icon: LuBox },
  { href: "/depenses", label: "Dépenses", icon: LuTrendingDown },
  { href: "/dettes", label: "Dettes", icon: LuCircleAlert },
  { href: "/rapports", label: "Rapports", icon: LuChartBar },
];

export default function MobileMenu() {
  const pathname = usePathname();

  // Masquage automatique sur les pages d'authentification
  const excludedPaths = ["/login", "/signup"];
  if (pathname && excludedPaths.includes(pathname)) {
    return null;
  }

  return (
    <nav className="print-hide fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-800 border-t border-slate-700 flex items-center h-20 md:hidden shadow-2xl pb-safe pr-20 overflow-x-auto">
      {menu.map((item, idx) => {
        // Sécurisation de la détection de la page active (gère le dashboard racine et les sous-routes)
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
        const IconComponent = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 h-full text-[11px] font-medium transition-all duration-200 select-none active:scale-95 touch-none relative group overflow-hidden
              ${
                isActive
                  ? "text-white font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
          >
            {isActive && (
              <motion.div
                layoutId="mobileActive"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 -z-10 opacity-80"
              />
            )}
            <div className={`text-lg mb-0.5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
              <IconComponent size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
            </div>
            <span className="truncate max-w-full px-1">{item.label}</span>
          </Link>
        );
      })}


    </nav>
  );
}