"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { 
  Lightbulb, Timer, Flame, Trophy, BarChart2, Brain, Zap, AlertTriangle 
} from "lucide-react";

interface DailyFocus {
  date: string;
  totalMinutes: number;
}

function getDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatMinutes(minutes: number, locale: string): string {
  if (minutes < 60) {
    return locale === "ar"
      ? `${Math.round(minutes)} دقيقة`
      : `${Math.round(minutes)} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) {
    return locale === "ar" ? `${h} ساعة` : `${h}h`;
  }
  return locale === "ar" ? `${h} ساعة ${m} د` : `${h}h ${m}m`;
}

function getLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const LEVEL_COLORS = [
  "bg-white/5",
  "bg-brainhance-purple/30",
  "bg-brainhance-purple/60",
  "bg-brainhance-purple/90",
  "bg-brainhance-purple shadow-[0_0_8px_rgba(139,92,246,0.6)]",
];

const LEVEL_LABELS: Record<string, string[]> = {
  ar: ["لا تركيز", "1-30 دقيقة", "30-60 دقيقة", "60-120 دقيقة", "+120 دقيقة"],
  en: ["No focus", "1-30 min", "30-60 min", "60-120 min", "120+ min"],
};

export default function InsightsPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyFocus[]>([]);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  // ─── Fetch last 100 days of focus sessions ──────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);
    const since = hundredDaysAgo.toISOString();

    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .gte("start_time", since)
      .order("start_time", { ascending: true });

    // Aggregate per day
    const dayMap = new Map<string, number>();
    for (const s of sessions || []) {
      if (!s.start_time || !s.end_time) continue;
      const day = getDateString(new Date(s.start_time));
      const durationSec =
        (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000;
      const durationMin = durationSec / 60;
      dayMap.set(day, (dayMap.get(day) || 0) + durationMin);
    }

    // Ensure all 100 days exist (fill gaps with 0)
    const result: DailyFocus[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 99);
    for (let i = 0; i < 100; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = getDateString(d);
      result.push({ date: key, totalMinutes: Math.round(dayMap.get(key) || 0) });
    }
    setDailyData(result);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Analytics computed values ──────────────────────────
  const totalMinutes = useMemo(
    () => dailyData.reduce((acc, d) => acc + d.totalMinutes, 0),
    [dailyData]
  );

  const streak = useMemo(() => {
    // Count consecutive days ending with today that have > 0 minutes
    // first check today, then yesterday, etc.
    let count = 0;
    const today = new Date();
    for (let i = 0; i < dailyData.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDateString(d);
      const entry = dailyData.find((x) => x.date === key);
      if (entry && entry.totalMinutes > 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [dailyData]);

  const bestDay = useMemo(() => {
    let best: DailyFocus | null = null;
    for (const d of dailyData) {
      if (!best || d.totalMinutes > best.totalMinutes) best = d;
    }
    return best || dailyData[0];
  }, [dailyData]);

  // ─── Heatmap layout ─────────────────────────────────────
  const weeks = useMemo(() => {
    if (!dailyData.length) return [];
    const cols: DailyFocus[][] = [];
    const padStart = new Date(dailyData[0].date + "T00:00:00");
    const startDay = padStart.getDay() || 0; // 0=Sun
    // Add empty pads before first day
    const padded = [...Array(startDay).fill(null), ...dailyData];
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7));
    }
    return cols;
  }, [dailyData]);

  // ─── AI Insights (keep existing) ───────────────────────
  const generateInsights = useCallback(async () => {
    if (!userId) return;
    setGenerating(true);
    setInsights(null);

    const start = new Date();
    start.setDate(start.getDate() - 30);
    const since = start.toISOString();

    const [focusRes, goalsRes, energyRes, journalsRes] = await Promise.all([
      supabase.from("focus_sessions").select("*").eq("user_id", userId).gte("start_time", since),
      supabase.from("goals").select("*").eq("user_id", userId),
      supabase
        .from("daily_energy")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(30),
      supabase
        .from("voice_journals")
        .select("transcription_text, ai_summary, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          focusSessions: focusRes.data || [],
          voiceJournals: journalsRes.data || [],
          goals: goalsRes.data || [],
          dailyEnergy: energyRes.data || [],
        }),
      });

      const data = await res.json();
      setInsights(
        data.insights ||
          (locale === "ar" ? "لم يتم الحصول على رؤى." : "No insights received.")
      );
    } catch {
      setInsights(locale === "ar" ? "حدث خطأ في الاتصال." : "Connection error.");
    } finally {
      setGenerating(false);
    }
  }, [userId, locale]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh]"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-foreground">{t(locale, "loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Lightbulb className="w-7 h-7 text-brainhance-glow" />
          <span className="gradient-text">
            {locale === "ar" ? "الرؤى والتحليلات" : "Insights & Analytics"}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "تتبع تركيزك وإنتاجيتك خلال الـ 100 يوم الماضية"
            : "Track your focus and productivity over the last 100 days"}
        </p>
      </motion.div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <GlowCard>
            <div className="flex items-center gap-3">
              <Timer className="w-8 h-8 text-brainhance-purple shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "إجمالي وقت التركيز" : "Total Focus Time"}
                </p>
                <p className="text-xl font-bold text-brainhance-glow truncate">
                  {formatMinutes(totalMinutes, locale)}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard>
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "الأيام المتتالية" : "Current Streak"}
                </p>
                <p className="text-xl font-bold text-brainhance-glow">
                  {streak}{" "}
                  {locale === "ar" ? "يوم" : streak === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlowCard>
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "أفضل يوم" : "Best Day"}
                </p>
                <p className="text-xl font-bold text-brainhance-glow truncate">
                  {bestDay ? formatMinutes(bestDay.totalMinutes, locale) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {bestDay ? formatDateLabel(bestDay.date, locale) : ""}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* GitHub-style Heatmap */}
      <GlowCard>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-brainhance-purple" />
          {locale === "ar" ? "خريطة التركيز" : "Focus Heatmap"}
        </h3>

        <div className="overflow-x-auto pb-2 flex gap-2 items-start" dir="ltr">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] shrink-0 text-[10px] text-muted-foreground pe-1">
             <div className="h-[14px] flex items-center leading-none justify-end"></div>
             <div className="h-[14px] flex items-center leading-none justify-end">{locale === "ar" ? "ن" : "Mon"}</div>
             <div className="h-[14px] flex items-center leading-none justify-end"></div>
             <div className="h-[14px] flex items-center leading-none justify-end">{locale === "ar" ? "ث" : "Wed"}</div>
             <div className="h-[14px] flex items-center leading-none justify-end"></div>
             <div className="h-[14px] flex items-center leading-none justify-end">{locale === "ar" ? "ج" : "Fri"}</div>
             <div className="h-[14px] flex items-center leading-none justify-end"></div>
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) =>
                  day === null ? (
                    <div key={di} className="w-[14px] h-[14px]" />
                  ) : (
                    <div
                      key={day.date}
                      className={`w-[14px] h-[14px] rounded-sm ${LEVEL_COLORS[getLevel(day.totalMinutes)]} transition-colors cursor-default`}
                      title={`${formatDateLabel(day.date, locale)} — ${formatMinutes(day.totalMinutes, locale)}`}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>{locale === "ar" ? "أقل" : "Less"}</span>
          {LEVEL_COLORS.map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>{locale === "ar" ? "أكثر" : "More"}</span>
        </div>
      </GlowCard>

      {/* AI Insights */}
      <GlowCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-brainhance-purple" />
            {locale === "ar" ? "رؤى الذكاء الاصطناعي" : "AI Insights"}
          </h3>
          <Button
            onClick={generateInsights}
            disabled={generating}
            className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
          >
            {generating
              ? locale === "ar"
                ? "جاري الاستخراج..."
                : "Generating..."
              : <><Zap className="w-4 h-4 mr-1" /> {locale === "ar" ? "استخرج الرؤى" : "Extract Insights"}</>}
          </Button>
        </div>

        {generating && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-12 h-12 border-2 border-brainhance-purple border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "جاري تحليل الأنماط..." : "Analyzing patterns..."}
              </p>
            </div>
          </div>
        )}

        {insights && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed"
          >
            {insights}
          </motion.div>
        )}

        {!insights && !generating && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? 'اضغط على "استخرج الرؤى" لتحليل أنماط تركيزك واكتشاف رؤى ذكية'
                : 'Click "Extract Insights" to analyze your focus patterns and discover smart insights'}
            </p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
