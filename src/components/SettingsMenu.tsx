"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GooglePlacesInput from "./GooglePlacesInput";
import {
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
  LuFileText,
} from "react-icons/lu";

type Notification = {
  type: "success" | "error";
  message: string;
};

export default function SettingsMenu() {
  const pathname = usePathname();
  // Ne pas afficher sur login/signup ET masquer sur desktop (md+)
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: "DG Business",
    phone: "",
    address: "",
  });
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Charger les données de l'entreprise au montage
    const loadCompanyData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/company", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCompanyData({
            name: data.nom || "DG Business",
            phone: data.phone || "",
            address: data.adresse || "",
          });
          // Charger la signature de l'entreprise si elle existe
          if (data.signature_url) {
            setSignaturePreview(data.signature_url);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    loadCompanyData();
  }, []);

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

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignaturePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("signature", file);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/company/signature", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur lors de l'upload");

      const data = await response.json();
      // Mettre à jour le preview avec l'URL sauvegardée
      setSignaturePreview(data.signature_url);
      showNotification("success", "Signature uploadée avec succès");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Erreur lors de l'upload"
      );
      setSignaturePreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSignature = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/company/signature", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setSignaturePreview(null);
      showNotification("success", "Signature supprimée avec succès");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    showNotification(
      "success",
      `Mode ${!isDarkMode ? "sombre" : "clair"} activé`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSaveCompanyInfo = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/company/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: companyData.name,
          phone: companyData.phone,
          adresse: companyData.address,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      showNotification("success", "Informations sauvegardées avec succès");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthPage) return null; // Ne pas afficher sur pages d'auth

  return (
    <div className="print-hide">
      {/* Bouton Settings - Mobile/Tablet only (hidden on md+) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed top-4 sm:top-6 right-4 sm:right-6 z-40 md:hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all"
            aria-label="Paramètres"
            title="Paramètres de l'application"
          >
            <LuSettings size={20} className="sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-md shadow-sm text-white text-xs max-w-[280px] ${
              notification.type === "success" ? "bg-green-600/95" : "bg-red-600/95"
            }`}
          >
            {notification.type === "success" ? (
              <LuCheck size={14} className="shrink-0" />
            ) : (
              <LuCircleAlert size={14} className="shrink-0" />
            )}
            <span className="font-normal truncate text-xs">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Settings Sidebar - Mobile/Tablet only */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-0 right-0 z-50 h-screen w-full sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-700 overflow-hidden md:hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
                <h2 className="font-bold text-lg sm:text-xl">Paramètres</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-purple-500 rounded-lg transition"
                >
                  <LuX size={20} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3">
                {/* Logo Settings */}
                <div className="space-y-2 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                    <LuUpload size={16} className="sm:w-5 sm:h-5" />
                    Logo
                  </h3>

                  {logoPreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full h-16 sm:h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700"
                    >
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain p-2"
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-2 text-xs sm:text-sm">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-2 sm:px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1"
                    >
                      <LuUpload size={14} className="sm:w-4 sm:h-4" />
                      {isLoading ? "..." : "Logo"}
                    </button>

                    {logoPreview && (
                      <button
                        onClick={handleDeleteLogo}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 sm:px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1"
                      >
                        <LuTrash2 size={14} className="sm:w-4 sm:h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {/* Company Info */}
                <div className="space-y-2 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                    <LuBuilding2 size={16} className="sm:w-5 sm:h-5" />
                    Entreprise
                  </h3>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <input
                      type="text"
                      placeholder="Nom"
                      value={companyData.name}
                      onChange={(e) =>
                        setCompanyData({ ...companyData, name: e.target.value })
                      }
                      className="w-full px-2 sm:px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />

                    <div className="flex items-center gap-2">
                      <LuPhone size={14} className="text-zinc-500" />
                      <input
                        type="tel"
                        placeholder="Téléphone"
                        value={companyData.phone}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, phone: e.target.value })
                        }
                        className="flex-1 px-2 sm:px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <LuMapPin size={14} className="text-zinc-500 mt-1.5 flex-shrink-0" />
                      <GooglePlacesInput
                        value={companyData.address}
                        onChange={(address, placeDetails) => {
                          setCompanyData({ 
                            ...companyData, 
                            address,
                            // Optionnel: enregistrer aussi les coordonnées GPS
                            // latitude: placeDetails?.lat,
                            // longitude: placeDetails?.lng,
                          });
                        }}
                        placeholder="Recherchez votre adresse..."
                        className="flex-1"
                      />
                    </div>

                    <button
                      onClick={handleSaveCompanyInfo}
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-2 sm:px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1 text-xs sm:text-sm mt-2"
                    >
                      <LuCheck size={14} className="sm:w-4 sm:h-4" />
                      {isLoading ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>

                {/* Signature Settings - Compact */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
                    <LuFileText size={14} className="sm:w-4 sm:h-4" />
                    Signature
                  </h3>

                  {signaturePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full h-12 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center overflow-hidden border border-dashed border-blue-300 dark:border-blue-700"
                    >
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="w-full h-full object-contain p-1"
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-1.5 text-xs">
                    <button
                      onClick={() => signatureFileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded font-medium transition flex items-center justify-center gap-1"
                    >
                      <LuUpload size={12} />
                      {isLoading ? "..." : "Upload"}
                    </button>

                    {signaturePreview && (
                      <button
                        onClick={handleDeleteSignature}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded font-medium transition flex items-center justify-center gap-1"
                      >
                        <LuTrash2 size={12} />
                        Retirer
                      </button>
                    )}
                  </div>

                  <input
                    ref={signatureFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {/* Theme Settings */}
                <div className="space-y-2 pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                    {isDarkMode ? (
                      <LuMoon size={16} className="sm:w-5 sm:h-5" />
                    ) : (
                      <LuSun size={16} className="sm:w-5 sm:h-5" />
                    )}
                    Apparence
                  </h3>

                  <button
                    onClick={toggleDarkMode}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-lg font-medium transition flex items-center justify-between text-xs sm:text-sm"
                  >
                    <span>Mode {isDarkMode ? "Sombre" : "Clair"}</span>
                    <div
                      className={`w-8 h-5 rounded-full transition flex items-center p-0.5 ${
                        isDarkMode
                          ? "bg-purple-600"
                          : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition transform ${
                          isDarkMode ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Account Settings */}
                <div className="space-y-2 pb-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base">
                    Compte
                  </h3>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <LuLogOut size={14} className="sm:w-4 sm:h-4" />
                    Déconnexion
                  </button>
                </div>

                {/* Info Footer */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5 pt-2">
                  <p>
                    <strong>DG Business</strong> v1.0.0
                  </p>
                  <p>Gestion intégrée</p>
                  <p>© 2026 - Tous droits réservés</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
