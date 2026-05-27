"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useOnboardingStore, useAuthStore, useGamificationStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { Timer, Compass, Zap, Flame, Activity, CircleDot, Bot, MessageCircle, BarChart3, TrendingUp, Frown, Meh, Smile, CloudMoon, CheckCircle2, ListChecks, Trophy, RefreshCw, Sword } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { playChime } from "@/components/notifications/ToastProvider";

// ─── Wheel of Life Radar ─────────────────────────────────
function WheelOfLifeChart({ locale, wheel }: { locale: "ar" | "en"; wheel: Record<string, number> }) {
  const chartData = [
    { subject: t(locale, "career"), value: wheel.career, fullMark: 10 },
    { subject: t(locale, "relationships"), value: wheel.relationships, fullMark: 10 },
    { subject: t(locale, "health"), value: wheel.health, fullMark: 10 },
    { subject: t(locale, "finances"), value: wheel.finances, fullMark: 10 },
    { subject: t(locale, "personalGrowth"), value: wheel.personal_growth || wheel.personalGrowth, fullMark: 10 },
    { subject: t(locale, "fun"), value: wheel.fun, fullMark: 10 },
    { subject: t(locale, "physicalEnv"), value: wheel.physical_env || wheel.physicalEnv, fullMark: 10 },
    { subject: t(locale, "spirituality"), value: wheel.spirituality, fullMark: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
        <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a78bfa", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#666", fontSize: 10 }} />
        <Radar name="Life Balance" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Alignment Compass ───────────────────────────────────
function AlignmentCompass({ score, locale }: { score: number; locale: "ar" | "en" }) {
  const color = score >= 70 ? "#34D399" : score >= 40 ? "#FBBF24" : "#F87171";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 264} 264`}
            transform="rotate(-90 50 50)"
            initial={{ strokeDasharray: "0 264" }}
            animate={{ strokeDasharray: `${(score / 100) * 264} 264` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <text x="50" y="47" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold">{score}%</text>
          <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6">{t(locale, "alignmentScore")}</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Energy Tracker ──────────────────────────────────────
function EnergyTracker({
  locale,
  userId,
  value,
  onChange,
}: {
  locale: "ar" | "en";
  userId: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const [saving, setSaving] = useState(false);

  const getEnergyIcon = (level: number) => {
    if (level <= 3) return <CloudMoon className="w-6 h-6 text-red-400" />;
    if (level <= 5) return <Meh className="w-6 h-6 text-yellow-400" />;
    if (level <= 7) return <Smile className="w-6 h-6 text-green-400" />;
    return <Zap className="w-6 h-6 text-brainhance-purple" />;
  };

  const getEnergyColor = (level: number) => {
    if (level <= 3) return "#F87171";
    if (level <= 5) return "#FBBF24";
    if (level <= 7) return "#34D399";
    return "#8B5CF6";
  };

  const handleSave = useCallback(async (level: number) => {
    onChange(level);
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("daily_energy").upsert(
      { user_id: userId, date: today, energy_level: level },
      { onConflict: "user_id, date" }
    );
    setSaving(false);
  }, [userId, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{t(locale, "energyLevel")}</span>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-muted-foreground">...</span>}
          <motion.div key={value} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
            {getEnergyIcon(value)}
          </motion.div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={(val) => handleSave(Array.isArray(val) ? val[0] : val)}
          min={1}
          max={10}
          step={1}
          className="flex-1"
        />
        <motion.span
          key={value}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-lg font-bold w-8 text-end"
          style={{ color: getEnergyColor(value) }}
        >
          {value}
        </motion.span>
      </div>
    </div>
  );
}

// ─── Weekly Energy Chart ─────────────────────────────────
function WeeklyEnergyChart({ data }: { data: { day: string; energy: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
        <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} />
        <YAxis domain={[0, 10]} hide />
        <Tooltip contentStyle={{ background: "rgba(15,10,26,0.9)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", color: "#fff" }} />
        <Area type="monotone" dataKey="energy" stroke="#8B5CF6" fill="url(#energyGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Dashboard ──────────────────────────────────────
export default function DashboardPage() {
  const { locale } = useLanguageStore();
  const { user } = useAuthStore();
  const userId = user?.id;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t(locale, "goodMorning");
    if (hour < 18) return t(locale, "goodAfternoon");
    return t(locale, "goodEvening");
  };

  const displayName = user?.name ? user.name.split(" ")[0] : (locale === "ar" ? "يا مُبدع" : "Creator");

  // ─── Real data state ──────────────────────────────
  const [loading, setLoading] = useState(true);
  const [todayFocus, setTodayFocus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [weeklyEnergy, setWeeklyEnergy] = useState<{ day: string; energy: number }[]>(
    (locale === "ar"
      ? ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
      : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
    ).map((day) => ({ day, energy: 0 }))
  );
  const [wheelData, setWheelData] = useState<Record<string, number>>({});

  const [plannerData, setPlannerData] = useState<any>(null);
  const [activeTaskKey, setActiveTaskKey] = useState<"priorities" | "goals">("priorities");
  const [isSyncing, setIsSyncing] = useState(false);

  const [priorities, setPriorities] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [extraTasks, setExtraTasks] = useState<{ text: string; completed: boolean }[]>([]);
  const [twelveWeekTasks, setTwelveWeekTasks] = useState<{ text: string; completed: boolean; source: string }[]>([]);
  
  const handleToggleTask = async (index: number, type: "priority" | "extra") => {
    if (!userId) return;
    
    const today = new Date().toISOString().split("T")[0];
    let currentPlannerData = plannerData;
    
    // Ensure plannerData is populated before toggle to avoid data loss on upsert
    if (!currentPlannerData) {
      const { data } = await supabase
        .from("planner_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_type", "daily")
        .eq("date", today)
        .maybeSingle();
      if (data && data.data) {
        currentPlannerData = data.data;
        setPlannerData(currentPlannerData);
      }
    }
    
    let updatedPriorities = [...priorities];
    let updatedExtra = [...extraTasks];
    
    if (type === "priority") {
      updatedPriorities[index].completed = !updatedPriorities[index].completed;
      const currentXP = useAuthStore.getState().points;
      if (updatedPriorities[index].completed) {
        useAuthStore.getState().setPoints(currentXP + 50);
        playChime();
      } else {
        const newXP = currentXP - 50;
        useAuthStore.getState().setPoints(Math.max(0, newXP));
        
        // Trigger Punishment
        const gamificationStore = useGamificationStore.getState();
        if (newXP < 0) {
          // Severe punishment because XP hit 0
          gamificationStore.triggerPunishment(
            2, 
            locale === "ar" 
              ? "لقد استنزفت نقاطك بالكامل وتتراجع عن أولوياتك! هذا التخاذل سيبعدك عن رسالتك." 
              : "You have depleted your points and are neglecting your priorities! This will keep you away from your mission."
          );
        } else {
          // Light punishment (Warning)
          gamificationStore.triggerPunishment(
            1,
            locale === "ar"
              ? "التراجع عن مهمة يكلفك 50 XP. التزم بما قررت فعله!"
              : "Undoing a task costs you 50 XP. Stick to your commitments!"
          );
        }
      }
    } else {
      updatedExtra[index].completed = !updatedExtra[index].completed;
      const currentXP = useAuthStore.getState().points;
      if (updatedExtra[index].completed) {
        useAuthStore.getState().setPoints(currentXP + 20);
        playChime();
      } else {
        const newXP = currentXP - 20;
        useAuthStore.getState().setPoints(Math.max(0, newXP));
        
        // Trigger Punishment for extra tasks too
        const gamificationStore = useGamificationStore.getState();
        if (newXP < 0) {
          gamificationStore.triggerPunishment(
            2, 
            locale === "ar" 
              ? "لقد وصلت للصفر! التراجع المستمر هو عدو الإنجاز." 
              : "You hit zero! Constant undoing is the enemy of achievement."
          );
        } else {
          gamificationStore.triggerPunishment(
            1,
            locale === "ar"
              ? "فقدت 20 XP لتراجعك. التركيز هو الحل!"
              : "Lost 20 XP for undoing. Focus is the key!"
          );
        }
      }
    }
    
    setPriorities(updatedPriorities);
    setExtraTasks(updatedExtra);
    
    const newData = {
      ...currentPlannerData,
      [activeTaskKey]: updatedPriorities,
      extraTasks: updatedExtra,
      lastUpdated: new Date().toISOString()
    };
    setPlannerData(newData);
    
    // Persist to today's draft with upsert
    await supabase.from("planner_logs").upsert({
      user_id: userId,
      log_type: "daily",
      date: today,
      data: newData,
    }, { onConflict: "user_id, log_type, date" });
  };

  const fetchPlannerData = async () => {
    if (!userId) return;
    setIsSyncing(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_type", "daily")
      .eq("date", todayStr)
      .maybeSingle();

    if (data && data.data) {
      setPlannerData(data.data);
      let key: "priorities" | "goals" = "priorities";
      
      const hasPriorities = data.data.priorities && data.data.priorities.some((p: any) => p.text && p.text.trim() !== "");
      if (hasPriorities) {
        key = "priorities";
      } else if (data.data.goals && data.data.goals.some((g: any) => g.text && g.text.trim() !== "")) {
        key = "goals";
      }
      setActiveTaskKey(key);

      const rawP = data.data[key] || [];
      setPriorities(rawP
        .map((p: any, i: number) => typeof p === "string" ? { id: `p-${i}`, text: p, completed: false } : { id: `p-${i}`, ...p })
        .filter((p: any) => p.text && p.text.trim() !== "")
      );

      const rawE = data.data.extraTasks || [];
      setExtraTasks(rawE
        .map((e: any, i: number) => typeof e === "string" ? { text: e, completed: false } : e)
        .filter((e: any) => e.text && e.text.trim() !== "")
      );
    }
    setIsSyncing(false);
  };

  const generateAITip = useCallback(() => {
    if (Object.keys(wheelData).length === 0) {
      return locale === "ar" 
        ? "أهلاً بك! أنصحك بملء بوصلة الحياة لتحديد أولوياتك بدقة." 
        : "Welcome! I recommend filling out your Life Compass to precisely determine your priorities.";
    }

    let lowestArea = "";
    let minScore = 11;
    for (const [key, value] of Object.entries(wheelData)) {
      if (value < minScore) {
        minScore = value;
        lowestArea = key;
      }
    }

    const areaNamesAr: Record<string, string> = {
      career: "المهنة", relationships: "العلاقات", health: "الصحة", finances: "المال", personal_growth: "النمو الشخصي", fun: "المتعة", physical_env: "البيئة المحيطة", spirituality: "الروحانية"
    };
    
    const areaNamesEn: Record<string, string> = {
      career: "Career", relationships: "Relationships", health: "Health", finances: "Finances", personal_growth: "Personal Growth", fun: "Fun", physical_env: "Physical Environment", spirituality: "Spirituality"
    };

    const areaAr = areaNamesAr[lowestArea] || lowestArea;
    const areaEn = areaNamesEn[lowestArea] || lowestArea;

    if (streak === 0) {
      return locale === "ar"
        ? `لاحظت أن لديك مجالاً للتحسين في جانب (${areaAr}). ما رأيك أن تبدأ جلسة تركيز قصيرة اليوم للعمل على هدف صغير يخص هذا الجانب؟`
        : `I noticed room for improvement in your (${areaEn}). How about starting a short focus session today to work on a small goal related to this?`;
    } else {
      return locale === "ar"
        ? `عمل رائع! أنت مستمر لـ ${streak} أيام. استغل هذا الزخم اليوم للتركيز على رفع تقييمك في جانب (${areaAr}).`
        : `Great job! You have a streak of ${streak} days. Use this momentum today to focus on improving your (${areaEn}).`;
    }
  }, [locale, wheelData, streak]);

  // ─── Fetch real data ──────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

    const dayLabels = locale === "ar"
      ? ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
      : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

    Promise.all([
      supabase.from("focus_sessions").select("*").eq("user_id", userId).gte("start_time", todayStr),
      supabase
        .from("focus_sessions")
        .select("start_time")
        .eq("user_id", userId)
        .gte("start_time", hundredDaysAgo.toISOString()),
      supabase
        .from("daily_energy")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .limit(7),
      supabase
        .from("assessments_wheel_of_life")
        .select("*")
        .eq("user_id", userId)
        .order("assessment_date", { ascending: false })
        .limit(1),
      supabase
        .from("planner_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_type", "daily")
        .eq("date", todayStr.split("T")[0])
        .maybeSingle(),
    ]).then(([todayRes, allRes, energyRes, wheelRes, plannerRes]) => {
      // Planner priorities — fetch today's draft by date
      if (plannerRes.data && plannerRes.data.data) {
        const data = plannerRes.data.data;
        setPlannerData(data);
        
        let key: "priorities" | "goals" = "priorities";
        const hasPriorities = data.priorities && data.priorities.some((p: any) => p.text && p.text.trim() !== "");
        if (hasPriorities) {
          key = "priorities";
        } else if (data.goals && data.goals.some((g: any) => g.text && g.text.trim() !== "")) {
          key = "goals";
        }
        setActiveTaskKey(key);

        const rawP = data[key] || [];
        setPriorities(rawP
          .map((p: any, i: number) => typeof p === "string" ? { id: `p-${i}`, text: p, completed: false } : { id: `p-${i}`, ...p })
          .filter((p: any) => p.text && p.text.trim() !== "")
        );
        
        const rawE = data.extraTasks || [];
        setExtraTasks(rawE
          .map((e: any, i: number) => typeof e === "string" ? { text: e, completed: false } : e)
          .filter((e: any) => e.text && e.text.trim() !== "")
        );
      }
      // Today's focus count
      setTodayFocus(todayRes.data?.length || 0);

      // Streak
      if (allRes.data) {
        const daySet = new Set<string>();
        for (const s of allRes.data) {
          if (s.start_time) {
            daySet.add(new Date(s.start_time).toISOString().split("T")[0]);
          }
        }
        let count = 0;
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

        let startOffset = 0;
        if (!daySet.has(todayStr)) {
          if (daySet.has(yesterdayStr)) {
            startOffset = 1;
          } else {
            startOffset = -1; // break immediately
          }
        }

        if (startOffset !== -1) {
          for (let i = startOffset; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            if (daySet.has(key)) count++;
            else break;
          }
        }
        setStreak(count);
      }

      // Weekly energy
      const energyMap = new Map<string, number>();
      if (energyRes.data) {
        for (const e of energyRes.data) {
          const d = new Date(e.date + "T00:00:00");
          const dayName = d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" });
          energyMap.set(dayName, e.energy_level);
        }
        if (energyRes.data.length > 0) {
          const last = energyRes.data[energyRes.data.length - 1];
          setCurrentEnergy(last.energy_level);
        }
      }
      setWeeklyEnergy(dayLabels.map((day) => ({ day, energy: energyMap.get(day) || 0 })));

      // Alignment score and Wheel Data
      const ow = useOnboardingStore.getState().data.wheelOfLife;
      if (wheelRes.data && wheelRes.data[0]) {
        const w = wheelRes.data[0];
        setWheelData({
          career: w.career, relationships: w.relationships, health: w.health,
          finances: w.finances, personal_growth: w.personal_growth, fun: w.fun,
          physical_env: w.physical_env, spirituality: w.spirituality
        });
        const vals = [w.career, w.relationships, w.health, w.finances, w.personal_growth, w.fun, w.physical_env, w.spirituality];
        const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        setAlignmentScore(Math.round((avg / 10) * 100));
      } else {
        setWheelData(ow as any);
        const vals = [ow.career, ow.relationships, ow.health, ow.finances, ow.personalGrowth, ow.fun, ow.physicalEnv, ow.spirituality];
        const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        setAlignmentScore(Math.round((avg / 10) * 100));
      }

      // ─── Fetch 12-Week Year daily tasks for today ──
      fetchTwelveWeekTodayTasks(userId).then(setTwelveWeekTasks);

      setLoading(false);
    });
  }, [userId, locale]);

  const fetchTwelveWeekTodayTasks = async (uid: string): Promise<{ text: string; completed: boolean; source: string }[]> => {
    const { data: plan } = await supabase
      .from("twelve_week_plans")
      .select("id")
      .eq("user_id", uid)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) return [];

    const { data: tasks } = await supabase
      .from("twelve_week_tasks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("week_number", { ascending: true });

    if (!tasks || tasks.length === 0) return [];

    const currentWeekTask = tasks.find((t) => !t.week_completed) || tasks[tasks.length - 1];
    if (!currentWeekTask || !currentWeekTask.daily_tasks_json) return [];

    const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const todayDay = currentWeekTask.daily_tasks_json.find((d: any) => d.dayNumber === todayDayNumber);
    if (!todayDay || !todayDay.tasks) return [];

    return todayDay.tasks.map((t: any) => ({
      text: t.text,
      completed: t.completed || false,
      source: "12-week",
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir={locale === "ar" ? "rtl" : "ltr"}>
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">
          {getGreeting()}{" "}
          <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === "ar" ? "هذا هو مركز قيادة حياتك. ابدأ يومك بوعي." : "This is your life command center. Start your day with awareness."}
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t(locale, "todaysFocus"), value: todayFocus, icon: Timer, color: "text-brainhance-purple", bg: "bg-brainhance-purple/10" },
          { label: t(locale, "alignmentScore"), value: `${alignmentScore}%`, icon: Compass, color: "text-brainhance-success", bg: "bg-green-500/10" },
          { label: t(locale, "energyLevel"), value: `${currentEnergy}/10`, icon: Zap, color: "text-brainhance-warning", bg: "bg-yellow-500/10" },
          { label: t(locale, "streakDays"), value: streak, icon: Flame, color: "text-brainhance-danger", bg: "bg-red-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <GlowCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Life Wheel */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <GlowCard className="h-full">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-brainhance-purple" /> {t(locale, "lifeBalance")}
            </h3>
            <WheelOfLifeChart locale={locale} wheel={wheelData} />
          </GlowCard>
        </motion.div>

        {/* Alignment + Streak */}
        <motion.div className="space-y-6" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <GlowCard>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brainhance-purple" /> {t(locale, "alignmentScore")}
            </h3>
            <AlignmentCompass score={alignmentScore} locale={locale} />
          </GlowCard>
          <GlowCard>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="w-6 h-6 text-brainhance-danger" />
              </motion.div>
              <div>
                <span className="text-2xl font-bold gradient-text">{streak}</span>
                <p className="text-xs text-muted-foreground">{t(locale, "streakDays")}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Energy Tracker */}
        {userId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlowCard>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-brainhance-warning" /> {t(locale, "energyLevel")}</h3>
              <EnergyTracker locale={locale} userId={userId} value={currentEnergy} onChange={setCurrentEnergy} />
              <div className="mt-4"><WeeklyEnergyChart data={weeklyEnergy} /></div>
            </GlowCard>
          </motion.div>
        )}

        {/* Quick Focus */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <GlowCard>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Timer className="w-4 h-4 text-brainhance-purple" /> {t(locale, "focusMode")}</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="264" transform="rotate(-90 50 50)" />
                  <text x="50" y="47" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">25:00</text>
                  <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6">{locale === "ar" ? "جاهز" : "Ready"}</text>
                </svg>
              </div>
              <Button onClick={() => window.location.href = "/dashboard/focus"} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-8">
                {t(locale, "startFocus")}
              </Button>
            </div>
          </GlowCard>
        </motion.div>

        {/* AI Coach */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <GlowCard>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Bot className="w-4 h-4 text-brainhance-purple" /> {t(locale, "aiCoach")}</h3>
            <div className="space-y-3">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">{locale === "ar" ? "نصيحة اليوم" : "Today's Tip"}</p>
                <p className="text-sm">{generateAITip()}</p>
              </div>
              <Button variant="outline" className="w-full glass border-brainhance-purple/30 hover:bg-brainhance-purple/10 text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> {t(locale, "askCoach")}
              </Button>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Today's Priorities Section */}
      <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <GlowCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-brainhance-purple" /> 
              {locale === "ar" ? "أولويات اليوم" : "Today's Priorities"}
            </h3>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchPlannerData} 
                disabled={isSyncing}
                className="hover:bg-brainhance-purple/10 text-muted-foreground hover:text-brainhance-purple"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">+50 XP / Goal</span>
              </div>
            </div>
          </div>

          {priorities.length === 0 && twelveWeekTasks.length === 0 ? (
            <div className="text-center py-10 glass rounded-2xl border-dashed border-white/10">
              <p className="text-sm text-muted-foreground mb-4">
                {locale === "ar" ? "لم يتم تحديد أهداف لليوم بعد في المخطط الذكي." : "No goals set for today in the Smart Planner yet."}
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard/planner"} className="glass text-xs">
                {locale === "ar" ? "اذهب للتخطيط" : "Go to Planner"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {priorities.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {priorities.map((task, i) => (
                  <motion.div
                    key={task.id || i}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      task.completed 
                        ? "bg-brainhance-success/10 border-brainhance-success/30 opacity-70" 
                        : "bg-white/5 border-white/10 hover:border-brainhance-purple/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id={`prio-${i}`}
                        checked={task.completed} 
                        onCheckedChange={() => handleToggleTask(i, "priority")}
                        className="mt-1 border-brainhance-purple data-[state=checked]:bg-brainhance-purple"
                      />
                      <label htmlFor={`prio-${i}`} className={`text-sm font-medium cursor-pointer leading-tight ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.text}
                      </label>
                    </div>
                  </motion.div>
                  ))}
                </div>
              )}

              {/* 12-Week Year Daily Tasks */}
              {twelveWeekTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sword className="w-3.5 h-3.5 text-brainhance-glow" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {locale === "ar" ? "السنة ذات 12 أسبوعاً — مهام اليوم" : "12-Week Year — Today's Tasks"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {twelveWeekTasks.map((task, i) => (
                      <div key={`tw-${i}`} className="flex items-start gap-2 p-3 glass rounded-xl border border-brainhance-purple/10">
                        <Checkbox
                          id={`twelve-${i}`}
                          checked={task.completed}
                          disabled
                          className="mt-0.5 border-brainhance-glow/50 data-[state=checked]:bg-brainhance-glow"
                        />
                        <label htmlFor={`twelve-${i}`} className={`text-xs cursor-default leading-tight ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Tasks Section */}
              {extraTasks.some(t => t.text) && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-brainhance-purple" />
                      {locale === "ar" ? "مهام إضافية" : "Extra Tasks"}
                    </p>
                    <span className="text-[10px] font-bold text-brainhance-glow">+20 XP لكل مهمة</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extraTasks.filter(t => t.text).map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
                        <Checkbox 
                          id={`extra-${i}`}
                          checked={task.completed} 
                          onCheckedChange={() => handleToggleTask(i, "extra")}
                        />
                        <label htmlFor={`extra-${i}`} className={`text-xs cursor-pointer ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlowCard>
      </motion.div>
    </div>
  );
}
