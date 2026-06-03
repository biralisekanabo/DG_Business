"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuTrendingDown,
  LuPlus,
  LuEye,
  LuFileText,
  LuX,
  LuTrash2,
  LuPencil,
  LuSave,
  LuCheck,
  LuCircleAlert,
  LuDollarSign,
  LuCurrency,
  LuFilter,
  LuDownload,
  LuCalendar,
  LuChartBar,
  LuEllipsisVertical,
} from "react-icons/lu";

// Types
type Devise = "USD" | "CDF";

type Depense = {
  id: number;
  date: string;
  motif: string;
  montant: number;
  devise: Devise;
  justificatif?: string | null;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

// Constantes
const tauxCDFUSD = 2850; // Taux fictif, à adapter selon besoin réel

export default function DepensesPage() {
  // États principaux
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [filteredDepenses, setFilteredDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // États des modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filtres
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [filtreDevise, setFiltreDevise] = useState<Devise | "Toutes">("Toutes");

  // Formulaire
  const [formData, setFormData] = useState({
    date: "",
    motif: "",
    montant: "",
    devise: "USD" as Devise,
    justificatif: "",
  });

  // Chargement initial
  useEffect(() => {
    fetchDepenses();
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    let result = [...depenses];
    if (dateDebut) result = result.filter((d) => d.date >= dateDebut);
    if (dateFin) result = result.filter((d) => d.date <= dateFin);
    if (filtreDevise !== "Toutes") result = result.filter((d) => d.devise === filtreDevise);
    setFilteredDepenses(result);
  }, [depenses, dateDebut, dateFin, filtreDevise]);

  const fetchDepenses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");
      const res = await fetch("/api/depenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setDepenses(data);
    } catch (err: any) {
      setError(err.message);
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({ date: "", motif: "", montant: "", devise: "USD", justificatif: "" });
    setIsEditing(false);
    setSelectedDepense(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (depense: Depense) => {
    setSelectedDepense(depense);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (depense: Depense) => {
    setSelectedDepense(depense);
    setFormData({
      date: depense.date,
      motif: depense.motif,
      montant: depense.montant.toString(),
      devise: depense.devise,
      justificatif: depense.justificatif || "",
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (depense: Depense) => {
    setSelectedDepense(depense);
    setIsDeleteModalOpen(true);
  };

  // Soumission (création / modification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: formData.date,
      motif: formData.motif,
      montant: parseFloat(formData.montant),
      devise: formData.devise,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");

      let url = "/api/depenses";
      let method = "POST";
      if (isEditing && selectedDepense) {
        url = `/api/depenses/${selectedDepense.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur d'enregistrement");

      const saved = await res.json();
      if (isEditing && selectedDepense) {
        setDepenses((prev) => prev.map((d) => (d.id === selectedDepense.id ? saved : d)));
        showNotification("success", "Dépense modifiée");
      } else {
        setDepenses((prev) => [saved, ...prev]);
        showNotification("success", "Dépense ajoutée");
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepense) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`/api/depenses/${selectedDepense.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setDepenses((prev) => prev.filter((d) => d.id !== selectedDepense.id));
      showNotification("success", "Dépense supprimée");
      setIsDeleteModalOpen(false);
      setSelectedDepense(null);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const entetes = ["Date", "Motif", "Montant", "Devise"];
    const lignes = filteredDepenses.map((d) => [
      d.date,
      d.motif,
      d.montant.toString(),
      d.devise,
    ]);
    const csvContent = [entetes, ...lignes].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "depenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("success", "Export CSV effectué");
  };

  // Calcul des totaux par devise
  const totalUSD = filteredDepenses
    .filter((d) => d.devise === "USD")
    .reduce((sum, d) => sum + d.montant, 0);
  const totalCDF = filteredDepenses
    .filter((d) => d.devise === "CDF")
    .reduce((sum, d) => sum + d.montant, 0);
  const totalEnCDF = totalUSD * tauxCDFUSD + totalCDF;

  // Animations
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
  };
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };
  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.03, duration: 0.2 },
    }),
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-screen-lg box-border px-3 md:px-4 py-6 pb-8 md:pb-6 overflow-y-auto md:max-h-[calc(100vh-100px)]">
      {/* Toast */}
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
            {notification.type === "success" ? <LuCheck size={14} className="shrink-0" /> : <LuCircleAlert size={14} className="shrink-0" />}
            <span className="font-normal truncate text-xs">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En-tête */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LuTrendingDown className="text-red-600 dark:text-red-400 text-3xl" />
            Gestion des Dépenses
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Suivi des sorties de caisse en USD et CDF, avec justificatifs.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCSV}
            className="px-2 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 text-xs"
          >
            <LuDownload size={14} /> <span className="hidden sm:inline">Export CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAddModal}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-xs shadow-sm"
          >
            <LuPlus size={14} /> <span className="hidden sm:inline">Nouvelle dépense</span>
          </motion.button>
        </div>
      </header>

      {/* Cartes résumé */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total USD</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                ${totalUSD.toLocaleString()}
              </p>
            </div>
            <LuDollarSign className="text-green-600 text-3xl" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total CDF</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalCDF.toLocaleString()} FC
              </p>
            </div>
            <LuCurrency className="text-blue-600 text-3xl" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total équivalent CDF</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalEnCDF.toLocaleString()} FC
              </p>
              <p className="text-xs text-zinc-400">(1 USD = {tauxCDFUSD} FC)</p>
            </div>
            <LuChartBar className="text-purple-600 text-3xl" />
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
            <LuCalendar size={12} /> Date début
          </label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
            <LuCalendar size={12} /> Date fin
          </label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
            <LuFilter size={12} /> Devise
          </label>
          <select
            value={filtreDevise}
            onChange={(e) => setFiltreDevise(e.target.value as Devise | "Toutes")}
            className="w-full px-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm"
          >
            <option value="Toutes">Toutes</option>
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => {
              setDateDebut("");
              setDateFin("");
              setFiltreDevise("Toutes");
            }}
            className="px-4 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 transition"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau des dépenses */}
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"
              />
              <p className="mt-2">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 uppercase">
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Date</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Motif</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Montant</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Devise</th>
                  {/* <th className="px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:table-cell">Justificatif</th> */}
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 sm:px-3 py-4 sm:py-8 text-center text-zinc-400 text-xs">
                      Aucune dépense trouvée
                    </td>
                  </tr>
                ) : (
                  filteredDepenses.map((depense, idx) => (
                    <motion.tr
                      key={depense.id}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={tableRowVariants}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {depense.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 break-words max-w-[200px] md:max-w-none">
                        {depense.motif}
                      </td>
                      <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {depense.devise === "USD" ? "$" : ""}
                        {depense.montant.toLocaleString()}
                        {depense.devise === "CDF" ? " FC" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            depense.devise === "USD"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {depense.devise === "USD" ? <LuDollarSign size={12} /> : <LuCurrency size={12} />}
                          {depense.devise}
                        </span>
                      </td>
                      {/* Suppression justificatif */}
                      <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-center whitespace-nowrap relative">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              setOpenDropdownId(openDropdownId === depense.id ? null : depense.id)
                            }
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <LuEllipsisVertical size={16} className="text-gray-600 dark:text-gray-300" />
                          </button>
                          {openDropdownId === depense.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-36 sm:w-40 py-1"
                            >
                              <button
                                onClick={() => {
                                  handleOpenViewModal(depense);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuEye size={14} /> Voir
                              </button>
                              <button
                                onClick={() => {
                                  handleOpenEditModal(depense);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <LuPencil size={14} /> Modifier
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => {
                                  handleOpenDeleteModal(depense);
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
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODALE AJOUT/ÉDITION */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white dark:bg-zinc-800 rounded-lg sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6 z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditing ? "Modifier" : "Nouvelle dépense"}</h2>
                <button onClick={() => setIsAddModalOpen(false)}>
                  <LuX size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Motif</label>
                  <input
                    type="text"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900"
                    required
                  />
                </div>
                <div className="w-full grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Devise</label>
                    <select
                      value={formData.devise}
                      onChange={(e) => setFormData({ ...formData, devise: e.target.value as Devise })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CDF">CDF (FC)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Justificatif (nom)</label>
                  <input
                    type="text"
                    value={formData.justificatif}
                    onChange={(e) => setFormData({ ...formData, justificatif: e.target.value })}
                    placeholder="facture.pdf"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm"
                  >
                    <LuSave size={16} /> {isEditing ? "Mettre à jour" : "Ajouter"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE VISUALISATION */}
      <AnimatePresence>
        {isViewModalOpen && selectedDepense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsViewModalOpen(false)}
            />
            <motion.div
              variants={modalVariants}
              className="relative bg-white dark:bg-zinc-800 rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Détail de la dépense</h2>
                <button onClick={() => setIsViewModalOpen(false)}>
                  <LuX size={20} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-zinc-500">Date :</span>
                  <span>{selectedDepense.date}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-zinc-500">Motif :</span>
                  <span className="font-semibold break-words max-w-[200px] text-right">
                    {selectedDepense.motif}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-zinc-500">Montant :</span>
                  <span className="font-bold text-red-600">
                    {selectedDepense.devise === "USD" ? "$" : ""}
                    {selectedDepense.montant.toLocaleString()}
                    {selectedDepense.devise === "CDF" ? " FC" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Justificatif :</span>
                  <span className="break-words max-w-[200px] text-right">
                    {selectedDepense.justificatif || "Aucun"}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE SUPPRESSION */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedDepense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              variants={modalVariants}
              className="relative bg-white dark:bg-zinc-800 rounded-xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
              <p>
                Supprimer <strong>{selectedDepense.motif}</strong> (
                {selectedDepense.devise === "USD" ? "$" : ""}
                {selectedDepense.montant.toLocaleString()}
                {selectedDepense.devise === "CDF" ? " FC" : ""}) ?
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
                >
                  <LuTrash2 size={16} /> Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}