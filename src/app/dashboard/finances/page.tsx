"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useLanguageStore } from "@/lib/store";
import { GlowCard } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingDown,
  PieChart as PieChartIcon,
  ShoppingBag,
  X,
  Target,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Wallet
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ─── Zustand Store ────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
}

interface FinanceState {
  transactions: Transaction[];
  monthlyBudget: number;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  setMonthlyBudget: (budget: number) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      transactions: [],
      monthlyBudget: 0,
      addTransaction: (t) =>
        set((s) => ({
          transactions: [
            {
              ...t,
              id: crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),
            },
            ...s.transactions,
          ],
        })),
      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
    }),
    { name: "brainhance-finances-v2" }
  )
);

// ─── Categories ───────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { key: "food", ar: "طعام", en: "Food", emoji: "🍕" },
  { key: "bills", ar: "فواتير", en: "Bills", emoji: "💡" },
  { key: "entertainment", ar: "ترفيه", en: "Entertainment", emoji: "🎮" },
  { key: "education", ar: "تعليم", en: "Education", emoji: "📚" },
  { key: "transport", ar: "مواصلات", en: "Transport", emoji: "🚗" },
  { key: "health", ar: "صحة", en: "Health", emoji: "💊" },
  { key: "clothes", ar: "ملابس", en: "Clothes", emoji: "👕" },
  { key: "other", ar: "أخرى", en: "Other", emoji: "📦" },
];

const INCOME_CATEGORIES = [
  { key: "salary", ar: "راتب", en: "Salary", emoji: "💰" },
  { key: "freelance", ar: "عمل حر", en: "Freelance", emoji: "💻" },
  { key: "gift", ar: "هدية", en: "Gift", emoji: "🎁" },
  { key: "investment", ar: "استثمار", en: "Investment", emoji: "📈" },
  { key: "other_income", ar: "أخرى", en: "Other", emoji: "💵" },
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const CATEGORY_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#6366F1",
  "#94A3B8",
];

function getCategoryColor(key: string) {
  const idx = ALL_CATEGORIES.findIndex((c) => c.key === key);
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : CATEGORY_COLORS.length - 1];
}

