"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import type { LifeRole } from "@/lib/types";
import { 
  AlertTriangle, Target, Timer, Clock, Play, Square, Zap, 
  Music, Volume2, Settings2, Brain, Users, ClipboardList, CheckCircle,
  Minimize2, Maximize2, Move, X, Trash2, Coffee
} from "lucide-react";

const CHIME_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3";

// ─── Distraction Alert ───────────────────────────────────
function DistractionAlert({
  locale,
  onDismiss,
}: {
  locale: "ar" | "en";
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-red-900/30 backdrop-blur-sm animate-shake" />
      <motion.div
        className="relative z-10 glass-strong rounded-3xl p-8 max-w-md text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{ borderColor: "rgba(248, 113, 113, 0.5)" }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <AlertTriangle className="w-8 h-8 text-brainhance-danger" />
        </motion.div>
        <h3 className="text-xl font-bold text-brainhance-danger mb-2">
          {t(locale, "distracted")}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t(locale, "focusMessage")}
        </p>
        <Button
          onClick={onDismiss}
          className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-8 flex items-center gap-2"
        >
          <Target className="w-4 h-4" /> {t(locale, "backOnTrack")}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Circular Timer ──────────────────────────────────────
function CircularTimer({
  totalSeconds,
  remainingSeconds,
  isActive,
  isOnBreak,
  locale,
}: {
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isOnBreak: boolean;
  locale: "ar" | "en";
}) {
  const progress = totalSeconds > 0 ? (1 - remainingSeconds / totalSeconds) : 0;
  const circumference = 2 * Math.PI * 120;
  const offset = circumference * (1 - progress);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const activeColor = isOnBreak ? "#34D399" : "#8B5CF6";
  const glowColor = isOnBreak ? "rgba(52, 211, 153, 0.3)" : "rgba(139, 92, 246, 0.3)";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="280" height="280" viewBox="0 0 280 280">
        <circle
          cx="140" cy="140" r="120"
          fill="none"
          stroke="rgba(139, 92, 246, 0.08)"
          strokeWidth="8"
        />
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isMajor = i % 5 === 0;
          const innerR = isMajor ? 108 : 112;
          const outerR = 117;
          const tickX1 = Number((140 + innerR * Math.cos(angle)).toFixed(6));
          const tickY1 = Number((140 + innerR * Math.sin(angle)).toFixed(6));
          const tickX2 = Number((140 + outerR * Math.cos(angle)).toFixed(6));
          const tickY2 = Number((140 + outerR * Math.sin(angle)).toFixed(6));
          return (
            <line
              key={i}
              x1={tickX1}
              y1={tickY1}
              x2={tickX2}
              y2={tickY2}
              stroke={isMajor ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.1)"}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}
        <motion.circle
          cx="140" cy="140" r="120"
          fill="none"
          stroke={activeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 140 140)"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
        {isActive && (
          <motion.circle
            cx="140" cy="140" r="90"
            fill="none"
            stroke={activeColor}
            strokeWidth="1"
            opacity={0.2}
            animate={{ r: [85, 95, 85], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={remainingSeconds}
          className="text-5xl font-bold tracking-wider"
          style={{ color: activeColor }}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">
          {isOnBreak
            ? <span className="flex items-center gap-1 text-green-400"><Clock className="w-3 h-3" /> {locale === "ar" ? "استراحة" : "Break"}</span>
            : isActive
              ? <span className="flex items-center gap-1 text-brainhance-purple"><Zap className="w-3 h-3" /> {locale === "ar" ? "مُركّز" : "Focusing"}</span>
              : <span className="flex items-center gap-1 text-muted-foreground"><Timer className="w-3 h-3" /> {locale === "ar" ? "جاهز" : "Ready"}</span>
          }
        </span>
      </div>
    </div>
  );
}

// ─── Session History Item ────────────────────────────────
function SessionHistoryItem({
  session,
  locale,
}: {
  session: {
    task_name: string;
    duration_sec: number;
    is_distracted: boolean;
    distraction_note: string | null;
    created_at: string;
  };
  locale: "ar" | "en";
}) {
  const mins = Math.floor(session.duration_sec / 60);
  const secs = session.duration_sec % 60;
  const time = new Date(session.created_at).toLocaleTimeString(
    locale === "ar" ? "ar-EG" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div className="flex items-center justify-between glass rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brainhance-purple/20 flex items-center justify-center">
            <Timer className="w-4 h-4 text-brainhance-purple" />
          </div>
        <div>
          <p className="text-sm font-medium">{session.task_name}</p>
          <p className="text-[10px] text-muted-foreground">{time}</p>
          {session.distraction_note && (
            <p className="text-[10px] text-brainhance-danger mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {session.distraction_note}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-brainhance-glow">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
        {session.is_distracted && (
          <Zap className="w-3.5 h-3.5 text-brainhance-danger" />
        )}
      </div>
    </div>
  );
}

// ─── History Modal ───────────────────────────────────────
function HistoryModal({
  isOpen,
  onClose,
  userId,
  locale,
  roles
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
  locale: "ar" | "en";
  roles: LifeRole[];
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    
    Promise.all([
      supabase.from("focus_sessions").select("*").eq("user_id", userId).order("start_time", { ascending: false }),
      supabase.from("pareto_tasks").select("*").eq("user_id", userId).gt("spent_minutes", 0).order("updated_at", { ascending: false })
    ]).then(([focusRes, tasksRes]) => {
      const combined = [];
      if (focusRes.data) {
        combined.push(...focusRes.data.map((d: any) => ({
          id: `focus_${d.id}`,
          name: d.task_name || (locale === "ar" ? "جلسة تركيز" : "Focus Session"),
          date: new Date(d.start_time),
          duration_sec: d.end_time ? Math.round((new Date(d.end_time).getTime() - new Date(d.start_time).getTime()) / 1000) : 0,
          type: "focus",
          role_id: d.role_id
        })));
      }
      if (tasksRes.data) {
        combined.push(...tasksRes.data.map((d: any) => ({
          id: `task_${d.id}`,
          name: d.title || (locale === "ar" ? "مهمة" : "Task"),
          date: new Date(d.updated_at),
          duration_sec: d.spent_minutes * 60,
          type: "task",
          role_id: d.role_id
        })));
      }
      
      combined.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHistory(combined);
      setLoading(false);
    });
  }, [isOpen, userId, locale]);

  const handleDelete = async (id: string, type: "focus" | "task") => {
    if (type === "focus") {
      await supabase.from("focus_sessions").delete().eq("id", id.replace("focus_", ""));
    } else {
      await supabase.from("pareto_tasks").update({ spent_minutes: 0 }).eq("id", id.replace("task_", ""));
    }
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const grouped = history.reduce((acc: Record<string, any[]>, item) => {
    const monthKey = item.date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  const availableMonths = Object.keys(grouped);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (availableMonths.length > 0 && (!selectedMonth || !availableMonths.includes(selectedMonth))) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const items = grouped[selectedMonth] || [];

  // Calculate role stats
  const roleStats = items.reduce((acc: Record<string, number>, item) => {
    if (item.role_id) {
      acc[item.role_id] = (acc[item.role_id] || 0) + item.duration_sec;
    }
    return acc;
  }, {});

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
           <motion.div
             initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
             className="glass-strong rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-brainhance-purple/30"
           >
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                   <ClipboardList className="w-6 h-6 text-brainhance-purple" />
                   {locale === "ar" ? "السجل الكامل" : "Full History"}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             {availableMonths.length > 0 && (
               <div className="mb-4 flex flex-wrap gap-2">
                 {availableMonths.map(m => (
                   <button
                     key={m}
                     onClick={() => setSelectedMonth(m)}
                     className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                       selectedMonth === m 
                         ? "bg-brainhance-purple text-white shadow-lg shadow-brainhance-purple/30" 
                         : "glass text-muted-foreground hover:text-foreground"
                     }`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             )}

             {selectedMonth && Object.keys(roleStats).length > 0 && (
               <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {Object.entries(roleStats).map(([roleId, totalSec]) => {
                   const r = roles.find(ro => ro.id === roleId);
                   if (!r) return null;
                   return (
                     <div key={roleId} className="glass p-3 rounded-xl flex items-center gap-3">
                       <div className="text-2xl">{r.icon}</div>
                       <div>
                         <p className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={r.role_name}>{r.role_name}</p>
                         <p className="font-bold text-sm text-brainhance-glow">
                           {Math.floor(totalSec / 3600)}h {Math.floor((totalSec % 3600) / 60)}m
                         </p>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}

             <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-brainhance-purple/30 scrollbar-track-transparent hover:scrollbar-thumb-brainhance-purple/60">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
                ) : items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{locale === "ar" ? "لا يوجد سجل بعد." : "No history yet."}</p>
                ) : (
                    <div className="space-y-3">
                       <div className="space-y-2">
                         {items.map(item => (
                           <div key={item.id} className="flex items-center justify-between glass p-3 rounded-xl hover:bg-white/5 transition-colors">
                             <div>
                               <p className="font-medium text-sm flex items-center gap-2">
                                 {item.type === "focus" ? <Timer className="w-4 h-4 text-brainhance-purple" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                                 {item.name}
                               </p>
                               <div className="flex items-center gap-2 mt-1">
                                 <p className="text-[10px] text-muted-foreground">
                                   {item.date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                 </p>
                                 {item.role_id && roles.find(r => r.id === item.role_id) && (
                                   <span className="text-[10px] px-1.5 py-0.5 rounded bg-brainhance-purple/20 text-brainhance-glow flex items-center gap-1">
                                     {roles.find(r => r.id === item.role_id)?.icon} <span className="truncate max-w-[60px]">{roles.find(r => r.id === item.role_id)?.role_name}</span>
                                   </span>
                                 )}
                               </div>
                             </div>
                             <div className="flex items-center gap-3">
                               <div className="text-sm font-mono text-brainhance-glow font-bold">
                                 {Math.floor(item.duration_sec / 60)}{locale === "ar" ? "د" : "m"}
                               </div>
                               <button 
                                 onClick={() => handleDelete(item.id, item.type)}
                                 className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                 title={locale === "ar" ? "حذف السجل" : "Delete Record"}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                )}
             </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Main Focus Page ─────────────────────────────────────
export default function FocusPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const [mode, setMode] = useState<"pomodoro" | "custom">("pomodoro");
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize completedCycles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("brainhance_pomodoro_cycles");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const todayStr = new Date().toISOString().split("T")[0];
        if (parsed.date === todayStr) {
          setCompletedCycles(parsed.count || 0);
        } else {
          localStorage.removeItem("brainhance_pomodoro_cycles");
        }
      } catch (e) {}
    }
  }, []);

  const updateCompletedCycles = (newCount: number) => {
    setCompletedCycles(newCount);
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("brainhance_pomodoro_cycles", JSON.stringify({ date: todayStr, count: newCount }));
  };

  // Display Modes
  const [viewMode, setViewMode] = useState<"normal" | "floating" | "fullscreen">("normal");

  useEffect(() => {
    if (!isActive) {
      setViewMode("normal");
    }
  }, [isActive]);

  // Session state
  const [taskName, setTaskName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [distractionCount, setDistractionCount] = useState(0);
  const [showDistractionInput, setShowDistractionInput] = useState(false);
  const [distractionNote, setDistractionNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Audio state
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Data
  const [roles, setRoles] = useState<LifeRole[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => setMounted(true), []);

  // Stats
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayFocusSec, setTodayFocusSec] = useState(0);

  // ─── Ambient audio management (Procedural Rain Noise) ───
  useEffect(() => {
    if (isActive && ambientEnabled) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (!rainNodeRef.current) {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise (rain-like)
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.3; // Gentle volume

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
        rainNodeRef.current = source;
      }
    } else {
      if (rainNodeRef.current) {
        rainNodeRef.current.stop();
        rainNodeRef.current.disconnect();
        rainNodeRef.current = null;
      }
    }

    return () => {
      // Don't completely destroy AudioContext on re-renders, just stop the node.
    };
  }, [isActive, ambientEnabled]);

  // ─── Cleanup on unmount ────────────────────────────
  useEffect(() => {
    // Request notification permission for stretch/break reminders
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (rainNodeRef.current) {
        rainNodeRef.current.stop();
        rainNodeRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // ─── Fetch roles & session history ─────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [rolesRes] = await Promise.all([
      supabase.from("life_roles").select("*").eq("user_id", userId),
    ]);

    if (!rolesRes.error) {
      setRoles(rolesRes.data as LifeRole[]);
    } else {
      console.error(rolesRes.error);
    }

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { data: todayData } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", todayStr)
      .order("start_time", { ascending: false });

    if (todayData) {
      setSessions(todayData);
      setTodaySessions(todayData.length);
      const totalSec = todayData.reduce((acc: number, s: any) => {
        if (s.start_time && s.end_time) {
          return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000;
        }
        return acc;
      }, 0);
      setTodayFocusSec(Math.round(totalSec));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Timer logic ──────────────────────────────────
  const handleSessionEndRef = useRef<() => void>(undefined);

  useEffect(() => {
    handleSessionEndRef.current = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Completion celebration
      const chime = new Audio(CHIME_URL);
      chime.volume = 0.5;
      chime.play().catch((e) => console.error("Chime Audio blocked:", e));

      if (!isOnBreak) {
        // Just finished a FOCUS session.
        if (userId && startTime) {
          setSaving(true);
          supabase.from("focus_sessions").insert({
            user_id: userId,
            start_time: startTime,
            end_time: new Date().toISOString(),
            task_name: taskName || (locale === "ar" ? "جلسة تركيز" : "Focus Session"),
            role_id: selectedRoleId,
            is_distracted: distractionCount > 0,
            distraction_note: distractionNote || null,
          }).then(() => {
            setSaving(false);
            setStartTime(null);
            setDistractionCount(0);
            setDistractionNote("");
            setShowDistractionInput(false);
            fetchData();
          });
        }

        const phrase = locale === "ar" 
          ? "أحسنت! انتهت الجلسة. وقت الراحة الآن، قم بتحريك جسمك وافرد ظهرك!"
          : "Great job! Session complete. It is break time, stand up and stretch your body!";
          
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = locale === "ar" ? "ar-SA" : "en-US";
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(locale === "ar" ? "وقت الراحة! 🧘‍♂️" : "Break Time! 🧘‍♂️", {
            body: locale === "ar" ? "انتهت الجلسة بنجاح. تحرك من مكانك، اشرب ماء، ومطّط عضلاتك." : "Session finished. Stand up, hydrate, and stretch your muscles.",
            icon: "https://cdn-icons-png.flaticon.com/512/3712/3712245.png"
          });
        }

        if (mode === "pomodoro") {
          const newCycleCount = completedCycles + 1;
          updateCompletedCycles(newCycleCount);

          setIsOnBreak(true);
          const isLongBreak = newCycleCount > 0 && newCycleCount % longBreakInterval === 0;
          setRemaining((isLongBreak ? longBreakMinutes : breakMinutes) * 60);
          setIsActive(true); // Automatically start break timer
        } else {
          setIsActive(false);
        }
      } else {
        // Just finished a BREAK session.
        setIsActive(false);
        setIsOnBreak(false);
        setRemaining(pomodoroMinutes * 60);

        const phrase = locale === "ar" 
          ? "انتهت فترة الراحة. استعد للتركيز مجدداً."
          : "Break is over. Get ready to focus again.";
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = locale === "ar" ? "ar-SA" : "en-US";
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(locale === "ar" ? "انتهت الراحة 🚀" : "Break Over 🚀", {
            body: locale === "ar" ? "استعد لجلسة تركيز جديدة لتحقيق أهدافك!" : "Get ready for a new focus session to crush your goals!"
          });
        }
      }
    };
  });

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            handleSessionEndRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // ─── Controls ────────────────────────────────────
  const handleStart = useCallback(() => {
    const finalTask = taskName.trim() || (locale === "ar" ? "جلسة تركيز" : "Focus Session");
    setTaskName(finalTask);
    setStartTime(new Date().toISOString());
    setDistractionCount(0);
    setDistractionNote("");
    setShowDistractionInput(false);
    const duration = mode === "pomodoro" ? pomodoroMinutes * 60 : pomodoroMinutes * 60;
    setRemaining(duration);
    setIsActive(true);
    setIsOnBreak(false);

    // Unlock audio engines in browser on direct click
    const dummyAudio = new Audio(CHIME_URL);
    dummyAudio.volume = 0;
    dummyAudio.play().catch(() => {});
    
    const dummySpeech = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(dummySpeech);
  }, [taskName, locale, mode, pomodoroMinutes]);

  const handleStop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!userId || !startTime) return;
    setSaving(true);

    const elapsed = pomodoroMinutes * 60 - remaining;
    supabase.from("focus_sessions").insert({
      user_id: userId,
      start_time: startTime,
      end_time: new Date().toISOString(),
      task_name: taskName || (locale === "ar" ? "جلسة تركيز" : "Focus Session"),
      role_id: selectedRoleId,
      is_distracted: distractionCount > 0,
      distraction_note: distractionNote || null,
    }).then(() => {
      setSaving(false);
      setStartTime(null);
      setDistractionCount(0);
      setDistractionNote("");
      setShowDistractionInput(false);
      fetchData();
    });
  }, [userId, startTime, pomodoroMinutes, remaining, taskName, selectedRoleId, distractionCount, distractionNote, locale, fetchData]);

  const handleDistraction = useCallback(() => {
    setDistractionCount((c) => c + 1);
    setShowDistractionInput(true);
  }, []);

  const handleLogDistraction = useCallback(() => {
    setShowDistractionInput(false);
  }, []);

  const totalSeconds = isOnBreak ? breakMinutes * 60 : (mode === "pomodoro" ? pomodoroMinutes * 60 : pomodoroMinutes * 60);

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSliderChange = useCallback((val: number | readonly number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    setPomodoroMinutes(v);
    if (!isActive) setRemaining(v * 60);
  }, [isActive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir={isRTL ? "rtl" : "ltr"}>
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
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Timer className="w-6 h-6 text-brainhance-purple" />
          <span className="gradient-text">{t(locale, "focusMode")}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "أزِل التشتت وادخل في حالة التدفق" : "Eliminate distractions and enter flow state"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Timer Column (2 cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Card */}
          <GlowCard className="flex flex-col items-center py-8 relative">
            
            {/* Mode Controls */}
            {isActive && viewMode === "normal" && (
              <div className={`absolute top-4 ${locale === "ar" ? "left-4" : "right-4"} flex items-center gap-2 z-20`}>
                <button 
                  onClick={() => setViewMode("floating")} 
                  className="p-2 text-muted-foreground hover:text-foreground glass rounded-full transition-colors" 
                  title={locale === "ar" ? "وضع النوافذ العائمة" : "Floating Mode"}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("fullscreen")} 
                  className="p-2 text-muted-foreground hover:text-foreground glass rounded-full transition-colors" 
                  title={locale === "ar" ? "ملء الشاشة" : "Full Screen"}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {viewMode !== "normal" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center w-full">
                <Timer className="w-16 h-16 text-brainhance-purple opacity-30 mb-6 animate-pulse" />
                <p className="text-muted-foreground">
                  {viewMode === "floating" 
                    ? (locale === "ar" ? "المؤقت عائم على الشاشة..." : "Timer is floating...")
                    : (locale === "ar" ? "المؤقت في وضع ملء الشاشة..." : "Timer is full screen...")}
                </p>
                <Button 
                  onClick={() => setViewMode("normal")} 
                  variant="outline" 
                  className="mt-6 glass rounded-xl border-brainhance-purple/30"
                >
                  {locale === "ar" ? "العودة للوضع العادي" : "Return to normal view"}
                </Button>
              </div>
            ) : (
              <>
                <CircularTimer
                  totalSeconds={totalSeconds}
                  remainingSeconds={remaining}
                  isActive={isActive}
                  isOnBreak={isOnBreak}
                  locale={locale}
                />

            {/* Task & Role setup (when not active) */}
            {!isActive && (
              <motion.div
                className="w-full max-w-sm mt-6 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder={t(locale, "taskToFocus")}
                  className="bg-background/50 border-border/50 text-center"
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                />

                {roles.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setSelectedRoleId(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        selectedRoleId === null
                          ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                          : "glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {locale === "ar" ? "عام" : "General"}
                    </button>
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                          selectedRoleId === role.id
                            ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                            : "glass text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{role.icon}</span>
                        <span>{role.role_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Active task & role display */}
            {isActive && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs text-muted-foreground">{locale === "ar" ? "المهمة الحالية" : "Current Task"}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{taskName}</p>
                {selectedRoleId && roles.find((r) => r.id === selectedRoleId) && (
                  <span className="inline-flex items-center gap-1 text-[10px] mt-1 px-2 py-0.5 rounded-full bg-brainhance-purple/15 text-brainhance-glow">
                    {roles.find((r) => r.id === selectedRoleId)!.icon}{" "}
                    {roles.find((r) => r.id === selectedRoleId)!.role_name}
                  </span>
                )}
              </motion.div>
            )}

            {/* Distraction inline input */}
            <AnimatePresence>
              {showDistractionInput && isActive && (
                <motion.div
                  className="w-full max-w-sm mt-4 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Textarea
                    value={distractionNote}
                    onChange={(e) => setDistractionNote(e.target.value)}
                    placeholder={locale === "ar" ? "ماذا حدث؟ صِف التشتت..." : "What happened? Describe the distraction..."}
                    className="bg-background/50 border-brainhance-danger/30 text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => {
                        setShowDistractionInput(false);
                        if (!distractionNote.trim()) {
                          setDistractionCount((c) => Math.max(0, c - 1));
                        }
                      }}
                      variant="outline"
                      size="xs"
                      className="glass border-border/30 text-xs"
                    >
                      {locale === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button
                      onClick={handleLogDistraction}
                      size="xs"
                    className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white text-xs flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> {locale === "ar" ? "تسجيل" : "Log"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full max-w-sm">
              {!isActive ? (
                <Button
                  onClick={handleStart}
                  className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white py-6 text-lg rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-brainhance-purple/20 hover:scale-[1.02] transition-all"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span className="font-bold tracking-wide">{t(locale, "startFocus")}</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleStop}
                    disabled={saving}
                    className="flex-1 w-full bg-brainhance-danger hover:bg-red-600 text-white py-6 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-brainhance-danger/20 hover:scale-[1.02] transition-all"
                  >
                    {saving ? <Clock className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                    <span>{saving ? "..." : t(locale, "endFocus")}</span>
                  </Button>
                  <Button
                    onClick={handleDistraction}
                    variant="outline"
                    className="flex-1 w-full glass border-brainhance-warning/30 text-brainhance-warning hover:bg-brainhance-warning/10 py-6 rounded-2xl flex items-center justify-center gap-2 font-bold hover:scale-[1.02] transition-all"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    <span>{t(locale, "distracted")}</span>
                  </Button>
                </>
              )}
            </div>
          </GlowCard>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <GlowCard>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t(locale, "sessionsToday")}</p>
                <p className="text-2xl font-bold text-brainhance-glow mt-1">{todaySessions}</p>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t(locale, "totalFocusTime")}</p>
                <p className="text-2xl font-bold text-brainhance-success mt-1">{formatDuration(todayFocusSec)}</p>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t(locale, "distractions")}</p>
                <p className="text-2xl font-bold text-brainhance-danger mt-1">{distractionCount}</p>
              </div>
            </GlowCard>
          </div>

          {/* Full History Button */}
          <Button
            onClick={() => setShowHistory(true)}
            variant="outline"
            className="w-full glass border-brainhance-purple/30 py-6 rounded-2xl flex items-center justify-center gap-2 text-brainhance-purple hover:bg-brainhance-purple/10 transition-all font-bold mt-4"
          >
            <ClipboardList className="w-5 h-5" />
            {locale === "ar" ? "سجل الجلسات الكامل" : "Full Sessions History"}
          </Button>
        </div>

      {/* ─── Floating Mode Widget ─── */}
      <AnimatePresence>
        {viewMode === "floating" && isActive && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-24 right-8 z-[100] cursor-move"
          >
            <div className="glass rounded-3xl p-4 flex flex-col items-center gap-3 border border-brainhance-purple/30 shadow-[0_0_40px_rgba(139,92,246,0.2)] backdrop-blur-2xl bg-background/80">
               <div className="flex w-full justify-between items-center px-1 mb-2">
                 <Move className="w-4 h-4 text-muted-foreground opacity-50" />
                 <button 
                   onClick={() => setViewMode("normal")} 
                   className="text-muted-foreground hover:text-foreground transition-colors p-1"
                 >
                   <Maximize2 className="w-4 h-4" />
                 </button>
               </div>
               <div className="scale-75 origin-top -mb-10">
                 <CircularTimer totalSeconds={totalSeconds} remainingSeconds={remaining} isActive={isActive} isOnBreak={isOnBreak} locale={locale} />
               </div>
               <Button onClick={handleStop} size="sm" className="mt-2 w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors shadow-none">
                 <Square className="w-4 h-4 mr-2" /> {locale === "ar" ? "إيقاف" : "Stop"}
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fullscreen Mode ─── */}
      {mounted && createPortal(
        <AnimatePresence>
          {viewMode === "fullscreen" && isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <button 
                onClick={() => setViewMode("normal")} 
                className={`absolute top-8 ${locale === "ar" ? "left-8" : "right-8"} p-4 glass rounded-full text-muted-foreground hover:text-foreground transition-transform hover:scale-110`}
              >
                <Minimize2 className="w-6 h-6" />
              </button>
              <div className="w-[420px] h-[420px] flex items-center justify-center mb-10 relative">
                 <div className="scale-[1.5]">
                   <CircularTimer totalSeconds={totalSeconds} remainingSeconds={remaining} isActive={isActive} isOnBreak={isOnBreak} locale={locale} />
                 </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-foreground text-center max-w-2xl">{taskName}</h2>
              {selectedRoleId && roles.find((r) => r.id === selectedRoleId) && (
                <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-brainhance-purple/15 text-brainhance-glow text-lg">
                  {roles.find((r) => r.id === selectedRoleId)!.icon}{" "}
                  {roles.find((r) => r.id === selectedRoleId)!.role_name}
                </span>
              )}
              <div className="mt-16 flex gap-6">
                 <Button onClick={handleStop} size="lg" className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-10 py-8 text-xl shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all hover:scale-105">
                   <Square className="w-6 h-6 mr-3" /> {locale === "ar" ? "إنهاء الجلسة" : "End Session"}
                 </Button>
                 <Button onClick={handleDistraction} variant="outline" size="lg" className="glass border-brainhance-warning/30 text-brainhance-warning hover:bg-brainhance-warning/10 rounded-2xl px-10 py-8 text-xl shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all hover:scale-105">
                   <Zap className="w-6 h-6 mr-3" /> {locale === "ar" ? "تشتت" : "Distracted"}
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

        {/* ─── Settings Column ────────────────────── */}
        <div className="space-y-4">
          {/* Timer Settings */}
          <GlowCard>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-brainhance-purple" /> {locale === "ar" ? "إعدادات التركيز" : "Focus Settings"}
            </h3>

            <div className="space-y-5">
              {/* Mode */}
                          {mode === "pomodoro" ? (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" /> {locale === "ar" ? "التركيز" : "Focus"}
                        </Label>
                        <span className="text-xs font-bold text-brainhance-glow">{pomodoroMinutes}{locale === "ar" ? "د" : "m"}</span>
                      </div>
                      <Slider
                        value={[pomodoroMinutes]}
                        onValueChange={(v: any) => {
                          const val = Array.isArray(v) ? v[0] : v;
                          setPomodoroMinutes(val);
                          if (!isActive && !isOnBreak) setRemaining(val * 60);
                        }}
                        min={1} max={90} step={1}
                        disabled={isActive}
                        dir="ltr"
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {locale === "ar" ? "راحة قصيرة" : "Short Break"}
                        </Label>
                        <span className="text-xs font-bold text-brainhance-purple">{breakMinutes}{locale === "ar" ? "د" : "m"}</span>
                      </div>
                      <Slider
                        value={[breakMinutes]}
                        onValueChange={(v: any) => setBreakMinutes(Array.isArray(v) ? v[0] : v)}
                        min={1} max={30} step={1}
                        disabled={isActive}
                        dir="ltr"
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5" /> {locale === "ar" ? "راحة طويلة" : "Long Break"}
                        </Label>
                        <span className="text-xs font-bold text-brainhance-success">{longBreakMinutes}{locale === "ar" ? "د" : "m"}</span>
                      </div>
                      <Slider
                        value={[longBreakMinutes]}
                        onValueChange={(v: any) => setLongBreakMinutes(Array.isArray(v) ? v[0] : v)}
                        min={5} max={60} step={1}
                        disabled={isActive}
                        dir="ltr"
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> {locale === "ar" ? "الدورات للراحة" : "Interval"}
                        </Label>
                        <span className="text-xs font-bold text-brainhance-purple">{longBreakInterval}</span>
                      </div>
                      <Slider
                        value={[longBreakInterval]}
                        onValueChange={(v: any) => setLongBreakInterval(Array.isArray(v) ? v[0] : v)}
                        min={1} max={10} step={1}
                        disabled={isActive}
                        dir="ltr"
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  {/* Cycles counter display */}
                  <div className="pt-3 border-t border-border/30 text-center">
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar" ? "الدورات المكتملة اليوم: " : "Completed Cycles Today: "}
                      <span className="font-bold text-brainhance-glow">{completedCycles}</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Timer className="w-4 h-4" /> {locale === "ar" ? "الوقت المخصص" : "Custom Duration"}
                    </Label>
                    <span className="font-bold text-brainhance-glow">{pomodoroMinutes} {locale === "ar" ? "د" : "m"}</span>
                  </div>
                  <Slider
                    value={[pomodoroMinutes]}
                    onValueChange={(v: any) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      setPomodoroMinutes(val);
                      if (!isActive) setRemaining(val * 60);
                    }}
                    min={1} max={180} step={5}
                    disabled={isActive}
                    dir="ltr"
                    className="cursor-pointer"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode("pomodoro"); if (!isActive) setRemaining(pomodoroMinutes * 60); }}
                  className={`flex-1 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 ${mode === "pomodoro" ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" : "glass text-muted-foreground"}`}
                >
                  <Timer className="w-3.5 h-3.5" /> Pomodoro
                </button>
                <button
                  onClick={() => { setMode("custom"); if (!isActive) setRemaining(pomodoroMinutes * 60); }}
                  className={`flex-1 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 ${mode === "custom" ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" : "glass text-muted-foreground"}`}
                >
                  <Clock className="w-3.5 h-3.5" /> {locale === "ar" ? "مخصص" : "Custom"}
                </button>
              </div>

              {/* Focus Duration */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">{t(locale, "focusDuration")}</Label>
                  <span className="text-xs text-brainhance-glow font-bold">{pomodoroMinutes} {t(locale, "minutes")}</span>
                </div>
                <div dir="ltr" className="w-full">
                  <Slider
                    value={[pomodoroMinutes]}
                    onValueChange={handleSliderChange}
                    min={5}
                    max={90}
                    step={5}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground" dir="ltr">
                  <span>5</span>
                  <span>90</span>
                </div>
              </div>

              {/* Break Duration */}
              {mode === "pomodoro" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">{t(locale, "breakDuration")}</Label>
                    <span className="text-xs text-brainhance-success font-bold">{breakMinutes} {t(locale, "minutes")}</span>
                  </div>
                  <div dir="ltr" className="w-full">
                    <Slider
                      value={[breakMinutes]}
                      onValueChange={(val) => setBreakMinutes(Array.isArray(val) ? val[0] : val)}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground" dir="ltr">
                    <span>1</span>
                    <span>30</span>
                  </div>
                </div>
              )}

              {/* Ambient Sound Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-brainhance-purple" />
                  <div>
                    <p className="text-xs font-medium">
                      {locale === "ar" ? "الصوت المحيطي" : "Ambient Sound"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {locale === "ar" ? "صوت مطر هادئ" : "Calm rain noise"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmbientEnabled((p) => !p)}
                  className={`relative w-11 h-6 rounded-full transition-all ${
                    ambientEnabled
                      ? "bg-brainhance-purple"
                      : "bg-white/10"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ left: ambientEnabled ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Test Audio Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full text-xs glass"
                  onClick={() => {
                    const chime = new Audio(CHIME_URL);
                    chime.volume = 0.5;
                    chime.play().catch(e => alert(locale === "ar" ? "المتصفح يمنع الصوت: " + e.message : "Browser blocked audio: " + e.message));
                    
                    const phrase = locale === "ar" ? "أحسنت بطل!" : "Great job!";
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(phrase);
                    utterance.lang = locale === "ar" ? "ar-SA" : "en-US";
                    window.speechSynthesis.speak(utterance);
                  }}
                >
                  <Volume2 className="w-4 h-4" /> {locale === "ar" ? "تجربة الصوت الاحتفالي" : "Test Celebration Audio"}
                </Button>
              </div>
              </div>
          </GlowCard>

          <GlowCard>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-brainhance-purple" /> {t(locale, "deepWork")}
            </h3>
            <div className="space-y-2">
              {[
                { Icon: Volume2, ar: "أغلق الإشعارات تماماً", en: "Turn off all notifications" },
                { Icon: Music, ar: "استخدم الأصوات المحيطة", en: "Use ambient sounds" },
                { Icon: Zap, ar: "اشرب ماء قبل البدء", en: "Drink water before starting" },
                { Icon: Target, ar: "حدد هدفاً واحداً فقط للجلسة", en: "Set just one goal per session" },
                { Icon: Clock, ar: "لا تتحقق من الهاتف", en: "Don't check your phone" },
              ].map(({ Icon, ar, en }, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Icon className="w-3.5 h-3.5 text-brainhance-purple shrink-0" />
                  {locale === "ar" ? ar : en}
                </motion.div>
              ))}
            </div>
          </GlowCard>

          {/* Installed Roles */}
          {roles.length > 0 && (
            <GlowCard>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brainhance-purple" /> {locale === "ar" ? "أدواري" : "My Roles"}
              </h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center gap-2 glass rounded-xl p-2"
                  >
                    <span className="text-lg">{role.icon}</span>
                    <span className="text-xs text-muted-foreground">{role.role_name}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>
      </div>
      
      {/* ─── Global History Modal ─── */}
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} userId={userId} locale={locale} roles={roles} />
    </div>
  );
}
