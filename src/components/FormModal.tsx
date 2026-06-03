"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuSave } from "react-icons/lu";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitButtonText?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-xs",
  md: "max-w-sm",
  lg: "max-w-md",
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function FormModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  submitButtonText = "Enregistrer",
  isLoading = false,
  size = "md",
}: FormModalProps) {
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
            className={`relative bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} p-3 md:p-4 max-h-[85vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <LuX size={18} className="text-zinc-500 dark:text-zinc-400" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-3">
              {/* Fields */}
              <div className="space-y-2">{children}</div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t border-zinc-200 dark:border-zinc-700">
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
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <LuSave size={14} />
                  {isLoading ? "Enregistrement..." : submitButtonText}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
