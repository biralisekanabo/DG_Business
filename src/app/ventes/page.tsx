"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCircleDollarSign,
  LuPlus,
  LuEye,
  LuPencil,
  LuTrash2,
  LuX,
  LuSave,
  LuCheck,
  LuCircleAlert,
  LuSearch,
  LuTrendingUp,
  LuDownload,
  LuUsers,
  LuAward,
  LuChartBar,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuDollarSign,
  LuCoins,
  LuEllipsisVertical,
} from "react-icons/lu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import SignatureBlock from "@/components/Signature/SignatureBlock";

type Vente = {
  id: number;
  date: string;
  clientname: string;
  montant: number; // always stored in USD
};

type Produit = {
  id: number;
  modele: string;
  quantite: number;
  prix: number;
  categorie: string;
  fournisseur: string;
  devise: string;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

type Periode = "aujourdhui" | "semaine" | "mois" | "annee";

const EXCHANGE_RATE = 2350;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 20, stiffness: 300 },
  },
  exit: { scale: 0.9, opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hover: { scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" },
  tap: { scale: 0.98 },
};

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [periode, setPeriode] = useState<Periode>("mois");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [lastAddedVente, setLastAddedVente] = useState<Vente | null>(null);

  // Signature for receipts
  const [showSignatureForReceipt, setShowSignatureForReceipt] = useState(false);
  const [signatureVenteId, setSignatureVenteId] = useState<number | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Formulaire (ajout avec produit du stock)
  const [formData, setFormData] = useState({
    client: "",
    produitId: "",
    quantite: "1",
    amount: "",
    currency: "USD",
  });

  // Liste des produits disponibles (quantité > 0)
  const produitsEnStock = useMemo(() => {
    return produits.filter(p => p.quantite > 0);
  }, [produits]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const fetchVentes = async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ventes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des ventes");
      const data = await res.json();
      const sorted = data.sort((a: Vente, b: Vente) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setVentes(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/produits", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des produits");
      const data = await res.json();
      setProduits(data);
    } catch (err) {
      console.error("Erreur produits:", err);
      showNotification("error", "Impossible de charger le stock.");
    }
  };

  useEffect(() => {
    fetchVentes();
    fetchProduits();
  }, []);

  // Filtrage
  const filteredVentes = useMemo(() => {
    const today = new Date();
    let startDate: Date | null = null;
    switch (periode) {
      case "aujourdhui":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case "semaine":
        startDate = subDays(today, 7);
        break;
      case "mois":
        startDate = subMonths(today, 1);
        break;
      case "annee":
        startDate = subYears(today, 1);
        break;
    }
    return ventes.filter((vente) => {
      const matchSearch = (vente.clientname || "").toLowerCase().includes(searchTerm.toLowerCase());
      const venteDate = parseISO(vente.date);
      const matchDate = startDate ? venteDate >= startDate : true;
      return matchSearch && matchDate;
    });
  }, [ventes, searchTerm, periode]);

  // Pagination
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const paginatedVentes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVentes.slice(start, start + itemsPerPage);
  }, [filteredVentes, currentPage]);

  // Statistiques globales
  const montantTotal = filteredVentes.reduce((sum, v) => sum + (Number(v.montant) || 0), 0);
  const moyenneVente = filteredVentes.length > 0 ? montantTotal / filteredVentes.length : 0;
  const nbTransactions = filteredVentes.length;

  // Top 5 clients
  const topClients = useMemo(() => {
    const clientMap = new Map<string, number>();
    filteredVentes.forEach((v) => {
      clientMap.set(v.clientname, (clientMap.get(v.clientname) || 0) + Number(v.montant));
    });
    return Array.from(clientMap.entries())
      .map(([client, total]) => ({ client, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredVentes]);

  // Données graphique
  const chartData = useMemo(() => {
    const salesByDate = new Map<string, number>();
    filteredVentes.forEach((v) => {
      const date = v.date;
      salesByDate.set(date, (salesByDate.get(date) || 0) + v.montant);
    });
    return Array.from(salesByDate.entries())
      .map(([date, montant]) => ({ date: format(parseISO(date), "dd/MM"), montant, rawDate: date }))
      .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
  }, [filteredVentes]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Export CSV
  const exportCSV = () => {
    const headers = ["Date", "Client", "Montant (USD)"];
    const rows = filteredVentes.map((v) => [v.date, v.clientname, v.montant]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `ventes_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("success", "Export CSV effectué");
  };

  const generateReceiptWithSignature = async (signatureData: string) => {
    if (!signatureVenteId) return;

    setIsGeneratingReceipt(true);
    try {
      const token = getAuthToken();
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          venteId: signatureVenteId,
          signature: {
            signataire: localStorage.getItem('userName') || 'Utilisateur',
            date: new Date(),
            hash: signatureData,
          },
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la génération du reçu');

      const data = await response.json();
      showNotification('success', 'Reçu généré et signé avec succès');

      if (data.url) {
        window.open(data.url, '_blank');
      }

      setShowSignatureForReceipt(false);
      setSignatureVenteId(null);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors de la génération du reçu');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPeriode("mois");
    setCurrentPage(1);
  };

  const convertToUSD = (amount: number, currency: string): number => {
    if (currency === "CDF") {
      return amount / EXCHANGE_RATE;
    }
    return amount;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }

    if (!formData.produitId) {
      showNotification("error", "Veuillez sélectionner un produit");
      return;
    }

    const produit = produits.find((p) => p.id.toString() === formData.produitId);
    if (!produit) {
      showNotification("error", "Produit non trouvé");
      return;
    }

    const quantite = parseInt(formData.quantite);
    if (isNaN(quantite) || quantite <= 0) {
      showNotification("error", "Quantité invalide");
      return;
    }

    if (quantite > produit.quantite) {
      showNotification("error", `Stock insuffisant. Disponible: ${produit.quantite}`);
      return;
    }

    const montantTotal = produit.prix * quantite;
    const today = new Date().toISOString();

    try {
      const res = await fetch("/api/ventes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: today,
          client: formData.client,
          montant: montantTotal,
          produitId: produit.id,
          quantite: quantite,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const newVente = await res.json();
      setVentes((prev) => [newVente, ...prev]);
      setLastAddedVente(newVente);
      setAddSuccess(true);
      showNotification("success", `Vente ajoutée: ${produit.modele} x${quantite} = ${montantTotal.toFixed(2)} USD`);
      // Garder la modal ouverte avec message de succès
      resetForm();
      fetchProduits();
      // Auto-close après 3 secondes
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddModalOpen(false);
      }, 3000);
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Échec de l'ajout");
    }
  };

  const openEditModal = (vente: Vente) => {
    setSelectedVente(vente);
    setFormData({
      client: vente.clientname,
      produitId: "",
      quantite: "1",
      amount: vente.montant.toString(),
      currency: "USD",
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVente) return;
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    const montantNum = parseFloat(formData.amount);
    if (isNaN(montantNum) || montantNum <= 0) {
      showNotification("error", "Montant invalide");
      return;
    }
    try {
      const res = await fetch(`/api/ventes/${selectedVente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedVente.date,
          client: formData.client,
          montant: montantNum,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la modification");
      const updatedVente = await res.json();
      setVentes((prev) =>
        prev.map((v) => (v.id === selectedVente.id ? updatedVente : v)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      showNotification("success", "Vente modifiée avec succès");
      setIsEditModalOpen(false);
      resetForm();
      setSelectedVente(null);
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Échec de la modification");
    }
  };

  const handleDelete = async () => {
    if (!selectedVente) return;
    const token = getAuthToken();
    if (!token) {
      showNotification("error", "Non authentifié");
      return;
    }
    try {
      const res = await fetch(`/api/ventes/${selectedVente.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setVentes((prev) => prev.filter((v) => v.id !== selectedVente.id));
      showNotification("success", "Vente supprimée avec succès");
      setIsDeleteModalOpen(false);
      setSelectedVente(null);
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Échec de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      client: "",
      produitId: "",
      quantite: "1",
      amount: "",
      currency: "USD",
    });
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  };

  const convertedPreview = useMemo(() => {
    const raw = parseFloat(formData.amount);
    if (isNaN(raw) || raw <= 0) return null;
    if (formData.currency === "CDF") {
      const usd = raw / EXCHANGE_RATE;
      return `${raw.toLocaleString()} CDF → ${usd.toFixed(2)} USD (taux ${EXCHANGE_RATE})`;
    }
    return `${raw.toLocaleString()} USD`;
  }, [formData.amount, formData.currency]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <div className="w-full max-w-screen-lg box-border px-3 md:px-4 py-4 pb-8 md:pb-8 overflow-y-auto md:max-h-[calc(100vh-100px)]">
        {/* Notification Toast améliorée */}
        <AnimatePresence>
          {notification && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${
                notification.type === "success"
                  ? "bg-green-500/90 border-green-400 text-white"
                  : "bg-red-500/90 border-red-400 text-white"
              }`}
            >
              {notification.type === "success" ? (
                <LuCheck className="w-5 h-5" />
              ) : (
                <LuCircleAlert className="w-5 h-5" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - inchangé */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Ventes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos transactions et analysez vos performances (USD)
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <motion.button
              whileHover={cardVariants.hover}
              whileTap={cardVariants.tap}
              onClick={exportCSV}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium shadow-sm hover:shadow"
            >
              <LuDownload size={14} /> Exporter CSV
            </motion.button>
            <motion.button
              whileHover={cardVariants.hover}
              whileTap={cardVariants.tap}
              onClick={() => setShowSignatureForReceipt(true)}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 font-medium shadow-sm hover:shadow"
            >
              <LuCheck size={14} /> Générer Reçu Signé
            </motion.button>
            <motion.button
              whileHover={cardVariants.hover}
              whileTap={cardVariants.tap}
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold shadow-md"
            >
              <LuPlus size={14} /> Nouvelle vente
            </motion.button>
          </div>
        </motion.div>

        {/* KPIs - inchangé */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          <motion.div variants={fadeInUp} whileHover="hover" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">${montantTotal.toFixed(2)}</p>
              </div>
              <LuCircleDollarSign className="text-emerald-500 text-3xl" />
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover="hover" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{nbTransactions}</p>
              </div>
              <LuTrendingUp className="text-blue-500 text-3xl" />
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover="hover" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Panier moyen</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">${moyenneVente.toFixed(2)}</p>
              </div>
              <LuChartBar className="text-purple-500 text-3xl" />
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} whileHover="hover" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Top client</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                  {topClients[0]?.client || "-"}
                </p>
              </div>
              <LuAward className="text-yellow-500 text-3xl shrink-0 ml-2" />
            </div>
          </motion.div>
        </motion.div>

        {/* Graphiques et Top clients - inchangé */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Évolution des ventes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => `$${value}`} />
                <Line type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top 5 clients</h3>
            <div className="space-y-3">
              {topClients.map((client, idx) => (
                <div key={client.client} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-500 shrink-0">{idx+1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{client.client}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap ml-2">${Number(client.total).toFixed(2)}</span>
                </div>
              ))}
              {topClients.length === 0 && <p className="text-sm text-gray-400 text-center">Aucune vente</p>}
            </div>
          </div>
        </div>

        {/* Filtres et tableau - inchangé */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-900 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm"
                />
              </div>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value as Periode)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm"
              >
                <option value="aujourdhui">Aujourd'hui</option>
                <option value="semaine">7 derniers jours</option>
                <option value="mois">30 derniers jours</option>
                <option value="annee">12 derniers mois</option>
              </select>
              <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-emerald-600 transition">
                <LuRefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVentes.map((vente) => (
                  <tr key={vente.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(vente.date)}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-white truncate max-w-[150px] sm:max-w-[250px]">{vente.clientname}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${Number(vente.montant).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap relative">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === vente.id ? null : vente.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <LuEllipsisVertical size={16} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        {openDropdownId === vente.id && (
                          <motion.div
                            key={`dropdown-${vente.id}`}
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-32 py-1"
                          >
                            <button
                              onClick={() => {
                                setSelectedVente(vente);
                                setIsViewModalOpen(true);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <LuEye size={14} /> Voir
                            </button>
                            <button
                              onClick={() => {
                                openEditModal(vente);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <LuPencil size={14} /> Modifier
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            <button
                              onClick={() => {
                                setSelectedVente(vente);
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
                  </tr>
                ))}
                {paginatedVentes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-400">Aucune vente trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                <LuChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                <LuChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* MODALE AJOUT - améliorée (glassmorphisme, responsive) */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                {/* Header */}
                <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Nouvelle vente</h2>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-1">Enregistrez une transaction</p>
                  </div>
                  <button 
                    onClick={() => !addSuccess && setIsAddModalOpen(false)} 
                    className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                  >
                    <LuX size={20} />
                  </button>
                </div>

                {/* Success Message - affiche dans la modal */}
                <AnimatePresence>
                  {addSuccess && lastAddedVente && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800 px-4 sm:px-6 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <LuCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">Vente enregistrée avec succès!</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Client: <span className="font-medium">{lastAddedVente.clientname}</span></p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">Montant: <span className="font-medium">${Number(lastAddedVente.montant).toFixed(2)}</span></p>
                          <button
                            onClick={() => window.open(`/receipts/${lastAddedVente.id}`, '_blank')}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            <LuDownload size={14} /> Générer le reçu
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content */}
                <div className="p-4 sm:p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <form onSubmit={handleAdd} className="space-y-4">
                    {/* Client - Avec historique si client existant */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client *</label>
                      <input
                        type="text"
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        placeholder="Nom du client"
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-900 dark:text-white transition"
                        required
                      />
                      {formData.client && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          {(() => {
                            const clientSales = filteredVentes.filter(v => v.clientname.toLowerCase() === formData.client.toLowerCase());
                            if (clientSales.length === 0) return <p className="text-xs text-gray-500">Nouveau client</p>;
                            const totalClient = clientSales.reduce((sum, v) => sum + Number(v.montant), 0);
                            return (
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                <span className="text-gray-500">Client existant • </span>
                                <span className="font-semibold">{clientSales.length} vente{clientSales.length > 1 ? 's' : ''}</span>
                                <span className="text-gray-500"> • Total: </span>
                                <span className="font-semibold text-emerald-600">${totalClient.toFixed(2)}</span>
                              </p>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Produit */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Produit *</label>
                      <select
                        value={formData.produitId}
                        onChange={(e) => setFormData({ ...formData, produitId: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900 dark:text-white transition"
                        required
                      >
                        <option value="">-- Sélectionner --</option>
                        {produitsEnStock.length === 0 ? (
                          <option value="" disabled>⚠️ Aucun produit en stock</option>
                        ) : (
                          produitsEnStock.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.modele} • {p.quantite} dispo • ${Number(p.prix).toFixed(2)}
                            </option>
                          ))
                        )}
                      </select>
                      {produitsEnStock.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <LuCircleAlert size={14} /> Approvisionner le stock
                        </p>
                      )}
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quantité *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantite}
                        onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                        placeholder="Quantité"
                        className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900 dark:text-white transition"
                        required
                      />
                      {(() => {
                        if (!formData.produitId) return null;
                        const produit = produits.find((p) => p.id.toString() === formData.produitId);
                        if (!produit) return null;
                        const quantite = parseInt(formData.quantite) || 0;
                        if (quantite > produit.quantite) {
                          return (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                              <LuCircleAlert size={14} /> Quantité insuffisante. Max: {produit.quantite}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Résumé du total */}
                    {formData.produitId && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-2 border-emerald-200 dark:border-emerald-800"
                      >
                        {(() => {
                          const produit = produits.find((p) => p.id.toString() === formData.produitId);
                          if (!produit) return null;
                          const quantite = parseInt(formData.quantite) || 1;
                          const total = produit.prix * quantite;
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span>Prix unitaire</span>
                                <span className="font-medium">${Number(produit.prix).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <span>Quantité</span>
                                <span className="font-medium">{quantite}</span>
                              </div>
                              <div className="border-t border-emerald-200 dark:border-emerald-700 pt-2 flex justify-between">
                                <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">Total</span>
                                <span className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">${Number(total).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <LuCheck size={14} className="flex-shrink-0 mt-0.5" />
                      <span>La date du jour sera automatiquement enregistrée</span>
                    </div>

                    {/* Footer - Buttons (INSIDE FORM) */}
                    {!addSuccess && (
                      <div className="border-t border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 mt-4 px-4 sm:px-6 py-3 flex gap-2 sm:gap-3 justify-end bg-gray-50 dark:bg-gray-900/50">
                        <button 
                          type="button"
                          onClick={() => setIsAddModalOpen(false)} 
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium text-gray-700 dark:text-gray-300"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit"
                          disabled={(() => {
                            if (!formData.produitId || !formData.client) return true;
                            const produit = produits.find((p) => p.id.toString() === formData.produitId);
                            if (!produit) return true;
                            const quantite = parseInt(formData.quantite) || 0;
                            if (quantite <= 0 || quantite > produit.quantite) return true;
                            return false;
                          })()}
                          className="px-4 sm:px-5 py-2 text-xs sm:text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition shadow-md"
                        >
                          <LuSave size={16} /> Enregistrer
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE VISUALISATION - améliorée */}
        <AnimatePresence>
          {isViewModalOpen && selectedVente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsViewModalOpen(false)}
              />
              <motion.div
                variants={modalVariants}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-md p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Détail vente</h2>
                  <button onClick={() => setIsViewModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LuX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between"><span className="font-medium">Date :</span> <span>{formatDate(selectedVente.date)}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Client :</span> <span>{selectedVente.clientname}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Montant :</span> <span className="font-bold text-emerald-600">${Number(selectedVente.montant).toFixed(2)} USD</span></div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 transition">Fermer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE ÉDITION - améliorée */}
        <AnimatePresence>
          {isEditModalOpen && selectedVente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsEditModalOpen(false)}
              />
              <motion.div
                variants={modalVariants}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-md p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Modifier la vente</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LuX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-gray-300 hover:bg-gray-100 transition">Annuler</button>
                    <button type="submit" className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-md"><LuSave size={16} /> Enregistrer</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE SUPPRESSION - améliorée */}
        <AnimatePresence>
          {isDeleteModalOpen && selectedVente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsDeleteModalOpen(false)}
              />
              <motion.div
                variants={modalVariants}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-md p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Confirmer suppression</h2>
                  <button onClick={() => setIsDeleteModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LuX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Supprimer la vente de <strong>{selectedVente.clientname}</strong> (${Number(selectedVente.montant).toFixed(2)}) ?
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-gray-300 hover:bg-gray-100 transition">Annuler</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 shadow-md hover:bg-red-700 transition"><LuTrash2 size={16} /> Supprimer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODALE SÉLECTION VENTE POUR SIGNATURE - améliorée */}
        <AnimatePresence>
          {showSignatureForReceipt && !signatureVenteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowSignatureForReceipt(false)}
              />
              <motion.div
                variants={modalVariants}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-md p-5 max-h-[85vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b border-gray-200 dark:border-gray-700 mb-3 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sélectionner une vente</h2>
                  <button onClick={() => setShowSignatureForReceipt(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <LuX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  {ventes.slice(0, 10).map((vente) => (
                    <button
                      key={vente.id}
                      onClick={() => setSignatureVenteId(vente.id)}
                      className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition"
                    >
                      <div className="font-semibold truncate">{vente.clientname}</div>
                      <div className="text-sm text-gray-500">{formatDate(vente.date)} - ${Number(vente.montant).toFixed(2)} USD</div>
                    </button>
                  ))}
                  {ventes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune vente disponible</p>}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Signature Block - inchangé */}
        {showSignatureForReceipt && signatureVenteId && (
          <SignatureBlock title="Signer le Reçu de Vente" description="Veuillez signer pour générer le reçu PDF signé digitalement" onGenerate={generateReceiptWithSignature} isLoading={isGeneratingReceipt} />
        )}
      </div>
    </div>
  );
}