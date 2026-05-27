"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  Target, Sword, Lock, CheckCircle, Circle, Calendar, Star, Trophy,
  ChevronRight, Sparkles, RefreshCw, Play, Brain, Zap, Clock, CheckCheck,
  Gift, PartyPopper, Loader2, Plus, Trash2, ListTodo, Sun, Moon,
} from "lucide-react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

// ─── Types ──────────────────────────────────────────────
interface DailyTask {
  text: string;
  type: "strategic" | "buffer";
  completed: boolean;
}

interface DayData {
  dayNumber: number;
  dayName: string;
  tasks: DailyTask[];
}

interface WeekData {
  weekNumber: number;
  tasks: any[];
  focusDescription: string;
}

interface TwelveWeekPlan {
  id: string;
  goals_json: string[];
  strategy: string;
  month_mapping: Record<string, number[]>;
  status: "active" | "completed" | "abandoned";
  start_date: string;
}

interface TwelveWeekTaskRecord {
  id?: string;
  plan_id: string;
  week_number: number;
  tasks_json: any[];
  milestone: string;
  daily_tasks_json: DayData[];
  strategic_block_done: boolean;
  buffer_block_done: boolean;
  breakout_block_done: boolean;
  week_completed: boolean;
  review_notes: string;
}

// ─── Helpers ────────────────────────────────────────────
function getWeekStatus(
  weekNumber: number,
  records: Map<number, TwelveWeekTaskRecord>,
  currentWeek: number
): "past" | "current" | "future" | "locked" {
  if (weekNumber === 13) {
    const w13 = records.get(13);
    const w12 = records.get(12);
    if (w12?.week_completed) return "past";
    return w13?.week_completed ? "current" : "locked";
  }
  if (weekNumber < currentWeek) return "past";
  if (weekNumber === currentWeek) return "current";
  return "locked";
}

function computeCurrentWeek(records: Map<number, TwelveWeekTaskRecord>): number {
  for (let i = 1; i <= 12; i++) {
    const r = records.get(i);
    if (!r || !r.week_completed) return i;
  }
  return 13;
}

const DAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_NAMES_AR = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];

