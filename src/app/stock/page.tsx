"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuBox,
  LuCirclePlus,
  LuCircleMinus,
  LuTriangleAlert,
  LuEye,
  LuPencil,
  LuTrash2,
  LuX,
  LuSave,
  LuCheck,
  LuCircleAlert,
  LuSearch,
  LuPackage,
  LuCoins,
  LuDownload,
  LuTrendingUp,
  LuHistory,
  LuDollarSign,
  LuPlus,
  LuEllipsisVertical,
} from "react-icons/lu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

// Types
type Devise = "USD" | "CDF";
type Statut = "Faible" | "OK";

type StockItem = {
  id: number;
  modele: string;
  categorie: string;
  fournisseur: string;
  quantite: number;
  prix: number;
  devise: Devise;
  seuil: number;
  statut: Statut;
};

type Mouvement = {
  id: number;
  stockId: number;
  type: "entree" | "sortie";
  quantite: number;
  date: string;
  raison: string;
  utilisateur: string;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

const SEUIL_DEFAUT = 10;
const EXCHANGE_RATE = 2350;

const getStatutColor = (statut: Statut) => {
  switch (statut) {
    case "Faible":
      return "text-orange-600 bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800";
    case "OK":
      return "text-green-600 bg-green-100 dark:bg-green-950/40 border-green-200 dark:border-green-800";
    default:
      return "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categorieFilter, setCategorieFilter] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [fournisseurs, setFournisseurs] = useState<string[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<"entree" | "sortie">("entree");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [movementQuantity, setMovementQuantity] = useState(1);
  const [movementRaison, setMovementRaison] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    modele: "",
    categorie: "",
    fournisseur: "",
    quantite: "",
    prix: "",
    devise: "USD" as Devise,
    seuil: SEUIL_DEFAUT.toString(),
  });

  const [chartData, setChartData] = useState<{ date: string; quantite: number }[]>([]);

  const getAuthToken = () => localStorage.getItem("token");

  const fetchStock = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Authentification requise");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/stock", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur chargement stock");
      const data = await res.json();
      setStockItems(data);
    } catch (err: any) {
      setError(err.message);
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMouvements = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/mouvements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur chargement historique");
      const data = await res.json();
      setMouvements(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchMouvements();
  }, []);

  useEffect(() => {
    const cats = [...new Set(stockItems.map((i) => i.categorie))];
    const fours = [...new Set(stockItems.map((i) => i.fournisseur))];
    setCategories(cats);
    setFournisseurs(fours);
  }, [stockItems]);

  useEffect(() => {
    if (mouvements.length === 0) return;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, "yyyy-MM-dd");
    }).reverse();
    const data = last7Days.map((date) => {
      const mouvs = mouvements.filter((m) => m.date.startsWith(date));
      const net = mouvs.reduce((acc, m) => acc + (m.type === "entree" ? m.quantite : -m.quantite), 0);
      return { date: format(new Date(date), "dd/MM"), quantite: net };
    });
    setChartData(data);
  }, [mouvements]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateStatut = (quantite: number, seuil: number): Statut => (quantite < seuil ? "Faible" : "OK");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    const quantite = parseInt(formData.quantite);
    const prix = parseFloat(formData.prix);
    const seuil = parseInt(formData.seuil);
    const newItem = {
      modele: formData.modele,
      categorie: formData.categorie,
      fournisseur: formData.fournisseur,
      quantite,
      prix,
      devise: formData.devise,
      seuil,
      statut: updateStatut(quantite, seuil),
    };
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) throw new Error("Erreur ajout");
      const saved = await res.json();
      setStockItems((prev) => [saved, ...prev]);
      showNotification("success", "Article ajouté");
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    const quantite = parseInt(formData.quantite);
    const prix = parseFloat(formData.prix);
    const seuil = parseInt(formData.seuil);
    const updated = {
      ...selectedItem,
      modele: formData.modele,
      categorie: formData.categorie,
      fournisseur: formData.fournisseur,
      quantite,
      prix,
      devise: formData.devise,
      seuil,
      statut: updateStatut(quantite, seuil),
    };
    try {
      const res = await fetch(`/api/stock/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Erreur modification");
      const saved = await res.json();
      setStockItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      showNotification("success", "Article modifié");
      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleMovement = async () => {
    if (!selectedItem) return;
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    let newQuantite = selectedItem.quantite;
    if (movementType === "entree") newQuantite += movementQuantity;
    else newQuantite -= movementQuantity;

    if (newQuantite < 0) {
      showNotification("error", "Stock insuffisant");
      return;
    }
    if (movementQuantity <= 0) {
      showNotification("error", "Quantité invalide");
      return;
    }
    if (!movementRaison.trim()) {
      showNotification("error", "Raison requise");
      return;
    }

    const updatedStock = {
      ...selectedItem,
      quantite: newQuantite,
      statut: updateStatut(newQuantite, selectedItem.seuil),
    };
    try {
      const resStock = await fetch(`/api/stock/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedStock),
      });
      if (!resStock.ok) throw new Error("Erreur mise à jour stock");
      const savedStock = await resStock.json();
      setStockItems((prev) => prev.map((i) => (i.id === savedStock.id ? savedStock : i)));

      const mouvement = {
        stockId: selectedItem.id,
        type: movementType,
        quantite: movementQuantity,
        date: new Date().toISOString(),
        raison: movementRaison,
        utilisateur: "admin",
      };
      const resMvt = await fetch("/api/mouvements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mouvement),
      });
      if (resMvt.ok) {
        const newMvt = await resMvt.json();
        setMouvements((prev) => [newMvt, ...prev]);
      }
      showNotification("success", `${movementType === "entree" ? "Entrée" : "Sortie"} enregistrée`);
      setIsMovementModalOpen(false);
      setSelectedItem(null);
      setMovementQuantity(1);
      setMovementRaison("");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    try {
      const res = await fetch(`/api/stock/${selectedItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setStockItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      showNotification("success", "Article supprimé");
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const exportCSV = () => {
    const headers = ["Modèle", "Catégorie", "Fournisseur", "Quantité", "Prix", "Devise", "Seuil", "Statut"];
    const rows = filteredItems.map((item) => [
      item.modele,
      item.categorie,
      item.fournisseur,
      item.quantite,
      item.prix,
      item.devise,
      item.seuil,
      item.statut,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `stock_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("success", "Export CSV effectué");
  };

  const resetForm = () => {
    setFormData({
      modele: "",
      categorie: "",
      fournisseur: "",
      quantite: "",
      prix: "",
      devise: "USD",
      seuil: SEUIL_DEFAUT.toString(),
    });
  };

  const openEditModal = (item: StockItem) => {
    setSelectedItem(item);
    setFormData({
      modele: item.modele,
      categorie: item.categorie,
      fournisseur: item.fournisseur,
      quantite: item.quantite.toString(),
      prix: item.prix.toString(),
      devise: item.devise,
      seuil: item.seuil.toString(),
    });
    setIsEditModalOpen(true);
  };

  const openMovementModal = (item: StockItem, type: "entree" | "sortie") => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQuantity(1);
    setMovementRaison("");
    setIsMovementModalOpen(true);
  };

  const totalArticles = stockItems.reduce((acc, i) => acc + i.quantite, 0);
  const valeurStockUSD = stockItems
    .filter((i) => i.devise === "USD")
    .reduce((acc, i) => acc + i.quantite * i.prix, 0);
  const valeurStockCDF = stockItems
    .filter((i) => i.devise === "CDF")
    .reduce((acc, i) => acc + i.quantite * i.prix, 0);
  const alertesCount = stockItems.filter((i) => i.statut === "Faible").length;

  const filteredItems = stockItems.filter((item) => {
    const matchSearch =
      item.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategorie = categorieFilter ? item.categorie === categorieFilter : true;
    const matchFournisseur = fournisseurFilter ? item.fournisseur === fournisseurFilter : true;
    return matchSearch && matchCategorie && matchFournisseur;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <div className="w-full max-w-screen-lg box-border px-3 md:px-4 py-4 pb-8 md:pb-8 overflow-y-auto md:max-h-[calc(100vh-100px)]">
        {/* Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              key="notification"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-md shadow-sm text-white text-xs max-w-[280px] ${
                notification.type === "success"
                  ? "bg-green-600/95"
                  : "bg-red-600/95"
              }`}
            >
              {notification.type === "success" ? <LuCheck size={14} className="shrink-0" /> : <LuCircleAlert size={14} className="shrink-0" />}
              <span className="font-normal truncate text-xs">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <LuBox className="text-blue-600 dark:text-blue-400 text-3xl" />
                Gestion du Stock
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Suivez vos réserves, gérez les mouvements et évitez les ruptures.
              </p>
            </div>
            <div className="flex flex-nowrap gap-1 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportCSV}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium shadow-sm whitespace-nowrap"
              >
                <LuDownload size={14} /> Exporter CSV
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-md whitespace-nowrap"
              >
                <LuPlus size={16} /> <span className="hidden sm:inline">Nouvel article</span><span className="inline sm:hidden">Ajouter</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total articles</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalArticles} pcs</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <LuPackage className="text-blue-600 dark:text-blue-400 text-2xl" />
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Valeur (USD)</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">${valeurStockUSD.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <LuDollarSign className="text-emerald-600 dark:text-emerald-400 text-2xl" />
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Valeur (CDF)</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{valeurStockCDF.toLocaleString()} FC</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <LuCoins className="text-amber-600 dark:text-amber-400 text-2xl" />
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Alertes stock faible</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{alertesCount}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <LuTriangleAlert className="text-orange-600 dark:text-orange-400 text-2xl" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Graphique */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-8"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
              <LuTrendingUp /> Évolution du stock (7 derniers jours)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="quantite" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 mb-6"
        >
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recherche</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Modèle, catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
              <select
                value={categorieFilter}
                onChange={(e) => setCategorieFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur</label>
              <select
                value={fournisseurFilter}
                onChange={(e) => setFournisseurFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {fournisseurs.map((four) => (
                  <option key={four} value={four}>{four}</option>
                ))}
              </select>
            </div>
            {(categorieFilter || fournisseurFilter || searchTerm) && (
              <button
                onClick={() => {
                  setCategorieFilter("");
                  setFournisseurFilter("");
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </motion.div>

        {/* Alerte stock critique */}
        {alertesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-amber-800 dark:text-amber-400 text-sm mb-8"
          >
            <LuTriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Alerte stock critique :</span> {alertesCount} modèle(s) sont presque en rupture. Pensez à réapprovisionner.
            </div>
          </motion.div>
        )}

        {/* Tableau du stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="overflow-x-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-gray-500">Chargement du stock...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500">{error}</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">Aucun article trouvé.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Modèle</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Fournisseur</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Quantité</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Prix</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-3 py-3 font-semibold text-gray-800 dark:text-white truncate max-w-[150px]">{item.modele}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{item.categorie || "-"}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{item.fournisseur || "-"}</td>
                      <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-200">{item.quantite}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {item.devise === "USD" ? "$" : "FC"} {item.prix.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatutColor(item.statut)}`}>
                          {item.statut}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap relative">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <LuEllipsisVertical size={16} className="text-gray-600 dark:text-gray-300" />
                          </button>
                          {openDropdownId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-36 sm:w-40 py-1"
                            >
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsViewModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuEye size={14} /> Voir
                              </button>
                              <button
                                onClick={() => {
                                  openMovementModal(item, "entree");
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuCirclePlus size={14} /> Entrée
                              </button>
                              <button
                                onClick={() => {
                                  openMovementModal(item, "sortie");
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuCircleMinus size={14} /> Sortie
                              </button>
                              <button
                                onClick={() => {
                                  openEditModal(item);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuPencil size={14} /> Modifier
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsDeleteModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuTrash2 size={14} /> Supprimer
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Historique des mouvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
            <LuHistory /> Derniers mouvements
          </h2>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white dark:bg-gray-800">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left">Article</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Qté</th>
                  <th className="text-left">Raison</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.slice(0, 10).map((mvt) => {
                  const article = stockItems.find((s) => s.id === mvt.stockId);
                  return (
                    <tr key={mvt.id} className="border-b border-gray-100 dark:border-gray-700/50 text-xs">
                      <td className="py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{format(new Date(mvt.date), "dd/MM/yy HH:mm")}</td>
                      <td className="font-medium text-gray-800 dark:text-white truncate max-w-[150px]">{article?.modele || "?"}</td>
                      <td className={mvt.type === "entree" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>{mvt.type === "entree" ? "↓" : "↑"}</td>
                      <td className="font-medium">{mvt.quantite}</td>
                      <td className="text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{mvt.raison}</td>
                    </tr>
                  );
                })}
                {mouvements.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-400 text-xs">Aucun mouvement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ==================== MODALES ==================== */}

        {/* MODALE AJOUT */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div key="addModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsAddModalOpen(false)}
              />
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Nouvel article
                  </h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <LuX size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modèle *</label>
                    <input type="text" value={formData.modele} onChange={(e) => setFormData({ ...formData, modele: e.target.value })} className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg dark:bg-gray-900 focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Catégorie</label>
                      <input type="text" value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fournisseur</label>
                      <input type="text" value={formData.fournisseur} onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" />
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantité *</label>
                      <input type="number" min="0" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Prix unit. *</label>
                      <div className="flex gap-2">
                        <input type="number" step="0.01" value={formData.prix} onChange={(e) => setFormData({ ...formData, prix: e.target.value })} className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-900" required />
                        <select value={formData.devise} onChange={(e) => setFormData({ ...formData, devise: e.target.value as Devise })} className="px-3 py-2 border rounded-xl dark:bg-gray-900">
                          <option value="USD">USD</option>
                          <option value="CDF">CDF</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Seuil d'alerte</label>
                    <input type="number" min="0" value={formData.seuil} onChange={(e) => setFormData({ ...formData, seuil: e.target.value })} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md">
                      <LuSave size={16} /> Ajouter
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE ÉDITION */}
        <AnimatePresence>
          {isEditModalOpen && selectedItem && (
            <div key="editModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Modifier l'article</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><LuX size={20} className="sm:w-6 sm:h-6" /></button>
                </div>
                <form onSubmit={handleEdit} className="space-y-3 sm:space-y-4">
                  <div><label className="block text-xs sm:text-sm font-medium mb-1">Modèle *</label><input type="text" value={formData.modele} onChange={(e) => setFormData({...formData, modele: e.target.value})} className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg dark:bg-gray-900" required /></div>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div><label>Catégorie</label><input type="text" value={formData.categorie} onChange={(e) => setFormData({...formData, categorie: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" /></div>
                    <div><label>Fournisseur</label><input type="text" value={formData.fournisseur} onChange={(e) => setFormData({...formData, fournisseur: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" /></div>
                  </div>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label>Quantité *</label><input type="number" min="0" value={formData.quantite} onChange={(e) => setFormData({...formData, quantite: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" required /></div>
                    <div><label>Prix unit. *</label><div className="flex gap-2"><input type="number" step="0.01" value={formData.prix} onChange={(e) => setFormData({...formData, prix: e.target.value})} className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-900" required /><select value={formData.devise} onChange={(e) => setFormData({...formData, devise: e.target.value as Devise})} className="px-3 py-2 border rounded-xl dark:bg-gray-900"><option value="USD">USD</option><option value="CDF">CDF</option></select></div></div>
                  </div>
                  <div><label>Seuil d'alerte</label><input type="number" min="0" value={formData.seuil} onChange={(e) => setFormData({...formData, seuil: e.target.value})} className="w-full px-4 py-2 border rounded-xl dark:bg-gray-900" /></div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-gray-100">Annuler</button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold flex items-center gap-2"><LuSave size={16} /> Enregistrer</motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE MOUVEMENT */}
        <AnimatePresence>
          {isMovementModalOpen && selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMovementModalOpen(false)} />
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{movementType === "entree" ? "Ajout au stock" : "Sortie de stock"}</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">Article : <strong>{selectedItem.modele}</strong> (stock actuel : {selectedItem.quantite} pcs)</p>
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1">Quantité</label>
                  <input type="number" min="1" value={movementQuantity} onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)} className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg dark:bg-gray-900" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium mb-1">Raison *</label>
                  <input type="text" value={movementRaison} onChange={(e) => setMovementRaison(e.target.value)} placeholder="Ex: Vente, Réapprovisionnement, Casse..." className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg dark:bg-gray-900" required />
                </div>
                <div className="flex justify-end gap-2 sm:gap-3">
                  <button onClick={() => setIsMovementModalOpen(false)} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleMovement} className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white rounded-lg font-semibold flex items-center gap-1 sm:gap-2 ${movementType === "entree" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                    {movementType === "entree" ? <LuCirclePlus size={14} className="sm:w-4 sm:h-4" /> : <LuCircleMinus size={14} className="sm:w-4 sm:h-4" />} Confirmer
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE VISUALISATION */}
        <AnimatePresence>
          {isViewModalOpen && selectedItem && (
            <div key="viewModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl sm:text-2xl font-bold">Détails article</h2><button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><LuX size={20} className="sm:w-6 sm:h-6" /></button></div>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Modèle :</span><span className="break-words max-w-[60%] text-right">{selectedItem.modele}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Catégorie :</span><span>{selectedItem.categorie || "-"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Fournisseur :</span><span>{selectedItem.fournisseur || "-"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Quantité :</span><span>{selectedItem.quantite} pcs</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Prix unitaire :</span><span>{selectedItem.devise === "USD" ? "$" : "FC"} {selectedItem.prix.toLocaleString()}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="font-medium">Seuil d'alerte :</span><span>{selectedItem.seuil} pcs</span></div>
                  <div className="flex justify-between"><span className="font-medium">Statut :</span><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatutColor(selectedItem.statut)}`}>{selectedItem.statut}</span></div>
                </div>
                <div className="mt-4 sm:mt-6 flex justify-end"><button onClick={() => setIsViewModalOpen(false)} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300 dark:hover:bg-gray-600">Fermer</button></div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE SUPPRESSION */}
        <AnimatePresence>
          {isDeleteModalOpen && selectedItem && (
            <div key="deleteModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Confirmer la suppression</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6">Supprimer définitivement <strong>{selectedItem.modele}</strong> ? Cette action est irréversible.</p>
                <div className="flex justify-end gap-2 sm:gap-3">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleDelete} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-2"><LuTrash2 size={14} className="sm:w-4 sm:h-4" /> Supprimer</motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}