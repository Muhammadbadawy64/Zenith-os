"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BookOpen,
  Sparkles,
  Calendar,
  Trash2,
  Plus,
  Brain,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useLanguageStore, useNotificationStore } from "@/lib/store";
import { GlowCard } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { MonthPicker } from "@/components/ui/month-picker";
import { CustomDatePicker } from "@/components/ui/date-picker";

// ─── Journal Store ──────────────────────────────────────────
export interface JournalEntry {
  id: string;
  date: string;
  happened: string;
  felt: string;
  tomorrow: string;
  mood: number; // 1-5
  gratitude?: string[]; // 3 items
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, "id">) => void;
  updateEntry: (id: string, entry: Partial<Omit<JournalEntry, "id">>) => void;
  removeEntry: (id: string) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (e) =>
        set((s) => ({
          entries: [
            {
              ...e,
              id: crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),
            },
            ...s.entries,
          ],
        })),
      updateEntry: (id, updatedFields) =>
        set((s) => ({
          entries: s.entries.map(e => e.id === id ? { ...e, ...updatedFields } : e)
        })),
      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    { name: "brainhance-journal" }
  )
);

// ─── Helpers ────────────────────────────────────────────────
const MOODS = [
  { emoji: "😢", label_ar: "حزين جداً", label_en: "Very Sad" },
  { emoji: "😟", label_ar: "حزين", label_en: "Sad" },
  { emoji: "😐", label_ar: "عادي", label_en: "Neutral" },
  { emoji: "😊", label_ar: "سعيد", label_en: "Happy" },
  { emoji: "😄", label_ar: "سعيد جداً", label_en: "Very Happy" },
];

