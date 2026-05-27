"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { 
  BarChart2, Timer, Flame, Zap, Target, CheckCircle, TrendingUp, Mic, Brain, RefreshCw 
} from "lucide-react";

export default function AnalyzePage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFocusMinutes: 0,
    distractionRate: 0,
    activeGoals: 0,
    completedGoals: 0,
    avgGoalProgress: 0,
    totalJournals: 0,
    journalCount: 0,
    roleCount: 0,
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [focusRes, goalsRes, journalsRes, rolesRes] = await Promise.all([
      supabase.from("focus_sessions").select("*").eq("user_id", userId),
      supabase.from("goals").select("*").eq("user_id", userId),
      supabase.from("voice_journals").select("id").eq("user_id", userId),
      supabase.from("life_roles").select("id").eq("user_id", userId),
    ]);

    const focusSessions = focusRes.data || [];
    const goals = goalsRes.data || [];

    const totalMin = focusSessions.reduce((acc: number, s: any) => {
      if (s.start_time && s.end_time) {
        return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
      }
      return acc;
    }, 0);

    const distracted = focusSessions.filter((s: any) => s.is_distracted).length;

    setStats({
      totalSessions: focusSessions.length,
      totalFocusMinutes: Math.round(totalMin),
      distractionRate: focusSessions.length > 0 ? Math.round((distracted / focusSessions.length) * 100) : 0,
      activeGoals: goals.filter((g: any) => g.status === "active").length,
      completedGoals: goals.filter((g: any) => g.status === "completed").length,
      avgGoalProgress: goals.length > 0 ? Math.round(goals.reduce((a: number, g: any) => a + (g.progress_percentage || 0), 0) / goals.length) : 0,
      totalJournals: journalsRes.data?.length || 0,
      journalCount: journalsRes.data?.length || 0,
      roleCount: rolesRes.data?.length || 0,
    });

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAnalysis = useCallback(async () => {
    if (!userId) return;
    setAnalyzing(true);
    setAnalysis(null);

    const [focusRes, goalsRes, journalsRes, rolesRes, ikigaiRes, wheelRes] = await Promise.all([
      supabase.from("focus_sessions").select("*").eq("user_id", userId),
      supabase.from("goals").select("*").eq("user_id", userId),
      supabase.from("voice_journals").select("transcription_text").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("life_roles").select("*").eq("user_id", userId),
      supabase.from("assessments_ikigai").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("assessments_wheel_of_life").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          roles: rolesRes.data || [],
          goals: goalsRes.data || [],
          focusSessions: focusRes.data || [],
          voiceJournals: journalsRes.data || [],
          wheelOfLife: wheelRes.data || null,
          ikigai: ikigaiRes.data || null,
        }),
      });

      const data = await res.json();
      setAnalysis(data.analysis || (locale === "ar" ? "⚠️ لم يتم الحصول على تحليل." : "⚠️ No analysis received."));
    } catch {
      setAnalysis(locale === "ar" ? "⚠️ حدث خطأ في الاتصال." : "⚠️ Connection error.");
    } finally {
      setAnalyzing(false);
    }
  }, [userId, locale]);

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

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-brainhance-purple" />
          <span className="gradient-text">{locale === "ar" ? "التحليل الشامل" : "Deep Analysis"}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "تحليل متكامل لحياتك بناءً على بياناتك" : "Comprehensive life analysis based on your data"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: locale === "ar" ? "جلسات التركيز" : "Focus Sessions", value: stats.totalSessions, Icon: Timer, color: "#8B5CF6" },
          { label: locale === "ar" ? "دقائق التركيز" : "Focus Minutes", value: stats.totalFocusMinutes, Icon: Flame, color: "#34D399" },
          { label: locale === "ar" ? "معدل التشتت" : "Distraction Rate", value: `${stats.distractionRate}%`, Icon: Zap, color: stats.distractionRate > 30 ? "#F87171" : "#FBBF24" },
          { label: locale === "ar" ? "الأهداف النشطة" : "Active Goals", value: stats.activeGoals, Icon: Target, color: "#60A5FA" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlowCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <stat.Icon className="w-8 h-8 opacity-80" style={{ color: stat.color }} />
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Second Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: locale === "ar" ? "الأهداف المكتملة" : "Completed Goals", value: stats.completedGoals, Icon: CheckCircle, color: "#34D399" },
          { label: locale === "ar" ? "متوسط التقدم" : "Avg Progress", value: `${stats.avgGoalProgress}%`, Icon: TrendingUp, color: "#8B5CF6" },
          { label: locale === "ar" ? "المذكرات الصوتية" : "Voice Journals", value: stats.journalCount, Icon: Mic, color: "#F97316" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <GlowCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <stat.Icon className="w-8 h-8 opacity-80" style={{ color: stat.color }} />
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* AI Analysis */}
      <GlowCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-brainhance-purple" />
            {locale === "ar" ? "التحليل بالذكاء الاصطناعي" : "AI-Powered Analysis"}
          </h3>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
          >
            {analyzing
              ? (locale === "ar" ? "جاري التحليل..." : "Analyzing...")
              : <><RefreshCw className="w-4 h-4 mr-1" /> {locale === "ar" ? "تشغيل التحليل" : "Run Analysis"}</>}
          </Button>
        </div>

        {analyzing && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-12 h-12 border-2 border-brainhance-purple border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "جاري تحليل بياناتك..." : "Analyzing your data..."}
              </p>
            </div>
          </div>
        )}

        {analysis && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {analysis}
            </div>
          </motion.div>
        )}

        {!analysis && !analyzing && (
          <div className="text-center py-12">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "اضغط على زر التحليل للحصول على تحليل شامل لحياتك"
                : "Click Run Analysis to get a comprehensive life analysis"}
            </p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
