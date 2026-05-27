"use client";
import React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/ui/animations";
import { CustomDatePicker } from "@/components/ui/date-picker";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useLanguageStore, useAuthStore, useNotificationStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import {
  Sparkles, Film, CalendarDays, Globe, Plus, Trash2,
  ChevronLeft, ChevronRight, ExternalLink, Bot, X, TrendingUp, Users,
  ScrollText, Copy, CheckCheck, Lightbulb, PenLine, Video,
  Scissors, Search, Rocket, BarChart2, Clapperboard,
  MonitorPlay, Camera, Hash, Briefcase, Music,
  PenTool, BookOpen, Layers, Zap, Folder, CheckSquare, Palette, LayoutTemplate, Link
} from "lucide-react";

const STAGES = ["idea", "scripting", "filming", "editing", "review", "published"] as const;

const STAGE_LABELS: Record<string, { ar: string; en: string }> = {
  idea:       { ar: "فكرة",            en: "Idea" },
  scripting:  { ar: "كتابة السيناريو", en: "Scripting" },
  filming:    { ar: "تصوير",           en: "Filming" },
  editing:    { ar: "مونتاج",          en: "Editing" },
  review:     { ar: "مراجعة",          en: "Review" },
  published:  { ar: "منشور",           en: "Published" },
};

const STAGE_ICONS: Record<string, React.ReactNode> = {
  idea:      <Lightbulb  className="w-4 h-4 text-yellow-400" />,
  scripting: <PenLine    className="w-4 h-4 text-brainhance-purple" />,
  filming:   <Clapperboard className="w-4 h-4 text-pink-400" />,
  editing:   <Scissors   className="w-4 h-4 text-blue-400" />,
  review:    <Search     className="w-4 h-4 text-orange-400" />,
  published: <Rocket     className="w-4 h-4 text-brainhance-glow" />,
};

const renderPlatformBadge = (platform: string) => {
  const p = platform.toLowerCase().trim();
  let Icon = Globe;
  let colorClass = "text-muted-foreground bg-white/5 border-white/10";

  if (p.includes("youtube") || p.includes("يوتيوب")) {
    Icon = MonitorPlay;
    colorClass = "text-red-500 bg-red-500/10 border-red-500/20";
  } else if (p.includes("instagram") || p.includes("انستاجرام") || p.includes("انستغرام")) {
    Icon = Camera;
    colorClass = "text-pink-500 bg-pink-500/10 border-pink-500/20";
  } else if (p.includes("facebook") || p.includes("فيس بوك") || p.includes("فيسبوك")) {
    Icon = Users;
    colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20";
  } else if (p.includes("twitter") || p.includes("تويتر") || p.includes("x")) {
    Icon = Hash;
    colorClass = "text-sky-400 bg-sky-400/10 border-sky-400/20";
  } else if (p.includes("tiktok") || p.includes("تيك توك") || p.includes("تيكتوك")) {
    Icon = Music;
    colorClass = "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
  } else if (p.includes("linkedin") || p.includes("لينكد ان") || p.includes("لينكدإن")) {
    Icon = Briefcase;
    colorClass = "text-blue-600 bg-blue-600/10 border-blue-600/20";
  }

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 w-fit ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {platform}
    </span>
  );
};

interface ContentItem {
  id: string;
  title: string;
  stage: string;
  platform: string | null;
  scheduled_date: string | null;
  niche: string | null;
  created_at: string;
}

interface PlatformLink {
  id: string;
  platform: string | null;
  url: string;
  category?: string;
  icon?: string;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-5 h-5 text-brainhance-glow" />,
  MonitorPlay: <MonitorPlay className="w-5 h-5 text-red-500" />,
  Camera: <Camera className="w-5 h-5 text-pink-500" />,
  Hash: <Hash className="w-5 h-5 text-sky-400" />,
  Briefcase: <Briefcase className="w-5 h-5 text-blue-600" />,
  Music: <Music className="w-5 h-5 text-cyan-400" />,
  PenTool: <PenTool className="w-5 h-5 text-purple-400" />,
  BookOpen: <BookOpen className="w-5 h-5 text-green-400" />,
  Layers: <Layers className="w-5 h-5 text-yellow-400" />,
  Zap: <Zap className="w-5 h-5 text-orange-400" />,
  Folder: <Folder className="w-5 h-5 text-indigo-400" />,
  CheckSquare: <CheckSquare className="w-5 h-5 text-emerald-400" />,
  Palette: <Palette className="w-5 h-5 text-pink-400" />,
  LayoutTemplate: <LayoutTemplate className="w-5 h-5 text-blue-400" />,
  Link: <Link className="w-5 h-5 text-muted-foreground" />,
};

const CATEGORIES_AR = ["الكل", "أدوات تصميم", "إلهام", "تعلم", "إدارة", "أخرى"];
const CATEGORIES_EN = ["All", "Design Tools", "Inspiration", "Learning", "Management", "Other"];