const MOOD_COLORS: Record<number, string> = {
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#22C55E",
  5: "#8B5CF6",
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string, locale: "ar" | "en") {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Custom Recharts Tooltip ─────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
  locale,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  locale: "ar" | "en";
}) {
  if (!active || !payload?.length) return null;
  const mood = payload[0].value;
  const moodInfo = MOODS[mood - 1];
  return (
    <div className="glass-strong rounded-xl px-4 py-3 border border-brainhance-purple/30 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold flex items-center gap-2">
        <span>{moodInfo?.emoji}</span>
        <span style={{ color: MOOD_COLORS[mood] }}>
          {locale === "ar" ? moodInfo?.label_ar : moodInfo?.label_en}
        </span>
      </p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function DailyJournalPage() {
  const { locale } = useLanguageStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isRTL = locale === "ar";

  const { entries, addEntry, updateEntry, removeEntry } = useJournalStore();

  // Form state
  const [happened, setHappened] = useState("");
  const [felt, setFelt] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [mood, setMood] = useState(3);
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [editId, setEditId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [entryDate, setEntryDate] = useState<string>(getTodayStr());

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Expanded entries state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  const todayStr = getTodayStr();
  const todayEntry = entries.find((e) => e.date === todayStr);

  // Mood chart data (last 30 days)
  const chartData = useMemo(() => {
    const last30 = entries
      .filter((e) => {
        const diff =
          (new Date().getTime() - new Date(e.date).getTime()) /
          (1000 * 60 * 60 * 24);
        return diff <= 30;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return last30.map((e) => ({
      date: new Date(e.date).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        { month: "short", day: "numeric" }
      ),
      mood: e.mood,
    }));
  }, [entries, locale]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    entries.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [entries]);

  // ─── Handlers ──────────────────────────────────────────
  const handleSubmit = () => {
    if (!happened.trim() && !felt.trim() && !tomorrow.trim() && !gratitude.some(g => g.trim())) return;

    const filteredGratitude = gratitude.map(g => g.trim()).filter(Boolean);

    if (editId) {
      updateEntry(editId, {
        date: entryDate,
        happened: happened.trim(),
        felt: felt.trim(),
        tomorrow: tomorrow.trim(),
        mood,
        gratitude: filteredGratitude,
      });
      addNotification({
        title: locale === "ar" ? "تم التعديل ✅" : "Updated ✅",
        description: locale === "ar" ? "تم تحديث المدخلة بنجاح" : "Journal entry updated successfully",
        type: "success",
      });
      setEditId(null);
    } else {
      addEntry({
        date: entryDate,
        happened: happened.trim(),
        felt: felt.trim(),
        tomorrow: tomorrow.trim(),
        mood,
        gratitude: filteredGratitude,
      });
      addNotification({
        title: locale === "ar" ? "تم الحفظ ✅" : "Saved ✅",
        description: locale === "ar" ? "تمت إضافة مدخلة اليوميات بنجاح" : "Journal entry saved successfully",
        type: "success",
      });
    }

    setHappened("");
    setFelt("");
    setTomorrow("");
    setMood(3);
    setGratitude(["", "", ""]);
    setEntryDate(getTodayStr());
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditId(entry.id);
    setHappened(entry.happened || "");
    setFelt(entry.felt || "");
    setTomorrow(entry.tomorrow || "");
    setMood(entry.mood || 3);
    setEntryDate(entry.date);
    setGratitude(entry.gratitude?.length ? [...entry.gratitude, "", "", ""].slice(0, 3) : ["", "", ""]);
    setIsFormOpen(true);
    setIsHistoryModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAiAnalysis = async () => {
    const last7 = entries.slice(0, 7);
    if (last7.length === 0) {
      addNotification({
        title: locale === "ar" ? "لا توجد مدخلات" : "No entries",
        description:
          locale === "ar"
            ? "أضف بعض المدخلات أولاً قبل طلب التحليل"
            : "Add some entries first before requesting analysis",
        type: "alert",
      });
      return;
    }

    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const res = await fetch("/api/journal-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: last7, locale }),
      });
      const data = await res.json();
      setAiAnalysis(
        data.analysis ||
          (locale === "ar"
            ? "لم يتم الحصول على تحليل"
            : "No analysis returned")
      );
    } catch {
      setAiAnalysis(
        locale === "ar"
          ? "⚠️ حدث خطأ أثناء التحليل. حاول مرة أخرى."
          : "⚠️ An error occurred. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* ─── Header ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <BookOpen className="w-7 h-7 text-brainhance-glow" />
          </motion.span>
          <span className="gradient-text">
            {locale === "ar" ? "اليوميات الذكية" : "Daily Journal"}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "وثّق يومك واكتشف أنماط حياتك بالذكاء الاصطناعي"
            : "Document your day and discover life patterns with AI"}
        </p>
      </motion.div>

      {/* ─── Mood Trend Chart ─────────────────────────────── */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlowCard>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brainhance-glow" />
              <h3 className="text-sm font-bold">
                {locale === "ar"
                  ? "اتجاه المزاج — آخر 30 يوم"
                  : "Mood Trend — Last 30 Days"}
              </h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="moodGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(139,92,246,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(139,92,246,0.2)" }}
                    tickLine={false}
                    reversed={isRTL}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => MOODS[v - 1]?.emoji || ""}
                    orientation={isRTL ? "right" : "left"}
                  />
                  <Tooltip
                    content={<CustomTooltip locale={locale} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fill="url(#moodGradient)"
                    dot={{
                      r: 5,
                      fill: "#8B5CF6",
                      stroke: "#1a1030",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#A78BFA",
                      stroke: "#8B5CF6",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Form + AI Analysis ───────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entry Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlowCard>
              {/* Form Header */}
              <div
                className="w-full flex flex-wrap items-center justify-between mb-2 gap-3"
              >
                <button
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-5 h-5 text-brainhance-glow" />
                  <h3 className="text-base font-bold">
                    {editId 
                      ? (locale === "ar" ? "✏️ تعديل المدخلة" : "✏️ Edit Entry")
                      : (locale === "ar" ? "📝 مدخلة جديدة" : "📝 New Entry")
                    }
                  </h3>
                  <motion.div
                    animate={{ rotate: isFormOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </button>
                <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                  <CustomDatePicker
                    value={entryDate}
                    onChange={setEntryDate}
                    locale={locale}
                    className="w-full sm:w-44"
                  />
                </div>
              </div>

              <AnimatePresence>
                {isFormOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 pt-4">
                      {/* Mood Selector */}
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-3 block">
                          {locale === "ar"
                            ? "كيف حالك اليوم؟"
                            : "How are you feeling today?"}
                        </label>
                        <div className="flex items-center justify-center gap-3">
                          {MOODS.map((m, i) => {
                            const value = i + 1;
                            const isSelected = mood === value;
                            return (
                              <motion.button
                                key={value}
                                onClick={() => setMood(value)}
                                className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                                  isSelected
                                    ? "bg-brainhance-purple/20 ring-2 ring-brainhance-purple shadow-lg shadow-brainhance-purple/20"
                                    : "glass hover:bg-white/5"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.92 }}
                                animate={
                                  isSelected
                                    ? { scale: [1, 1.15, 1.05], y: -4 }
                                    : { scale: 1, y: 0 }
                                }
                                transition={{ duration: 0.3 }}
                              >
                                <span className="text-3xl">{m.emoji}</span>
                                <span
                                  className={`text-[10px] font-medium ${
                                    isSelected
                                      ? "text-brainhance-glow"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {locale === "ar" ? m.label_ar : m.label_en}
                                </span>
                                {isSelected && (
                                  <motion.div
                                    layoutId="mood-indicator"
                                    className="absolute -bottom-1 w-6 h-1 rounded-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet"
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Text Areas */}
                      <div className="space-y-4">
                        {/* What happened */}
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            {locale === "ar"
                              ? "ماذا حدث اليوم؟ 📋"
                              : "What happened today? 📋"}
                          </label>
                          <textarea
                            value={happened}
                            onChange={(e) => setHappened(e.target.value)}
                            rows={3}
                            placeholder={
                              locale === "ar"
                                ? "اكتب أهم ما حدث في يومك..."
                                : "Write about the most important events of your day..."
                            }
                            className="w-full glass-strong rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 placeholder:text-muted-foreground/50 transition-all"
                          />
                        </div>

                        {/* How did you feel */}
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            {locale === "ar"
                              ? "بمَ شعرت؟ 💭"
                              : "How did you feel? 💭"}
                          </label>
                          <textarea
                            value={felt}
                            onChange={(e) => setFelt(e.target.value)}
                            rows={3}
                            placeholder={
                              locale === "ar"
                                ? "صف مشاعرك وأفكارك..."
                                : "Describe your feelings and thoughts..."
                            }
                            className="w-full glass-strong rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 placeholder:text-muted-foreground/50 transition-all"
                          />
                        </div>

                        {/* Tomorrow */}
                        <div>
                          <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            {locale === "ar"
                              ? "ماذا أحتاج أن أفعله غداً؟ 🎯"
                              : "What do I need to do tomorrow? 🎯"}
                          </label>
                          <textarea
                            value={tomorrow}
                            onChange={(e) => setTomorrow(e.target.value)}
                            rows={2}
                            placeholder={
                              locale === "ar"
                                ? "خطط ليومك القادم..."
                                : "Plan for tomorrow..."
                            }
                            className="w-full glass-strong rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 placeholder:text-muted-foreground/50 transition-all"
                          />
                        </div>
                        {/* Gratitude */}
                        <div className="space-y-2 mt-4">
                          <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                            {locale === "ar" ? "3 أشياء أنا ممتن لها اليوم 🌟" : "3 things I'm grateful for today 🌟"}
                          </label>
                          {[0, 1, 2].map((i) => (
                            <input
                              key={i}
                              value={gratitude[i] || ""}
                              onChange={(e) => {
                                const newG = [...gratitude];
                                newG[i] = e.target.value;
                                setGratitude(newG);
                              }}
                              placeholder={locale === "ar" ? `${i+1}. ممتن لـ...` : `${i+1}. Grateful for...`}
                              className="w-full glass-strong rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 placeholder:text-muted-foreground/50 transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-3">
                        {editId && (
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-1/3">
                            <Button
                              onClick={() => {
                                setEditId(null);
                                setHappened("");
                                setFelt("");
                                setTomorrow("");
                                setMood(3);
                                setGratitude(["", "", ""]);
                                setEntryDate(getTodayStr());
                              }}
                              className="w-full bg-white/5 hover:bg-white/10 text-foreground py-6 text-base font-bold rounded-xl border border-white/10"
                            >
                              {locale === "ar" ? "إلغاء" : "Cancel"}
                            </Button>
                          </motion.div>
                        )}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1">
                          <Button
                            onClick={handleSubmit}
                            disabled={!happened.trim() && !felt.trim() && !tomorrow.trim() && !gratitude.some(g => g.trim())}
                            className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white py-6 text-base font-bold rounded-xl shadow-lg shadow-brainhance-purple/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-5 h-5 me-2" />
                            {editId 
                              ? (locale === "ar" ? "تحديث المدخلة" : "Update Entry")
                              : (locale === "ar" ? "حفظ المدخلة" : "Save Entry")
                            }
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlowCard>
          </motion.div>

          {/* ─── AI Analysis Section ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlowCard>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brainhance-glow" />
                  <h3 className="text-base font-bold">
                    {locale === "ar"
                      ? "تحليل الذكاء الاصطناعي"
                      : "AI Pattern Analysis"}
                  </h3>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleAiAnalysis}
                    disabled={aiLoading || entries.length === 0}
                    className="bg-gradient-to-r from-purple-600 via-brainhance-purple to-indigo-600 text-white px-6 gap-2 shadow-lg shadow-brainhance-purple/25 disabled:opacity-40"
                  >
                    {aiLoading ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {aiLoading
                      ? locale === "ar"
                        ? "جاري التحليل..."
                        : "Analyzing..."
                      : locale === "ar"
                        ? "✨ تحليل آخر 7 مدخلات"
                        : "✨ Analyze Last 7 Entries"}
                  </Button>
                </motion.div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {locale === "ar"
                  ? "يقوم الذكاء الاصطناعي بتحليل أنماط حياتك واكتشاف الأخطاء المتكررة وتقديم نصائح عملية"
                  : "AI analyzes your life patterns, discovers recurring mistakes, and provides actionable tips"}
              </p>

              {/* AI Loading Animation */}
              <AnimatePresence>
                {aiLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center py-8 gap-4"
                  >
                    <motion.div className="relative w-16 h-16">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-brainhance-purple/30"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-brainhance-purple/20"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Brain className="w-8 h-8 text-brainhance-glow" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <p className="text-sm text-brainhance-glow font-medium animate-pulse">
                      {locale === "ar"
                        ? "جاري تحليل الأنماط..."
                        : "Analyzing patterns..."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Result */}
              <AnimatePresence>
                {aiAnalysis && !aiLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brainhance-purple/10 via-transparent to-indigo-600/10 rounded-2xl blur-xl" />
                    <div className="relative glass-strong rounded-2xl p-6 border border-brainhance-purple/20">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-brainhance-glow">
                          {locale === "ar"
                            ? "نتائج التحليل الذكي"
                            : "AI Analysis Results"}
                        </span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlowCard>
          </motion.div>
        </div>

        {/* ─── Right: Quick Stats & History Button ──────────────── */}
        <div className="space-y-4">
          <motion.button
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsHistoryModalOpen(true)}
            className="w-full glass-strong border border-brainhance-purple/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center shadow-lg hover:bg-white/5 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-brainhance-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7 text-brainhance-glow" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-text mb-1">
                {locale === "ar" ? "سجل اليوميات" : "Journal History"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {locale === "ar" ? "استعرض جميع مدخلاتك السابقة" : "Browse all your past entries"}
              </p>
            </div>
          </motion.button>

          {/* ─── Quick Stats ────────────────────────────────── */}
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlowCard>
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brainhance-glow" />
                  {locale === "ar" ? "إحصائيات سريعة" : "Quick Stats"}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Entries */}
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold gradient-text">
                      {entries.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar" ? "إجمالي المدخلات" : "Total Entries"}
                    </p>
                  </div>
                  {/* Average Mood */}
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold">
                      {MOODS[
                        Math.round(
                          entries.reduce((a, e) => a + e.mood, 0) /
                            entries.length
                        ) - 1
                      ]?.emoji || "😐"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar"
                        ? "متوسط المزاج"
                        : "Average Mood"}
                    </p>
                  </div>
                  {/* Current Streak */}
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold gradient-text">
                      {(() => {
                        let streak = 0;
                        const today = new Date();
                        for (let i = 0; i < 365; i++) {
                          const d = new Date(today);
                          d.setDate(d.getDate() - i);
                          const ds = d.toISOString().slice(0, 10);
                          if (entries.some((e) => e.date === ds)) streak++;
                          else break;
                        }
                        return streak;
                      })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar" ? "أيام متتالية 🔥" : "Day Streak 🔥"}
                    </p>
                  </div>
                  {/* Best Mood Day */}
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold">
                      {MOODS[
                        Math.max(...entries.map((e) => e.mood)) - 1
                      ]?.emoji || "😄"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar" ? "أفضل مزاج" : "Best Mood"}
                    </p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) removeEntry(deleteTarget.id); }}
        itemName={deleteTarget ? (locale === "ar" ? "هذه المدخلة" : "this entry") : undefined}
      />

      {/* ─── History Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-all ${
              isRTL ? "pr-4 sm:pr-8 md:pr-[120px] xl:pr-[280px]" : "pl-4 sm:pl-8 md:pl-[120px] xl:pl-[280px]"
            }`}
            onClick={() => setIsHistoryModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-dropdown border border-brainhance-purple/30 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="p-6 border-b border-border/10 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brainhance-purple/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brainhance-glow" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{locale === "ar" ? "سجل اليوميات" : "Journal History"}</h2>
                    <p className="text-xs text-muted-foreground">{entries.length} {locale === "ar" ? "مدخلة إجمالاً" : "total entries"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <MonthPicker 
                    value={historyMonth} 
                    onChange={setHistoryMonth} 
                    locale={locale} 
                    align={locale === "ar" ? "left" : "right"}
                  />
                  <button
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-brainhance-purple/20 scrollbar-track-transparent">
                {(() => {
                  const filteredGroupedEntries = groupedEntries.filter(([date]) => date.startsWith(historyMonth));
                  
                  return filteredGroupedEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {locale === "ar"
                          ? "لا توجد مدخلات بعد. ابدأ بتوثيق يومك!"
                          : "No entries for this month."}
                      </p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AnimatePresence>
                        {filteredGroupedEntries.map(([date, dayEntries], gi) => {
                          const isToday = date === todayStr;
                          return (
                            <motion.div
                              key={date}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: gi * 0.05 }}
                              className="space-y-3"
                            >
                              {/* Date Header */}
                              <div
                                className={`flex items-center gap-2 text-sm font-semibold py-1 ${
                                  isToday
                                    ? "text-brainhance-glow"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    isToday
                                      ? "bg-brainhance-glow animate-pulse"
                                      : "bg-muted-foreground/30"
                                  }`}
                                />
                                {isToday
                                  ? locale === "ar"
                                    ? "اليوم"
                                    : "Today"
                                  : formatDate(date, locale)}
                              </div>

                              {/* Entries for this date */}
                              <div className="space-y-2">
                                {dayEntries.map((entry, ei) => {
                                  const isExpanded = expandedIds.has(entry.id);
                                  const moodInfo = MOODS[entry.mood - 1];
                                  return (
                                    <motion.div
                                      key={entry.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
                                      transition={{ delay: ei * 0.03 }}
                                      className={`rounded-xl border transition-all ${
                                        isToday
                                          ? "border-brainhance-purple/30 bg-brainhance-purple/5"
                                          : "border-border/10 glass"
                                      }`}
                                    >
                                      {/* Entry Header */}
                                      <button
                                        onClick={() => toggleExpand(entry.id)}
                                        className="w-full flex items-center justify-between p-3 text-start"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className="text-2xl shrink-0">
                                            {moodInfo?.emoji}
                                          </span>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[250px]">
                                              {entry.happened || entry.felt || "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {locale === "ar"
                                                ? moodInfo?.label_ar
                                                : moodInfo?.label_en}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                          )}
                                        </div>
                                      </button>

                                      {/* Expanded Content */}
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-4 pb-4 space-y-4 border-t border-border/10 pt-4">
                                              {entry.happened && (
                                                <div>
                                                  <p className="text-xs font-semibold text-brainhance-glow mb-1">
                                                    {locale === "ar"
                                                      ? "📋 ماذا حدث"
                                                      : "📋 What happened"}
                                                  </p>
                                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                                    {entry.happened}
                                                  </p>
                                                </div>
                                              )}
                                              {entry.felt && (
                                                <div>
                                                  <p className="text-xs font-semibold text-brainhance-glow mb-1">
                                                    {locale === "ar"
                                                      ? "💭 المشاعر"
                                                      : "💭 Feelings"}
                                                  </p>
                                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                                    {entry.felt}
                                                  </p>
                                                </div>
                                              )}
                                              {entry.tomorrow && (
                                                <div>
                                                  <p className="text-xs font-semibold text-brainhance-glow mb-1">
                                                    {locale === "ar"
                                                      ? "🎯 مهام الغد"
                                                      : "🎯 Tomorrow"}
                                                  </p>
                                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                                    {entry.tomorrow}
                                                  </p>
                                                </div>
                                              )}
                                              {entry.gratitude && entry.gratitude.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold text-brainhance-glow mb-1">
                                                    {locale === "ar" ? "🌟 الامتنان" : "🌟 Gratitude"}
                                                  </p>
                                                  <ul className="text-sm text-foreground/80 leading-relaxed list-disc list-inside space-y-1">
                                                    {entry.gratitude.map((g, i) => (
                                                      <li key={i}>{g}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              {/* Action Buttons */}
                                              <div className="flex items-center gap-4 pt-2">
                                                <motion.button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(entry);
                                                  }}
                                                  className="flex items-center gap-1.5 text-xs text-blue-400/80 hover:text-blue-400 transition-colors"
                                                  whileHover={{ x: isRTL ? -3 : 3 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <Plus className="w-4 h-4 rotate-45" />
                                                  {locale === "ar" ? "تعديل" : "Edit"}
                                                </motion.button>
                                                <motion.button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(entry);
                                                  }}
                                                  className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                                                  whileHover={{ x: isRTL ? -3 : 3 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                  {locale === "ar" ? "حذف" : "Delete"}
                                                </motion.button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                 );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
