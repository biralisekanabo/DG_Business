"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLayoutDashboard,
  LuCircleDollarSign,
  LuBox,
  LuTrendingDown,
  LuChartBar,
  LuChevronRight,
  LuSettings,
  LuX,
  LuUpload,
  LuTrash2,
  LuCheck,
  LuMoon,
  LuSun,
  LuLogOut,
  LuCircleAlert,
  LuBuilding2,
  LuPhone,
  LuMapPin,
} from "react-icons/lu";

type Notification = {
  type: "success" | "error";
  message: string;
};

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/ventes", label: "Ventes", icon: LuCircleDollarSign },
  { href: "/stock", label: "Stock", icon: LuBox },
  { href: "/depenses", label: "Dépenses", icon: LuTrendingDown },
  { href: "/dettes", label: "Dettes", icon: LuCircleAlert },
  { href: "/rapports", label: "Rapports", icon: LuChartBar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: "DG Business",
    phone: "",
    address: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/company/logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur lors de l'upload");

      showNotification("success", "Logo uploadé avec succès");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Erreur lors de l'upload"
      );
      setLogoPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/company/logo", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setLogoPreview(null);
      showNotification("success", "Logo supprimé avec succès");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Masquage sur pages auth
  const excludedPaths = ["/login", "/signup"];
  if (pathname && excludedPaths.includes(pathname)) {
    return null;
  }

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: { x: -300, opacity: 0, transition: { duration: 0.2 } },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  // Desktop Sidebar only (hidden on mobile)
  return (
    <>
      {/* Sidebar Desktop only */}
      <motion.aside
        variants={sidebarVariants}
        initial="visible"
        animate="visible"
        className="print-hide hidden md:flex fixed left-0 top-0 h-screen w-64 bg-linear-to-b from-blue-950 via-slate-900 to-slate-800 border-r border-slate-700 flex-col z-30 shadow-2xl"
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-slate-700 bg-blue-950/50">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <LuBox size={24} className="text-blue-400" />
            </div>
            DG Business
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          {menu.map((item, i) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.href}
                custom={i}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/40"
                      : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 to-transparent animate-pulse" />
                  )}
                  <IconComponent
                    size={20}
                    className={`transition-transform group-hover:scale-110 shrink-0 z-10 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span className="font-medium flex-1 z-10 text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="w-1 h-6 bg-white rounded-l-full"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Settings Button */}
        <div className="px-3 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 group"
          >
            <LuSettings size={20} className="transition-transform group-hover:scale-110 shrink-0" />
            <span className="font-medium flex-1 text-sm">Paramètres</span>
          </button>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed top-20 left-4 z-60 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-md text-white text-xs max-w-xs ${
                notification.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {notification.type === "success" ? (
                <LuCheck size={16} className="shrink-0" />
              ) : (
                <LuCircleAlert size={16} className="shrink-0" />
              )}
              <span className="font-normal truncate">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-[90vh] bg-linear-to-b from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-blue-950/50 sticky top-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <LuSettings size={20} className="text-blue-400" />
                  Paramètres
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <LuX size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Company Logo Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <LuBuilding2 size={18} className="text-blue-400" />
                    Logo
                  </h3>
                  <div className="flex items-center gap-3">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-12 h-12 rounded-lg object-cover bg-slate-700"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                      >
                        <LuUpload size={16} />
                        Upload
                      </button>
                      {logoPreview && (
                        <button
                          onClick={handleDeleteLogo}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          <LuTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                {/* Company Data Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <LuBuilding2 size={18} className="text-blue-400" />
                    Entreprise
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Nom</label>
                      <input
                        type="text"
                        value={companyData.name}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <LuPhone size={14} /> Téléphone
                      </label>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <LuMapPin size={14} /> Adresse
                      </label>
                      <input
                        type="text"
                        value={companyData.address}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <LuSun size={18} className="text-blue-400" />
                    Thème
                  </h3>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-white text-sm font-medium">Mode sombre</span>
                    {isDarkMode ? (
                      <LuMoon size={18} className="text-blue-400" />
                    ) : (
                      <LuSun size={18} className="text-yellow-400" />
                    )}
                  </button>
                </div>

                {/* Logout Section */}
                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 text-sm font-medium transition-colors"
                  >
                    <LuLogOut size={18} />
                    Déconnexion
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