const LINK_TEMPLATES = [
  { name: "Notion", url: "https://notion.so", icon: "CheckSquare", category_ar: "إدارة", category_en: "Management" },
  { name: "YouTube", url: "https://youtube.com", icon: "MonitorPlay", category_ar: "إلهام", category_en: "Inspiration" },
  { name: "Canva", url: "https://canva.com", icon: "Palette", category_ar: "أدوات تصميم", category_en: "Design Tools" },
  { name: "Figma", url: "https://figma.com", icon: "Layers", category_ar: "أدوات تصميم", category_en: "Design Tools" },
  { name: "ChatGPT", url: "https://chatgpt.com", icon: "Zap", category_ar: "أدوات", category_en: "Tools" },
  { name: "Pinterest", url: "https://pinterest.com", icon: "Camera", category_ar: "إلهام", category_en: "Inspiration" },
];

interface ContentScript {
  id: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  platform: string | null;
  created_at: string;
}

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_AR = ["أحد", "إثن", "ثلاث", "أربع", "خميس", "جمعة", "سبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ContentPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const userId = useAuthStore((s) => s.user?.id);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [activeTab, setActiveTab] = useState<"ideas" | "pipeline" | "calendar" | "scripts" | "platforms" | "growth">("ideas");
  const [loading, setLoading] = useState(true);

  // Content items
  const [items, setItems] = useState<ContentItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newNiche, setNewNiche] = useState(""); // Used as Category
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Ideas filter
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<"all" | "idea" | "scripting" | "published">("all");

  // Platforms
  const [platforms, setPlatforms] = useState<PlatformLink[]>([]);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatName, setNewPlatName] = useState("");
  const [newPlatUrl, setNewPlatUrl] = useState("");
  const [newPlatCategory, setNewPlatCategory] = useState("أخرى");
  const [newPlatIcon, setNewPlatIcon] = useState("Globe");
  const [platSearch, setPlatSearch] = useState("");
  const [platCategoryFilter, setPlatCategoryFilter] = useState("All");
  const [deletingPlatform, setDeletingPlatform] = useState<{ id: string, name: string } | null>(null);

  // Calendar
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // AI Growth
  const [niche, setNiche] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [growthResult, setGrowthResult] = useState<{
    trend_analysis: string;
    video_ideas: string[];
    optimization_tips: string[];
    viral_suggestions: string[];
    competitor_analysis: string;
  } | null>(null);

  // Scripts
  const [scripts, setScripts] = useState<ContentScript[]>([]);
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptHook, setScriptHook] = useState("");
  const [scriptBody, setScriptBody] = useState("");
  const [scriptCTA, setScriptCTA] = useState("");
  const [scriptPlatform, setScriptPlatform] = useState("");
  const [scriptSaving, setScriptSaving] = useState(false);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar detail
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ─── Fetch data ─────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [itemsRes, platRes, scriptsRes] = await Promise.all([
      supabase.from("content_studio").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("platform_links").select("*").eq("user_id", userId).order("platform", { ascending: true }),
      supabase.from("content_scripts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    if (itemsRes.data) setItems(itemsRes.data as ContentItem[]);
    if (platRes.data) setPlatforms(platRes.data as PlatformLink[]);
    if (scriptsRes.data) setScripts(scriptsRes.data as ContentScript[]);

    // set initial category filter language
    setPlatCategoryFilter(locale === "ar" ? "الكل" : "All");
    
    setLoading(false);
  }, [userId, locale]);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Content CRUD ───────────────────────────────
  const addContent = async () => {
    if (!userId || !newTitle.trim()) return;
    const payload: any = {
      user_id: userId,
      title: newTitle.trim(),
      stage: "idea",
    };
    if (newPlatform.trim()) payload.platform = newPlatform.trim();
    if (newSchedule) payload.scheduled_date = newSchedule;
    if (newNiche.trim()) payload.niche = newNiche.trim();

    const { data, error } = await supabase.from("content_studio").insert(payload).select().single();
    if (error) {
      console.error("Add Idea Error:", error);
      addNotification({ title: "خطأ", description: error.message, type: "alert" });
    }
    if (data) {
      setItems((p) => [data as ContentItem, ...p]);
      setNewTitle("");
      setNewPlatform("");
      setNewSchedule("");
      setNewNiche("");
      setShowAddForm(false);
      addNotification({ title: locale === "ar" ? "تمت الإضافة" : "Added", description: locale === "ar" ? "تم إضافة المحتوى بنجاح" : "Content added successfully", type: "success" });
    }
  };

  const updateContent = async () => {
    if (!userId || !editingItem || !editingItem.title.trim()) return;
    const payload = {
      title: editingItem.title.trim(),
      platform: editingItem.platform?.trim() || null,
      scheduled_date: editingItem.scheduled_date || null,
      niche: editingItem.niche?.trim() || null,
    };

    const { error } = await supabase.from("content_studio").update(payload).eq("id", editingItem.id);
    if (error) {
      addNotification({ title: "خطأ", description: error.message, type: "alert" });
    } else {
      setItems((p) => p.map((it) => (it.id === editingItem.id ? { ...it, ...payload } : it)));
      setEditingItem(null);
      addNotification({ title: locale === "ar" ? "تم التحديث" : "Updated", description: locale === "ar" ? "تم تحديث الفكرة بنجاح" : "Idea updated successfully", type: "success" });
    }
  };

  const moveStage = async (id: string, newStage: string) => {
    await supabase.from("content_studio").update({ stage: newStage }).eq("id", id);
    setItems((p) => p.map((item) => (item.id === id ? { ...item, stage: newStage } : item)));
  };

  const toggleTrackingStep = async (item: ContentItem, step: 'script' | 'film' | 'edit') => {
    let newStage = item.stage;
    
    if (step === 'script') {
      const hasScript = ["filming", "editing", "review", "published"].includes(item.stage);
      newStage = hasScript ? "scripting" : "filming";
    } else if (step === 'film') {
      const hasFilmed = ["editing", "review", "published"].includes(item.stage);
      newStage = hasFilmed ? "filming" : "editing";
    } else if (step === 'edit') {
      const hasEdited = ["review", "published"].includes(item.stage);
      newStage = hasEdited ? "editing" : "review";
    }
    
    await moveStage(item.id, newStage);
  };

  const deleteContent = async (id: string) => {
    await supabase.from("content_studio").delete().eq("id", id);
    setItems((p) => p.filter((item) => item.id !== id));
  };

  // ─── Platform CRUD ──────────────────────────────
  const addPlatform = async () => {
    if (!userId || !newPlatName.trim()) return;
    const payload = { 
      user_id: userId, 
      platform: newPlatName.trim(), 
      url: newPlatUrl.trim() || null,
      category: newPlatCategory || (locale === "ar" ? "أخرى" : "Other"),
      icon: newPlatIcon || "Globe"
    };
    const { data, error } = await supabase.from("platform_links").insert(payload).select().single();
    if (error) {
       addNotification({ title: "خطأ", description: error.message, type: "alert" });
    }
    if (data) {
      setPlatforms((p) => [...p, data as PlatformLink]);
      setNewPlatName("");
      setNewPlatUrl("");
      setNewPlatCategory(locale === "ar" ? "أخرى" : "Other");
      setNewPlatIcon("Globe");
      setShowAddPlatform(false);
    }
  };

  const deletePlatform = async (id: string) => {
    await supabase.from("platform_links").delete().eq("id", id);
    setPlatforms((p) => p.filter((pl) => pl.id !== id));
    setDeletingPlatform(null);
  };

  // ─── AI Growth ──────────────────────────────────
  const runAnalysis = async () => {
    if (!niche.trim()) return;
    setAnalyzing(true);
    setGrowthResult(null);
    try {
      const res = await fetch("/api/ai-growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platformLinks: platforms, locale }),
      });
      const data = await res.json();
      setGrowthResult(data);
    } catch {
      // silent
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Scripts CRUD ───────────────────────────────
  const saveScript = async () => {
    if (!userId || !scriptTitle.trim()) return;
    setScriptSaving(true);
    const payload = {
      user_id: userId,
      title: scriptTitle.trim(),
      hook: scriptHook.trim(),
      body: scriptBody.trim(),
      cta: scriptCTA.trim(),
      platform: scriptPlatform.trim(),
    };
    const { data } = await supabase.from("content_scripts").insert(payload).select().single();
    if (data) {
      setScripts((p) => [data as ContentScript, ...p]);
      setScriptTitle(""); setScriptHook(""); setScriptBody(""); setScriptCTA(""); setScriptPlatform("");
      setShowScriptForm(false);
      addNotification({ title: locale === "ar" ? "تم حفظ السكريبت ✓" : "Script saved ✓", description: scriptTitle.trim(), type: "success" });
    }
    setScriptSaving(false);
  };

  const deleteScript = async (id: string) => {
    await supabase.from("content_scripts").delete().eq("id", id);
    setScripts((p) => p.filter((s) => s.id !== id));
  };

  const copyScript = (script: ContentScript) => {
    const text = [
      script.hook && `🎯 ${locale === "ar" ? "الهوك" : "Hook"}:\n${script.hook}`,
      script.body && `\n📝 ${locale === "ar" ? "السكريبت" : "Script"}:\n${script.body}`,
      script.cta && `\n🚀 CTA:\n${script.cta}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Calendar helpers ───────────────────────────
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calStartDay = new Date(calYear, calMonth, 1).getDay();
  const scheduledDates = useMemo(() => {
    const set = new Set<number>();
    for (const item of items) {
      if (item.scheduled_date) {
        const d = new Date(item.scheduled_date);
        if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
          set.add(d.getDate());
        }
      }
    }
    return set;
  }, [items, calMonth, calYear]);

  const dayItems = useMemo(() => {
    if (selectedDay === null) return [];
    return items.filter(item => {
      if (!item.scheduled_date) return false;
      const d = new Date(item.scheduled_date);
      return d.getDate() === selectedDay && d.getMonth() === calMonth && d.getFullYear() === calYear;
    });
  }, [items, selectedDay, calMonth, calYear]);

  // ─── Pipeline helpers ───────────────────────────
  const groupByStage = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const s of STAGES) map.set(s, []);
    for (const item of items) {
      const list = map.get(item.stage);
      if (list) list.push(item);
    }
    return map;
  }, [items]);

  const renderTrackingCheckboxes = (item: ContentItem) => {
    const hasScript = ["filming", "editing", "review", "published"].includes(item.stage);
    const hasFilmed = ["editing", "review", "published"].includes(item.stage);
    const hasEdited = ["review", "published"].includes(item.stage);

    return (
      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/10">
        <button onClick={() => toggleTrackingStep(item, 'script')} className={`flex items-center gap-2 text-xs transition-colors ${hasScript ? "text-brainhance-success font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
          <div className={`w-4 h-4 flex items-center justify-center rounded border ${hasScript ? "bg-brainhance-success/20 border-brainhance-success/50" : "bg-white/5 border-white/10"}`}>
            {hasScript && <CheckCheck className="w-3 h-3" />}
          </div>
          {locale === "ar" ? "السكريبت" : "Script"}
        </button>
        <button onClick={() => toggleTrackingStep(item, 'film')} className={`flex items-center gap-2 text-xs transition-colors ${hasFilmed ? "text-pink-400 font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
          <div className={`w-4 h-4 flex items-center justify-center rounded border ${hasFilmed ? "bg-pink-500/20 border-pink-500/50" : "bg-white/5 border-white/10"}`}>
            {hasFilmed && <CheckCheck className="w-3 h-3" />}
          </div>
          {locale === "ar" ? "التصوير" : "Filming"}
        </button>
        <button onClick={() => toggleTrackingStep(item, 'edit')} className={`flex items-center gap-2 text-xs transition-colors ${hasEdited ? "text-blue-400 font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
          <div className={`w-4 h-4 flex items-center justify-center rounded border ${hasEdited ? "bg-blue-500/20 border-blue-500/50" : "bg-white/5 border-white/10"}`}>
            {hasEdited && <CheckCheck className="w-3 h-3" />}
          </div>
          {locale === "ar" ? "المونتاج" : "Editing"}
        </button>
      </div>
    );
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

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Film className="w-7 h-7 text-brainhance-glow" />
          <span className="gradient-text">{t(locale, "contentStudio")}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t(locale, "contentDesc")}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "ideas",    Icon: Lightbulb,  ar: "الأفكار",       en: "Ideas" },
          { key: "pipeline", Icon: Film,       ar: "خط الإنتاج",    en: "Pipeline" },
          { key: "calendar", Icon: CalendarDays, ar: "التقويم",       en: "Calendar" },
          { key: "scripts",  Icon: ScrollText,  ar: "السكريبتات",    en: "Scripts"  },
          { key: "platforms",Icon: Globe,       ar: "روابطي السريعة",       en: "Quick Links"},
          { key: "growth",   Icon: BarChart2,   ar: "النمو",         en: "Growth"   },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {locale === "ar" ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
          {/* ── Ideas Tab ──────────────────────── */}
          {activeTab === "ideas" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                  {(["all", "idea", "scripting", "published"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setIdeaStatusFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${ideaStatusFilter === filter ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" : "glass text-muted-foreground hover:text-foreground"}`}
                    >
                      {filter === "all" ? (locale === "ar" ? "الكل" : "All") : STAGE_LABELS[filter as keyof typeof STAGE_LABELS][locale === "ar" ? "ar" : "en"]}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white w-full sm:w-auto shrink-0"
                >
                  <Plus className="w-4 h-4 me-1.5" /> {locale === "ar" ? "فكرة جديدة" : "New Idea"}
                </Button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0, overflow: "hidden" }} animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} exit={{ opacity: 0, height: 0, overflow: "hidden" }}>
                    <GlowCard>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t(locale, "contentTitle")} className="bg-background/50 md:col-span-2" />
                        <Input value={newNiche} onChange={(e) => setNewNiche(e.target.value)} placeholder={locale === "ar" ? "التصنيف (مثال: فلوج)" : "Category (e.g. Vlog)"} className="bg-background/50 md:col-span-2" />
                        <Input value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} placeholder={t(locale, "contentPlatform")} className="bg-background/50" />
                        <Button onClick={addContent} disabled={!newTitle.trim()} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white h-full">
                          <Plus className="w-4 h-4 me-1" /> {t(locale, "addContent")}
                        </Button>
                      </div>
                    </GlowCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ideas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <AnimatePresence>
                  {items
                    .filter((item) => {
                      if (ideaStatusFilter === "all") return true;
                      if (ideaStatusFilter === "idea") return item.stage === "idea";
                      if (ideaStatusFilter === "scripting") return item.stage !== "idea" && item.stage !== "published";
                      if (ideaStatusFilter === "published") return item.stage === "published";
                      return true;
                    })
                    .map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <GlowCard className="h-full flex flex-col group">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-bold leading-relaxed">{item.title}</h3>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all shrink-0">
                              <button onClick={() => setEditingItem(item)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <PenLine className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteContent(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {item.niche && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-brainhance-purple/10 text-brainhance-purple border border-brainhance-purple/20">
                                {item.niche}
                              </span>
                            )}
                            {item.platform && renderPlatformBadge(item.platform)}
                          </div>
                          
                          {renderTrackingCheckboxes(item)}
                          
                          <div className="mt-3 flex items-center justify-end">
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-foreground flex items-center gap-1">
                              {STAGE_ICONS[item.stage]} 
                              <span className="hidden sm:inline">{STAGE_LABELS[item.stage]?.[locale === "ar" ? "ar" : "en"]}</span>
                            </span>
                          </div>
                        </GlowCard>
                      </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="col-span-full text-center py-12 glass rounded-2xl">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد أفكار بعد" : "No ideas yet"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Pipeline Tab ────────────────────── */}
          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                >
                  <Plus className="w-4 h-4 me-1.5" /> {t(locale, "addContent")}
                </Button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0, overflow: "hidden" }} animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} exit={{ opacity: 0, height: 0, overflow: "hidden" }}>
                    <GlowCard>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t(locale, "contentTitle")} className="bg-background/50 md:col-span-2" />
                        <Input value={newNiche} onChange={(e) => setNewNiche(e.target.value)} placeholder={locale === "ar" ? "التصنيف (مثال: فلوج)" : "Category (e.g. Vlog)"} className="bg-background/50" />
                        <Input value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} placeholder={t(locale, "contentPlatform")} className="bg-background/50" />
                        <CustomDatePicker value={newSchedule} onChange={setNewSchedule} locale={locale} placeholder={locale === "ar" ? "تاريخ النشر" : "Publish Date"} />
                        <Button onClick={addContent} disabled={!newTitle.trim()} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white md:col-span-5">
                          <Plus className="w-4 h-4 me-1" /> {t(locale, "addContent")}
                        </Button>
                      </div>
                    </GlowCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kanban Board - horizontal scroll */}
              <div className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-black/10 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-r [&::-webkit-scrollbar-thumb]:from-brainhance-purple/50 [&::-webkit-scrollbar-thumb]:to-brainhance-violet/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:from-brainhance-purple hover:[&::-webkit-scrollbar-thumb]:to-brainhance-violet">
                <div className="flex gap-4 min-w-max" dir={locale === "ar" ? "rtl" : "ltr"}>
                  {STAGES.map((stage) => {
                    const stageItems = groupByStage.get(stage) || [];
                    return (
                      <div key={stage} className="w-64 shrink-0">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <span className="flex items-center justify-center w-6 h-6">{STAGE_ICONS[stage]}</span>
                          <h3 className="text-sm font-bold">{locale === "ar" ? STAGE_LABELS[stage].ar : STAGE_LABELS[stage].en}</h3>
                          <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{stageItems.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto pr-1 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brainhance-purple/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brainhance-purple/60">
                          {stageItems.length === 0 && (
                            <div className="glass rounded-xl p-4 text-center">
                              <p className="text-[10px] text-muted-foreground">{locale === "ar" ? "سحب المحتوى هنا" : "Drop content here"}</p>
                            </div>
                          )}
                          <AnimatePresence>
                            {stageItems.map((item) => (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass rounded-xl p-3 group cursor-pointer hover:border-brainhance-purple/30 border border-transparent transition-all"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold leading-relaxed flex-1">{item.title}</p>
                                  <div className="shrink-0 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                    <button onClick={() => setEditingItem(item)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                      <PenLine className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => deleteContent(item.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {item.platform && <div className="mt-1.5">{renderPlatformBadge(item.platform)}</div>}
                                {item.scheduled_date && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    📅 {new Date(item.scheduled_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                                  </p>
                                )}
                                
                                {renderTrackingCheckboxes(item)}
                                
                                <div className="flex gap-1 mt-3">
                                  {stage !== "idea" && (
                                    <button onClick={() => moveStage(item.id, STAGES[STAGES.indexOf(stage) - 1])} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
                                      {locale === "ar" ? "→" : "←"}
                                    </button>
                                  )}
                                  {stage !== "published" && (
                                    <button onClick={() => moveStage(item.id, STAGES[STAGES.indexOf(stage) + 1])} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
                                      {locale === "ar" ? "←" : "→"}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Calendar Tab ─────────────────────── */}
          {activeTab === "calendar" && (
            <GlowCard>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); }} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                  {locale === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <h3 className="text-sm font-bold">
                  {locale === "ar" ? MONTHS_AR[calMonth] : MONTHS_EN[calMonth]} {calYear}
                </h3>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); }} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                  {locale === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(locale === "ar" ? DAYS_AR : DAYS_EN).map((d) => (
                  <div key={d} className="text-center text-[10px] text-muted-foreground py-2 font-semibold">{d}</div>
                ))}
                {Array.from({ length: calStartDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: calDaysInMonth }, (_, i) => i + 1).map((day) => {
                  const hasContent = scheduledDates.has(day);
                  const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                  return (
                    <motion.div
                      key={day}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => hasContent && setSelectedDay(day)}
                      className={`relative aspect-square rounded-xl flex items-center justify-center text-xs transition-all ${
                        hasContent ? "cursor-pointer" : "cursor-default"
                      } ${
                        isToday
                          ? "bg-brainhance-purple/30 text-brainhance-glow font-bold border border-brainhance-purple/40"
                          : hasContent
                            ? "bg-brainhance-purple/15 text-brainhance-glow hover:bg-brainhance-purple/25"
                            : "glass hover:bg-white/5"
                      }`}
                    >
                      {day}
                      {hasContent && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brainhance-glow" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Day Detail Modal */}
              <AnimatePresence>
                {selectedDay !== null && dayItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setSelectedDay(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="glass rounded-2xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">
                          {locale === "ar" ? MONTHS_AR[calMonth] : MONTHS_EN[calMonth]} {selectedDay}, {calYear}
                        </h3>
                        <button onClick={() => setSelectedDay(null)} className="p-1.5 glass rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dayItems.map((item) => (
                          <div key={item.id} className="glass rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold">{item.title}</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brainhance-purple/20 text-brainhance-glow shrink-0">
                                {locale === "ar" ? STAGE_LABELS[item.stage]?.ar || item.stage : STAGE_LABELS[item.stage]?.en || item.stage}
                              </span>
                            </div>
                            {item.platform && <p className="text-[10px] text-muted-foreground mt-1">{item.platform}</p>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlowCard>
          )}

          {/* ── Scripts Tab ──────────────────────── */}
          {activeTab === "scripts" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowScriptForm(!showScriptForm)}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                >
                  <ScrollText className="w-4 h-4 me-1.5" /> {locale === "ar" ? "سكريبت جديد" : "New Script"}
                </Button>
              </div>

              <AnimatePresence>
                {showScriptForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <GlowCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <PenLine className="w-4 h-4 text-brainhance-glow" />
                          {locale === "ar" ? "سكريبت جديد" : "New Script"}
                        </h3>
                        <button onClick={() => setShowScriptForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">{locale === "ar" ? "عنوان الفيديو" : "Video Title"} *</label>
                            <Input value={scriptTitle} onChange={(e) => setScriptTitle(e.target.value)} placeholder={locale === "ar" ? "مثال: كيف تبني عادة في 21 يوم" : "e.g. How to build a habit in 21 days"} className="bg-background/50" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">{locale === "ar" ? "المنصة" : "Platform"}</label>
                            <Input value={scriptPlatform} onChange={(e) => setScriptPlatform(e.target.value)} placeholder={locale === "ar" ? "يوتيوب، تيك توك..." : "YouTube, TikTok..."} className="bg-background/50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> {locale === "ar" ? "الهوك (أول 5 ثواني)" : "Hook (First 5 seconds)"}</label>
                          <Textarea value={scriptHook} onChange={(e) => setScriptHook(e.target.value)} placeholder={locale === "ar" ? "الجملة الأولى التي تجذب الانتباه..." : "The opening line that grabs attention..."} className="bg-background/50 min-h-[70px]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5 text-brainhance-purple" /> {locale === "ar" ? "جسم السكريبت" : "Script Body"}</label>
                          <Textarea value={scriptBody} onChange={(e) => setScriptBody(e.target.value)} placeholder={locale === "ar" ? "محتوى الفيديو كاملاً..." : "Full video content..."} className="bg-background/50 min-h-[180px] font-mono text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5 text-brainhance-glow" /> CTA {locale === "ar" ? "(دعوة للتفاعل)" : "(Call to Action)"}</label>
                          <Textarea value={scriptCTA} onChange={(e) => setScriptCTA(e.target.value)} placeholder={locale === "ar" ? "اشترك وفعّل الجرس..." : "Subscribe and hit the bell..."} className="bg-background/50 min-h-[60px]" />
                        </div>
                        <Button onClick={saveScript} disabled={scriptSaving || !scriptTitle.trim()} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white">
                          {scriptSaving
                            ? <span className="flex items-center gap-2"><motion.span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /></span>
                            : <span className="flex items-center gap-2"><PenLine className="w-4 h-4" />{locale === "ar" ? "حفظ السكريبت" : "Save Script"}</span>}
                        </Button>
                      </div>
                    </GlowCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {scripts.length === 0 && !showScriptForm ? (
                <div className="text-center py-16">
                  <ScrollText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد سكريبتات بعد" : "No scripts yet"}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{locale === "ar" ? "ابدأ بكتابة سكريبت فيديو جديد" : "Start writing your first video script"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {scripts.map((script, idx) => (
                      <motion.div key={script.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                        <GlowCard>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold">{script.title}</h3>
                                {script.platform && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brainhance-purple/15 text-brainhance-glow">{script.platform}</span>
                                )}
                              </div>
                              {script.hook && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex items-start gap-1"><Lightbulb className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />{script.hook}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                                {new Date(script.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => copyScript(script)}
                                className="p-1.5 glass rounded-xl text-muted-foreground hover:text-brainhance-glow transition-colors"
                                title={locale === "ar" ? "نسخ" : "Copy"}
                              >
                                {copiedId === script.id ? <CheckCheck className="w-3.5 h-3.5 text-brainhance-success" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                                className="p-1.5 glass rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ScrollText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteScript(script.id)}
                                className="p-1.5 glass rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedScript === script.id && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 space-y-3">
                                {script.hook && (
                                  <div className="glass rounded-xl p-3">
                                    <p className="text-[10px] text-brainhance-glow font-bold mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-yellow-400" />{locale === "ar" ? "الهوك" : "Hook"}</p>
                                    <p className="text-xs text-foreground/80 whitespace-pre-wrap">{script.hook}</p>
                                  </div>
                                )}
                                {script.body && (
                                  <div className="glass rounded-xl p-3">
                                    <p className="text-[10px] text-brainhance-glow font-bold mb-1 flex items-center gap-1"><ScrollText className="w-3 h-3 text-brainhance-purple" />{locale === "ar" ? "السكريبت" : "Script"}</p>
                                    <p className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">{script.body}</p>
                                  </div>
                                )}
                                {script.cta && (
                                  <div className="glass rounded-xl p-3 bg-brainhance-purple/5 border border-brainhance-purple/20">
                                    <p className="text-[10px] text-brainhance-glow font-bold mb-1 flex items-center gap-1"><Rocket className="w-3 h-3 text-brainhance-glow" />CTA</p>
                                    <p className="text-xs text-foreground/80 whitespace-pre-wrap">{script.cta}</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </GlowCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* ── Platforms Tab ────────────────────── */}
          {activeTab === "platforms" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={platSearch} 
                    onChange={(e) => setPlatSearch(e.target.value)} 
                    placeholder={locale === "ar" ? "ابحث عن رابط..." : "Search link..."} 
                    className="pl-9 bg-background/50" 
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-thin">
                  {(locale === "ar" ? CATEGORIES_AR : CATEGORIES_EN).map((cat) => {
                    const isAll = cat === "الكل" || cat === "All";
                    const isSelected = platCategoryFilter === cat || (isAll && (platCategoryFilter === "الكل" || platCategoryFilter === "All"));
                    return (
                      <button
                        key={cat}
                        onClick={() => setPlatCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          isSelected 
                            ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" 
                            : "glass text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setShowAddPlatform(!showAddPlatform)}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white w-full sm:w-auto shrink-0"
                >
                  <Plus className="w-4 h-4 me-1.5" /> {t(locale, "addPlatform")}
                </Button>
              </div>

              <AnimatePresence>
                {showAddPlatform && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <GlowCard>
                      <div className="mb-4">
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                          {locale === "ar" ? "قوالب سريعة:" : "Quick Templates:"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {LINK_TEMPLATES.map((tmpl) => (
                             <button
                               key={tmpl.name}
                               onClick={() => {
                                 setNewPlatName(tmpl.name);
                                 setNewPlatUrl(tmpl.url);
                                 setNewPlatIcon(tmpl.icon);
                                 setNewPlatCategory(locale === "ar" ? tmpl.category_ar : tmpl.category_en);
                               }}
                               className="px-3 py-1.5 glass rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center gap-1.5"
                             >
                               <span className="scale-75 shrink-0">{PLATFORM_ICONS[tmpl.icon] || <Globe className="w-4 h-4" />}</span>
                               {tmpl.name}
                             </button>
                           ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-2">
                           <Input value={newPlatName} onChange={(e) => setNewPlatName(e.target.value)} placeholder={t(locale, "contentPlatform")} className="bg-background/50" />
                        </div>
                        <div className="lg:col-span-2">
                           <Input value={newPlatUrl} onChange={(e) => setNewPlatUrl(e.target.value)} placeholder={t(locale, "platformUrl")} className="bg-background/50" />
                        </div>
                        <div>
                           <Input value={newPlatCategory} onChange={(e) => setNewPlatCategory(e.target.value)} placeholder={locale === "ar" ? "التصنيف" : "Category"} className="bg-background/50" />
                        </div>
                        <div className="lg:col-span-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                           {Object.keys(PLATFORM_ICONS).map((iconKey) => (
                             <button
                               key={iconKey}
                               onClick={() => setNewPlatIcon(iconKey)}
                               className={`p-2 rounded-xl transition-all shrink-0 ${newPlatIcon === iconKey ? "bg-brainhance-purple/20 border border-brainhance-purple/50" : "glass hover:bg-white/10"}`}
                             >
                               {PLATFORM_ICONS[iconKey]}
                             </button>
                           ))}
                        </div>
                        <div className="lg:col-span-1">
                          <Button onClick={addPlatform} disabled={!newPlatName.trim()} className="w-full h-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white py-3">
                            <Plus className="w-4 h-4 me-1" /> {locale === "ar" ? "إضافة" : "Add"}
                          </Button>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {(() => {
                const filtered = platforms.filter(pl => {
                  const matchesSearch = (pl.platform || "").toLowerCase().includes(platSearch.toLowerCase()) || 
                                       (pl.url && pl.url.toLowerCase().includes(platSearch.toLowerCase()));
                  const isAll = platCategoryFilter === "الكل" || platCategoryFilter === "All";
                  const matchesCategory = isAll || (pl.category === platCategoryFilter);
                  return matchesSearch && matchesCategory;
                });
                
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <Globe className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد روابط تطابق بحثك" : "No links match your search"}</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((pl) => (
                      <motion.div key={pl.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-xl p-4 flex items-center justify-between group hover:border-brainhance-purple/30 transition-all border border-transparent">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 glass rounded-xl flex items-center justify-center shrink-0">
                             {PLATFORM_ICONS[pl.icon || "Globe"] || <Globe className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{pl.platform}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {pl.category && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-muted-foreground shrink-0 border border-white/5">
                                  {pl.category}
                                </span>
                              )}
                              {pl.url && (
                                <a href={pl.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brainhance-purple hover:underline flex items-center gap-1 truncate max-w-[120px]">
                                  {pl.url.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setDeletingPlatform({ id: pl.id, name: pl.platform || "Link" })} className="opacity-0 group-hover:opacity-100 p-2 glass rounded-xl text-muted-foreground hover:text-destructive hover:bg-red-500/10 transition-all shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── AI Growth Tab ────────────────────── */}
          {activeTab === "growth" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input form */}
              <GlowCard className="h-fit">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brainhance-glow" /> {t(locale, "aiGrowth")}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t(locale, "nicheLabel")}</label>
                    <Input
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder={t(locale, "nichePlaceholder")}
                      className="bg-background/50"
                    />
                  </div>

                  {platforms.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(locale, "platformLinks")}</label>
                      <div className="space-y-1">
                        {platforms.map((pl) => (
                          <div key={pl.id} className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <Globe className="w-3 h-3 text-brainhance-glow" />
                            {pl.platform}{pl.url ? ` — ${pl.url}` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={runAnalysis}
                    disabled={analyzing || !niche.trim()}
                    className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                  >
                    {analyzing ? (
                      <span className="flex items-center gap-2">
                        <motion.span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                        {locale === "ar" ? "جاري التحليل..." : "Analyzing..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {t(locale, "aiAudit")}
                      </span>
                    )}
                  </Button>
                </div>
              </GlowCard>

              {/* Results */}
              <div className="space-y-4">
                {growthResult && (
                  <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <GlowCard>
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                          <span>📊</span> {t(locale, "trendAnalysis")}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{growthResult.trend_analysis}</p>
                      </GlowCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <GlowCard>
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <span>🎬</span> {t(locale, "videoIdeas")}
                        </h3>
                        <ul className="space-y-2">
                          {growthResult.video_ideas.map((idea, i) => (
                            <li key={i} className="glass rounded-xl p-3 text-xs flex items-start gap-2">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="text-foreground/90">{idea}</span>
                            </li>
                          ))}
                        </ul>
                      </GlowCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <GlowCard>
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-brainhance-glow" /> {t(locale, "viralSuggestions")}
                        </h3>
                        <ul className="space-y-2">
                          {growthResult.viral_suggestions.map((s, i) => (
                            <li key={i} className="glass rounded-xl p-3 text-xs flex items-start gap-2">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="text-foreground/90">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </GlowCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <GlowCard>
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <span>⚡</span> {t(locale, "optimizationTips")}
                        </h3>
                        <ul className="space-y-2">
                          {growthResult.optimization_tips.map((tip, i) => (
                            <li key={i} className="glass rounded-xl p-3 text-xs flex items-start gap-2">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                              <span className="text-foreground/90">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </GlowCard>
                    </motion.div>

                    {growthResult.competitor_analysis && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <GlowCard>
                          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-brainhance-glow" /> {t(locale, "competitorAnalysis")}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{growthResult.competitor_analysis}</p>
                        </GlowCard>
                      </motion.div>
                    )}
                  </>
                )}

                {!growthResult && !analyzing && (
                  <div className="flex items-center justify-center h-full py-16">
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">{t(locale, "growthDesc")}</p>
                    </div>
                  </div>
                )}

                {analyzing && (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                      <p className="text-sm text-muted-foreground">{locale === "ar" ? "جاري التحليل..." : "Analyzing..."}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Content Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <GlowCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">
                    {locale === "ar" ? "تعديل الفكرة/المحتوى" : "Edit Content"}
                  </h2>
                  <button onClick={() => setEditingItem(null)} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t(locale, "contentTitle")}</label>
                    <Input
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{locale === "ar" ? "التصنيف" : "Category"}</label>
                    <Input
                      value={editingItem.niche || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, niche: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t(locale, "contentPlatform")}</label>
                    <Input
                      value={editingItem.platform || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, platform: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{locale === "ar" ? "تاريخ النشر" : "Publish Date"}</label>
                    <CustomDatePicker
                      value={editingItem.scheduled_date || ""}
                      onChange={(val) => setEditingItem({ ...editingItem, scheduled_date: val })}
                      locale={locale}
                      placeholder={locale === "ar" ? "حدد تاريخ النشر" : "Select publish date"}
                      direction="up"
                    />
                  </div>
                  <Button onClick={updateContent} disabled={!editingItem.title.trim()} className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white mt-4">
                    {locale === "ar" ? "حفظ التعديلات" : "Save Changes"}
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Platform Confirm Modal */}
      <DeleteConfirmModal
        open={!!deletingPlatform}
        onClose={() => setDeletingPlatform(null)}
        onConfirm={() => {
          if (deletingPlatform) deletePlatform(deletingPlatform.id);
        }}
        itemName={deletingPlatform?.name}
      />
    </div>
  );
}
