"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, Calendar, Pencil, Trash2, CalendarRange, Star, Rocket, Save, 
  CheckCircle, TrendingUp, RefreshCw, Pin, Brain, BookOpen, Activity, 
  Heart, Sun, Plus, FileText, Moon, Archive, Binoculars, Inbox, ChevronDown, ChevronRight, ChevronLeft, GripVertical
} from "lucide-react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

// ─── Animations ───────────────────────────────────────────
const zoomVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 1.05 : 0.95,
    filter: "blur(4px)",
  }),
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 0.95 : 1.05,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: "easeOut" }
  })
};

// ─── Helpers ──────────────────────────────────────────────
function getMonthWeeks(year: number, month: number) {
  const weeks: { index: number; start: Date; end: Date }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let current = new Date(firstDay);

  let weekIndex = 1;
  while (current <= lastDay) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    if (end > lastDay) end.setDate(lastDay.getDate());
    weeks.push({ index: weekIndex, start: new Date(start), end: new Date(end) });
    current.setDate(current.getDate() + 7);
    weekIndex++;
  }

  return weeks;
}

function formatDate(d: Date, locale: "ar" | "en") {
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

// Returns the ISO date string of the Monday of the current week
function getWeekMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}


// ─── 6 Year Vision Component ──────────────────────────────
function Vision6Years({ locale }: { locale: "ar" | "en" }) {
  const { user } = useAuthStore();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const [goals, setGoals] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_type", "vision")
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.data && data.data.goals) {
          setGoals(data.data.goals);
        } else {
          setGoals({});
        }
      });
  }, [user?.id, currentYear]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("planner_logs").upsert({
        user_id: user.id,
        log_type: "vision",
        date: "2099-12-31",
        data: { goals },
      }, { onConflict: "user_id, log_type, date", ignoreDuplicates: false });
      if (error) console.error("[Vision save error]", error.message);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, goals]);

  const [newGoal, setNewGoal] = useState<{ year: number; text: string } | null>(null);
  const [editingGoal, setEditingGoal] = useState<{ year: number; index: number; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ year: number; index: number; name: string } | null>(null);

  // ─── Drag & Drop Handlers ───
  const [draggedGoal, setDraggedGoal] = useState<{ year: number; index: number; text: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, year: number, index: number, text: string) => {
    setDraggedGoal({ year, index, text });
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedGoal(null);
    if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnYear = (e: React.DragEvent, targetYear: number) => {
    e.preventDefault();
    if (!draggedGoal) return;
    
    setGoals((prev) => {
      const { year: sourceYear, index: sourceIndex, text } = draggedGoal;
      const newGoals = { ...prev };
      
      newGoals[sourceYear] = [...(newGoals[sourceYear] || [])];
      newGoals[sourceYear].splice(sourceIndex, 1);
      
      if (sourceYear !== targetYear && (newGoals[targetYear] || []).length >= 3) {
        return prev;
      }

      newGoals[targetYear] = [...(newGoals[targetYear] || []), text];
      return newGoals;
    });
  };

  const handleDropOnGoal = (e: React.DragEvent, targetYear: number, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedGoal) return;

    setGoals((prev) => {
      const { year: sourceYear, index: sourceIndex } = draggedGoal;
      const newGoals = { ...prev };
      
      newGoals[sourceYear] = [...(newGoals[sourceYear] || [])];
      
      if (sourceYear === targetYear) {
        const [moved] = newGoals[sourceYear].splice(sourceIndex, 1);
        newGoals[sourceYear].splice(targetIndex, 0, moved);
      } else {
        if ((newGoals[targetYear] || []).length >= 3) return prev;
        
        newGoals[targetYear] = [...(newGoals[targetYear] || [])];
        const [moved] = newGoals[sourceYear].splice(sourceIndex, 1);
        newGoals[targetYear].splice(targetIndex, 0, moved);
      }
      return newGoals;
    });
  };

  const addGoal = (year: number) => {
    if (!newGoal || !newGoal.text.trim()) return;
    setGoals((prev) => ({ ...prev, [year]: [...(prev[year] || []), newGoal.text] }));
    setNewGoal(null);
  };

  const updateGoal = () => {
    if (!editingGoal || !editingGoal.text.trim()) return;
    setGoals((prev) => {
      const yearGoals = [...(prev[editingGoal.year] || [])];
      yearGoals[editingGoal.index] = editingGoal.text;
      return { ...prev, [editingGoal.year]: yearGoals };
    });
    setEditingGoal(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const { year, index } = deleteTarget;
    setGoals((prev) => {
      const yearGoals = [...(prev[year] || [])];
      yearGoals.splice(index, 1);
      return { ...prev, [year]: yearGoals };
    });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold gradient-text">
          {locale === "ar" ? "رؤية الـ 6 سنوات (تفريغ العقل)" : "6-Year Vision (Brain Dump)"}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl mx-auto">
          {locale === "ar"
            ? "لا تشتت نفسك بأهداف بعيدة الآن. ضع 3 أهداف كبرى كحد أقصى لكل سنة قادمة، وركز فقط على السنة الحالية."
            : "Don't distract yourself with distant goals. Place up to 3 major goals for future years, and focus only on the current year."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((year, index) => {
          const yearGoals = goals[year] || [];
          const isCurrentYear = index === 0;

          return (
            <motion.div key={year} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnYear(e, year)}
                className="h-full"
              >
                <GlowCard className={`h-full flex flex-col transition-all ${isCurrentYear ? "border-brainhance-purple ring-1 ring-brainhance-purple/30" : ""} ${draggedGoal && draggedGoal.year !== year ? "border-dashed border-brainhance-purple/50 bg-brainhance-purple/5" : ""}`}>
                  <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    {isCurrentYear ? <Target className="w-5 h-5 text-brainhance-purple" /> : <Calendar className="w-5 h-5 text-muted-foreground" />} {year}
                  </h4>
                  {isCurrentYear && (
                    <span className="text-xs bg-brainhance-purple/20 text-brainhance-glow px-2 py-1 rounded-md">
                      {locale === "ar" ? "السنة الحالية" : "Current Year"}
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-1 min-h-[100px]">
                  {yearGoals.map((goal, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => handleDragStart(e, year, i, goal)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnGoal(e, year, i)}
                      className="group relative flex flex-col gap-2 p-3 rounded-xl glass hover:bg-white/5 transition-all text-sm border border-border/30 hover:border-brainhance-purple/50 cursor-grab active:cursor-grabbing"
                    >
                      {editingGoal?.year === year && editingGoal?.index === i ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Input
                            autoFocus
                            value={editingGoal.text}
                            onChange={(e) => setEditingGoal({ ...editingGoal, text: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && updateGoal()}
                            className="text-sm h-8 bg-background/50"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={updateGoal} className="h-6 px-2 text-[10px] bg-brainhance-success text-white">
                              ✓
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingGoal(null)} className="h-6 px-2 text-[10px]">
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="flex items-start gap-2 flex-1">
                            <GripVertical className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
                            <span className="text-brainhance-purple font-bold mt-0.5">{i + 1}.</span>
                            <p className="flex-1 leading-snug">{goal}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                            <button onClick={() => setEditingGoal({ year, index: i, text: goal })} className="text-muted-foreground hover:text-blue-400 p-1">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget({ year, index: i, name: goal })} className="text-muted-foreground hover:text-red-400 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {yearGoals.length < 3 &&
                    (newGoal?.year === year ? (
                      <div className="flex flex-col gap-2 mt-2 p-3 rounded-xl border border-dashed border-brainhance-purple/50 bg-brainhance-purple/5">
                        <Input
                          autoFocus
                          value={newGoal.text}
                          onChange={(e) => setNewGoal({ year, text: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && addGoal(year)}
                          placeholder={locale === "ar" ? "أدخل الهدف..." : "Enter goal..."}
                          className="text-sm h-8 bg-background/80"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => addGoal(year)} className="h-7 text-xs bg-brainhance-purple text-white flex-1">
                            {locale === "ar" ? "حفظ" : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setNewGoal(null)} className="h-7 text-xs flex-1 border-border/50">
                            {locale === "ar" ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewGoal({ year, text: "" })}
                        className="w-full text-start text-xs text-muted-foreground hover:text-brainhance-glow p-3 rounded-xl border border-dashed border-border/50 hover:border-brainhance-purple/50 hover:bg-brainhance-purple/5 transition-colors mt-2"
                      >
                        + {locale === "ar" ? "إضافة هدف (الحد الأقصى 3)" : "Add goal (Max 3)"}
                      </button>
                    ))}
                </div>
                </GlowCard>
              </div>
            </motion.div>
          );
        })}
      </div>

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

// ─── Monthly Planner Component ────────────────────────────
function MonthlyPlanner({ locale }: { locale: "ar" | "en" }) {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" });
  const monthWeeks = getMonthWeeks(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const [lifeDream, setLifeDream] = useState("");
  const [monthGoals, setMonthGoals] = useState<string[]>([""]);
  const [howToAchieve, setHowToAchieve] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [weekGoals, setWeekGoals] = useState<Record<number, string[]>>(() => {
    const init: Record<number, string[]> = {};
    monthWeeks.forEach((w) => (init[w.index] = [""]));
    return init;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const monthDateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;

  // Load existing draft on mount or when month changes
  useEffect(() => {
    if (!user?.id) return;

    // Reset local state first to prevent bleed-over between months
    setLifeDream("");
    setMonthGoals([""]);
    setHowToAchieve("");
    setWeekGoals(() => {
      const init: Record<number, string[]> = {};
      monthWeeks.forEach((w) => (init[w.index] = [""]));
      return init;
    });

    supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_type", "monthly")
      .eq("date", monthDateKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data.data || {};
          setLifeDream(d.lifeDream || "");
          setMonthGoals(d.monthGoals || [""]);
          setHowToAchieve(d.howToAchieve || "");
          if (d.weekGoals) setWeekGoals(d.weekGoals);
        }
      });
  }, [user?.id, monthDateKey]); // Rely on monthDateKey, which changes when currentDate changes

  // Autosave with 2s debounce
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("planner_logs").upsert({
        user_id: user.id,
        log_type: "monthly",
        date: monthDateKey,
        data: { monthName: monthLabel, lifeDream, monthGoals, howToAchieve, weekGoals, monthWeeks },
      }, { onConflict: "user_id, log_type, date", ignoreDuplicates: false });
      if (error) console.error("[Monthly save error]", error.message);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, lifeDream, monthGoals, howToAchieve, weekGoals]);

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center mb-8 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-4 justify-center">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-white/10">
            <ChevronRight className={`w-5 h-5 ${locale === "ar" ? "" : "rotate-180"}`} />
          </Button>
          <h3 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2 min-w-[200px]">
            <CalendarRange className="w-7 h-7 text-brainhance-purple" /> {locale === "ar" ? "خطة" : "Plan for"} {monthLabel}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-white/10">
            <ChevronLeft className={`w-5 h-5 ${locale === "ar" ? "" : "rotate-180"}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-glow">
              <Star className="w-4 h-4" /> {locale === "ar" ? "حلم حياتي أني..." : "My life dream is to..."}
            </h4>
            <Textarea
              value={lifeDream}
              onChange={(e) => setLifeDream(e.target.value)}
              placeholder={locale === "ar" ? "اكتب رؤيتك الكبرى هنا..." : "Write your grand vision here..."}
              className="bg-background/50 border-border/50 resize-none min-h-[80px]"
            />
          </GlowCard>

          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-brainhance-purple">
              <Target className="w-4 h-4" /> {locale === "ar" ? "أهدافي المحددة هذا الشهر" : "My Specific Goals this Month"}
            </h4>
            <div className="space-y-3">
              {monthGoals.map((goal, i) => (
                <div key={`mgoal-${i}`} className="group relative flex flex-col gap-2 p-3 rounded-xl glass hover:bg-white/5 transition-all text-sm border border-border/30 hover:border-brainhance-purple/50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-brainhance-purple/20 text-brainhance-glow flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-brainhance-purple/30">
                      {i + 1}
                    </span>
                    <Input
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...monthGoals];
                        newGoals[i] = e.target.value;
                        setMonthGoals(newGoals);
                      }}
                      placeholder={locale === "ar" ? "الهدف والتفاصيل..." : "Goal and details..."}
                      className="bg-transparent border-b border-border/50 rounded-none focus-visible:ring-0 px-1 text-sm h-8"
                    />
                    {monthGoals.length > 1 && (
                      <button
                        onClick={() => setMonthGoals(monthGoals.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {monthGoals.length < 5 && (
                <button
                  onClick={() => setMonthGoals([...monthGoals, ""])}
                  className="w-full text-start text-xs text-muted-foreground hover:text-brainhance-glow p-3 rounded-xl border border-dashed border-border/50 hover:border-brainhance-purple/50 hover:bg-brainhance-purple/5 transition-colors mt-2 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> {locale === "ar" ? "إضافة هدف جديد" : "Add new goal"}
                </button>
              )}
            </div>
          </GlowCard>

          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-glow">
              <Rocket className="w-4 h-4" /> {locale === "ar" ? "كيف ستحقق حلم حياتك؟" : "How will you achieve your life dream?"}
            </h4>
            <Textarea
              value={howToAchieve}
              onChange={(e) => setHowToAchieve(e.target.value)}
              placeholder={locale === "ar" ? "الخطوات والاستراتيجية..." : "Steps and strategy..."}
              className="bg-background/50 border-border/50 resize-none min-h-[100px]"
            />
          </GlowCard>
        </div>

        {/* Dynamic Weeks */}
        <div className="flex flex-col gap-4 h-fit">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-brainhance-purple" />
            <h4 className="text-lg font-bold text-foreground">
              {locale === "ar" ? "توزيع أسابيع الشهر" : "Month Weeks Distribution"}
            </h4>
          </div>
          
          {monthWeeks.map((week) => (
            <GlowCard key={week.index} className="flex flex-col border border-border/30 hover:border-brainhance-purple/30 transition-colors p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brainhance-purple/10 flex items-center justify-center ring-1 ring-brainhance-purple/30">
                    <span className="font-bold text-brainhance-glow text-sm">W{week.index}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {locale === "ar" ? `الأسبوع ${week.index}` : `Week ${week.index}`}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(week.start, locale)} - {formatDate(week.end, locale)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 flex-1 mt-2">
                {(weekGoals[week.index] || []).map((wg, idx) => (
                  <div key={`wk-${week.index}-g-${idx}`} className="flex gap-2 items-center group">
                    <span className="w-4 h-4 rounded border border-muted-foreground/30 flex items-center justify-center bg-white/5 shrink-0" />
                    <Input
                      value={wg}
                      onChange={(e) => {
                        const newWG = { ...weekGoals };
                        newWG[week.index] = [...(newWG[week.index] || [])];
                        newWG[week.index][idx] = e.target.value;
                        setWeekGoals(newWG);
                      }}
                      placeholder={locale === "ar" ? "مهمة أساسية لهذا الأسبوع..." : "Key task for this week..."}
                      className="h-8 text-sm bg-transparent border-transparent hover:border-border/50 focus:border-brainhance-purple/50 rounded-lg px-2 transition-all shadow-none"
                    />
                    {(weekGoals[week.index] || []).length > 1 && (
                      <button
                        onClick={() => {
                          const newWG = { ...weekGoals };
                          newWG[week.index] = (newWG[week.index] || []).filter((_, i) => i !== idx);
                          setWeekGoals(newWG);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 p-1.5 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newWG = { ...weekGoals };
                  newWG[week.index] = [...(newWG[week.index] || []), ""];
                  setWeekGoals(newWG);
                }}
                className="mt-3 text-xs font-semibold text-brainhance-purple hover:text-brainhance-glow transition-colors flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-brainhance-purple/10 w-max"
              >
                <Plus className="w-3.5 h-3.5" /> {locale === "ar" ? "مهمة جديدة" : "New task"}
              </button>
            </GlowCard>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 end-6 z-50">
        <motion.div className="px-4 py-3 rounded-full glass text-[10px] text-muted-foreground flex items-center gap-2">
          <Save className="w-3.5 h-3.5" />
          {locale === "ar" ? "حفظ تلقائي" : "Autosave"}
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 end-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold bg-brainhance-success/20 border border-brainhance-success/40 text-brainhance-success"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Weekly Planner Component ─────────────────────────────
function WeeklyPlanner({ locale }: { locale: "ar" | "en" }) {
  const { user } = useAuthStore();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthWeeks = getMonthWeeks(currentYear, currentMonth);

  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(() => {
    const today = now.getTime();
    const current = monthWeeks.find(w => today >= w.start.getTime() && today <= w.end.getTime());
    return current ? current.index : 1;
  });

  const activeWeek = monthWeeks.find(w => w.index === activeWeekIndex) || monthWeeks[0];
  const weekDateKey = activeWeek.start.toISOString().split("T")[0];

  const [achievedLastWeek, setAchievedLastWeek] = useState("");
  const [improveThisWeek, setImproveThisWeek] = useState("");
  const [habitsToFocus, setHabitsToFocus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [projects, setProjects] = useState([
    { id: 1, title: "", deadline: "", completed: false },
    { id: 2, title: "", deadline: "", completed: false },
    { id: 3, title: "", deadline: "", completed: false },
  ]);

  const [focusGoals, setFocusGoals] = useState({
    psychological: "",
    mental: "",
    physical: "",
    social: "",
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load existing draft on mount and when week changes
  useEffect(() => {
    if (!user?.id) return;

    // Reset local state first to prevent bleed-over
    setAchievedLastWeek("");
    setImproveThisWeek("");
    setHabitsToFocus("");
    setProjects([{ id: 1, title: "", deadline: "", completed: false }, { id: 2, title: "", deadline: "", completed: false }, { id: 3, title: "", deadline: "", completed: false }]);
    setFocusGoals({ psychological: "", mental: "", physical: "", social: "" });

    supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_type", "weekly")
      .eq("date", weekDateKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data.data || {};
          setAchievedLastWeek(d.achievedLastWeek || "");
          setImproveThisWeek(d.improveThisWeek || "");
          setHabitsToFocus(d.habitsToFocus || "");
          setProjects(d.projects || [{ id: 1, title: "", deadline: "", completed: false }, { id: 2, title: "", deadline: "", completed: false }, { id: 3, title: "", deadline: "", completed: false }]);
          setFocusGoals(d.focusGoals || { psychological: "", mental: "", physical: "", social: "" });
        }
      });
  }, [user?.id, weekDateKey, activeWeekIndex]);

  // Autosave with 2s debounce
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("planner_logs").upsert({
        user_id: user.id,
        log_type: "weekly",
        date: weekDateKey,
        data: { weekNumber: activeWeekIndex.toString(), achievedLastWeek, improveThisWeek, habitsToFocus, projects, focusGoals },
      }, { onConflict: "user_id, log_type, date", ignoreDuplicates: false });
      if (error) console.error("[Weekly save error]", error.message);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, activeWeekIndex, weekDateKey, achievedLastWeek, improveThisWeek, habitsToFocus, projects, focusGoals]);

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center mb-8 flex flex-col items-center justify-center gap-3">
        <h3 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2">
          <Calendar className="w-7 h-7 text-brainhance-purple" /> {locale === "ar" ? "خطة الأسبوع" : "Weekly Plan"}
        </h3>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center mt-2 max-w-full px-4">
          {monthWeeks.map((week) => (
            <button
              key={week.index}
              onClick={() => setActiveWeekIndex(week.index)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                activeWeekIndex === week.index
                  ? "bg-brainhance-purple text-white border-brainhance-purple shadow-lg"
                  : "glass text-muted-foreground hover:text-foreground border-border/50"
              }`}
            >
              {locale === "ar" ? `الأسبوع ${week.index}` : `Week ${week.index}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-success">
              <CheckCircle className="w-4 h-4" /> {locale === "ar" ? "ما الذي حققته في الأسبوع الماضي؟" : "What I achieved last week?"}
            </h4>
            <Textarea
              value={achievedLastWeek}
              onChange={(e) => setAchievedLastWeek(e.target.value)}
              placeholder={locale === "ar" ? "إنجازاتي..." : "My achievements..."}
              className="bg-background/50 border-border/50 resize-none min-h-[80px]"
            />
          </GlowCard>

          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-glow">
              <TrendingUp className="w-4 h-4" /> {locale === "ar" ? "كيف سأحسن أدائي هذا الأسبوع؟" : "How will I improve my performance this week?"}
            </h4>
            <Textarea
              value={improveThisWeek}
              onChange={(e) => setImproveThisWeek(e.target.value)}
              placeholder={locale === "ar" ? "خطوات التحسين..." : "Improvement steps..."}
              className="bg-background/50 border-border/50 resize-none min-h-[80px]"
            />
          </GlowCard>

          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-purple">
              <RefreshCw className="w-4 h-4" /> {locale === "ar" ? "عادات سأركز عليها هذا الأسبوع" : "Habits to focus on this week"}
            </h4>
            <Textarea
              value={habitsToFocus}
              onChange={(e) => setHabitsToFocus(e.target.value)}
              placeholder={locale === "ar" ? "العادات..." : "Habits..."}
              className="bg-background/50 border-border/50 resize-none min-h-[80px]"
            />
          </GlowCard>
        </div>

        <div className="space-y-6">
          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-brainhance-glow">
              <Pin className="w-4 h-4" /> {locale === "ar" ? "مشاريع الأسبوع" : "Weekly Projects"}
            </h4>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={proj.id} className="glass p-3 rounded-xl border border-border/50 space-y-3 relative">
                  <div className="absolute top-0 start-0 w-1 h-full bg-brainhance-purple rounded-s-xl" />
                  <div className="ps-2">
                    <div className="flex gap-2 items-center mb-2">
                      <Checkbox
                        checked={proj.completed}
                        onCheckedChange={() => {
                          const newProjs = [...projects];
                          newProjs[idx].completed = !newProjs[idx].completed;
                          setProjects(newProjs);
                        }}
                        className="border-brainhance-purple data-[state=checked]:bg-brainhance-purple"
                      />
                      <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md">{idx + 1}</span>
                      <Input
                        value={proj.title}
                        onChange={(e) => {
                          const newProjs = [...projects];
                          newProjs[idx].title = e.target.value;
                          setProjects(newProjs);
                        }}
                        placeholder={locale === "ar" ? "اسم المشروع..." : "Project name..."}
                        className={`h-8 text-sm bg-transparent border-b border-border/50 rounded-none focus-visible:ring-0 px-0 ${proj.completed ? "line-through text-muted-foreground" : ""}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{locale === "ar" ? "ميعاد التسليم:" : "Deadline:"}</span>
                      <Input
                        type="date"
                        value={proj.deadline}
                        onChange={(e) => {
                          const newProjs = [...projects];
                          newProjs[idx].deadline = e.target.value;
                          setProjects(newProjs);
                        }}
                        className="h-7 text-xs bg-background/50 w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard>
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-brainhance-purple">
              <Target className="w-4 h-4" /> {locale === "ar" ? "أهداف سأركز عليها هذا الأسبوع" : "Goals to focus on this week"}
            </h4>
            <div className="space-y-3">
              {[
                { key: "psychological", label: locale === "ar" ? "نفسياً" : "Psychologically", Icon: Brain },
                { key: "mental", label: locale === "ar" ? "ذهنياً" : "Mentally", Icon: BookOpen },
                { key: "physical", label: locale === "ar" ? "جسدياً" : "Physically", Icon: Activity },
                { key: "social", label: locale === "ar" ? "اجتماعياً وعاطفياً" : "Socially & Emotionally", Icon: Heart },
              ].map((item) => (
                <div key={item.key} className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <item.Icon className="w-3.5 h-3.5 text-brainhance-purple" /> {item.label}:
                  </label>
                  <Input
                    value={focusGoals[item.key as keyof typeof focusGoals]}
                    onChange={(e) => setFocusGoals({ ...focusGoals, [item.key]: e.target.value })}
                    className="h-8 text-sm bg-background/50"
                  />
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>

      <div className="fixed bottom-6 end-6 z-50">
        <motion.div className="px-4 py-3 rounded-full glass text-[10px] text-muted-foreground flex items-center gap-2">
          <Save className="w-3.5 h-3.5" />
          {locale === "ar" ? "حفظ تلقائي" : "Autosave"}
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 end-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold bg-brainhance-success/20 border border-brainhance-success/40 text-brainhance-success"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Daily Planner Component ──────────────────────────────
function DailyPlanner({ locale }: { locale: "ar" | "en" }) {
  const { user } = useAuthStore();
  const [dayName, setDayName] = useState("");
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [goals, setGoals] = useState([{text: "", completed: false}, {text: "", completed: false}, {text: "", completed: false}]);
  const [priorities, setPriorities] = useState([{text: "", completed: false}, {text: "", completed: false}, {text: "", completed: false}]);
  const [extraTasks, setExtraTasks] = useState([{text: "", completed: false}, {text: "", completed: false}]);
  const [notes, setNotes] = useState("");
  const [checkboxes, setCheckboxes] = useState([false, false, false]);
  const [eveningDump, setEveningDump] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"draft" | "archived">("draft");
  const [toast, setToast] = useState<string | null>(null);

  const todayStr = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const todayDate = new Date().toISOString().split("T")[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load today's draft on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_type", "daily")
      .eq("date", todayDate)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data.data || {};
          setDayName(d.dayName || "");
          const parsedGratitude = d.gratitude || [];
          setGratitude([...parsedGratitude, "", "", ""].slice(0, 3));
          
          const parsedGoals = d.goals ? d.goals.map((g: any) => typeof g === "string" ? { text: g, completed: false } : g) : [];
          setGoals([...parsedGoals, {text: "", completed: false}, {text: "", completed: false}, {text: "", completed: false}].slice(0, 3));

          const parsedPriorities = d.priorities ? d.priorities.map((p: any) => typeof p === "string" ? { text: p, completed: false } : p) : [];
          setPriorities([...parsedPriorities, {text: "", completed: false}, {text: "", completed: false}, {text: "", completed: false}].slice(0, 3));

          const parsedExtraTasks = d.extraTasks ? d.extraTasks.map((e: any) => typeof e === "string" ? { text: e, completed: false } : e) : [];
          setExtraTasks([...parsedExtraTasks, {text: "", completed: false}, {text: "", completed: false}].slice(0, 2));
          setNotes(d.notes || "");
          setCheckboxes(d.checkboxes || [false, false, false]);
          setEveningDump(d.eveningDump || "");
          setStatus(data.status || "draft");
        }
      });
  }, [user?.id]);

  // Autosave with 2s debounce
  useEffect(() => {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      log_type: "daily",
      date: todayDate,
      status,
      data: {
        dayName: dayName || todayStr,
        gratitude,
        goals,
        priorities,
        extraTasks,
        notes,
        checkboxes,
        eveningDump,
      },
    };
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("planner_logs").upsert(payload, {
        onConflict: "user_id, log_type, date",
        ignoreDuplicates: false,
      });
      if (error) console.error("[Daily save error]", error.message);
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, dayName, gratitude, goals, priorities, extraTasks, notes, checkboxes, eveningDump, status, todayDate, todayStr, locale]);

  const finalizeDay = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    const { error } = await supabase.from("planner_logs").upsert({
      user_id: user.id,
      log_type: "daily",
      date: todayDate,
      status: "archived",
      data: {
        dayName: dayName || todayStr,
        gratitude, goals, priorities, extraTasks, notes, checkboxes, eveningDump,
      },
    }, { onConflict: "user_id, log_type, date" });
    setIsSaving(false);
    if (!error) {
      setStatus("archived");
      showToast(locale === "ar" ? "تم أرشفة اليوم ✓" : "Day archived ✓");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-center items-center mb-8">
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2">
            <Calendar className="w-7 h-7 text-brainhance-purple" /> {locale === "ar" ? "خطة اليوم" : "Plan for the Day"}
          </h3>
          <Input
            value={dayName}
            onChange={(e) => setDayName(e.target.value)}
            placeholder={todayStr}
            className="w-64 text-center font-bold text-lg bg-brainhance-purple/10 border-brainhance-purple/50 mx-auto"
          />
        </div>
      </div>

      <GlowCard>
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-success">
          <Sun className="w-5 h-5" /> {locale === "ar" ? "حابب تشكر ربنا على إيه النهاردة؟" : "What are you thankful for today?"}
        </h4>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-brainhance-success font-bold">✦</span>
              <Input
                value={gratitude[i] || ""}
                onChange={(e) => {
                  const newG = [...gratitude];
                  newG[i] = e.target.value;
                  setGratitude(newG);
                }}
                className="bg-transparent border-b border-border/50 rounded-none focus-visible:ring-0 px-1 h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlowCard className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-brainhance-purple flex items-center gap-2">
                  <Target className="w-4 h-4" /> {locale === "ar" ? "أهداف اليوم" : "Today's Goals"}
                </h4>
                {[0, 1, 2].map((i) => (
                  <div key={`goal-${i}`} className="flex gap-2 items-center">
                    <span className="text-xs bg-white/10 w-5 h-5 flex items-center justify-center rounded">{i + 1}</span>
                    <Input
                      value={goals[i]?.text || ""}
                      onChange={(e) => {
                        const newG = [...goals];
                        newG[i] = { ...(newG[i] || { completed: false }), text: e.target.value };
                        setGoals(newG);
                      }}
                      className={`h-8 text-sm bg-background/50 ${goals[i]?.completed ? "line-through text-muted-foreground" : ""}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-brainhance-success flex items-center gap-2">
                  <Star className="w-4 h-4" /> {locale === "ar" ? "الأولويات" : "Priorities"}
                </h4>
                {[0, 1, 2].map((i) => (
                  <div key={`prio-${i}`} className="flex gap-2 items-center">
                    <span className="text-xs text-brainhance-success w-5 h-5 flex items-center justify-center rounded border border-brainhance-success/30">
                      •
                    </span>
                    <Input
                      value={priorities[i]?.text || ""}
                      onChange={(e) => {
                        const newP = [...priorities];
                        newP[i] = { ...(newP[i] || { completed: false }), text: e.target.value };
                        setPriorities(newP);
                      }}
                      className={`h-8 text-sm bg-background/50 ${priorities[i]?.completed ? "line-through text-muted-foreground" : ""}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {locale === "ar" ? "مهام إضافية" : "Extra Tasks"}
                </h4>
                {[0, 1].map((i) => (
                  <Input
                    key={`extra-${i}`}
                    value={extraTasks[i]?.text || ""}
                    onChange={(e) => {
                      const newE = [...extraTasks];
                      newE[i] = { ...(newE[i] || { completed: false }), text: e.target.value };
                      setExtraTasks(newE);
                    }}
                    placeholder={locale === "ar" ? "إن وجدت..." : "If any..."}
                    className={`h-8 text-sm bg-background/50 ${extraTasks[i]?.completed ? "line-through text-muted-foreground" : ""}`}
                  />
                ))}
              </div>
            </div>
          </GlowCard>
        </div>

        <div className="space-y-6">
          <GlowCard className="h-full">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-muted-foreground">
              <FileText className="w-4 h-4" /> {locale === "ar" ? "ملاحظات" : "Notes"}
            </h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background/50 border-border/50 resize-none min-h-[120px] mb-4"
            />
            <div className="space-y-3 border-t border-border/30 pt-4">
              {[0, 1, 2].map((i) => (
                <div key={`check-${i}`} className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const newC = [...checkboxes];
                      newC[i] = !newC[i];
                      setCheckboxes(newC);
                    }}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${checkboxes[i] ? "bg-brainhance-purple border-brainhance-purple" : "border-muted-foreground/50"}`}
                  >
                    {checkboxes[i] && <span className="text-white text-xs">✓</span>}
                  </button>
                  <Input
                    placeholder={locale === "ar" ? "مهمة سريعة..." : "Quick task..."}
                    className="h-8 text-sm bg-transparent border-b border-border/50 rounded-none focus-visible:ring-0 px-1"
                  />
                </div>
              ))}
            </div>
          </GlowCard>
        </div>
      </div>

      <GlowCard className="border-brainhance-purple/30 bg-brainhance-purple/5">
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brainhance-purple">
          <Moon className="w-5 h-5" />{" "}
          {locale === "ar" ? "تفريغ قبل النوم: في حاجة شاغلة تفكيرك؟" : "Pre-sleep dump: Something on your mind?"}
        </h4>
        <Textarea
          value={eveningDump}
          onChange={(e) => setEveningDump(e.target.value)}
          placeholder={locale === "ar" ? "اكتب هنا لتفريغ عقلك والنوم بسلام..." : "Write here to empty your mind and sleep peacefully..."}
          className="bg-background/80 border-brainhance-purple/30 resize-none min-h-[100px]"
        />
      </GlowCard>

      <div className="fixed bottom-6 end-6 z-50 flex gap-3">
        {status !== "archived" && (
          <motion.button
            onClick={finalizeDay}
            disabled={isSaving}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all bg-brainhance-success/20 text-brainhance-success border border-brainhance-success/30 hover:bg-brainhance-success/30"
          >
            <Archive className="w-5 h-5" />
            {locale === "ar" ? "أرشفة اليوم" : "Archive Day"}
          </motion.button>
        )}
        <motion.div className="px-4 py-3 rounded-full glass text-[10px] text-muted-foreground flex items-center gap-2">
          <Save className="w-3.5 h-3.5" />
          {status === "archived"
            ? (locale === "ar" ? "مؤرشف" : "Archived")
            : (locale === "ar" ? "حفظ تلقائي" : "Autosave")}
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 end-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold bg-brainhance-success/20 border border-brainhance-success/40 text-brainhance-success"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Archive View Component ────────────────────────────────
function ArchiveView({ locale }: { locale: "ar" | "en" }) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "archived">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("planner_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setLogs(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    await supabase.from("planner_logs").delete().eq("id", id);
    setLogs((p) => p.filter((l) => l.id !== id));
    const { useNotificationStore } = require("@/lib/store");
    useNotificationStore.getState().addNotification({
      title: locale === "ar" ? "تم الحذف" : "Deleted",
      description: locale === "ar" ? "تم حذف السجل بنجاح" : "Log deleted successfully",
      type: "success"
    });
    setDeleteTarget(null);
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === "all") return true;
    return (l.status || "draft") === filter;
  });

  const grouped = filteredLogs.reduce<Record<string, any[]>>((acc, log) => {
    const type = log.log_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(log);
    return acc;
  }, {});

  const typeOrder = ["monthly", "weekly", "daily"];
  const typeMeta: Record<string, { Icon: React.ElementType; label: string }> = {
    monthly: { Icon: CalendarRange, label: locale === "ar" ? "شهري" : "Monthly" },
    weekly: { Icon: Calendar, label: locale === "ar" ? "أسبوعي" : "Weekly" },
    daily: { Icon: Calendar, label: locale === "ar" ? "يومي" : "Daily" },
  };

  const getLogTitle = (log: any) => {
    if (log.log_type === "daily") return log.data?.dayName || (locale === "ar" ? "يوميات" : "Daily Log");
    if (log.log_type === "weekly") return `${locale === "ar" ? "الأسبوع رقم" : "Week"} ${log.data?.weekNumber || ""}`;
    if (log.log_type === "monthly") return log.data?.monthName || (locale === "ar" ? "خطة شهرية" : "Monthly Plan");
    return locale === "ar" ? "سجل" : "Log";
  };

  const renderSummaryCards = (data: any, type: string) => {
    const cards: React.ReactNode[] = [];
    if (!data) return null;

    if (type === "daily") {
      const items = [
        ...(data.gratitude?.filter(Boolean) || []).map((g: string) => ({ label: "🙏", text: g })),
        ...(data.goals?.filter((g: any) => g && (typeof g === "string" ? g : g.text)) || []).map((g: any) => ({ label: "🎯", text: typeof g === "string" ? g : g.text })),
        ...(data.priorities?.filter((g: any) => g && (typeof g === "string" ? g : g.text)) || []).map((g: any) => ({ label: "⭐", text: typeof g === "string" ? g : g.text })),
        ...(data.extraTasks?.filter((g: any) => g && (typeof g === "string" ? g : g.text)) || []).map((g: any) => ({ label: "📋", text: typeof g === "string" ? g : g.text })),
      ];
      items.slice(0, 6).forEach((item, i) => {
        cards.push(
          <div key={i} className="glass rounded-xl p-2.5 text-xs flex items-start gap-2">
            <span className="shrink-0">{item.label}</span>
            <span className="text-foreground/80 line-clamp-2">{item.text}</span>
          </div>
        );
      });
      if (data.notes) cards.push(
        <div key="notes" className="glass rounded-xl p-2.5 text-xs col-span-full">
          <span className="text-muted-foreground">{locale === "ar" ? "ملاحظات" : "Notes"}: </span>
          <span className="text-foreground/80 line-clamp-2">{data.notes}</span>
        </div>
      );
    } else if (type === "weekly") {
      if (data.achievedLastWeek) cards.push(
        <div key="achieved" className="glass rounded-xl p-2.5 text-xs col-span-full">
          <span className="text-brainhance-success">✅ </span>
          <span className="text-foreground/80 line-clamp-2">{data.achievedLastWeek}</span>
        </div>
      );
      (data.projects?.filter((p: any) => p.title) || []).forEach((p: any, i: number) => {
        cards.push(
          <div key={`proj-${i}`} className="glass rounded-xl p-2.5 text-xs">
            <span className="text-brainhance-glow font-semibold">{p.title}</span>
            {p.deadline && <p className="text-[10px] text-muted-foreground mt-0.5">📅 {p.deadline}</p>}
          </div>
        );
      });
    } else if (type === "monthly") {
      (data.monthGoals?.filter(Boolean) || []).forEach((g: string, i: number) => {
        cards.push(
          <div key={`mg-${i}`} className="glass rounded-xl p-2.5 text-xs flex items-start gap-2">
            <span className="shrink-0 font-bold text-brainhance-purple">{i + 1}.</span>
            <span className="text-foreground/80">{g}</span>
          </div>
        );
      });
      if (data.lifeDream) cards.push(
        <div key="dream" className="glass rounded-xl p-2.5 text-xs col-span-full">
          <span className="text-muted-foreground">{locale === "ar" ? "الحلم" : "Dream"}: </span>
          <span className="text-foreground/80 line-clamp-2">{data.lifeDream}</span>
        </div>
      );
    }

    return cards.length > 0 ? (
      <div className="grid grid-cols-2 gap-2">{cards}</div>
    ) : (
      <p className="text-xs text-muted-foreground">{locale === "ar" ? "لا توجد بيانات مفصلة" : "No detailed data"}</p>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2">
          <Archive className="w-7 h-7 text-brainhance-purple" /> {locale === "ar" ? "أرشيف الرحلة" : "Journey Archive"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {locale === "ar" ? `سجل تخطيطك — ${logs.length} مدخل` : `Your planning history — ${logs.length} entries`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 justify-center">
        {(["all", "draft", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all"
              ? (locale === "ar" ? "الكل" : "All")
              : f === "draft"
                ? (locale === "ar" ? "مسودات" : "Drafts")
                : (locale === "ar" ? "مؤرشف" : "Archived")}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <GlowCard className="text-center py-16 border-dashed border-border/30">
          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{locale === "ar" ? "لا توجد سجلات" : "No logs found"}</p>
        </GlowCard>
      ) : (
        typeOrder.filter((t) => grouped[t]?.length).map((type) => (
          <div key={type}>
            <div className="flex items-center gap-3 mb-4">
              {(() => { const Icon = typeMeta[type]?.Icon; return <Icon className="w-6 h-6 text-brainhance-purple" />; })()}
              <h4 className="text-lg font-bold text-foreground">{typeMeta[type]?.label}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brainhance-purple/10 text-brainhance-glow">{grouped[type].length}</span>
            </div>

            <div className="space-y-3">
              {grouped[type].map((log: any) => {
                const isOpen = expandedId === log.id;
                const logStatus = log.status || "draft";
                return (
                  <GlowCard key={log.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{getLogTitle(log)}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            logStatus === "archived"
                              ? "bg-brainhance-success/15 text-brainhance-success"
                              : "bg-yellow-400/15 text-yellow-400"
                          }`}>
                            {logStatus === "archived"
                              ? (locale === "ar" ? "مؤرشف" : "Archived")
                              : (locale === "ar" ? "مسودة" : "Draft")}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(log.date || log.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExpandedId(isOpen ? null : log.id)}
                          className="p-1.5 glass rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: log.id, name: getLogTitle(log) })}
                          className="p-1.5 glass rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border/20">
                            {renderSummaryCards(log.data, log.log_type)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlowCard>
                );
              })}
            </div>
          </div>
        ))
      )}

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

// ─── Main Planner Page ────────────────────────────────────
export default function PlannerPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";

  const [activeView, setActiveView] = useState<"vision" | "month" | "week" | "day" | "archive">("vision");
  const [direction, setDirection] = useState(0);

  const views = [
    { key: "vision" as const, Icon: Binoculars, label: locale === "ar" ? "الرؤية (6 سنوات)" : "Vision" },
    { key: "month" as const, Icon: CalendarRange, label: locale === "ar" ? "الشهر" : "Month" },
    { key: "week" as const, Icon: Calendar, label: locale === "ar" ? "الأسبوع" : "Week" },
    { key: "day" as const, Icon: Calendar, label: locale === "ar" ? "اليوم" : "Day" },
    { key: "archive" as const, Icon: Archive, label: locale === "ar" ? "الأرشيف" : "Archive" },
  ];

  const viewOrder = views.map(v => v.key);

  const handleViewChange = (newView: "vision" | "month" | "week" | "day" | "archive") => {
    const oldIdx = viewOrder.indexOf(activeView);
    const newIdx = viewOrder.indexOf(newView);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setActiveView(newView);
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Brain className="w-7 h-7 text-brainhance-purple" />
          <span className="gradient-text">{locale === "ar" ? "المخطط الذكي" : "Smart Planner"}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "نظام تخطيط متدرج يمنع التشتت" : "Cascading planning system to prevent distraction"}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border/20">
        {views.map((view) => (
          <button
            key={view.key}
            onClick={() => handleViewChange(view.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
              activeView === view.key
                ? "bg-brainhance-purple/10 text-brainhance-glow border-brainhance-purple"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-white/5"
            }`}
          >
            <view.Icon className="w-4 h-4" />
            {view.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeView}
          custom={direction}
          variants={zoomVariants as any}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          {activeView === "vision" && <Vision6Years locale={locale} />}
          {activeView === "month" && <MonthlyPlanner locale={locale} />}
          {activeView === "week" && <WeeklyPlanner locale={locale} />}
          {activeView === "day" && <DailyPlanner locale={locale} />}
          {activeView === "archive" && <ArchiveView locale={locale} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
