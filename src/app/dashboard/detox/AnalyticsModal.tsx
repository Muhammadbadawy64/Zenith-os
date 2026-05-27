"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { X, Activity, Sparkles, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  chartData: any[];
}

export function AnalyticsModal({ isOpen, onClose, locale, chartData }: AnalyticsModalProps) {
  const isRTL = locale === "ar";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" dir={isRTL ? "rtl" : "ltr"}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-strong border border-white/10 shadow-2xl rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col relative overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Activity className="w-6 h-6 text-brainhance-purple" />
                {isRTL ? "تحليل الأداء الشهري" : "Monthly Performance Analytics"}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <GlowCard className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-brainhance-purple" />
                  {isRTL ? "أداء هذا الشهر" : "Monthly Progress"}
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 13]} ticks={[0, 5, 10, 13]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1E1E2E", borderColor: "rgba(139, 92, 246, 0.3)", borderRadius: "12px", fontSize: "12px" }} 
                        itemStyle={{ color: "#8B5CF6" }}
                      />
                      <Line type="monotone" dataKey="points" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 2, fill: "#8B5CF6" }} activeDot={{ r: 6, fill: "#34D399" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlowCard>

              <GlowCard className="p-6 bg-brainhance-purple/5 border-brainhance-purple/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-32 h-32 text-brainhance-purple" />
                </div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-brainhance-glow relative z-10">
                  <Brain className="w-5 h-5" />
                  {isRTL ? "تحليل الأنماط" : "Pattern Analysis"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed relative z-10 mb-6">
                  {isRTL 
                    ? "قريباً سيتمكن الذكاء الاصطناعي من قراءة مصفوفة الشهر الخاصة بك وإعطائك نصائح دقيقة حول الأيام التي يقل فيها تركيزك."
                    : "Soon, AI will read your monthly matrix and provide precise advice on days your focus drops."}
                </p>
                <Button variant="outline" className="w-full sm:w-auto glass border-brainhance-purple/30 text-brainhance-glow hover:bg-brainhance-purple/20 relative z-10">
                  {isRTL ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}
                </Button>
              </GlowCard>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
