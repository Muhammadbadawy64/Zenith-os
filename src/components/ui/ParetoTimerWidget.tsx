"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/animations";
import { Play, Pause, Square } from "lucide-react";
import { useParetoTimerStore, useLanguageStore, useNotificationStore } from "@/lib/store";
import { playChime } from "@/components/notifications/ToastProvider";
import { supabase } from "@/lib/supabase";

export default function ParetoTimerWidget() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const addNotification = useNotificationStore((s) => s.addNotification);
  
  const {
    activeTask,
    timerMode,
    timeLeft,
    isTimerRunning,
    setActiveTask,
    setTimerMode,
    setTimeLeft,
    setIsTimerRunning
  } = useParetoTimerStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      // Timer finished!
      setIsTimerRunning(false);
      playChime();
      addNotification({
        title: isRTL ? "انتهى الوقت!" : "Time's Up!",
        description: timerMode === "pomodoro" 
          ? (isRTL ? "حان وقت الاستراحة." : "Time for a break.") 
          : (isRTL ? "انتهت الاستراحة، عد للعمل." : "Break over, back to work."),
        type: "success"
      });

      if (timerMode === "pomodoro" && activeTask) {
        const newSpent = (activeTask.spent_minutes || 0) + activeTask.estimated_minutes;
        supabase.from("pareto_tasks").update({ spent_minutes: newSpent }).eq("id", activeTask.id).then(() => {
          window.dispatchEvent(new CustomEvent("task-spent-updated", { 
            detail: { id: activeTask.id, spent_minutes: newSpent } 
          }));
        });
        
        setTimerMode("short_break");
        setTimeLeft(5 * 60);
      } else {
        setTimerMode("pomodoro");
        setTimeLeft(activeTask ? activeTask.estimated_minutes * 60 : 25 * 60);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft, timerMode, activeTask, isRTL, addNotification, setTimeLeft, setIsTimerRunning, setTimerMode]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pauseTimer = () => setIsTimerRunning(false);
  const stopTimer = async () => {
    setIsTimerRunning(false);
    
    if (activeTask && timerMode === "pomodoro") {
      const initialSeconds = activeTask.estimated_minutes * 60;
      const spentSeconds = initialSeconds - timeLeft;
      const spentMinutes = Math.floor(spentSeconds / 60);

      if (spentMinutes > 0) {
        const newSpent = (activeTask.spent_minutes || 0) + spentMinutes;
        await supabase.from("pareto_tasks").update({ spent_minutes: newSpent }).eq("id", activeTask.id);
        
        window.dispatchEvent(new CustomEvent("task-spent-updated", { 
          detail: { id: activeTask.id, spent_minutes: newSpent } 
        }));
      }
    }
    
    setActiveTask(null);
  };

  return (
    <AnimatePresence>
      {activeTask && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`fixed bottom-6 z-50 ${isRTL ? 'left-6' : 'right-6'}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="p-2 border border-white/10 bg-background/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center gap-4 rounded-full min-w-[320px] max-w-md">
            
            <div className="flex items-center gap-1 shrink-0">
              {isTimerRunning ? (
                <button onClick={pauseTimer} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <Pause className="w-5 h-5 text-foreground" />
                </button>
              ) : (
                <button onClick={() => setIsTimerRunning(true)} className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white rounded-full transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105">
                  <Play className="w-5 h-5" style={{ marginLeft: isRTL ? '0' : '4px', marginRight: isRTL ? '4px' : '0' }} />
                </button>
              )}
              <button onClick={stopTimer} className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-full transition-colors">
                <Square className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-10 bg-border/50 shrink-0"></div>

            <div className="flex-1 min-w-0 py-1">
              <p className="text-[10px] font-bold text-brainhance-purple mb-0.5 uppercase tracking-wider">
                {timerMode === "pomodoro" ? (isRTL ? "وقت التركيز" : "Focus Time") : (isRTL ? "استراحة" : "Break")}
              </p>
              <p className="text-sm font-semibold truncate text-foreground">{activeTask.title}</p>
            </div>
            
            <div className="text-3xl font-mono font-bold tracking-tight shrink-0 px-4 text-foreground">
              {formatTime(timeLeft)}
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
