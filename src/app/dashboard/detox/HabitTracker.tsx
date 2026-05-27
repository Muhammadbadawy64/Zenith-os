"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlowCard } from "@/components/ui/animations";
import { useHabitStore, calculateSRFR, HabitType, FrequencyType } from "./store";
import { useLanguageStore } from "@/lib/store";
import { Plus, Check, Target, Flame, Trash2, ShieldAlert } from "lucide-react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

export function HabitTrackerTab() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { habits, addHabit, toggleHabitLog, deleteHabit } = useHabitStore();

  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<HabitType>("positive");
  const [newFreqType, setNewFreqType] = useState<FrequencyType>("daily");
  const [newFreqCount, setNewFreqCount] = useState<number>(3);
  const [newFreqDays, setNewFreqDays] = useState<number[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    
    addHabit(newTitle.trim(), newType, {
      type: newFreqType,
      count: newFreqType === "times_per_week" ? newFreqCount : undefined,
      days: newFreqType === "specific_days" ? newFreqDays : undefined
    });
    
    setNewTitle("");
    setNewFreqType("daily");
    setNewFreqDays([]);
    setNewFreqCount(3);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-brainhance-glow" />
            {isRTL ? "متتبع العادات (SRFR)" : "Habit Tracker (SRFR)"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL 
              ? "ابنِ عاداتك وتخلص من العادات السيئة عبر مراحل: البداية (7 مرات)، التكرار (21 مرة)، والمتابعة/المكافأة."
              : "Build habits and break bad ones via phases: Start (7 reps), Repeat (21 reps), Follow/Reward."}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-white/10 hover:bg-white/20 text-foreground">
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? "إضافة عادة" : "Add Habit"}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlowCard className="p-4 bg-white/5 border-white/10">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Input 
                    placeholder={isRTL ? "اسم العادة (مثال: القراءة، الجيم...)" : "Habit Name (e.g., Reading, Gym...)"}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-background/50 border-white/10 flex-1"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={() => setNewType("positive")}
                      className={`flex-1 sm:flex-none border-green-500/30 hover:bg-green-500/20 ${newType === "positive" ? "bg-green-500/20 text-green-400" : "text-muted-foreground"}`}
                    >
                      {isRTL ? "إيجابية" : "Positive"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setNewType("negative")}
                      className={`flex-1 sm:flex-none border-red-500/30 hover:bg-red-500/20 ${newType === "negative" ? "bg-red-500/20 text-red-400" : "text-muted-foreground"}`}
                    >
                      {isRTL ? "سلبية" : "Negative"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                  <div className="text-sm font-semibold">{isRTL ? "التكرار:" : "Frequency:"}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setNewFreqType("daily")} className={newFreqType === "daily" ? "bg-brainhance-purple/20 border-brainhance-purple text-white" : "border-white/10 text-muted-foreground"}>
                      {isRTL ? "يومياً" : "Daily"}
                    </Button>
                    <Button variant="outline" onClick={() => setNewFreqType("specific_days")} className={newFreqType === "specific_days" ? "bg-brainhance-purple/20 border-brainhance-purple text-white" : "border-white/10 text-muted-foreground"}>
                      {isRTL ? "أيام محددة" : "Specific Days"}
                    </Button>
                    <Button variant="outline" onClick={() => setNewFreqType("times_per_week")} className={newFreqType === "times_per_week" ? "bg-brainhance-purple/20 border-brainhance-purple text-white" : "border-white/10 text-muted-foreground"}>
                      {isRTL ? "مرات أسبوعياً" : "Times/Week"}
                    </Button>
                  </div>

                  {newFreqType === "specific_days" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[0,1,2,3,4,5,6].map(day => (
                        <Button 
                          key={day} 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNewFreqDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                          className={newFreqDays.includes(day) ? "bg-white/20 text-white border-white/30" : "border-white/10 text-muted-foreground"}
                        >
                          {new Date(2026, 4, 3 + day).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long" })} 
                        </Button>
                      ))}
                    </div>
                  )}

                  {newFreqType === "times_per_week" && (
                     <div className="flex items-center gap-3 pt-2">
                        <span className="text-sm text-muted-foreground">{isRTL ? "كم مرة في الأسبوع؟" : "How many times a week?"}</span>
                        <Input type="number" min={1} max={7} value={newFreqCount} onChange={e => setNewFreqCount(Number(e.target.value) || 1)} className="w-20 bg-background/50 border-white/10 text-center" />
                     </div>
                  )}
                </div>

                <Button onClick={handleAdd} className="w-full sm:w-auto self-end bg-brainhance-purple hover:bg-brainhance-purple/80 text-white mt-2">
                  {isRTL ? "حفظ العادة" : "Save Habit"}
                </Button>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => {
          const { streak, phase, phaseMax, dayInPhase, cycles } = calculateSRFR(habit);
          const isDoneToday = !!habit.logs[todayStr];
          const isPos = habit.type === "positive";
          
          const freq = habit.frequency || { type: "daily" };
          const freqBadge = 
            freq.type === "daily" ? (isRTL ? "يومياً" : "Daily") :
            freq.type === "times_per_week" ? `${freq.count} ${isRTL ? "مرات / أسبوع" : "times/week"}` :
            (isRTL ? "أيام محددة" : "Specific Days");

          const isScheduledToday = 
            freq.type === "times_per_week" || 
            freq.type === "daily" || 
            (freq.type === "specific_days" && freq.days?.includes(new Date().getDay()));

          const colorClass = isPos ? "text-green-400" : "text-red-400";
          const bgClass = isPos ? "bg-green-500/20 border-green-500/30" : "bg-red-500/20 border-red-500/30";
          const progressColor = isPos ? "bg-green-400" : "bg-red-400";

          return (
            <GlowCard key={habit.id} className="p-5 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => setHabitToDelete(habit.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    {isPos ? <Flame className={`w-5 h-5 ${colorClass}`} /> : <ShieldAlert className={`w-5 h-5 ${colorClass}`} />}
                    {habit.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-md border border-white/5">{freqBadge}</span>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "المرحلة:" : "Phase:"} <span className={`font-semibold ${colorClass}`}>{phase}</span>
                      {cycles > 0 && <span className="ms-2 text-brainhance-glow">({cycles} {isRTL ? "دورات مكتملة" : "Cycles"})</span>}
                    </p>
                  </div>
                </div>
                
                {isScheduledToday ? (
                  <button
                    onClick={() => toggleHabitLog(habit.id, todayStr)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 border-2 ${
                      isDoneToday 
                        ? `${bgClass} shadow-[0_0_15px_rgba(0,0,0,0.2)] shadow-${isPos ? "green" : "red"}-500/20 scale-105` 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    title={isRTL ? "تأكيد إنجاز اليوم" : "Mark today as done"}
                  >
                    <Check className={`w-6 h-6 ${isDoneToday ? colorClass : "text-white/20"}`} />
                  </button>
                ) : (
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 opacity-50 cursor-not-allowed shrink-0"
                    title={isRTL ? "ليس مقرراً اليوم بناءً على جدولك" : "Not scheduled for today"}
                  >
                    <span className="text-[9px] text-center leading-tight text-white/40">{isRTL ? "غير\nمقرر" : "Off\nDay"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  <span>{isRTL ? "التقدم في المرحلة" : "Phase Progress"}</span>
                  <span>{dayInPhase} / {phaseMax}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${progressColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(dayInPhase / phaseMax) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mt-2 bg-black/20 p-2 rounded-xl">
                <span className="text-muted-foreground">{isRTL ? "مرات الإنجاز (السلسلة):" : "Completions (Streak):"}</span>
                <span className="font-bold flex items-center gap-1">
                  {streak} <Flame className="w-3 h-3 text-orange-400" />
                </span>
              </div>
            </GlowCard>
          );
        })}

        {habits.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-3xl">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>{isRTL ? "لم تقم بإضافة أي عادات بعد." : "No habits added yet."}</p>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={() => {
          if (habitToDelete) {
            deleteHabit(habitToDelete);
            setHabitToDelete(null);
          }
        }}
        itemName={habits.find(h => h.id === habitToDelete)?.title}
      />
    </div>
  );
}
