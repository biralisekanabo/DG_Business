"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuBookOpen,
  LuPlus,
  LuCheck,
  LuEye,
  LuPencil,
  LuTrash2,
  LuX,
  LuSave,
  LuCircleAlert,
  LuEllipsisVertical,
} from "react-icons/lu";

type Devise = "USD" | "CDF";

type Dette = {
  id: number;
  client: string;
  montant: number;
  devise: Devise;
  date: string;        // date d'octroi
  echeance: string;
  statut: "En attente" | "Réglée";
};

type Notification = {
  type: "success" | "error";
  message: string;
};

function getBadgeClass(statut: string) {
  switch (statut) {
    case "En attente":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    case "Réglée":
      return "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
    default:
      return "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800";
  }
}

function formatMontant(montant: number, devise: Devise) {
  return `${montant.toLocaleString()} ${devise === "USD" ? "$" : "FC"}`;
}

// ✅ Correction : formater la date pour ne garder que YYYY-MM-DD
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Supprime la partie heure (ex: "2026-05-31T00:00:00.000Z" → "2026-05-31")
  return dateStr.split("T")[0];
}

export default function DettesPage() {
  const [dettesItems, setDettesItems] = useState<Dette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDette, setSelectedDette] = useState<Dette | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    montant: "",
    devise: "CDF" as Devise,
    echeance: "",
  });

  useEffect(() => {
    async function fetchDettes() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Non authentifié");
          return;
        }
        const res = await fetch("/api/dettes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des dettes");
        const data = await res.json();
        setDettesItems(data);
      } catch (err: any) {
        setError(err.message);
        showNotification("error", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDettes();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({ client: "", montant: "", devise: "CDF", echeance: "" });
    setIsEditing(false);
    setSelectedDette(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenViewModal = (dette: Dette) => {
    setSelectedDette(dette);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (dette: Dette) => {
    setSelectedDette(dette);
    setFormData({
      client: dette.client,
      montant: dette.montant.toString(),
      devise: dette.devise,
      echeance: dette.echeance,
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (dette: Dette) => {
    setSelectedDette(dette);
    setIsDeleteModalOpen(true);
  };

  const handleOpenSettleModal = (dette: Dette) => {
    setSelectedDette(dette);
    setIsSettleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      client: formData.client,
      montant: parseFloat(formData.montant),
      devise: formData.devise,
      echeance: formData.echeance,
      statut: isEditing && selectedDette ? selectedDette.statut : "En attente",
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("error", "Non authentifié");
        return;
      }

      let url = "/api/dettes";
      let method = "POST";
      if (isEditing && selectedDette) {
        url = `/api/dettes/${selectedDette.id}`;
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

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");

      const savedDette = await res.json();

      if (isEditing && selectedDette) {
        setDettesItems((prev) =>
          prev.map((d) => (d.id === selectedDette.id ? savedDette : d))
        );
        showNotification("success", "Dette modifiée avec succès");
      } else {
        setDettesItems((prev) => [savedDette, ...prev]);
        showNotification("success", "Dette ajoutée avec succès");
      }

      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleSettle = async () => {
    if (!selectedDette) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("error", "Non authentifié");
        return;
      }

      const res = await fetch(`/api/dettes/${selectedDette.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...selectedDette, statut: "Réglée" }),
      });
      if (!res.ok) throw new Error("Erreur lors du règlement");
      const updated = await res.json();
      setDettesItems((prev) =>
        prev.map((d) => (d.id === selectedDette.id ? updated : d))
      );
      showNotification("success", "Dette marquée comme réglée");
      setIsSettleModalOpen(false);
      setSelectedDette(null);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedDette) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("error", "Non authentifié");
        return;
      }

      const res = await fetch(`/api/dettes/${selectedDette.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setDettesItems((prev) => prev.filter((d) => d.id !== selectedDette.id));
      showNotification("success", "Dette supprimée avec succès");
      setIsDeleteModalOpen(false);
      setSelectedDette(null);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

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
    <div className="flex flex-col gap-3 w-full max-w-screen-lg box-border px-3 md:px-4 py-4 pb-8 md:pb-8 overflow-y-auto md:max-h-[calc(100vh-100px)]">
      <AnimatePresence>
        {notification && (
          <motion.div
            key="notification"
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

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LuBookOpen className="text-amber-500 dark:text-amber-400 text-2xl md:text-3xl" />
            Gestion des Dettes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Suivez les crédits en USD ou CDF. La date d'octroi est automatique.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-medium px-2 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-xs shadow-sm"
        >
          <LuPlus size={18} />
          Nouvelle dette
        </motion.button>
      </header>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full"
              />
              <p className="mt-2">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Client</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Montant</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 hidden md:table-cell">Date d'octroi</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 hidden md:table-cell">Échéance</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2">Statut</th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dettesItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                      Aucune dette trouvée.
                    </td>
                  </tr>
                ) : (
                  dettesItems.map((dette, idx) => (
                    <motion.tr
                      key={dette.id}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={tableRowVariants}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 break-words max-w-[120px] sm:max-w-none">
                        {dette.client}
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                        {formatMontant(dette.montant, dette.devise)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs md:text-sm">
                        {formatDate(dette.date)}  {/* ✅ formatée */}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs md:text-sm">
                        {formatDate(dette.echeance)}  {/* ✅ formatée */}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getBadgeClass(dette.statut)}`}>
                          {dette.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap relative">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === dette.id ? null : dette.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <LuEllipsisVertical size={16} className="text-gray-600" />
                          </button>
                          {openDropdownId === dette.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 rounded-lg shadow-lg z-50 w-36 sm:w-40 py-1"
                            >
                              <button
                                onClick={() => { handleOpenViewModal(dette); setOpenDropdownId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <LuEye size={14} /> Voir
                              </button>
                              <button
                                onClick={() => { handleOpenEditModal(dette); setOpenDropdownId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <LuPencil size={14} /> Modifier
                              </button>
                              {dette.statut === "En attente" && (
                                <button
                                  onClick={() => { handleOpenSettleModal(dette); setOpenDropdownId(null); }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-green-600 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <LuCheck size={14} /> Régler
                                </button>
                              )}
                              <div className="border-t border-gray-200 my-1" />
                              <button
                                onClick={() => { handleOpenDeleteModal(dette); setOpenDropdownId(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-100 flex items-center gap-2"
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

      {/* MODALE AJOUT / ÉDITION */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div key="addModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-md p-6 z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditing ? "Modifier" : "Nouvelle dette"}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                  <LuX size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-900"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Devise</label>
                    <select
                      value={formData.devise}
                      onChange={(e) => setFormData({ ...formData, devise: e.target.value as Devise })}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-900"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CDF">CDF (FC)</option>
                    </select>
                  </div>
                </div>

                {isEditing && selectedDette && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg text-sm">
                    <span className="text-zinc-500">Date d'octroi : </span>
                    <span className="font-medium">{formatDate(selectedDette.date)}</span>  {/* ✅ formatée */}
                    <p className="text-xs text-zinc-400 mt-1">Non modifiable</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Échéance</label>
                  <input
                    type="date"
                    value={formData.echeance}
                    onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-900"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm hover:bg-zinc-100 rounded-lg">
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2 text-sm">
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
        {isViewModalOpen && selectedDette && (
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
              className="relative bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Détail de la dette</h2>
                <button onClick={() => setIsViewModalOpen(false)}><LuX size={20} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Client :</span>
                  <span>{selectedDette.client}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Montant :</span>
                  <span className="font-bold">{formatMontant(selectedDette.montant, selectedDette.devise)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Date d'octroi :</span>
                  <span>{formatDate(selectedDette.date)}</span>  {/* ✅ formatée */}
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Échéance :</span>
                  <span>{formatDate(selectedDette.echeance)}</span>  {/* ✅ formatée */}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Statut :</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getBadgeClass(selectedDette.statut)}`}>
                    {selectedDette.statut}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-zinc-200 rounded-lg">Fermer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE RÈGLEMENT */}
      <AnimatePresence>
        {isSettleModalOpen && selectedDette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/50" onClick={() => setIsSettleModalOpen(false)} />
            <motion.div variants={modalVariants} className="relative bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Marquer comme réglée</h2>
              <p className="mb-6">Confirmer le règlement de la dette de <strong>{selectedDette.client}</strong> (montant : {formatMontant(selectedDette.montant, selectedDette.devise)}) ?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsSettleModalOpen(false)} className="px-4 py-2 text-sm hover:bg-zinc-100 rounded-lg">Annuler</button>
                <button onClick={handleSettle} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"><LuCheck size={16} /> Confirmer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE SUPPRESSION */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedDette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)} />
            <motion.div variants={modalVariants} className="relative bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
              <p className="mb-6">Supprimer la dette de <strong>{selectedDette.client}</strong> ({formatMontant(selectedDette.montant, selectedDette.devise)}) ? Irréversible.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm hover:bg-zinc-100 rounded-lg">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"><LuTrash2 size={16} /> Supprimer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}