import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HabitType = "positive" | "negative";
export type FrequencyType = "daily" | "specific_days" | "times_per_week";

export interface HabitFrequency {
  type: FrequencyType;
  days?: number[]; // 0=Sunday, 1=Monday, etc.
  count?: number;  // X times per week
}

export interface Habit {
  id: string;
  title: string;
  type: HabitType;
  createdAt: number;
  frequency: HabitFrequency;
  logs: Record<string, boolean>; // mapping YYYY-MM-DD to success state
}

interface HabitState {
  habits: Habit[];
  addHabit: (title: string, type: HabitType, frequency?: HabitFrequency) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (id: string, dateStr: string) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      addHabit: (title, type, frequency = { type: "daily" }) => set((s) => ({
        habits: [
          ...s.habits,
          {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            title,
            type,
            frequency,
            createdAt: Date.now(),
            logs: {}
          }
        ]
      })),
      deleteHabit: (id) => set((s) => ({
        habits: s.habits.filter((h) => h.id !== id)
      })),
      toggleHabitLog: (id, dateStr) => set((s) => ({
        habits: s.habits.map((h) => {
          if (h.id === id) {
            return {
              ...h,
              logs: {
                ...h.logs,
                [dateStr]: !h.logs[dateStr]
              }
            };
          }
          return h;
        })
      })),
    }),
    { name: "brainhance-habits" }
  )
);

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

export function calculateSRFR(habit: Habit) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  
  const createdDate = new Date(habit.createdAt);
  createdDate.setHours(0, 0, 0, 0);

  const freq = habit.frequency || { type: "daily" };
  let currentStreak = 0;
  let consecutiveMisses = 0;

  if (freq.type === "times_per_week") {
    const weeks: Record<string, number> = {};
    
    Object.keys(habit.logs).forEach(dateStr => {
      if (habit.logs[dateStr]) {
        const logDate = new Date(dateStr);
        logDate.setHours(0,0,0,0);
        const weekStart = getStartOfWeek(logDate).toISOString().split("T")[0];
        weeks[weekStart] = (weeks[weekStart] || 0) + 1;
      }
    });

    const currentWeekStart = getStartOfWeek(today);
    const createdWeekStart = getStartOfWeek(createdDate);
    
    let cursor = new Date(currentWeekStart);
    const requiredCount = freq.count || 1;

    while (cursor >= createdWeekStart) {
      const weekStr = cursor.toISOString().split("T")[0];
      const countThisWeek = weeks[weekStr] || 0;

      if (weekStr === currentWeekStart.toISOString().split("T")[0]) {
        currentStreak += countThisWeek;
      } else {
        if (countThisWeek >= requiredCount) {
          currentStreak += countThisWeek;
        } else {
          break; // Streak broken on failed week
        }
      }
      cursor.setDate(cursor.getDate() - 7);
    }
  } else {
    // daily or specific_days
    let cursor = new Date(today);

    while (cursor >= createdDate) {
      const dStr = cursor.toISOString().split("T")[0];
      const dayOfWeek = cursor.getDay();

      const isScheduled = freq.type === "daily" || (freq.type === "specific_days" && freq.days && freq.days.includes(dayOfWeek));

      if (isScheduled) {
        const isSuccess = habit.logs[dStr];

        if (isSuccess) {
          currentStreak++;
          consecutiveMisses = 0; 
        } else {
          if (dStr !== todayStr) {
            consecutiveMisses++;
            if (consecutiveMisses >= 2) {
              break;
            }
          }
        }
      }
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // Phase logic
  let phase = "Start"; 
  let phaseMax = 7;
  let dayInPhase = currentStreak;
  
  if (currentStreak > 7 && currentStreak <= 28) {
    phase = "Repeat"; 
    phaseMax = 21;
    dayInPhase = currentStreak - 7;
  } else if (currentStreak > 28) {
    phase = "Follow / Reward";
    phaseMax = 28;
    dayInPhase = ((currentStreak - 28) % 28) || 28;
  }
  
  const cycles = Math.floor((currentStreak > 28 ? currentStreak - 28 : 0) / 28) + (currentStreak > 28 ? 1 : 0);

  return { streak: currentStreak, phase, phaseMax, dayInPhase, cycles };
}
