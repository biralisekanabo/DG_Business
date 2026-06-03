"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTrash2, LuX } from "react-icons/lu";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmButtonText?: string;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  isLoading = false,
  confirmButtonText = "Supprimer",
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-xs p-3 md:p-4 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-950 rounded-lg">
                  <LuTrash2 size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {title}
                  </h2>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <LuX size={18} className="text-zinc-500 dark:text-zinc-400" />
              </motion.button>
            </div>

            {/* Message */}
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-xs md:text-sm">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <LuTrash2 size={14} />
                {isLoading ? "Suppression..." : confirmButtonText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
