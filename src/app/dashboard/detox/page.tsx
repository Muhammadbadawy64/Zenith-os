"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  Activity, CheckCircle2, Circle, Flame, Sparkles, Brain, Moon,
  Sunrise, Dumbbell, BookOpen, Droplets, Smile, Frown, Meh, Smartphone,
  ChevronLeft, ChevronRight, Save
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

import { AnalyticsModal } from "./AnalyticsModal";
import { HabitTrackerTab } from "./HabitTracker";

const HABIT_PROTOCOL = [
  { id: "wakeup_early", ar: "الاستيقاظ مبكراً", en: "Wake up early", icon: Sunrise },
  { id: "no_sweets_fastfood", ar: "بدون حلويات وفاست فود", en: "No Sweets & Fast Food", icon: Activity },
  { id: "no_phone_morning", ar: "بدون شاشات أول ساعتين", en: "No Phone First 2 Hrs", icon: Smartphone },
  { id: "no_phone_night", ar: "بدون شاشات قبل النوم بساعتين", en: "No Phone Before Bed", icon: Moon },
  { id: "exercise", ar: "تمرين", en: "Exercise", icon: Dumbbell },
  { id: "sleep_before_12", ar: "النوم قبل 12", en: "Sleep before 12", icon: Moon },
  { id: "pray_mosque", ar: "الصلاة في المسجد", en: "Pray in Mosque", icon: Sparkles },
  { id: "read_book", ar: "قراءة كتاب / معلومة", en: "Read Book / Info", icon: BookOpen },
  { id: "quran", ar: "الورد اليومي للقرآن", en: "Daily Quran", icon: BookOpen },
  { id: "no_negative_habits", ar: "بدون عادات سلبية", en: "No Negative Habits", icon: CheckCircle2 },
  { id: "walk_25", ar: "المشي 25 دقيقة", en: "Walk 25 mins", icon: Activity },
  { id: "dhikr", ar: "500 ذكر", en: "500 Dhikr", icon: Sparkles },
  { id: "water_3l", ar: "شرب 3 لتر مياه", en: "Drink 3L Water", icon: Droplets },
];

const SLEEP_OPTIONS = ["3-5", "6", "7-8", "8+"];
const MOOD_OPTIONS = ["good", "neutral", "bad"];

const getMoodIcon = (mood: string) => {
  if (mood === "good") return <Smile className="w-4 h-4 text-green-500" />;
  if (mood === "neutral") return <Meh className="w-4 h-4 text-yellow-500" />;
  if (mood === "bad") return <Frown className="w-4 h-4 text-red-500" />;
  return <div className="w-4 h-4 rounded-full border border-dashed border-white/20" />;
};

type DailyLog = {
  id?: string;
  log_date: string;
  habits: Record<string, boolean>;
  work_time_hrs: number;
  screen_time_hrs: number;
  sleep_category: string;
  mood: string;
  total_points: number;
};