// ─── Main Page ──────────────────────────────────────────
export default function BattlePlanPage() {
  const { locale } = useLanguageStore();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  // Setup state
  const [goals, setGoals] = useState<string[]>([""]);
  const [monthMapping, setMonthMapping] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingMicro, setGeneratingMicro] = useState(false);
  const [error, setError] = useState("");

  // Plan state
  const [planId, setPlanId] = useState<string | null>(null);
  const [dbPlan, setDbPlan] = useState<TwelveWeekPlan | null>(null);
  const [tasksRecords, setTasksRecords] = useState<Map<number, TwelveWeekTaskRecord>>(new Map());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [viewingWeek, setViewingWeek] = useState(1);

  // Review
  const [showReview, setShowReview] = useState(false);
  const [reviewLocked, setReviewLocked] = useState(false);
  const [microError, setMicroError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; name: string } | null>(null);

  // ─── Init month mapping when goals change ──────
  useEffect(() => {
    setMonthMapping((prev) => {
      const next: Record<string, number[]> = {};
      for (let i = 0; i < goals.length; i++) {
        next[String(i)] = prev[String(i)] || [1, 2, 3];
      }
      return next;
    });
  }, [goals.length]);

  // ─── Load existing plan on mount ────────────────
  useEffect(() => {
    if (!user?.id) return;
    loadActivePlan();
  }, [user?.id]);

  const loadActivePlan = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: plan } = await supabase
      .from("twelve_week_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) {
      setLoading(false);
      return;
    }

    setPlanId(plan.id);
    setDbPlan(plan);
    setGoals(Array.isArray(plan.goals_json) ? plan.goals_json : [""]);
    setMonthMapping(plan.month_mapping || {});

    const { data: tasks } = await supabase
      .from("twelve_week_tasks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("week_number", { ascending: true });

    const records = new Map<number, TwelveWeekTaskRecord>();

    if (tasks) {
      for (const t of tasks) {
        records.set(t.week_number, {
          id: t.id,
          plan_id: t.plan_id,
          week_number: t.week_number,
          tasks_json: t.tasks_json || [],
          milestone: t.milestone || "",
          daily_tasks_json: t.daily_tasks_json || [],
          strategic_block_done: t.strategic_block_done || false,
          buffer_block_done: t.buffer_block_done || false,
          breakout_block_done: t.breakout_block_done || false,
          week_completed: t.week_completed || false,
          review_notes: t.review_notes || "",
        });
      }
    }

    setTasksRecords(records);
    const cw = computeCurrentWeek(records);
    setCurrentWeek(cw);
    setViewingWeek(cw);
    setLoading(false);
  };

  // ─── Generate macro plan ────────────────────────
  const generatePlan = async () => {
    const validGoals = goals.filter((g) => g.trim());
    if (validGoals.length === 0) return;
    if (!user?.id) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/12week/macro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: validGoals, monthMapping, locale }),
      });

      const data = await res.json();
      if (!res.ok || !data.weeks || data.weeks.length === 0) {
        setError(data.error || (locale === "ar" ? "فشل في إنشاء الخطة." : "Failed to generate plan."));
        return;
      }

      const { data: newPlan, error: planErr } = await supabase
        .from("twelve_week_plans")
        .insert({
          user_id: user.id,
          goals_json: validGoals,
          strategy: "custom",
          month_mapping: monthMapping,
          status: "active",
          start_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (planErr || !newPlan) {
        setError(locale === "ar" ? "فشل في حفظ الخطة." : "Failed to save plan.");
        return;
      }

      setPlanId(newPlan.id);
      setDbPlan(newPlan);

      const weekInserts = data.weeks.map((w: any) => ({
        plan_id: newPlan.id,
        week_number: w.weekNumber,
        tasks_json: [],
        milestone: w.milestone || "",
        daily_tasks_json: [],
        strategic_block_done: false,
        buffer_block_done: false,
        breakout_block_done: false,
        week_completed: false,
        review_notes: "",
      }));

      const { data: insertedTasks } = await supabase
        .from("twelve_week_tasks")
        .insert(weekInserts)
        .select();

      const records = new Map<number, TwelveWeekTaskRecord>();
      if (insertedTasks) {
        for (const t of insertedTasks) {
          records.set(t.week_number, {
            id: t.id,
            plan_id: t.plan_id,
            week_number: t.week_number,
            tasks_json: [],
            milestone: t.milestone || "",
            daily_tasks_json: [],
            strategic_block_done: false,
            buffer_block_done: false,
            breakout_block_done: false,
            week_completed: false,
            review_notes: "",
          });
        }
      }

      setTasksRecords(records);
      setCurrentWeek(1);
      setViewingWeek(1);
    } catch {
      setError(locale === "ar" ? "حدث خطأ في الاتصال." : "Connection error.");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Generate daily execution plan (micro) ─────
  const generateDailyPlan = async () => {
    const rec = tasksRecords.get(currentWeek);
    if (!rec || !rec.milestone) {
      setMicroError(locale === "ar"
        ? "لا يوجد معلم أسبوعي. أنشئ الخطة الرئيسية أولاً."
        : "No weekly milestone available. Generate the main plan first.");
      return;
    }

    setGeneratingMicro(true);
    setMicroError("");

    try {
      const res = await fetch("/api/12week/micro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestone: rec.milestone, weekNumber: currentWeek, locale }),
      });

      const data = await res.json();
      if (!res.ok || !data.days || data.days.length === 0) {
        setMicroError(data.error || (locale === "ar" ? "فشل في إنشاء الخطة اليومية." : "Failed to generate daily plan."));
        return;
      }

      const daysWithCompletion: DayData[] = data.days.map((d: any) => ({
        dayNumber: d.dayNumber,
        dayName: d.dayName,
        tasks: (d.tasks || []).map((t: any) => ({
          text: t.text,
          type: t.type || "strategic",
          completed: false,
        })),
      }));

      const updatedRec = { ...rec, daily_tasks_json: daysWithCompletion };
      const newRecords = new Map(tasksRecords);
      newRecords.set(currentWeek, updatedRec);
      setTasksRecords(newRecords);

      await supabase.from("twelve_week_tasks").upsert({
        id: rec.id,
        plan_id: rec.plan_id,
        week_number: currentWeek,
        tasks_json: rec.tasks_json,
        milestone: rec.milestone,
        daily_tasks_json: daysWithCompletion,
        strategic_block_done: rec.strategic_block_done,
        buffer_block_done: rec.buffer_block_done,
        breakout_block_done: rec.breakout_block_done,
        week_completed: rec.week_completed,
        review_notes: rec.review_notes,
      }, { onConflict: "plan_id, week_number" });
    } catch {
      setMicroError(locale === "ar" ? "حدث خطأ في الاتصال." : "Connection error.");
    } finally {
      setGeneratingMicro(false);
    }
  };

  // ─── Toggle daily task ─────────────────────────
  const toggleDailyTask = async (dayIndex: number, taskIndex: number) => {
    const rec = tasksRecords.get(currentWeek);
    if (!rec || !rec.daily_tasks_json[dayIndex]) return;

    const updatedDays = rec.daily_tasks_json.map((day, di) => {
      if (di !== dayIndex) return day;
      return {
        ...day,
        tasks: day.tasks.map((t, ti) =>
          ti === taskIndex ? { ...t, completed: !t.completed } : t
        ),
      };
    });

    const updatedRec = { ...rec, daily_tasks_json: updatedDays };
    const newRecords = new Map(tasksRecords);
    newRecords.set(currentWeek, updatedRec);
    setTasksRecords(newRecords);

    await supabase.from("twelve_week_tasks").upsert({
      id: rec.id,
      plan_id: rec.plan_id,
      week_number: currentWeek,
      tasks_json: rec.tasks_json,
      milestone: rec.milestone,
      daily_tasks_json: updatedDays,
      strategic_block_done: rec.strategic_block_done,
      buffer_block_done: rec.buffer_block_done,
      breakout_block_done: rec.breakout_block_done,
      week_completed: rec.week_completed,
      review_notes: rec.review_notes,
    }, { onConflict: "plan_id, week_number" });
  };

  // ─── Toggle time block ─────────────────────────
  const toggleBlock = async (block: "strategic_block_done" | "buffer_block_done" | "breakout_block_done") => {
    const rec = tasksRecords.get(currentWeek);
    if (!rec) return;

    const updatedRec = { ...rec, [block]: !rec[block] };
    const newRecords = new Map(tasksRecords);
    newRecords.set(currentWeek, updatedRec);
    setTasksRecords(newRecords);

    await supabase.from("twelve_week_tasks").upsert({
      id: rec.id,
      plan_id: rec.plan_id,
      week_number: currentWeek,
      tasks_json: rec.tasks_json,
      milestone: rec.milestone,
      daily_tasks_json: rec.daily_tasks_json,
      strategic_block_done: updatedRec.strategic_block_done,
      buffer_block_done: updatedRec.buffer_block_done,
      breakout_block_done: updatedRec.breakout_block_done,
      week_completed: rec.week_completed,
      review_notes: rec.review_notes,
    }, { onConflict: "plan_id, week_number" });
  };

  // ─── Complete week review ──────────────────────
  const submitReview = async (executed: boolean) => {
    const rec = tasksRecords.get(currentWeek);
    if (!rec || !planId) return;

    const notes = executed
      ? (locale === "ar" ? "تم التنفيذ ✅" : "Executed ✅")
      : (locale === "ar" ? "لم يتم التنفيذ، سأحاول الأسبوع القادم" : "Not executed, will try next week");

    const updatedRec = { ...rec, week_completed: executed, review_notes: notes };
    const newRecords = new Map(tasksRecords);
    newRecords.set(currentWeek, updatedRec);
    setTasksRecords(newRecords);
    setShowReview(false);

    await supabase.from("twelve_week_tasks").upsert({
      id: rec.id,
      plan_id: planId,
      week_number: currentWeek,
      tasks_json: rec.tasks_json,
      milestone: rec.milestone,
      daily_tasks_json: rec.daily_tasks_json,
      strategic_block_done: rec.strategic_block_done,
      buffer_block_done: rec.buffer_block_done,
      breakout_block_done: rec.breakout_block_done,
      week_completed: executed,
      review_notes: notes,
    }, { onConflict: "plan_id, week_number" });

    if (executed) {
      const nextWeek = currentWeek + 1;
      setCurrentWeek(nextWeek);
      setViewingWeek(nextWeek);
      setReviewLocked(false);

      if (currentWeek === 12) {
        await supabase.from("twelve_week_plans").update({ status: "completed" }).eq("id", planId);
        setDbPlan((prev: TwelveWeekPlan | null) => prev ? { ...prev, status: "completed" } : null);
      }
    } else {
      setReviewLocked(true);
    }
  };

  const promptReview = () => {
    if (reviewLocked) return;
    setShowReview(true);
  };

  // ─── Goal management ───────────────────────────
  const addGoal = () => { if (goals.length < 3) setGoals([...goals, ""]); };
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const i = deleteTarget.index;
    if (goals.length > 1) {
      setGoals(goals.filter((_, idx) => idx !== i));
    }
    setDeleteTarget(null);
  };
  const updateGoal = (i: number, val: string) => { const n = [...goals]; n[i] = val; setGoals(n); };

  const toggleMonth = (goalIdx: number, month: number) => {
    setMonthMapping((prev) => {
      const key = String(goalIdx);
      const current = prev[key] || [1, 2, 3];
      const next = current.includes(month)
        ? current.filter((m) => m !== month)
        : [...current, month].sort();
      return { ...prev, [key]: next.length > 0 ? next : [month] };
    });
  };

  // ─── Derived ───────────────────────────────────
  const weekStatus = getWeekStatus(viewingWeek, tasksRecords, currentWeek);
  const currentRec = tasksRecords.get(viewingWeek);
  const hasDailyPlan = currentRec && currentRec.daily_tasks_json && currentRec.daily_tasks_json.length > 0 && currentRec.daily_tasks_json.some((d) => d.tasks.length > 0);

  // ─── Loading ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brainhance-purple animate-spin" />
          <p className="text-sm text-muted-foreground">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Sword className="w-7 h-7 text-brainhance-purple" />
          <span className="gradient-text">
            {locale === "ar" ? "السنة ذات 12 أسبوعاً" : "12-Week Year"}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "حوّل أهدافك الكبرى إلى خطة تنفيذ عاجلة مع تفكيك تدريجي: أهداف ← معالم أسبوعية ← مهام يومية"
            : "Progressive deconstruction: Macro Goals → Weekly Milestones → Daily Micro-tasks"}
        </p>
      </motion.div>

      {/* ─── Setup Phase ──────────────────────────── */}
      {!planId && (
        <GlowCard>
          <div className="space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2 text-brainhance-purple">
              <Target className="w-4 h-4" />
              {locale === "ar" ? "حدد أهدافك الكبرى (1-3)" : "Define Your Macro Goals (1-3)"}
            </h3>

            <div className="space-y-3">
              {goals.map((g, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="bg-gradient-to-br from-brainhance-purple to-brainhance-violet text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 text-sm">
                    {i + 1}
                  </span>
                  <Textarea
                    value={g}
                    onChange={(e) => updateGoal(i, e.target.value)}
                    placeholder={locale === "ar" ? `الهدف ${i + 1}...` : `Goal ${i + 1}...`}
                    className="flex-1 bg-background/50 resize-none min-h-[60px]"
                    rows={2}
                  />
                  {goals.length > 1 && (
                    <button onClick={() => setDeleteTarget({ index: i, name: goals[i] || (locale === "ar" ? "الهدف" : "Goal") })} className="text-muted-foreground hover:text-destructive p-1 mt-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {goals.length < 3 && (
                <button onClick={addGoal} className="flex items-center gap-2 text-xs text-brainhance-purple hover:text-brainhance-glow transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {locale === "ar" ? "إضافة هدف" : "Add Goal"}
                </button>
              )}
            </div>

            {/* ─── Custom Month Mapping Board ──────── */}
            <div>
              <label className="block text-sm font-medium mb-3">
                {locale === "ar" ? "🧩 لوحة التخصيص — في أي الأشهر يعمل كل هدف؟" : "🧩 Customization Board — Which months is each goal active?"}
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-[40px_repeat(3,1fr)] gap-2 text-[10px] font-semibold text-muted-foreground mb-1">
                  <div />
                  <div className="text-center">{locale === "ar" ? "الشهر 1 (أس 1-4)" : "Month 1 (Wk 1-4)"}</div>
                  <div className="text-center">{locale === "ar" ? "الشهر 2 (أس 5-8)" : "Month 2 (Wk 5-8)"}</div>
                  <div className="text-center">{locale === "ar" ? "الشهر 3 (أس 9-12)" : "Month 3 (Wk 9-12)"}</div>
                </div>
                {goals.map((_, gi) => (
                  <div key={gi} className="grid grid-cols-[40px_repeat(3,1fr)] gap-2 items-center">
                    <span className="text-xs font-bold text-brainhance-purple text-center">{gi + 1}</span>
                    {[1, 2, 3].map((m) => {
                      const active = (monthMapping[String(gi)] || [1, 2, 3]).includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleMonth(gi, m)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? "bg-brainhance-purple/20 border border-brainhance-purple/50 text-brainhance-glow shadow-sm"
                              : "glass border border-border/20 text-muted-foreground/50 hover:text-foreground hover:border-border/50"
                          }`}
                        >
                          {active ? "✓" : "—"}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={generatePlan}
              disabled={generating || goals.filter((g) => g.trim()).length === 0}
              className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === "ar" ? "جاري إنشاء المعالم الأسبوعية..." : "Generating weekly milestones..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {locale === "ar" ? "أنشئ خطة الـ 12 أسبوعاً (SMARTER)" : "Generate 12-Week Plan (SMARTER)"}
                </span>
              )}
            </Button>
          </div>
        </GlowCard>
      )}

      {/* ─── Active Plan ───────────────────────────── */}
      {planId && (
        <>
          {/* Journey Map */}
          <GlowCard>
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center gap-0 min-w-[700px] px-4 pt-6 pb-2 relative">
                {Array.from({ length: 13 }, (_, i) => i + 1).map((wn) => {
                  const ws = getWeekStatus(wn, tasksRecords, currentWeek);
                  const is13 = wn === 13;
                  const rec = tasksRecords.get(wn);
                  const hasDaily = rec && rec.daily_tasks_json && rec.daily_tasks_json.some((d) => d.tasks.length > 0);

                  return (
                    <div key={wn} className="flex flex-col items-center gap-1.5 relative flex-1">
                      {/* Connector */}
                      {wn < 13 && (
                        <div className={`absolute top-5 start-1/2 w-full h-0.5 -z-0 ${
                          ws === "past" ? "bg-brainhance-success/50" : "bg-white/5"
                        }`} />
                      )}

                      <button
                        onClick={() => { if (ws !== "locked") setViewingWeek(wn); }}
                        disabled={ws === "locked"}
                        className="relative z-10"
                      >
                        <motion.div
                          animate={ws === "current" ? { scale: [1, 1.12, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative
                            ${ws === "past" ? "bg-brainhance-success/20 text-brainhance-success border-2 border-brainhance-success/50" : ""}
                            ${ws === "current" ? "bg-brainhance-purple text-white shadow-lg shadow-brainhance-purple/40 ring-2 ring-brainhance-purple/60 scale-110" : ""}
                            ${ws === "locked" ? "bg-white/5 text-muted-foreground/30 border border-white/10 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                          `}
                        >
                          {ws === "past" ? (
                            <CheckCheck className="w-5 h-5" />
                          ) : ws === "current" && is13 ? (
                            <Gift className="w-5 h-5" />
                          ) : ws === "current" ? (
                            <Play className="w-4 h-4 ms-0.5" />
                          ) : ws === "locked" ? (
                            <Lock className="w-4 h-4" />
                          ) : is13 ? (
                            <PartyPopper className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">{wn}</span>
                          )}
                        </motion.div>
                        {/* Daily plan indicator */}
                        {hasDaily && ws === "current" && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-brainhance-success rounded-full border-2 border-background flex items-center justify-center"
                          >
                            <ListTodo className="w-2 h-2 text-white" />
                          </motion.div>
                        )}
                      </button>

                      <span className={`text-[9px] font-medium whitespace-nowrap ${
                        ws === "current" ? "text-brainhance-purple" :
                        ws === "past" ? "text-brainhance-success" :
                        "text-muted-foreground/50"
                      }`}>
                        {is13
                          ? (locale === "ar" ? "احتفال" : "Celebrate")
                          : `${locale === "ar" ? "أسبوع" : "Wk"} ${wn}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlowCard>

          {/* Error */}
          <AnimatePresence>
            {(error || microError) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass rounded-xl p-4 text-sm text-destructive text-center"
              >
                {error || microError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Week Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewingWeek}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {viewingWeek === 13 ? (
                <CelebrationWeek locale={locale} planStatus={dbPlan?.status || "active"} onStartNew={loadActivePlan} />
              ) : weekStatus === "locked" ? (
                <GlowCard className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    {locale === "ar"
                      ? "هذا الأسبوع مقفل. أكمل الأسبوع الحالي لفتحه."
                      : "This week is locked. Complete the current week to unlock."}
                  </p>
                </GlowCard>
              ) : currentRec ? (
                <WeekContentView
                  locale={locale}
                  weekNum={viewingWeek}
                  isCurrent={viewingWeek === currentWeek}
                  record={currentRec}
                  hasDailyPlan={!!hasDailyPlan}
                  generatingMicro={generatingMicro}
                  onGenerateDaily={generateDailyPlan}
                  onToggleDailyTask={toggleDailyTask}
                  onToggleBlock={toggleBlock}
                  onPromptReview={promptReview}
                />
              ) : (
                <GlowCard className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 text-brainhance-purple animate-spin" />
                  <p className="text-sm text-muted-foreground">{locale === "ar" ? "جاري تحميل..." : "Loading..."}</p>
                </GlowCard>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentRec && viewingWeek === currentWeek && !currentRec.week_completed && (
              <Button
                onClick={promptReview}
                disabled={reviewLocked}
                className="flex-1 bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
              >
                <CheckCircle className="w-4 h-4" />
                {locale === "ar" ? "أنهي الأسبوع" : "Complete Week"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setPlanId(null); setDbPlan(null); setTasksRecords(new Map());
                setCurrentWeek(1); setViewingWeek(1); setError(""); setMicroError("");
                setShowReview(false); setReviewLocked(false);
              }}
              className="shrink-0 border-destructive/50 text-destructive hover:text-destructive"
            >
              {locale === "ar" ? "خطة جديدة" : "Start Over"}
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!planId && !loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <motion.div animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <Sword className="w-16 h-16 mx-auto text-brainhance-purple/40" />
            </motion.div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-4">
              {locale === "ar"
                ? "حدد 1-3 أهداف كبرى أعلاه، وخصص الأشهر لكل هدف، ثم اضغط 'أنشئ خطة الـ 12 أسبوعاً'."
                : "Set 1-3 macro goals above, customize the month mapping, and click 'Generate 12-Week Plan'."}
            </p>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full glass rounded-2xl p-8 border border-brainhance-purple/30 shadow-2xl"
            >
              <div className="text-center mb-6">
                <Brain className="w-12 h-12 mx-auto mb-3 text-brainhance-purple" />
                <h3 className="text-xl font-bold gradient-text mb-2">
                  {locale === "ar" ? "مراجعة الأسبوع" : "Weekly Review"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "هل نفذت الإجراءات المخطط لها هذا الأسبوع؟"
                    : "Did you execute the planned actions this week?"}
                </p>
              </div>
              <div className="text-xs text-muted-foreground mb-6 text-center">
                {locale === "ar"
                  ? "التركيز على التنفيذ وليس النتائج. الأسبوع القادم فرصة جديدة."
                  : "Focus on execution, not results. Next week is a fresh opportunity."}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => submitReview(true)}
                  className="flex-1 bg-brainhance-success/20 text-brainhance-success border border-brainhance-success/30 hover:bg-brainhance-success/30"
                >
                  <CheckCircle className="w-4 h-4" />
                  {locale === "ar" ? "نعم" : "Yes"}
                </Button>
                <Button onClick={() => submitReview(false)} variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {locale === "ar" ? "لا" : "No"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!!deleteTarget && (
        <DeleteConfirmModal open={!!deleteTarget}
          itemName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

// ─── Week Content View ───────────────────────────────────
function WeekContentView({
  locale, weekNum, isCurrent, record, hasDailyPlan,
  generatingMicro, onGenerateDaily, onToggleDailyTask, onToggleBlock, onPromptReview,
}: {
  locale: "ar" | "en";
  weekNum: number;
  isCurrent: boolean;
  record: TwelveWeekTaskRecord;
  hasDailyPlan: boolean;
  generatingMicro: boolean;
  onGenerateDaily: () => void;
  onToggleDailyTask: (dayIndex: number, taskIndex: number) => void;
  onToggleBlock: (block: "strategic_block_done" | "buffer_block_done" | "breakout_block_done") => void;
  onPromptReview: () => void;
}) {
  const interactable = isCurrent && !record.week_completed;

  let totalTasks = 0;
  let completedTasks = 0;
  if (hasDailyPlan && record.daily_tasks_json) {
    record.daily_tasks_json.forEach((day: DayData) => {
      totalTasks += day.tasks.length;
      completedTasks += day.tasks.filter((t: DailyTask) => t.completed).length;
    });
  }
  const executionScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  let scoreColor = "text-muted-foreground";
  if (executionScore >= 85) scoreColor = "text-brainhance-success";
  else if (executionScore >= 50) scoreColor = "text-amber-500";
  else if (executionScore > 0) scoreColor = "text-brainhance-glow";

  return (
    <div className="space-y-5">
      {/* Header + Milestone */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brainhance-purple" />
          {locale === "ar" ? `الأسبوع ${weekNum}` : `Week ${weekNum}`}
          {isCurrent && (
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-[10px] bg-brainhance-purple/20 text-brainhance-glow px-2 py-0.5 rounded-full"
            >
              {locale === "ar" ? "حالي" : "Current"}
            </motion.span>
          )}
          {record.week_completed && (
            <span className="text-[10px] bg-brainhance-success/20 text-brainhance-success px-2 py-0.5 rounded-full">
              {locale === "ar" ? "مكتمل" : "Done"}
            </span>
          )}
        </h3>

        {/* Execution Score */}
        {hasDailyPlan && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {locale === "ar" ? "مؤشر التنفيذ (Execution Score)" : "Execution Score"}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${executionScore}%` }} 
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${executionScore >= 85 ? "bg-brainhance-success" : executionScore >= 50 ? "bg-amber-500" : "bg-brainhance-glow"}`}
                />
              </div>
              <span className={`text-xs font-bold ${scoreColor}`}>
                {executionScore}%
              </span>
            </div>
            {executionScore >= 85 && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-brainhance-success flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {locale === "ar" ? "أسبوع ناجح!" : "Winning Week!"}
              </motion.span>
            )}
          </div>
        )}
      </div>

      {record.milestone && (
        <GlowCard className="border-brainhance-purple/30 bg-brainhance-purple/5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-brainhance-purple shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {locale === "ar" ? "المعلم الأسبوعي (SMARTER)" : "Weekly Milestone (SMARTER)"}
              </p>
              <p className="text-sm font-medium leading-relaxed">{record.milestone}</p>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Focus Timer */}
      {isCurrent && <FocusTimer locale={locale} />}

      {/* Daily Tasks Section */}
      {hasDailyPlan ? (
        <DailyTasksView
          locale={locale}
          days={record.daily_tasks_json}
          interactable={interactable}
          onToggleTask={onToggleDailyTask}
        />
      ) : (
        <GlowCard className="text-center py-10 border-dashed">
          <ListTodo className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">
            {locale === "ar"
              ? "لم يتم إنشاء خطة التنفيذ اليومية بعد."
              : "Daily execution plan not yet created."}
          </p>
          {interactable && (
            <Button
              onClick={onGenerateDaily}
              disabled={generatingMicro}
              className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
            >
              {generatingMicro ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === "ar" ? "جاري إنشاء المهام اليومية..." : "Generating daily tasks..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {locale === "ar" ? "أنشئ خطة التنفيذ اليومية" : "Generate Daily Execution Plan"}
                </span>
              )}
            </Button>
          )}
        </GlowCard>
      )}

      {/* Time Block Trackers */}
      <GlowCard>
        <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-brainhance-glow">
          <Clock className="w-4 h-4" />
          {locale === "ar" ? "كتل الوقت" : "Time Blocks"}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "strategic_block_done" as const, icon: "🎯", label: locale === "ar" ? "الكتلة الاستراتيجية" : "Strategic Block", desc: locale === "ar" ? "3 ساعات عمل عميق" : "3 hours deep work", done: record.strategic_block_done },
            { key: "buffer_block_done" as const, icon: "🧹", label: locale === "ar" ? "الكتلة الاحتياطية" : "Buffer Block", desc: locale === "ar" ? "1-2 ساعة إداري" : "1-2 hours admin", done: record.buffer_block_done },
            { key: "breakout_block_done" as const, icon: "🌴", label: locale === "ar" ? "كتلة الاستراحة" : "Breakout Block", desc: locale === "ar" ? "3 ساعات بعيداً عن العمل" : "3 hours away from work", done: record.breakout_block_done },
          ].map((b) => {
            const isBreakout = b.key === "breakout_block_done";
            const doneBg = isBreakout ? "bg-brainhance-success/15 border-brainhance-success/40" : "bg-brainhance-purple/15 border-brainhance-purple/40";
            return (
            <button
              key={b.key}
              onClick={() => { if (interactable) onToggleBlock(b.key); }}
              disabled={!interactable}
              className={`p-4 rounded-xl border text-start transition-all ${
                b.done ? doneBg : "glass border-border/30 hover:border-brainhance-purple/30"
              } ${!interactable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{b.icon}</span>
                {b.done ? <CheckCircle className="w-5 h-5 text-brainhance-success" /> : <Circle className="w-5 h-5 text-muted-foreground/50" />}
              </div>
              <p className="text-xs font-semibold mt-2">{b.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
            </button>
            );
          })}
        </div>
      </GlowCard>

      {record.review_notes && (
        <GlowCard className="border-brainhance-purple/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{locale === "ar" ? "ملاحظات المراجعة:" : "Review notes:"}</span>{" "}
            {record.review_notes}
          </p>
        </GlowCard>
      )}
    </div>
  );
}

// ─── Focus Timer Component ───────────────────────────────
function FocusTimer({ locale }: { locale: "ar" | "en" }) {
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 mins default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Switch mode automatically
      if (mode === "focus") {
        setMode("break");
        setTimeLeft(15 * 60); // 15 min break
      } else {
        setMode("focus");
        setTimeLeft(45 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? 45 * 60 : 15 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <GlowCard className={`border-brainhance-glow/30 ${mode === "focus" ? "bg-brainhance-glow/5" : "bg-brainhance-success/5"} relative overflow-hidden`}>
      {isActive && (
        <motion.div 
          className="absolute inset-0 bg-white/5" 
          animate={{ opacity: [0, 0.5, 0] }} 
          transition={{ duration: 4, repeat: Infinity }}
        />
      )}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold flex items-center gap-2 text-brainhance-glow mb-1">
            <Zap className="w-4 h-4" />
            {locale === "ar" ? "وضع التركيز (Pomodoro)" : "Focus Mode (Pomodoro)"}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${mode === "focus" ? "bg-brainhance-glow/20 text-brainhance-glow" : "bg-brainhance-success/20 text-brainhance-success"}`}>
              {mode === "focus" ? (locale === "ar" ? "تركيز" : "Focus") : (locale === "ar" ? "استراحة" : "Break")}
            </span>
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {locale === "ar" 
              ? "استخدم هذا المؤقت لإنجاز المهام الاستراتيجية العميقة" 
              : "Use this timer for deep strategic tasks"}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-3xl font-mono font-bold tracking-widest text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="flex flex-col gap-1 w-24">
            <Button onClick={toggleTimer} size="sm" className={`h-8 w-full ${isActive ? "bg-destructive text-white hover:bg-destructive/90" : "bg-brainhance-purple text-white"}`}>
              {isActive ? (locale === "ar" ? "إيقاف" : "Pause") : (locale === "ar" ? "ابدأ" : "Start")}
            </Button>
            <Button onClick={resetTimer} size="sm" variant="ghost" className="h-6 w-full text-[10px]">
              {locale === "ar" ? "إعادة ضبط" : "Reset"}
            </Button>
          </div>
        </div>
      </div>
    </GlowCard>
  );
}

// ─── Daily Tasks View ────────────────────────────────────
function DailyTasksView({
  locale, days, interactable, onToggleTask,
}: {
  locale: "ar" | "en";
  days: DayData[];
  interactable: boolean;
  onToggleTask: (dayIndex: number, taskIndex: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold flex items-center gap-2">
        <Sun className="w-4 h-4 text-brainhance-glow" />
        {locale === "ar" ? "المهام اليومية (إثنين - أحد)" : "Daily Tasks (Mon - Sun)"}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {days.map((day, di) => {
          const doneCount = day.tasks.filter((t) => t.completed).length;
          return (
            <GlowCard key={di} className={`${!interactable ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[9px] flex items-center justify-center font-bold">
                    {day.dayNumber}
                  </span>
                  {day.dayName}
                </h5>
                <span className="text-[10px] text-muted-foreground">
                  {doneCount}/{day.tasks.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {day.tasks.map((task, ti) => (
                  <div key={ti} className="flex items-start gap-2 group">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => onToggleTask(di, ti)}
                      disabled={!interactable}
                      className={`mt-0.5 ${
                        task.type === "strategic"
                          ? "border-brainhance-purple data-[state=checked]:bg-brainhance-purple"
                          : "border-muted-foreground/50"
                      }`}
                    />
                    <span className={`text-[11px] leading-relaxed flex-1 ${
                      task.completed ? "line-through text-muted-foreground/60" : "text-foreground/90"
                    }`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── Celebration Week ────────────────────────────────────
function CelebrationWeek({ locale, planStatus, onStartNew }: {
  locale: "ar" | "en";
  planStatus: string;
  onStartNew: () => void;
}) {
  return (
    <GlowCard className="text-center py-12">
      <motion.div
        animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <PartyPopper className="w-16 h-16 mx-auto text-brainhance-purple/60" />
      </motion.div>
      <h3 className="text-2xl font-bold gradient-text mb-3 mt-4">
        {locale === "ar" ? "🎉 أسبوع الاحتفال! 🎉" : "🎉 Celebration Week! 🎉"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {locale === "ar"
          ? "أحسنت! لقد أكملت 12 أسبوعاً من التنفيذ المركز. خذ هذا الأسبوع للراحة والاحتفال بإنجازاتك والتخطيط لدورتك القادمة."
          : "Well done! You've completed 12 weeks of focused execution. Take this week to rest, celebrate your wins, and plan your next cycle."}
      </p>
      {planStatus === "active" && (
        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          className="text-xs text-brainhance-glow mb-6">
          {locale === "ar" ? "الأسبوع 12 يجب إكماله أولاً" : "Week 12 must be completed first"}
        </motion.p>
      )}
      {planStatus === "completed" && (
        <Button onClick={onStartNew} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white">
          <RefreshCw className="w-4 h-4" />
          {locale === "ar" ? "ابدأ دورة جديدة" : "Start New Cycle"}
        </Button>
      )}
    </GlowCard>
  );
}
