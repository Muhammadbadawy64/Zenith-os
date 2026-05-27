"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore, useLanguageStore, useOnboardingStore } from "@/lib/store";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function PunishmentModal() {
  const { punishmentLevel, punishmentReason, resolvePunishment } = useGamificationStore();
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { data } = useOnboardingStore();
  
  const [typedText, setTypedText] = useState("");
  const requiredText = isRTL ? "لن أستسلم للكسل وسأكمل رسالتي" : "I will not give up to laziness and will complete my mission";

  if (punishmentLevel === 0) return null;

  const isSevere = punishmentLevel >= 2;

  const handleResolve = () => {
    if (isSevere && typedText.trim() !== requiredText) {
      return; // Must type the text to resolve severe punishment
    }
    setTypedText("");
    resolvePunishment();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/80 backdrop-blur-lg p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-zinc-900 border-2 border-red-500/50 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            {isSevere ? (
              <ShieldAlert className="w-10 h-10 text-red-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-red-400" />
            )}
          </div>
          
          <h2 className="text-3xl font-black text-red-500 mb-2">
            {isRTL ? "تحذير: مسارك في خطر!" : "Warning: Your path is in danger!"}
          </h2>
          
          <p className="text-lg text-zinc-300 mb-6">
            {punishmentReason}
          </p>

          {data.theWhy.lifeMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-400/80 mb-1">{isRTL ? "تذكر رؤيتك:" : "Remember your vision:"}</p>
              <p className="font-bold text-red-100">"{data.theWhy.lifeMessage}"</p>
            </div>
          )}

          {isSevere ? (
            <div className="space-y-4 mb-8 text-start">
              <p className="text-sm font-bold text-zinc-400">
                {isRTL 
                  ? "لإلغاء القفل، اكتب العهد التالي لالتزامك:" 
                  : "To unlock, type the following pledge to commit:"}
              </p>
              <div className="bg-black/50 p-3 rounded-lg border border-red-500/30 text-red-400 font-bold text-center select-none">
                {requiredText}
              </div>
              <input
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                placeholder={isRTL ? "اكتب العهد هنا..." : "Type the pledge here..."}
                className="w-full bg-zinc-950 border border-red-500/50 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-center"
              />
            </div>
          ) : null}

          <button
            onClick={handleResolve}
            disabled={isSevere && typedText.trim() !== requiredText}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
              isSevere && typedText.trim() !== requiredText
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            }`}
          >
            {isRTL 
              ? (isSevere ? "أتعهد بالالتزام" : "حسناً، سأعود للتركيز") 
              : (isSevere ? "I pledge to commit" : "Okay, I'll focus")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
