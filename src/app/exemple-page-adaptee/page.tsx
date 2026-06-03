"use client";

/**
 * EXEMPLE D'ADAPTATION RESPONSIVE
 * 
 * Cette page montre comment adapter une page existante pour utiliser:
 * - Sidebar responsive (automatique)
 * - FormModal pour les formulaires
 * - DeleteConfirmModal pour les confirmations
 * - Layout responsive
 * 
 * Copiez ce pattern pour adapter les autres pages.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuPlus, LuEye, LuPencil, LuTrash2, LuCheck, LuCircleAlert } from "react-icons/lu";
import FormModal from "@/components/FormModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

// ============================================
// TYPES
// ============================================

type Item = {
  id: number;
  name: string;
  description: string;
  amount: number;
  date: string;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function ExampleAdaptedPage() {
  // ============================================
  // STATE
  // ============================================
  
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Item 1", description: "Description", amount: 100, date: "2026-05-26" },
    { id: 2, name: "Item 2", description: "Description", amount: 200, date: "2026-05-26" },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  // ============================================
  // HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({ name: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    setSelectedItem(null);
    setIsEditing(false);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      amount: item.amount.toString(),
      date: item.date,
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleOpenView = (item: Item) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isEditing && selectedItem) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  name: formData.name,
                  description: formData.description,
                  amount: parseFloat(formData.amount),
                  date: formData.date,
                }
              : item
          )
        );
        showNotification("success", "Article modifié avec succès");
      } else {
        const newItem: Item = {
          id: Math.max(...items.map((i) => i.id), 0) + 1,
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
        };
        setItems((prev) => [newItem, ...prev]);
        showNotification("success", "Article ajouté avec succès");
      }

      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      showNotification("error", "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      showNotification("success", "Article supprimé");
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error) {
      showNotification("error", "Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.03 },
    }),
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col gap-4 w-full max-w-screen-lg box-border px-4 md:px-6 py-4 pb-8 md:pb-8 overflow-y-auto md:max-h-[calc(100vh-100px)]">
      {/* ========== NOTIFICATIONS ========== */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {notification.type === "success" ? (
              <LuCheck size={20} />
            ) : (
              <LuCircleAlert size={20} />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== HEADER ========== */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LuPlus className="text-blue-600 dark:text-blue-400 text-2xl md:text-3xl" />
            Exemple Page Adaptée
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Modèle de page responsive avec Sidebar et Modals centrées
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenForm}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-2 py-1.5 rounded-lg transition-all focus:ring-4 focus:ring-blue-500/20 flex items-center justify-center gap-1 text-xs select-none shadow-sm"
        >
          <LuPlus size={18} />
          Ajouter un article
        </motion.button>
      </header>

      {/* ========== TABLE ========== */}
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                    Aucun article trouvé.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={tableRowVariants}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors border-b border-zinc-200 dark:border-zinc-700"
                  >
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenView(item)}
                        className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                      >
                        <LuEye size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenEdit(item)}
                        className="inline text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                      >
                        <LuPencil size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenDelete(item)}
                        className="inline text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                      >
                        <LuTrash2 size={18} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Form Modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
        title={isEditing ? "Modifier l'article" : "Ajouter un article"}
        onSubmit={handleSubmit}
        submitButtonText={isEditing ? "Modifier" : "Ajouter"}
        isLoading={isLoading}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Entrez le nom"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Entrez la description"
              rows={3}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                Montant *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-900 dark:text-zinc-100">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedItem(null);
        }}
        title="Supprimer cet article?"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedItem?.name}"? Cette action ne peut pas être annulée.`}
        onConfirm={handleDelete}
        isLoading={isLoading}
        confirmButtonText="Supprimer"
      />

      {/* View Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" style={{ display: isViewOpen ? "flex" : "none" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsViewOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold mb-4">Détails</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Nom</p>
                <p className="font-semibold">{selectedItem.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Description</p>
                <p>{selectedItem.description}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Montant</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedItem.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Date</p>
                <p>{selectedItem.date}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsViewOpen(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Fermer
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
