"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useGamificationStore, useLanguageStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { GlowCard, FloatingParticles } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Coffee, Film, Gamepad2, Gift, Plus, Trash2, CheckCircle2, Heart, Star, Music, Pizza } from "lucide-react";
import { useNotificationStore } from "@/lib/store";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

const DEFAULT_REWARDS = [
  { id: "def-1", title: "مشروب مفضل (قهوة/شاي)", titleEn: "Favorite Drink (Coffee/Tea)", cost: 100, icon: "Coffee" },
  { id: "def-2", title: "حلقة من مسلسل", titleEn: "One Episode of a Show", cost: 300, icon: "Film" },
  { id: "def-3", title: "ساعة لعب (Gaming)", titleEn: "1 Hour Gaming", cost: 500, icon: "Gamepad2" },
  { id: "def-4", title: "وجبة دسمة أو حلى", titleEn: "Cheat Meal / Dessert", cost: 1000, icon: "Gift" },
];

export default function RewardsStorePage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { points, setPoints } = useAuthStore();
  const { customRewards, addCustomReward, removeCustomReward } = useGamificationStore();
  const { addNotification } = useNotificationStore();

  const [newTitle, setNewTitle] = useState("");
  const [newCost, setNewCost] = useState("500");
  const [newIcon, setNewIcon] = useState("Gift");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handlePurchase = (cost: number, title: string) => {
    if (points >= cost) {
      setPoints(points - cost);
      addNotification({
        title: isRTL ? "تم الشراء بنجاح! 🎉" : "Purchase Successful! 🎉",
        description: isRTL ? `استمتع بمكافأتك: ${title}` : `Enjoy your reward: ${title}`,
        type: "success"
      });
      // Confetti effect could go here
    } else {
      addNotification({
        title: isRTL ? "نقاط غير كافية 😔" : "Not Enough Points 😔",
        description: isRTL ? `تحتاج إلى ${cost - points} XP إضافية` : `You need ${cost - points} more XP`,
        type: "alert"
      });
    }
  };

  const handleAddCustom = () => {
    if (!newTitle.trim() || !newCost || isNaN(Number(newCost))) return;
    addCustomReward({
      title: newTitle.trim(),
      cost: Number(newCost),
      icon: newIcon
    });
    setNewTitle("");
    setNewCost("500");
    setNewIcon("Gift");
    setShowAdd(false);
  };

  const IconMap: Record<string, any> = { Coffee, Film, Gamepad2, Gift, Heart, Star, Music, Pizza };

  return (
    <div className="p-6 pb-24 max-w-5xl mx-auto relative min-h-[80vh]">
      <FloatingParticles />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-brainhance-purple to-brainhance-glow bg-clip-text text-transparent">
            {isRTL ? "متجر المكافآت 🎁" : "Rewards Store 🎁"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL 
              ? "استبدل نقاطك (XP) بمكافآت حقيقية تستمتع بها كهدية لإنجازاتك."
              : "Exchange your XP for real-world rewards you enjoy."}
          </p>
        </div>

        <motion.div 
          className="glass-strong px-6 py-4 rounded-2xl flex items-center gap-4 border border-brainhance-glow/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{isRTL ? "رصيدك الحالي" : "Current Balance"}</span>
            <span className="text-2xl font-black text-brainhance-glow">{points} XP</span>
          </div>
          <Zap className="w-8 h-8 text-brainhance-glow fill-brainhance-glow opacity-80" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Default Rewards */}
        {/* Default Rewards */}
        {DEFAULT_REWARDS.map(reward => {
          const Icon = IconMap[reward.icon] || Gift;
          const canAfford = points >= reward.cost;
          return (
            <motion.div key={reward.id} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className="h-full">
              <div className="relative glass-strong rounded-3xl overflow-hidden h-full flex flex-col border border-white/5 shadow-xl">
                {/* Top Banner with Icon */}
                <div className="h-32 bg-gradient-to-br from-brainhance-purple/20 to-brainhance-violet/10 relative flex items-center justify-center border-b border-white/5">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-brainhance-purple to-brainhance-glow p-0.5 shadow-lg shadow-brainhance-purple/30"
                  >
                    <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                      <Icon className="w-8 h-8 text-brainhance-glow" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="text-center">
                    <h3 className="font-bold text-lg leading-tight text-foreground">{isRTL ? reward.title : reward.titleEn}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-brainhance-glow font-black bg-brainhance-purple/10 w-max mx-auto px-3 py-1 rounded-full border border-brainhance-purple/20">
                      <Zap className="w-4 h-4 fill-brainhance-glow" />
                      {reward.cost} XP
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handlePurchase(reward.cost, isRTL ? reward.title : reward.titleEn)}
                    disabled={!canAfford}
                    className={`w-full font-bold py-6 rounded-xl transition-all ${
                      canAfford 
                        ? "bg-brainhance-glow hover:bg-white text-black shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {canAfford ? (isRTL ? "استبدال المكافأة" : "Claim Reward") : (isRTL ? "نقاط غير كافية" : "Not Enough XP")}
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Custom Rewards */}
        {customRewards.map(reward => {
          const Icon = IconMap[reward.icon] || Gift;
          const canAfford = points >= reward.cost;
          return (
            <motion.div key={reward.id} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className="h-full">
              <div className="relative glass-strong rounded-3xl overflow-hidden h-full flex flex-col border border-white/5 shadow-xl">
                <button 
                  onClick={() => setDeleteTarget({ id: reward.id, name: reward.title })}
                  className="absolute top-3 end-3 p-2 rounded-full bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white transition-all z-20 backdrop-blur-md"
                  title={isRTL ? "حذف" : "Delete"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {/* Top Banner with Icon */}
                <div className="h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 relative flex items-center justify-center border-b border-white/5">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30"
                  >
                    <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                      <Icon className="w-8 h-8 text-emerald-400" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="text-center">
                    <h3 className="font-bold text-lg leading-tight text-foreground">{reward.title}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-emerald-400 font-black bg-emerald-500/10 w-max mx-auto px-3 py-1 rounded-full border border-emerald-500/20">
                      <Zap className="w-4 h-4 fill-emerald-400" />
                      {reward.cost} XP
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handlePurchase(reward.cost, reward.title)}
                    disabled={!canAfford}
                    className={`w-full font-bold py-6 rounded-xl transition-all ${
                      canAfford 
                        ? "bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {canAfford ? (isRTL ? "استبدال المكافأة" : "Claim Reward") : (isRTL ? "نقاط غير كافية" : "Not Enough XP")}
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Add Custom Reward Card */}
        <GlowCard className="border-dashed border-2 border-white/10 hover:border-brainhance-glow/50 transition-colors flex flex-col items-center justify-center text-center gap-4 py-8 min-h-[200px]" onClick={() => setShowAdd(true)}>
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-muted-foreground">{isRTL ? "إضافة مكافأة مخصصة" : "Add Custom Reward"}</h3>
        </GlowCard>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong border border-white/10 shadow-2xl rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <h3 className="text-2xl font-black mb-6 text-center">{isRTL ? "مكافأة جديدة" : "New Reward"}</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{isRTL ? "اسم المكافأة" : "Reward Name"}</label>
                  <input 
                    placeholder={isRTL ? "مثال: شراء بيتزا 🍕" : "e.g. Buy a Pizza 🍕"} 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{isRTL ? "اختر أيقونة" : "Choose Icon"}</label>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {["Gift", "Gamepad2", "Film", "Coffee", "Heart", "Star", "Music", "Pizza"].map(ic => {
                      // We need to import these if not imported, or just use what we have. 
                      // Wait, we need to import Heart, Star, Music, Pizza! I'll just use the ones we have, plus Zap.
                      const IconComp = IconMap[ic] || Gift; // We will define IconMap above to include them
                      const isSelected = newIcon === ic;
                      return (
                        <button
                          key={ic}
                          onClick={() => setNewIcon(ic)}
                          className={`p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          <IconComp className="w-6 h-6" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">{isRTL ? "التكلفة (XP)" : "Cost (XP)"}</label>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-2">
                    <button 
                      onClick={() => setNewCost(prev => String(Math.max(10, Number(prev || 0) - 50)))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={newCost} 
                      onChange={e => setNewCost(e.target.value)} 
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-center text-xl font-black w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => setNewCost(prev => String(Number(prev || 0) + 50))}
                      className="w-10 h-10 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                  <Button onClick={() => setShowAdd(false)} variant="ghost" className="flex-1 rounded-xl py-6 hover:bg-white/5">{isRTL ? "إلغاء" : "Cancel"}</Button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddCustom} 
                    className="flex-1 rounded-xl py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-colors flex items-center justify-center"
                  >
                    {isRTL ? "إضافة" : "Add"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) removeCustomReward(deleteTarget.id); }}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
