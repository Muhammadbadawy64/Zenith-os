"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";
import { useLanguageStore } from "@/lib/store";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export default function DeleteConfirmModal({ open, onClose, onConfirm, itemName }: DeleteConfirmModalProps) {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="glass-dropdown rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Animated Trash Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 relative"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Trash Can */}
              <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-10 h-10 text-red-400" />
              </div>
              
              {/* Falling item animation */}
              <motion.div
                className="absolute -top-2 left-1/2 w-4 h-4 bg-brainhance-purple rounded-md"
                initial={{ y: -20, x: -8, opacity: 1, scale: 1 }}
                animate={{ y: 30, x: -8, opacity: 0, scale: 0.3, rotate: 180 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeIn" }}
              />
              <motion.div
                className="absolute -top-4 left-1/2 w-3 h-3 bg-brainhance-violet rounded-full"
                initial={{ y: -15, x: 2, opacity: 1, scale: 1 }}
                animate={{ y: 35, x: 2, opacity: 0, scale: 0.2, rotate: -120 }}
                transition={{ duration: 0.7, delay: 0.5, ease: "easeIn" }}
              />
              <motion.div
                className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-brainhance-glow rounded-sm"
                initial={{ y: -25, x: -15, opacity: 1, scale: 1 }}
                animate={{ y: 28, x: -8, opacity: 0, scale: 0.2, rotate: 90 }}
                transition={{ duration: 0.9, delay: 0.3, ease: "easeIn" }}
              />
            </motion.div>

            <h3 className="text-xl font-black text-foreground mb-2">
              {isRTL ? "هل أنت متأكد؟" : "Are you sure?"}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              {isRTL 
                ? `سيتم حذف ${itemName ? `"${itemName}"` : "هذا العنصر"} نهائياً ولن تتمكن من استرجاعه.` 
                : `${itemName ? `"${itemName}"` : "This item"} will be permanently deleted and cannot be recovered.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { onConfirm(); onClose(); }}
                className="flex-1 py-3 rounded-xl text-sm font-black bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isRTL ? "حذف" : "Delete"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