function getCategoryLabel(key: string, isRTL: boolean) {
  const cat = ALL_CATEGORIES.find((c) => c.key === key);
  if (!cat) return key;
  return `${cat.emoji} ${isRTL ? cat.ar : cat.en}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomBarTooltip({ active, payload, label, isRTL }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-2 border border-white/10 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">
        {isRTL ? `يوم ${label}` : `Day ${label}`}
      </p>
      <p className="text-sm font-bold text-brainhance-glow">
        {payload[0].value} {isRTL ? "ج.م" : "EGP"}
      </p>
    </div>
  );
}

function CustomPieTooltip({ active, payload, isRTL }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-2 border border-white/10 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold" style={{ color: payload[0].payload.fill }}>
        {payload[0].value} {isRTL ? "ج.م" : "EGP"}
      </p>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────
export default function FinancesPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";

  const {
    transactions,
    monthlyBudget,
    addTransaction,
    removeTransaction,
    setMonthlyBudget,
  } = useFinanceStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  
  // Add Form State
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("food");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [budgetInput, setBudgetInput] = useState("");

  // History Modal State
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  // ─── Current month filtering ─────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [transactions, currentMonth, currentYear]
  );

  const monthlyExpenses = useMemo(
    () => monthlyTransactions.filter((t) => t.type === "expense"),
    [monthlyTransactions]
  );
  
  const monthlyIncomes = useMemo(
    () => monthlyTransactions.filter((t) => t.type === "income"),
    [monthlyTransactions]
  );

  const totalExpenseThisMonth = useMemo(
    () => monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenses]
  );
  
  const totalIncomeThisMonth = useMemo(
    () => monthlyIncomes.reduce((sum, e) => sum + e.amount, 0),
    [monthlyIncomes]
  );

  const netSavings = totalIncomeThisMonth - totalExpenseThisMonth;

  const budgetUsedPercent = monthlyBudget > 0 ? Math.min((totalExpenseThisMonth / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = monthlyBudget > 0 && totalExpenseThisMonth > monthlyBudget;

  // ─── Pie chart data (Expenses Only) ──────────────────────
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([key, value]) => ({
      name: getCategoryLabel(key, isRTL),
      value: Math.round(value * 100) / 100,
      fill: getCategoryColor(key),
    }));
  }, [monthlyExpenses, isRTL]);

  // ─── Bar chart data (Expenses daily spending) ────────────
  const barData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daily: Record<number, number> = {};
    monthlyExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      daily[day] = (daily[day] || 0) + e.amount;
    });
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: Math.round((daily[i + 1] || 0) * 100) / 100,
    }));
  }, [monthlyExpenses, currentMonth, currentYear]);

  // ─── Handlers ────────────────────────────────────────────
  const handleTypeChange = (type: "expense" | "income") => {
    setFormType(type);
    setFormCategory(type === "expense" ? "food" : "salary");
  };

  const handleAdd = useCallback(() => {
    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0 || !formDescription.trim()) return;
    addTransaction({
      type: formType,
      amount: amt,
      description: formDescription.trim(),
      category: formCategory,
      date: new Date(formDate).toISOString(),
    });
    setFormAmount("");
    setFormDescription("");
    setFormType("expense");
    setFormCategory("food");
    setFormDate(new Date().toISOString().split("T")[0]);
    setShowAddModal(false);
  }, [formAmount, formDescription, formCategory, formType, formDate, addTransaction]);

  const handleSaveBudget = useCallback(() => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val);
    }
    setShowBudgetEdit(false);
    setBudgetInput("");
  }, [budgetInput, setMonthlyBudget]);

  // ─── Animation variants ──────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  const monthName = isRTL
    ? new Date().toLocaleDateString("ar-EG", { month: "long" })
    : new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 md:p-6 pb-24 max-w-7xl mx-auto relative min-h-[80vh]">
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-brainhance-purple via-purple-400 to-brainhance-glow bg-clip-text text-transparent">
            {isRTL ? "💰 الإدارة المالية" : "💰 Finances"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {isRTL
              ? "تابع الدخل والمصروفات وحلل عاداتك المالية بذكاء"
              : "Track income and expenses, and analyze your financial habits"}
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brainhance-purple to-brainhance-glow flex items-center justify-center shadow-lg shadow-brainhance-purple/40 hover:shadow-brainhance-purple/60 transition-shadow"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* ─── Summary Cards ─────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        {/* Total Income */}
        <motion.div variants={itemVariants} className="glass-strong p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              {isRTL ? "إجمالي الدخل" : "Total Income"}
            </p>
            <p className="text-2xl font-black text-white">
              {totalIncomeThisMonth.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{isRTL ? "ج.م" : "EGP"}</span>
            </p>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div variants={itemVariants} className="glass-strong p-5 rounded-2xl flex items-center gap-4 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              {isRTL ? "إجمالي المصروفات" : "Total Expenses"}
            </p>
            <p className="text-2xl font-black text-white">
              {totalExpenseThisMonth.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{isRTL ? "ج.م" : "EGP"}</span>
            </p>
          </div>
        </motion.div>

        {/* Net Savings */}
        <motion.div variants={itemVariants} className="glass-strong p-5 rounded-2xl flex items-center gap-4 border border-brainhance-purple/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brainhance-purple to-brainhance-glow flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              {isRTL ? "التوفير الصافي" : "Net Savings"}
            </p>
            <p className={`text-2xl font-black ${netSavings >= 0 ? "text-brainhance-glow" : "text-red-400"}`}>
              {netSavings.toFixed(2)} <span className="text-sm font-normal text-white/50">{isRTL ? "ج.م" : "EGP"}</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Budget Progress Bar (Expenses) ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8"
      >
        <div className="glass-strong rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brainhance-glow" />
              <span className="font-bold text-sm">
                {isRTL ? `الميزانية الشهرية — ${monthName}` : `Monthly Budget — ${monthName}`}
              </span>
            </div>
            <button
              onClick={() => {
                setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : "");
                setShowBudgetEdit(true);
              }}
              className="text-xs text-brainhance-glow hover:text-brainhance-purple font-semibold transition-colors px-3 py-1 rounded-lg hover:bg-brainhance-purple/10"
            >
              {monthlyBudget > 0
                ? isRTL
                  ? "تعديل"
                  : "Edit"
                : isRTL
                ? "تعيين ميزانية"
                : "Set Budget"}
            </button>
          </div>

          {monthlyBudget > 0 ? (
            <>
              <div className="relative h-4 rounded-full bg-white/5 overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsedPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" as const }}
                  className={`absolute inset-y-0 start-0 rounded-full ${
                    isOverBudget
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : budgetUsedPercent > 75
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-brainhance-purple to-brainhance-glow"
                  }`}
                  style={{
                    boxShadow: isOverBudget
                      ? "0 0 20px rgba(239,68,68,0.5)"
                      : "0 0 20px rgba(139,92,246,0.3)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {isRTL
                    ? `${totalExpenseThisMonth.toFixed(0)} من ${monthlyBudget.toFixed(0)} ج.م`
                    : `${totalExpenseThisMonth.toFixed(0)} EGP of ${monthlyBudget.toFixed(0)} EGP`}
                </span>
                <span
                  className={`text-xs font-bold ${
                    isOverBudget ? "text-red-400" : budgetUsedPercent > 75 ? "text-amber-400" : "text-brainhance-glow"
                  }`}
                >
                  {budgetUsedPercent.toFixed(0)}%
                  {isOverBudget && (isRTL ? " ⚠️ تجاوزت الميزانية!" : " ⚠️ Over budget!")}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isRTL
                ? "حدد ميزانية شهرية لتتبع إنفاقك بشكل أفضل"
                : "Set a monthly budget to better track your spending"}
            </p>
          )}
        </div>
      </motion.div>

      {/* ─── Analytics Charts ───────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Pie Chart - Category Breakdown */}
        <motion.div variants={itemVariants}>
          <div className="glass-strong rounded-2xl p-6 border border-white/5 h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brainhance-purple/20 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-brainhance-glow" />
              </div>
              <h3 className="font-bold text-lg">
                {isRTL ? "التوزيع حسب الفئة (المصروفات)" : "Spending by Category"}
              </h3>
            </div>

            {pieData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip isRTL={isRTL} />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-bold text-foreground">
                        {entry.value} {isRTL ? "ج.م" : "EGP"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground/40">
                <ShoppingBag className="w-12 h-12 mb-3" />
                <p className="text-sm">
                  {isRTL ? "لا توجد مصروفات هذا الشهر" : "No expenses this month"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bar Chart - Daily Trend */}
        <motion.div variants={itemVariants}>
          <div className="glass-strong rounded-2xl p-6 border border-white/5 h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brainhance-purple/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-brainhance-glow" />
              </div>
              <h3 className="font-bold text-lg">
                {isRTL ? "الإنفاق اليومي (المصروفات)" : "Daily Spending Trend"}
              </h3>
            </div>

            {monthlyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip isRTL={isRTL} />} cursor={{ fill: "rgba(139,92,246,0.08)" }} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="amount"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground/40">
                <Calendar className="w-12 h-12 mb-3" />
                <p className="text-sm">
                  {isRTL ? "ابدأ بإضافة مصروفاتك" : "Start adding expenses"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Transaction History Button ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex justify-center mt-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHistoryModal(true)}
          className="glass-strong w-full md:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 border border-brainhance-purple/30 hover:border-brainhance-purple/60 transition-colors shadow-lg hover:shadow-brainhance-purple/20 group"
        >
          <History className="w-5 h-5 text-brainhance-glow group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-lg">
            {isRTL ? "سجل العمليات" : "Transaction History"}
          </span>
        </motion.button>
      </motion.div>

      {/* ─── Add Transaction Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              dir={isRTL ? "rtl" : "ltr"}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong border border-white/10 shadow-2xl rounded-3xl p-6 max-w-[400px] w-full relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brainhance-purple to-brainhance-glow" />

              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 end-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black mb-4 text-center bg-gradient-to-r from-brainhance-purple to-brainhance-glow bg-clip-text text-transparent">
                {isRTL ? "✏️ إضافة عملية" : "✏️ Add Transaction"}
              </h3>

              <div className="space-y-3.5">
                {/* Type Toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => handleTypeChange("expense")}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                      formType === "expense"
                        ? "bg-red-500 text-white shadow-md"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {isRTL ? "مصروف" : "Expense"}
                  </button>
                  <button
                    onClick={() => handleTypeChange("income")}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                      formType === "income"
                        ? "bg-green-500 text-white shadow-md"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {isRTL ? "دخل" : "Income"}
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    {isRTL ? "المبلغ" : "Amount"}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={isRTL ? "مثال: 50" : "e.g. 50"}
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    {isRTL ? "التاريخ" : "Date"}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    {isRTL ? "الوصف" : "Description"}
                  </label>
                  <input
                    type="text"
                    placeholder={isRTL ? "مثال: غداء مع الأصدقاء" : "e.g. Lunch with friends"}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brainhance-purple/50 transition-all"
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    {isRTL ? "الفئة" : "Category"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(formType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                      const isSelected = formCategory === cat.key;
                      const color = getCategoryColor(cat.key);
                      return (
                        <motion.button
                          key={cat.key}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setFormCategory(cat.key)}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl border transition-all text-center ${
                            isSelected
                              ? "border-brainhance-purple bg-brainhance-purple/15 shadow-lg"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                          style={isSelected ? { borderColor: color, backgroundColor: `${color}15` } : undefined}
                        >
                          <span className="text-lg">{cat.emoji}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
                            {isRTL ? cat.ar : cat.en}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => setShowAddModal(false)}
                    variant="ghost"
                    className="flex-1 rounded-xl py-3 hover:bg-white/5"
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    disabled={!formAmount || !formDescription.trim()}
                    className="flex-1 rounded-xl py-3 bg-gradient-to-r from-brainhance-purple to-brainhance-glow hover:opacity-90 text-white font-black text-sm shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    {isRTL ? "إضافة" : "Add"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Transaction History Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-6"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              dir={isRTL ? "rtl" : "ltr"}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong border border-white/10 shadow-2xl rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brainhance-purple to-brainhance-glow" />

              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brainhance-purple/20 flex items-center justify-center">
                    <History className="w-5 h-5 text-brainhance-glow" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black">
                    {isRTL ? "سجل العمليات" : "Transaction History"}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <MonthPicker 
                    value={historyMonth} 
                    onChange={setHistoryMonth} 
                    locale={isRTL ? "ar" : "en"} 
                    align={isRTL ? "left" : "right"}
                  />
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(() => {
                  const filteredTransactions = transactions.filter(t => t.date.startsWith(historyMonth));
                  
                  // Calculate Summary
                  const mIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                  const mExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                  const mSavings = mIncome - mExpense;
                  
                  // Top Category
                  const catTotals = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                  }, {} as Record<string, number>);
                  const topCatKey = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0];
                  const topCatLabel = topCatKey ? getCategoryLabel(topCatKey, isRTL) : (isRTL ? "لا يوجد" : "None");
                  const topCatAmount = topCatKey ? catTotals[topCatKey] : 0;

                  return (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="glass-strong p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                          <span className="text-xs text-muted-foreground mb-1">{isRTL ? "إجمالي الدخل" : "Total Income"}</span>
                          <span className="font-black text-green-400">{mIncome.toFixed(0)}</span>
                        </div>
                        <div className="glass-strong p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                          <span className="text-xs text-muted-foreground mb-1">{isRTL ? "إجمالي المصروفات" : "Total Expense"}</span>
                          <span className="font-black text-red-400">{mExpense.toFixed(0)}</span>
                        </div>
                        <div className="glass-strong p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                          <span className="text-xs text-muted-foreground mb-1">{isRTL ? "صافي التوفير" : "Net Savings"}</span>
                          <span className={`font-black ${mSavings >= 0 ? "text-brainhance-glow" : "text-amber-500"}`}>{mSavings.toFixed(0)}</span>
                        </div>
                        <div className="glass-strong p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                          <span className="text-xs text-muted-foreground mb-1">{isRTL ? "أعلى فئة صرف" : "Top Category"}</span>
                          <span className="font-bold text-sm truncate w-full">{topCatLabel} <span className="text-xs opacity-60">({topCatAmount.toFixed(0)})</span></span>
                        </div>
                      </div>

                      {filteredTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {[...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => {
                      const color = getCategoryColor(transaction.category);
                      const isIncome = transaction.type === "income";
                      
                      return (
                        <div
                          key={transaction.id}
                          className="glass-strong rounded-xl p-4 border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-colors"
                        >
                          {/* Category Icon */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            {ALL_CATEGORIES.find(c => c.key === transaction.category)?.emoji || "📦"}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate">{transaction.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${color}20`,
                                  color: color,
                                }}
                              >
                                {getCategoryLabel(transaction.category, isRTL)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString(
                                  isRTL ? "ar-EG" : "en-US",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-end shrink-0 flex flex-col items-end">
                            <span className={`font-black text-lg ${isIncome ? 'text-green-400' : 'text-foreground'}`}>
                              {isIncome ? "+" : "-"}{transaction.amount.toFixed(2)} <span className="text-xs font-normal opacity-60">{isRTL ? "ج.م" : "EGP"}</span>
                            </span>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(transaction)}
                            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0 ms-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <GlowCard className="w-full flex flex-col items-center justify-center py-16 text-center">
                      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      </motion.div>
                      <p className="text-muted-foreground font-semibold">
                        {isRTL ? "لا توجد عمليات في هذا الشهر" : "No transactions in this month"}
                      </p>
                    </GlowCard>
                  </div>
                )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Budget Edit Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showBudgetEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowBudgetEdit(false)}
          >
            <motion.div
              dir={isRTL ? "rtl" : "ltr"}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong border border-white/10 shadow-2xl rounded-3xl p-8 max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

              <h3 className="text-xl font-black mb-6 text-center">
                {isRTL ? "🎯 تعيين الميزانية الشهرية" : "🎯 Set Monthly Budget"}
              </h3>

              <div className="relative mb-6">
                <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={isRTL ? "مثال: 3000" : "e.g. 3000"}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 py-4 text-white text-xl font-bold placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowBudgetEdit(false)}
                  variant="ghost"
                  className="flex-1 rounded-xl py-6 hover:bg-white/5"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveBudget}
                  className="flex-1 rounded-xl py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center"
                >
                  {isRTL ? "حفظ" : "Save"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) removeTransaction(deleteTarget.id); }}
        itemName={deleteTarget?.description}
      />
    </div>
  );
}
