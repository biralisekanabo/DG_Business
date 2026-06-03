"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuFileText,
  LuPrinter,
  LuEye,
  LuSearch,
  LuFilter,
  LuPlus,
  LuX,
  LuCheck,
  LuCircleAlert,
  LuTrash2,
  LuEllipsisVertical,
} from "react-icons/lu";

type Rapport = {
  id: number;
  titre: string;
  type: string;
  date: string;
  taille: string;
  contenu?: string;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

export default function RapportsPage() {
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    type: "Financier",
    date: new Date().toISOString().split("T")[0],
    taille: "0.5 Mo",
    contenu: "",
  });

  const typesDisponibles = ["Tous", "Financier", "Ventes", "Stocks", "Clients", "global"];

  useEffect(() => {
    async function fetchRapports() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Non authentifié");
          return;
        }
        const res = await fetch("/api/rapports", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des rapports");
        const data = await res.json();
        setRapports(data);
      } catch (err: any) {
        setError(err.message);
        showNotification("error", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRapports();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredRapports = rapports.filter((r) => {
    const matchSearch = r.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "Tous" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalRapports = rapports.length;
  const totalTaille = rapports.reduce((acc, r) => {
    const size = parseFloat(r.taille);
    return acc + (isNaN(size) ? 0 : size);
  }, 0);
  const typesCount = rapports.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Impression PDF professionnelle
  const handlePrint = (rapport: Rapport) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showNotification("error", "Veuillez autoriser les popups pour l'impression");
      return;
    }

    const currentDate = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const companyName = "Entreprise X";
    const metricsData = [
      { label: "Chiffre d'affaires", value: "245 000 €", objectif: "250 000 €" },
      { label: "Marge brute", value: "42 %", objectif: "40 %" },
      { label: "Satisfaction client", value: "4.6/5", objectif: "4.5/5" },
      { label: "Taux de conversion", value: "3.2 %", objectif: "3.0 %" },
    ];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${rapport.titre}</title>
          <meta charset="utf-8" />
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Inter','Segoe UI',system-ui; background:white; font-size:11pt; line-height:1.5; color:#1e293b; }
            .print-wrapper { max-width:1100px; margin:2rem auto; background:white; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); border-radius:1rem; overflow:hidden; }
            .report-content { padding:2rem; }
            @media print {
              body { margin:0; padding:0; }
              .print-wrapper { margin:0; box-shadow:none; border-radius:0; }
              .report-content { padding:0.75cm; }
              header { position:fixed; top:0; left:0; right:0; background:white; border-bottom:1px solid #cbd5e1; padding:0.5cm 0.75cm; font-size:9pt; }
              footer { position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid #cbd5e1; padding:0.3cm 0.75cm; font-size:8pt; text-align:center; }
              body { margin-top:2.2cm; margin-bottom:2cm; }
            }
            h1 { font-size:24pt; font-weight:800; margin-bottom:0.25rem; }
            .subtitle { color:#475569; border-bottom:2px solid #e2e8f0; padding-bottom:0.75rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; flex-wrap:wrap; }
            h2 { font-size:16pt; font-weight:600; margin:1.5rem 0 0.75rem; }
            table { width:100%; border-collapse:collapse; margin:1rem 0; }
            th,td { border:1px solid #cbd5e1; padding:0.5rem 0.75rem; text-align:left; }
            th { background:#f8fafc; font-weight:600; }
            .signature-area { margin-top:2rem; display:flex; justify-content:space-between; border-top:1px dashed #94a3b8; padding-top:1.5rem; }
            .footer-note { font-size:8pt; color:#64748b; text-align:center; margin-top:1.5rem; }
            .badge { background:#f1f5f9; border-radius:9999px; padding:0.2rem 0.6rem; font-size:9pt; display:inline-block; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <header><div style="display:flex; justify-content:space-between;"><span><strong>${companyName}</strong> – Rapport ${rapport.type}</span><span>Généré le ${currentDate}</span></div></header>
            <div class="report-content">
              <h1>${rapport.titre}</h1>
              <div class="subtitle"><span>Type : <span class="badge">${rapport.type}</span></span><span>Date : ${rapport.date}</span><span>Réf : R-${rapport.id}</span></div>
              <h2>📊 Résumé exécutif</h2>
              <p>${rapport.contenu || "Ce rapport présente une analyse détaillée des performances. Les indicateurs clés sont en ligne avec les objectifs stratégiques."}</p>
              <h2>📈 Indicateurs de performance</h2>
              <thead><tr><th>Indicateur</th><th>Valeur</th><th>Objectif</th><th>Écart</th></tr></thead>
              <tbody>${metricsData.map(m => `<tr><td>${m.label}</td><td>${m.value}</td><td>${m.objectif}</td><td>${(parseFloat(m.value) - parseFloat(m.objectif)).toFixed(1)}</td></tr>`).join("")}</tbody>
              </table>
              <div class="signature-area"><div>Approuvé par : _________________<br/><span style="font-size:8pt;">Direction</span></div><div>Date : ${new Date().toLocaleDateString()}</div></div>
              <div class="footer-note">Document confidentiel – ${companyName}</div>
            </div>
            <footer>Page 1 / 1</footer>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 800); }, 300); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddRapport = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRapport = {
      titre: formData.titre,
      type: formData.type,
      date: formData.date,
      taille: formData.taille,
      contenu: formData.contenu,
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRapport),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      const saved = await res.json();
      setRapports((prev) => [saved, ...prev]);
      showNotification("success", "Rapport ajouté avec succès");
      setIsAddModalOpen(false);
      setFormData({
        titre: "",
        type: "Financier",
        date: new Date().toISOString().split("T")[0],
        taille: "0.5 Mo",
        contenu: "",
      });
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Génération du rapport global (appel API)
  const generateGlobalReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur lors de la génération");
      }
      const data = await response.json();
      showNotification("success", "Rapport global généré avec succès");

      const newRapport: Rapport = {
        id: Date.now(),
        titre: `Rapport global - ${new Date().toLocaleDateString("fr-FR")}`,
        type: "global",
        date: new Date().toISOString(),
        taille: "1.2 Mo",
        contenu: `Total ventes : ${data.statistics.totalVentes} € | Transactions : ${data.statistics.nbTransactions}`,
      };
      setRapports([newRapport, ...rapports]);

      if (data.url) window.open(data.url, "_blank");
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Erreur lors de la génération");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("error", "Non authentifié");
        return;
      }
      const res = await fetch(`/api/rapports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setRapports((prev) => prev.filter((r) => r.id !== id));
      showNotification("success", "Rapport supprimé");
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-md shadow-sm text-white text-xs max-w-[280px] ${
              notification.type === "success" ? "bg-green-600/95" : "bg-red-600/95"
            }`}
          >
            {notification.type === "success" ? <LuCheck size={14} /> : <LuCircleAlert size={14} />}
            <span className="truncate text-xs">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Rapports & Analyses
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Consultez, imprimez et gérez vos rapports.
            </p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateGlobalReport}
              disabled={isGeneratingReport}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm text-xs disabled:opacity-50"
            >
              {isGeneratingReport ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LuCheck size={18} />
              )}
              Générer rapport global
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm text-xs"
            >
              <LuPlus size={18} /> Nouveau rapport
            </motion.button>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">Total rapports</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{totalRapports}</div>
          </div>
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">Taille cumulée</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTaille.toFixed(1)} Mo</div>
          </div>
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">Types distincts</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{Object.keys(typesCount).length}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="relative flex-1">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <LuFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm appearance-none"
            >
              {typesDisponibles.map((type) => (
                <option key={type} value={type}>
                  {type === "global" ? "Global" : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-400 animate-pulse font-medium">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
              />
              <p className="mt-2">Chargement des rapports...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 font-medium">{error}</div>
          ) : filteredRapports.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 italic">Aucun rapport ne correspond aux critères.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Titre</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Taille</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 text-xs md:text-sm">
                {filteredRapports.map((rapport, idx) => (
                  <motion.tr
                    key={rapport.id}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={tableRowVariants}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-3">
                        <LuFileText className="text-zinc-400" size={18} />
                        <span className="break-words max-w-[120px] sm:max-w-[200px]">{rapport.titre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700 font-semibold border">
                        {rapport.type === "global" ? "Global" : rapport.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">{rapport.date}</td>
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap hidden sm:table-cell">{rapport.taille}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === rapport.id ? null : rapport.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                      >
                        <LuEllipsisVertical size={16} />
                      </button>
                      {openDropdownId === rapport.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 w-36 py-1"
                        >
                          <button
                            onClick={() => {
                              setSelectedRapport(rapport);
                              setIsViewModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-blue-600 flex items-center gap-2 hover:bg-gray-100"
                          >
                            <LuEye size={14} /> Voir
                          </button>
                          <button
                            onClick={() => {
                              handlePrint(rapport);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-emerald-600 flex items-center gap-2 hover:bg-gray-100"
                          >
                            <LuPrinter size={14} /> Imprimer PDF
                          </button>
                          <div className="border-t my-1" />
                          <button
                            onClick={() => {
                              handleDelete(rapport.id);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-red-600 flex items-center gap-2 hover:bg-gray-100"
                          >
                            <LuTrash2 size={14} /> Supprimer
                          </button>
                        </motion.div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modale visualisation */}
      <AnimatePresence>
        {isViewModalOpen && selectedRapport && (
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
              className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedRapport.titre}</h2>
                <button onClick={() => setIsViewModalOpen(false)}><LuX size={20} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="font-medium">Type :</span><span>{selectedRapport.type}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="font-medium">Date :</span><span>{selectedRapport.date}</span></div>
                <div><span className="font-medium block mb-1">Contenu :</span><p className="bg-zinc-50 p-3 rounded-lg">{selectedRapport.contenu || "Aucune description."}</p></div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-zinc-200 rounded-lg">Fermer</button>
                <button onClick={() => { setIsViewModalOpen(false); handlePrint(selectedRapport); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2"><LuPrinter size={16} /> Imprimer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modale ajout */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div variants={modalVariants} className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Nouveau rapport</h2><button onClick={() => setIsAddModalOpen(false)}><LuX size={20} /></button></div>
              <form onSubmit={handleAddRapport} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Titre *</label><input type="text" value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-900" required /></div>
                <div><label className="block text-sm font-medium mb-1">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">{typesDisponibles.filter(t => t !== "Tous").map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Taille (Mo)</label><input type="text" value={formData.taille} onChange={(e) => setFormData({ ...formData, taille: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows={3} value={formData.contenu} onChange={(e) => setFormData({ ...formData, contenu: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm rounded-lg hover:bg-zinc-100">Annuler</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2"><LuCheck size={16} /> Créer</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}