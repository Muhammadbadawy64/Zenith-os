"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useLanguageStore, useAuthStore, useNotificationStore, useParetoTimerStore, ParetoTask } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  Play, Plus, Trash2, Crown, CheckCircle2, 
  Circle, Clock, Target, X, Timer, Info, BarChart3, CalendarDays, History
} from "lucide-react";

export default function TasksPage() {
  const { locale } = useLanguageStore();
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isRTL = locale === "ar";

  const { activeTask, setActiveTask, isTimerRunning } = useParetoTimerStore();

  const [tasks, setTasks] = useState<ParetoTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIsHighImpact, setNewIsHighImpact] = useState(false);
  const [newEstMinutes, setNewEstMinutes] = useState("25");
  const [showInfo, setShowInfo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pareto_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      setTasks(data as ParetoTask[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Listen to timer spent time updates
  useEffect(() => {
    const handleSpentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string, spent_minutes: number }>;
      const { id, spent_minutes } = customEvent.detail;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, spent_minutes } : t));
      
      // Update activeTask in store if it matches
      if (useParetoTimerStore.getState().activeTask?.id === id) {
        useParetoTimerStore.setState({ 
          activeTask: { ...useParetoTimerStore.getState().activeTask!, spent_minutes } 
        });
      }
    };

    window.addEventListener("task-spent-updated", handleSpentUpdated);
    return () => window.removeEventListener("task-spent-updated", handleSpentUpdated);
  }, []);

  // CRUD Operations
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newTitle.trim()) return;

    const payload = {
      user_id: user.id,
      title: newTitle.trim(),
      is_high_impact: newIsHighImpact,
      estimated_minutes: parseInt(newEstMinutes) || 25,
      status: "pending"
    };

    const { data, error } = await supabase.from("pareto_tasks").insert(payload).select().single();
    
    if (error) {
      console.error("Add task error:", error);
      addNotification({ 
        title: isRTL ? "خطأ في الحفظ" : "Error saving", 
        description: error.message, 
        type: "alert" 
      });
      return;
    }
    
    if (data) {
      setTasks([data as ParetoTask, ...tasks]);
      setNewTitle("");
      setShowAddForm(false);
      addNotification({ 
        title: isRTL ? "تم بنجاح" : "Success", 
        description: isRTL ? "تم إضافة المهمة الجديدة" : "Task added successfully", 
        type: "success" 
      });
    }
  };

  const toggleTaskStatus = async (task: ParetoTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    // Optimistic UI
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    // Stop timer if we complete the active task
    if (newStatus === "completed" && activeTask?.id === task.id) {
      setActiveTask(null);
    }

    await supabase.from("pareto_tasks").update({ status: newStatus }).eq("id", task.id);
  };

  const deleteTask = async (id: string) => {
    if (activeTask?.id === id) setActiveTask(null);
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from("pareto_tasks").delete().eq("id", id);
    setTaskToDelete(null);
  };

  // Timer Controls
  const startTaskTimer = (task: ParetoTask) => {
    setActiveTask(task);
  };

  const highImpactTasks = tasks.filter(t => t.is_high_impact && t.status !== "completed");
  const routineTasks = tasks.filter(t => !t.is_high_impact && t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  // History Analytics
  const analytics = useMemo(() => {
    const totalCompleted = completedTasks.length;
    const totalMinutesSpent = completedTasks.reduce((acc, curr) => acc + (curr.spent_minutes || 0), 0);
    const totalHours = Math.floor(totalMinutesSpent / 60);
    const remainingMinutes = totalMinutesSpent % 60;
    
    // Group by month
    const monthlyStats: Record<string, { count: number, minutes: number }> = {};
    completedTasks.forEach(task => {
      // @ts-ignore
      const date = new Date(task.created_at || Date.now());
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { count: 0, minutes: 0 };
      monthlyStats[monthKey].count += 1;
      monthlyStats[monthKey].minutes += (task.spent_minutes || 0);
    });

    return { totalCompleted, totalHours, remainingMinutes, monthlyStats };
  }, [completedTasks]);

  return (
    <div className="h-full flex flex-col relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-brainhance-purple" />
            {isRTL ? "مدير مهام باريتو" : "Pareto Tasks Manager"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL 
              ? "ركز على الـ 20% من المهام التي تحقق 80% من النتائج."
              : "Focus on the 20% of tasks that yield 80% of results."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowHistory(true)} className="glass text-muted-foreground hover:text-foreground">
            <History className="w-4 h-4 mr-2" />
            {isRTL ? "سجل المهام" : "Task Log"}
          </Button>
          <Button variant="outline" onClick={() => setShowInfo(true)} className="glass text-muted-foreground hover:text-foreground">
            <Info className="w-4 h-4 mr-2" />
            {isRTL ? "ما هو باريتو؟" : "What is Pareto?"}
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="bg-brainhance-purple hover:bg-brainhance-violet text-white">
            <Plus className="w-4 h-4 mr-2" />
            {isRTL ? "إضافة مهمة" : "Add Task"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        
        {/* 20% High Impact Column */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold gradient-text">{isRTL ? "المهام المحورية (20%)" : "High Impact (20%)"}</h2>
            <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium ml-auto">
              80% {isRTL ? "من النتائج" : "of Results"}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-24">
            {highImpactTasks.length === 0 && !loading && (
              <div className="text-center py-10 text-muted-foreground opacity-50">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{isRTL ? "لا توجد مهام محورية قيد التنفيذ." : "No active high impact tasks."}</p>
              </div>
            )}
            <AnimatePresence>
              {highImpactTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isActive={activeTask?.id === task.id}
                  isTimerRunning={activeTask?.id === task.id && isTimerRunning}
                  isRTL={isRTL}
                  onToggle={() => toggleTaskStatus(task)}
                  onDelete={() => setTaskToDelete(task.id)}
                  onPlay={() => startTaskTimer(task)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 80% Routine Column */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-muted-foreground">{isRTL ? "المهام الروتينية (80%)" : "Routine Tasks (80%)"}</h2>
            <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full font-medium ml-auto">
              20% {isRTL ? "من النتائج" : "of Results"}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-24">
            {routineTasks.length === 0 && !loading && (
              <div className="text-center py-10 text-muted-foreground opacity-50">
                <Circle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{isRTL ? "لا توجد مهام روتينية قيد التنفيذ." : "No active routine tasks."}</p>
              </div>
            )}
            <AnimatePresence>
              {routineTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isActive={activeTask?.id === task.id}
                  isTimerRunning={activeTask?.id === task.id && isTimerRunning}
                  isRTL={isRTL}
                  onToggle={() => toggleTaskStatus(task)}
                  onDelete={() => setTaskToDelete(task.id)}
                  onPlay={() => startTaskTimer(task)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <GlowCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {isRTL ? "مهمة جديدة" : "New Task"}
                  </h2>
                  <button onClick={() => setShowAddForm(false)} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={addTask} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRTL ? "اسم المهمة" : "Task Name"}</label>
                    <Input
                      autoFocus
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={isRTL ? "ماذا تريد أن تنجز؟" : "What needs to be done?"}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">{isRTL ? "نوع المهمة" : "Task Type"}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewIsHighImpact(true)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newIsHighImpact ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' : 'bg-background/50 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                      >
                        <Crown className="w-5 h-5" />
                        <span className="text-xs font-bold">{isRTL ? "محورية (20%)" : "High Impact"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewIsHighImpact(false)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${!newIsHighImpact ? 'bg-white/10 border-white/20 text-foreground' : 'bg-background/50 border-white/5 text-muted-foreground hover:bg-white/5'}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold">{isRTL ? "روتينية (80%)" : "Routine"}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRTL ? "الوقت المقدر (بالدقائق)" : "Estimated Time (mins)"}</label>
                    <Input
                      type="number"
                      required
                      min="5"
                      step="5"
                      value={newEstMinutes}
                      onChange={(e) => setNewEstMinutes(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <Button type="submit" disabled={!newTitle.trim()} className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white mt-4">
                    {isRTL ? "حفظ المهمة" : "Save Task"}
                  </Button>
                </form>
              </GlowCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pareto Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg">
              <GlowCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-brainhance-purple" />
                    {isRTL ? "قاعدة باريتو (80/20)" : "Pareto Principle (80/20)"}
                  </h2>
                  <button onClick={() => setShowInfo(false)} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-6 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? "قاعدة باريتو تنص على أن 80% من النتائج تأتي من 20% فقط من المجهود أو المهام. الفكرة هي التركيز على تلك الـ 20% المحورية أولاً."
                      : "The Pareto Principle states that 80% of your results come from 20% of your efforts. The goal is to focus on that critical 20% first."}
                  </p>

                  <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                    <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4" /> 
                      {isRTL ? "المهام المحورية (الـ 20% الماسية) 👑" : "High Impact Tasks (The 20%) 👑"}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {isRTL 
                        ? "هي المهام الصعبة أو الاستراتيجية التي تنقلك خطوة ضخمة للأمام."
                        : "These are the difficult or strategic tasks that move the needle the most."}
                    </p>
                    <ul className="list-disc list-inside text-foreground space-y-1">
                      <li>{isRTL ? "مثال: كتابة الفصل الأول من كتابك." : "Example: Writing the first chapter of your book."}</li>
                      <li>{isRTL ? "مثال: تعلم مهارة جديدة تزيد من دخلك." : "Example: Learning a new skill that increases your income."}</li>
                      <li>{isRTL ? "مثال: بناء ميزة أساسية في مشروعك البرمجي." : "Example: Building a core feature for your app."}</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> 
                      {isRTL ? "المهام الروتينية (الـ 80% العادية) 📋" : "Routine Tasks (The 80%) 📋"}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {isRTL 
                        ? "هي المهام الإدارية واليومية الضرورية ولكنها لا تصنع نقلة نوعية."
                        : "These are administrative and daily tasks that are necessary but don't cause a quantum leap."}
                    </p>
                    <ul className="list-disc list-inside text-foreground space-y-1">
                      <li>{isRTL ? "مثال: الرد على رسائل البريد الإلكتروني." : "Example: Replying to emails."}</li>
                      <li>{isRTL ? "مثال: ترتيب وتنظيف مساحة العمل." : "Example: Organizing and cleaning your workspace."}</li>
                      <li>{isRTL ? "مثال: دفع الفواتير وتجديد الاشتراكات." : "Example: Paying bills and renewing subscriptions."}</li>
                    </ul>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl max-h-[85vh] flex flex-col">
              <GlowCard className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-brainhance-purple" />
                    {isRTL ? "سجل المهام والإحصائيات" : "Task History & Analytics"}
                  </h2>
                  <button onClick={() => setShowHistory(false)} className="p-2 glass rounded-xl hover:text-foreground text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-2xl font-bold text-foreground">{analytics.totalCompleted}</span>
                    <span className="text-xs text-muted-foreground">{isRTL ? "مهمة منجزة" : "Completed Tasks"}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <Clock className="w-6 h-6 text-brainhance-purple mb-2" />
                    <span className="text-2xl font-bold text-foreground">
                      {analytics.totalHours}
                      <span className="text-sm text-muted-foreground mx-1">{isRTL ? "س" : "h"}</span>
                      {analytics.remainingMinutes}
                      <span className="text-sm text-muted-foreground mx-1">{isRTL ? "د" : "m"}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{isRTL ? "إجمالي الوقت المستغرق" : "Total Time Spent"}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <h3 className="font-bold flex items-center gap-2 mb-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    {isRTL ? "السجل الشهري" : "Monthly Log"}
                  </h3>
                  
                  {Object.keys(analytics.monthlyStats).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground/50 text-sm">
                      {isRTL ? "لا توجد مهام منجزة بعد." : "No completed tasks yet."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(analytics.monthlyStats)
                        .sort(([a], [b]) => b.localeCompare(a)) // Sort by date desc
                        .map(([month, stats]) => (
                        <div key={month} className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                          <span className="font-bold text-lg">{month}</span>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400/70" />
                              {stats.count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-brainhance-purple/70" />
                              {Math.floor(stats.minutes / 60)}h {stats.minutes % 60}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-muted-foreground">
                      <BarChart3 className="w-4 h-4" />
                      {isRTL ? "المهام المنجزة مؤخراً" : "Recently Completed"}
                    </h3>
                    <div className="space-y-2">
                      {completedTasks.slice(0, 10).map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 text-sm">
                          <div className="flex items-center gap-3 truncate">
                            {task.is_high_impact ? <Crown className="w-4 h-4 text-yellow-400 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <span className="truncate">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{task.spent_minutes} {isRTL ? "د" : "m"}</span>
                            <button 
                              onClick={() => setTaskToDelete(task.id)}
                              className="p-1.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) deleteTask(taskToDelete);
        }}
        itemName={isRTL ? "المهمة" : "Task"}
      />
    </div>
  );
}

// Subcomponent for Task Cards
function TaskCard({ 
  task, 
  isActive, 
  isTimerRunning,
  isRTL, 
  onToggle, 
  onDelete, 
  onPlay 
}: { 
  task: ParetoTask, 
  isActive: boolean, 
  isTimerRunning: boolean,
  isRTL: boolean, 
  onToggle: () => void, 
  onDelete: () => void, 
  onPlay: () => void 
}) {
  const isDone = task.status === "completed";
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative overflow-hidden p-4 rounded-2xl border transition-all ${
        isActive 
          ? "bg-brainhance-purple/10 border-brainhance-purple/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
          : isDone 
            ? "bg-white/5 border-white/5 opacity-60" 
            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggle}
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isDone 
              ? "bg-emerald-500 border-emerald-500 text-white" 
              : "border-muted-foreground/50 hover:border-foreground"
          }`}
        >
          {isDone && <CheckCircle2 className="w-4 h-4" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold truncate transition-all ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.spent_minutes} / {task.estimated_minutes} {isRTL ? "د" : "m"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isDone && (
            <button 
              onClick={onPlay}
              disabled={isActive}
              className={`p-2 rounded-xl transition-all ${isActive ? "text-brainhance-purple bg-brainhance-purple/20" : "hover:bg-white/10 text-muted-foreground hover:text-foreground"}`}
              title={isRTL ? "ابدأ المؤقت" : "Start Timer"}
            >
              {isActive && isTimerRunning ? <Timer className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <button 
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            title={isRTL ? "حذف" : "Delete"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
