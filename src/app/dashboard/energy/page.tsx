"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore, useNotificationStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Zap, Sun, Moon, CloudSun, Lightbulb, BrainCircuit, Clock, Sparkles, TrendingUp } from "lucide-react";

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
const SLOT_ICONS: Record<string, React.ElementType> = { morning: Sun, afternoon: CloudSun, evening: Moon };
const SLOT_EMOJIS: Record<string, string> = { morning: "", afternoon: "", evening: "" };

function getSuggestion(level: number, locale: "ar" | "en"): { text: string; Icon: React.ElementType } {
  if (level >= 7) return { text: t(locale, "deepWorkSuggest"), Icon: Zap };
  if (level >= 4) return { text: t(locale, "creativeSuggest"), Icon: Lightbulb };
  return { text: t(locale, "adminSuggest"), Icon: Clock };
}

export default function EnergyPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const userId = useAuthStore((s) => s.user?.id);

  const [loading, setLoading] = useState(true);
  const [savingBySlot, setSavingBySlot] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, Record<string, number>>>({});
  const [history, setHistory] = useState<any[]>([]);
  const addNotification = useNotificationStore((s) => s.addNotification);

  // AI Peak Analysis
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    peak_time: string;
    peak_analysis: string;
    deep_work_window: string;
    creative_window: string;
    admin_window: string;
    recommendations: string[];
  } | null>(null);

  // ─── Fetch today's logs + history ────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [todayRes, historyRes] = await Promise.all([
      supabase
        .from("daily_energy")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today),
      supabase
        .from("daily_energy")
        .select("*")
        .eq("user_id", userId)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true }),
    ]);

    // Today's logs per time slot
    const todayLogs: Record<string, number> = { morning: 5, afternoon: 5, evening: 5 };
    if (todayRes.data) {
      for (const row of todayRes.data) {
        const slot = (row.mood || "morning") as string;
        todayLogs[slot] = row.energy_level;
      }
    }
    setLogs({ [today]: todayLogs });

    // History for chart
    setHistory(historyRes.data || []);

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Save single slot ────────────────────────────
  const saveSlot = useCallback(async (date: string, slot: string, level: number) => {
    if (!userId) return;
    setSavingBySlot((p) => ({ ...p, [slot]: true }));

    const payload = {
      user_id: userId,
      date,
      energy_level: level,
      mood: slot,
      notes: slot,
    };

    // Upsert: assume unique constraint exists on (user_id, date, mood)
    const { error } = await supabase.from("daily_energy").upsert(payload, {
      onConflict: "user_id, date, mood",
      ignoreDuplicates: false,
    });

    // Fallback: simple insert if upsert fails
    if (error) {
      await supabase.from("daily_energy").insert(payload);
    }

    setSavingBySlot((p) => ({ ...p, [slot]: false }));

    if (slot === "morning") {
      addNotification({
        title: t(locale, "energyLevel"),
        description: `${t(locale, "logEnergy")}: ${level}/10`,
        type: "success",
      });
    }
  }, [userId, locale, addNotification]);

  // ─── Chart data ──────────────────────────────────
  const chartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; morning: number; afternoon: number; evening: number }>();
    const today = new Date().toISOString().split("T")[0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" });
      dayMap.set(key, { date: label, morning: 0, afternoon: 0, evening: 0 });

      // Overlay with today's unsaved local edits
      if (key === today && logs[today]) {
        const td = logs[today];
        dayMap.set(key, { date: label, morning: td.morning || 0, afternoon: td.afternoon || 0, evening: td.evening || 0 });
      }
    }

    for (const row of history) {
      const slot = row.mood as string;
      if (dayMap.has(row.date) && TIME_SLOTS.includes(slot as any)) {
        const entry = dayMap.get(row.date)!;
        if (slot === "morning" || slot === "afternoon" || slot === "evening") {
          entry[slot] = row.energy_level;
        }
      }
    }

    return Array.from(dayMap.values());
  }, [history, logs, locale]);

  // ─── Current average for suggestions ─────────────
  const currentAvg = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaySlots = logs[today];
    if (!todaySlots) return 5;
    const vals = Object.values(todaySlots);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
  }, [logs]);

  const suggestion = getSuggestion(Math.round(currentAvg), locale);

  // ─── AI Peak Analysis ────────────────────────────
  const runPeakAnalysis = async () => {
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai-energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energyData: chartData, locale }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      // silent
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-3">
          <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <p className="text-sm text-muted-foreground">{t(locale, "loading")}</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Zap className="w-7 h-7 text-brainhance-glow" />
          <span className="gradient-text">{t(locale, "energyManagement")}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t(locale, "energyDesc")}</p>
      </motion.div>

      {/* Energy Logging Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIME_SLOTS.map((slot, i) => {
          const level = logs[today]?.[slot] ?? 5;
          const Icon = SLOT_ICONS[slot];
          const saving = savingBySlot[slot];
          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlowCard className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-brainhance-glow" />
                    <h3 className="text-sm font-bold">{t(locale, slot)}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brainhance-purple/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brainhance-purple" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* Energy dial */}
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="6" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(level / 10) * 264} 264`}
                        transform="rotate(-90 50 50)"
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${(level / 10) * 264} 264` }}
                        transition={{ duration: 0.5 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.4))" }}
                      />
                      <text x="50" y="47" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
                        {level}
                      </text>
                      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6">
                        /10
                      </text>
                    </svg>
                  </div>

                  {/* Slider */}
                  <div className="w-full flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">1</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={level}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setLogs((p) => ({
                          ...p,
                          [today]: { ...(p[today] || { morning: 5, afternoon: 5, evening: 5 }), [slot]: val },
                        }));
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8B5CF6 ${(level / 10) * 100}%, rgba(139,92,246,0.15) ${(level / 10) * 100}%)`,
                        accentColor: "#8B5CF6",
                      }}
                      dir="ltr"
                    />
                    <span className="text-xs text-muted-foreground">10</span>
                  </div>

                  <Button
                    onClick={() => saveSlot(today, slot, level)}
                    disabled={saving}
                    size="sm"
                    className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white mt-2"
                  >
                    {saving ? "..." : t(locale, "logEnergy")}
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Row: Chart + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bio-Rhythm Chart */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlowCard>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-brainhance-purple" /> {t(locale, "bioRhythm")}
            </h3>
            {chartData.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">{t(locale, "noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,10,26,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", color: "#fff" }}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels: Record<string, string> = { morning: t(locale, "morning"), afternoon: t(locale, "afternoon"), evening: t(locale, "evening") };
                      return labels[value] || value;
                    }}
                  />
                  <Bar dataKey="morning" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="afternoon" fill="#A855F7" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="evening" fill="#C084FC" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlowCard>
        </motion.div>

        {/* Smart Suggestions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlowCard className="h-full">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-brainhance-glow" />
              {t(locale, "smartSuggestions")}
            </h3>
            <div className="flex flex-col items-center text-center gap-4 py-4">
                <suggestion.Icon className="w-12 h-12 text-brainhance-glow" />
              <div>
                <p className="text-sm font-semibold text-brainhance-glow mb-1">
                  {currentAvg >= 7 ? t(locale, "highEnergy") : currentAvg >= 4 ? t(locale, "neutralEnergy") : t(locale, "lowEnergy")}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.text}</p>
              </div>
              <div className="w-full glass rounded-xl p-3 mt-2">
                <p className="text-[10px] text-muted-foreground mb-2">{locale === "ar" ? "متوسط طاقتك اليوم" : "Your avg energy today"}</p>
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentAvg / 10) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-sm font-bold text-brainhance-glow">{currentAvg.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* ── AI Peak Performance Analysis ──────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-brainhance-glow" /> {t(locale, "peakPerformanceAnalysis")}
            </h3>
            <Button
              onClick={runPeakAnalysis}
              disabled={aiAnalyzing || chartData.length === 0}
              size="sm"
              className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
            >
              {aiAnalyzing ? (
                <span className="flex items-center gap-2">
                  <motion.span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  {locale === "ar" ? "جاري التحليل..." : "Analyzing..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {t(locale, "analyzeEnergy")}
                </span>
              )}
            </Button>
          </div>

          {!aiResult && !aiAnalyzing && (
            <p className="text-xs text-muted-foreground">{t(locale, "peakPerformanceDesc")}</p>
          )}

          {aiAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "تحليل أنماط الطاقة..." : "Analyzing energy patterns..."}</p>
              </div>
            </div>
          )}

          {aiResult && (
            <div className="space-y-4">
              {/* Peak time badge */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{aiResult.peak_time === "morning" ? "🌅" : aiResult.peak_time === "afternoon" ? "☀️" : "🌙"}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "أفضل وقت في اليوم" : "Peak time of day"}</p>
                  <p className="text-sm font-bold text-brainhance-glow capitalize">{aiResult.peak_time}</p>
                </div>
              </div>

              {/* Analysis text */}
              <p className="text-xs text-muted-foreground leading-relaxed">{aiResult.peak_analysis}</p>

              {/* Windows grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-brainhance-glow" />
                    <p className="text-[11px] font-semibold">{t(locale, "optimalDeepWorkWindow")}</p>
                  </div>
                  <p className="text-xs font-bold text-brainhance-glow">{aiResult.deep_work_window}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-brainhance-glow" />
                    <p className="text-[11px] font-semibold">{t(locale, "creativeWindow")}</p>
                  </div>
                  <p className="text-xs font-bold text-brainhance-glow">{aiResult.creative_window}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-brainhance-glow" />
                    <p className="text-[11px] font-semibold">{t(locale, "adminWindow")}</p>
                  </div>
                  <p className="text-xs font-bold text-brainhance-glow">{aiResult.admin_window}</p>
                </div>
              </div>

              {/* Recommendations */}
              {aiResult.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-bold mb-2">{t(locale, "energyRecommendations")}</p>
                  <ul className="space-y-2">
                    {aiResult.recommendations.map((rec, i) => (
                      <li key={i} className="glass rounded-xl p-3 text-xs flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-foreground/90">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </GlowCard>
      </motion.div>
    </div>
  );
}