export default function DetoxPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"matrix" | "habits">("matrix");
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Map of date string (YYYY-MM-DD) to DailyLog
  const [monthData, setMonthData] = useState<Record<string, DailyLog>>({});

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      // Format as YYYY-MM-DD using local time
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  }, [currentDate]);

  const fetchMonthData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const startDate = daysInMonth[0];
    const endDate = daysInMonth[daysInMonth.length - 1];

    const { data, error } = await supabase
      .from("detox_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", startDate)
      .lte("log_date", endDate);

    const newData: Record<string, DailyLog> = {};
    if (data) {
      data.forEach((row: any) => {
        newData[row.log_date] = {
          id: row.id,
          log_date: row.log_date,
          habits: row.habits || {},
          work_time_hrs: row.work_time_hrs || 0,
          screen_time_hrs: row.screen_time_hrs || 0,
          sleep_category: row.sleep_category || "",
          mood: row.mood || "",
          total_points: row.total_points || 0,
        };
      });
    }
    
    // Fill in empty days
    daysInMonth.forEach(dateStr => {
      if (!newData[dateStr]) {
        newData[dateStr] = {
          log_date: dateStr,
          habits: {},
          work_time_hrs: 0,
          screen_time_hrs: 0,
          sleep_category: "",
          mood: "",
          total_points: 0,
        };
      }
    });

    setMonthData(newData);
    setLoading(false);
  }, [user?.id, daysInMonth]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const updateDayData = async (dateStr: string, updates: Partial<DailyLog>) => {
    if (!user?.id) return;
    
    setMonthData(prev => {
      const existing = prev[dateStr];
      const newHabits = updates.habits !== undefined ? updates.habits : existing.habits;
      const points = Object.values(newHabits).filter(Boolean).length;
      
      const updated = { ...existing, ...updates, total_points: points };
      
      // Fire and forget save to Supabase
      saveToDb(updated);
      
      return { ...prev, [dateStr]: updated };
    });
  };

  const saveToDb = async (log: DailyLog) => {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      log_date: log.log_date,
      habits: log.habits,
      work_time_hrs: log.work_time_hrs,
      screen_time_hrs: log.screen_time_hrs,
      sleep_category: log.sleep_category,
      mood: log.mood,
      total_points: log.total_points,
    };

    if (log.id) {
      await supabase.from("detox_logs").update(payload).eq("id", log.id);
    } else {
      const { data, error } = await supabase.from("detox_logs").insert(payload).select().single();
      if (data) {
        // Update local ID so subsequent saves use update
        setMonthData(prev => ({
          ...prev,
          [log.log_date]: { ...prev[log.log_date], id: data.id }
        }));
      }
    }
  };

  const toggleHabit = (dateStr: string, habitId: string) => {
    const currentHabits = monthData[dateStr].habits;
    updateDayData(dateStr, { 
      habits: { ...currentHabits, [habitId]: !currentHabits[habitId] } 
    });
  };

  const cycleSleep = (dateStr: string) => {
    const current = monthData[dateStr].sleep_category;
    const idx = SLEEP_OPTIONS.indexOf(current);
    const next = idx === SLEEP_OPTIONS.length - 1 ? "" : SLEEP_OPTIONS[idx + 1];
    updateDayData(dateStr, { sleep_category: next });
  };

  const cycleMood = (dateStr: string) => {
    const current = monthData[dateStr].mood;
    const idx = MOOD_OPTIONS.indexOf(current);
    const next = idx === MOOD_OPTIONS.length - 1 ? "" : MOOD_OPTIONS[idx + 1];
    updateDayData(dateStr, { mood: next });
  };

  const chartData = useMemo(() => {
    return daysInMonth.map(dateStr => ({
      date: dateStr.split("-")[2],
      points: monthData[dateStr]?.total_points || 0,
    }));
  }, [daysInMonth, monthData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthName = currentDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <AnalyticsModal 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
        locale={locale} 
        chartData={chartData} 
      />

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="w-6 h-6 text-brainhance-purple" />
            <span className="gradient-text">{locale === "ar" ? "صيام الدوبامين والعادات" : "Dopamine Detox & Habits"}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "ar" ? "تتبع عاداتك اليومية وابنِ عادات قوية من خلال دورات متتابعة" : "Track daily habits and build strong streaks over cycles"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                activeTab === "matrix" ? "bg-brainhance-purple text-white shadow-lg" : "text-muted-foreground hover:text-white"
              }`}
            >
              {locale === "ar" ? "المصفوفة الشهرية" : "Monthly Matrix"}
            </button>
            <button
              onClick={() => setActiveTab("habits")}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                activeTab === "habits" ? "bg-brainhance-purple text-white shadow-lg" : "text-muted-foreground hover:text-white"
              }`}
            >
              {locale === "ar" ? "تتبع العادات" : "Habit Tracker"}
            </button>
          </div>

          {activeTab === "matrix" && (
            <>
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-xl hover:bg-white/10">
                  {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </Button>
                <span className="font-bold min-w-[120px] text-center">{monthName}</span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-xl hover:bg-white/10">
                  {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </Button>
              </div>

              <Button 
                onClick={() => setShowAnalytics(true)}
                className="bg-white/5 border border-white/10 hover:bg-brainhance-purple/20 text-brainhance-glow hover:text-white"
              >
                <Activity className="w-4 h-4 mr-2" />
                {locale === "ar" ? "تحليل الشهر" : "Analytics"}
              </Button>
            </>
          )}
        </div>
      </div>

      {activeTab === "matrix" ? (
        <GlowCard className="p-0 overflow-hidden flex flex-col w-full">
          <div className="p-4 border-b border-border/20 flex items-center justify-between min-w-0">
            <h3 className="font-bold">{locale === "ar" ? "المصفوفة الشهرية" : "Monthly Matrix"}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-3 h-3 bg-brainhance-purple/30 border border-brainhance-purple rounded-sm block"></span>
              {locale === "ar" ? "منجز" : "Done"}
              <span className="w-3 h-3 glass border border-white/10 rounded-sm block ms-2"></span>
              {locale === "ar" ? "فارغ" : "Empty"}
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse min-w-[800px]" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground border-b border-r border-border/20 bg-background/50 sticky start-0 z-10 w-48 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                    {locale === "ar" ? "العادات / الأيام" : "Habits / Days"}
                  </th>
                  {daysInMonth.map(dateStr => {
                    const d = new Date(dateStr);
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <th key={dateStr} className={`p-2 text-center border-b border-r border-border/20 font-medium min-w-[40px] ${isToday ? "bg-brainhance-purple/10 text-brainhance-glow" : ""}`}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] opacity-50 mb-1">{d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "narrow" })}</span>
                          <span>{d.getDate()}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {HABIT_PROTOCOL.map((habit) => (
                  <tr key={habit.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 border-b border-r border-border/20 bg-background/90 sticky start-0 z-10 w-48 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2">
                        <habit.icon className="w-4 h-4 text-brainhance-purple shrink-0" />
                        <span className="truncate" title={locale === "ar" ? habit.ar : habit.en}>
                          {locale === "ar" ? habit.ar : habit.en}
                        </span>
                      </div>
                    </td>
                    {daysInMonth.map(dateStr => {
                      const isDone = monthData[dateStr]?.habits?.[habit.id];
                      return (
                        <td key={`${habit.id}-${dateStr}`} className="p-1 border-b border-r border-border/10 text-center">
                          <button
                            onClick={() => toggleHabit(dateStr, habit.id)}
                            className={`w-full h-8 rounded-md flex items-center justify-center transition-all ${
                              isDone ? "bg-brainhance-purple/20 border border-brainhance-purple shadow-[0_0_10px_rgba(139,92,246,0.2)] text-brainhance-glow" : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-transparent hover:text-white/20"
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Total Points Row */}
                <tr className="bg-white/5 font-bold">
                  <td className="p-3 border-b border-r border-border/20 sticky start-0 z-10 w-48 bg-background/90 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                    {locale === "ar" ? "إجمالي النقاط (من 13)" : "Total Points (13)"}
                  </td>
                  {daysInMonth.map(dateStr => (
                    <td key={`pts-${dateStr}`} className="p-2 border-b border-r border-border/20 text-center text-brainhance-glow">
                      {monthData[dateStr]?.total_points || 0}
                    </td>
                  ))}
                </tr>

                {/* Metrics Rows */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 border-b border-r border-border/20 sticky start-0 z-10 w-48 bg-background/90">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="w-3 h-3" /> {locale === "ar" ? "الشغل (ساعات)" : "Work (Hrs)"}
                    </div>
                  </td>
                  {daysInMonth.map(dateStr => (
                    <td key={`work-${dateStr}`} className="p-1 border-b border-r border-border/10 text-center">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full h-8 text-center text-xs bg-transparent border border-transparent hover:border-white/20 focus:border-brainhance-purple rounded-md focus:outline-none"
                        value={monthData[dateStr]?.work_time_hrs || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateDayData(dateStr, { work_time_hrs: isNaN(val) ? 0 : val });
                        }}
                      />
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 border-b border-r border-border/20 sticky start-0 z-10 w-48 bg-background/90">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Smartphone className="w-3 h-3" /> {locale === "ar" ? "الشاشة (ساعات)" : "Screen (Hrs)"}
                    </div>
                  </td>
                  {daysInMonth.map(dateStr => (
                    <td key={`screen-${dateStr}`} className="p-1 border-b border-r border-border/10 text-center">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full h-8 text-center text-xs bg-transparent border border-transparent hover:border-white/20 focus:border-brainhance-purple rounded-md focus:outline-none"
                        value={monthData[dateStr]?.screen_time_hrs || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateDayData(dateStr, { screen_time_hrs: isNaN(val) ? 0 : val });
                        }}
                      />
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 border-b border-r border-border/20 sticky start-0 z-10 w-48 bg-background/90">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Moon className="w-3 h-3" /> {locale === "ar" ? "النوم" : "Sleep"}
                    </div>
                  </td>
                  {daysInMonth.map(dateStr => (
                    <td key={`sleep-${dateStr}`} className="p-1 border-b border-r border-border/10 text-center">
                      <button 
                        onClick={() => cycleSleep(dateStr)}
                        className="w-full h-8 flex items-center justify-center text-[9px] font-bold hover:bg-white/10 rounded-md"
                      >
                        {monthData[dateStr]?.sleep_category || "-"}
                      </button>
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 border-r border-border/20 sticky start-0 z-10 w-48 bg-background/90">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Smile className="w-3 h-3" /> {locale === "ar" ? "المزاج" : "Mood"}
                    </div>
                  </td>
                  {daysInMonth.map(dateStr => (
                    <td key={`mood-${dateStr}`} className="p-1 border-r border-border/10 text-center">
                      <button 
                        onClick={() => cycleMood(dateStr)}
                        className="w-full h-8 flex items-center justify-center hover:bg-white/10 rounded-md"
                      >
                        {getMoodIcon(monthData[dateStr]?.mood || "")}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </GlowCard>
      ) : (
        <HabitTrackerTab />
      )}
    </div>
  );
}
