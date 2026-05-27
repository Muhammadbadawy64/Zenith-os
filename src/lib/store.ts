// Zustand Store for Brainhance OS
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData, Profile } from "./types";

// ─── Theme Store ───────────────────────────────────────────
interface ThemeState {
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "brainhance-theme" }
  )
);

// ─── Language Store ────────────────────────────────────────
interface LanguageState {
  locale: "ar" | "en";
  setLocale: (locale: "ar" | "en") => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "ar",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "brainhance-locale" }
  )
);

// ─── Auth Store ────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  points: number;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOnboarded: (value: boolean) => void;
  setPoints: (points: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isOnboarded: false,
      points: 0,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      setPoints: (points) => set({ points: Math.max(0, points) }),
      logout: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isOnboarded: false,
          points: 0,
        }),
    }),
    { name: "brainhance-auth" }
  )
);

// ─── Settings Store (Module Toggling) ──────────────────────
export interface ModuleVisibility {
  planner: boolean;
  roles: boolean;
  tasks: boolean;
  focus: boolean;
  coach: boolean;
  analyze: boolean;
  "battle-plan": boolean;
  insights: boolean;
  compass: boolean;
  energy: boolean;
  content: boolean;
  "5whys": boolean;
  idea: boolean;
  detox: boolean;
  store: boolean;
  journal: boolean;
  finances: boolean;
}

interface SettingsState {
  modules: ModuleVisibility;
  toggleModule: (key: keyof ModuleVisibility) => void;
  setModules: (modules: ModuleVisibility) => void;
}

const DEFAULT_MODULES: ModuleVisibility = {
  planner: true,
  roles: true,
  tasks: true,
  focus: true,
  coach: true,
  analyze: true,
  "battle-plan": true,
  insights: true,
  compass: true,
  energy: true,
  content: true,
  "5whys": true,
  idea: true,
  detox: true,
  store: true,
  journal: true,
  finances: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      modules: DEFAULT_MODULES,
      toggleModule: (key) =>
        set((s) => ({ modules: { ...s.modules, [key]: !s.modules[key] } })),
      setModules: (modules) => set({ modules }),
    }),
    { name: "zenith-settings" }
  )
);

// ─── Onboarding Store ──────────────────────────────────────
interface OnboardingState {
  data: OnboardingData;
  setStep: (step: number) => void;
  updateWhoAmI: (skills: string[], passions: string[], values: string[]) => void;
  updateTheWhy: (drivingForce: string, lifeMessage: string) => void;
  updateIkigai: (ikigai: OnboardingData["ikigai"]) => void;
  updateWheelOfLife: (wheel: OnboardingData["wheelOfLife"]) => void;
  updateLifeReevaluation: (data: OnboardingData["lifeReevaluation"]) => void;
  reset: () => void;
}

const defaultOnboarding: OnboardingData = {
  step: 1,
  whoAmI: { skills: [], passions: [], values: [] },
  theWhy: { drivingForce: "", lifeMessage: "" },
  ikigai: { love: [], goodAt: [], worldNeeds: [], paidFor: [] },
  wheelOfLife: {
    career: 5,
    relationships: 5,
    health: 5,
    finances: 5,
    personalGrowth: 5,
    fun: 5,
    physicalEnv: 5,
    spirituality: 5,
  },
  lifeReevaluation: {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    priorities: [],
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      data: defaultOnboarding,
      setStep: (step) => set((s) => ({ data: { ...s.data, step } })),
      updateWhoAmI: (skills, passions, values) =>
        set((s) => ({ data: { ...s.data, whoAmI: { skills, passions, values } } })),
      updateTheWhy: (drivingForce, lifeMessage) =>
        set((s) => ({
          data: { ...s.data, theWhy: { drivingForce, lifeMessage } },
        })),
      updateIkigai: (ikigai) =>
        set((s) => ({ data: { ...s.data, ikigai } })),
      updateWheelOfLife: (wheelOfLife) =>
        set((s) => ({ data: { ...s.data, wheelOfLife } })),
      updateLifeReevaluation: (lifeReevaluation) =>
        set((s) => ({ data: { ...s.data, lifeReevaluation } })),
      reset: () => set({ data: defaultOnboarding }),
    }),
    { name: "brainhance-onboarding" }
  )
);

// ─── Focus Session Store ───────────────────────────────────
interface FocusState {
  isActive: boolean;
  taskName: string;
  roleId: string | null;
  startTime: number | null;
  duration: number; // in seconds
  mode: "pomodoro" | "custom";
  pomodoroMinutes: number;
  breakMinutes: number;
  isOnBreak: boolean;
  distractionCount: number;
  startSession: (taskName: string, roleId?: string) => void;
  endSession: () => void;
  incrementDistraction: () => void;
  setMode: (mode: "pomodoro" | "custom") => void;
  setPomodoroMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  toggleBreak: () => void;
}

export const useFocusStore = create<FocusState>()((set) => ({
  isActive: false,
  taskName: "",
  roleId: null,
  startTime: null,
  duration: 25 * 60,
  mode: "pomodoro",
  pomodoroMinutes: 25,
  breakMinutes: 5,
  isOnBreak: false,
  distractionCount: 0,
  startSession: (taskName, roleId) =>
    set({
      isActive: true,
      taskName,
      roleId: roleId || null,
      startTime: Date.now(),
      distractionCount: 0,
      isOnBreak: false,
    }),
  endSession: () =>
    set({
      isActive: false,
      taskName: "",
      roleId: null,
      startTime: null,
      isOnBreak: false,
    }),
  incrementDistraction: () =>
    set((s) => ({ distractionCount: s.distractionCount + 1 })),
  setMode: (mode) => set({ mode }),
  setPomodoroMinutes: (minutes) =>
    set({ pomodoroMinutes: minutes, duration: minutes * 60 }),
  setBreakMinutes: (minutes) => set({ breakMinutes: minutes }),
  toggleBreak: () => set((s) => ({ isOnBreak: !s.isOnBreak })),
}));

// ─── Battle Plan Store ──────────────────────────────────────
export interface BattlePlan {
  monthly: string[];
  weekly: string[];
  daily: string[];
  smarter_analysis: string;
}

interface BattlePlanState {
  goal: string;
  timeframe: string;
  focusMode: "sequential" | "parallel";
  plan: BattlePlan | null;
  setGoal: (goal: string) => void;
  setTimeframe: (timeframe: string) => void;
  setFocusMode: (focusMode: "sequential" | "parallel") => void;
  setPlan: (plan: BattlePlan | null) => void;
  clearPlan: () => void;
}

export const useBattlePlanStore = create<BattlePlanState>()(
  persist(
    (set) => ({
      goal: "",
      timeframe: "4 months",
      focusMode: "sequential",
      plan: null,
      setGoal: (goal) => set({ goal }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setFocusMode: (focusMode) => set({ focusMode }),
      setPlan: (plan) => set({ plan }),
      clearPlan: () =>
        set({ goal: "", timeframe: "4 months", focusMode: "sequential", plan: null }),
    }),
    { name: "brainhance-battle-plan" }
  )
);

// ─── Notification Store ────────────────────────────────────
export type NotificationType = "success" | "alert" | "info";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  time: number;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  soundEnabled: boolean;
  addNotification: (notif: Omit<AppNotification, "id" | "time" | "read">) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      soundEnabled: true,
      addNotification: (notif) =>
        set((s) => ({
          notifications: [
            {
              ...notif,
              id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
              time: Date.now(),
              read: false,
            },
            ...s.notifications,
          ],
        })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearAll: () => set({ notifications: [] }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: "zenith-notifications" }
  )
);

// ─── Gamification Store ────────────────────────────────────
export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  isCustom: boolean;
}

interface GamificationState {
  customRewards: Reward[];
  addCustomReward: (reward: Omit<Reward, "id" | "isCustom">) => void;
  removeCustomReward: (id: string) => void;
  // Punishment system
  punishmentLevel: number; // 0 = none, 1 = warning, 2 = severe (blocked UI)
  punishmentReason: string | null;
  triggerPunishment: (level: number, reason: string) => void;
  resolvePunishment: () => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
      customRewards: [],
      punishmentLevel: 0,
      punishmentReason: null,
      addCustomReward: (r) =>
        set((s) => ({
          customRewards: [
            ...s.customRewards,
            {
              ...r,
              id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
              isCustom: true,
            },
          ],
        })),
      removeCustomReward: (id) =>
        set((s) => ({
          customRewards: s.customRewards.filter((r) => r.id !== id),
        })),
      triggerPunishment: (level, reason) => set({ punishmentLevel: level, punishmentReason: reason }),
      resolvePunishment: () => set({ punishmentLevel: 0, punishmentReason: null }),
    }),
    { name: "brainhance-gamification" }
  )
);

// ─── Pareto Timer Store ────────────────────────────────────
export interface ParetoTask {
  id: string;
  title: string;
  description: string | null;
  is_high_impact: boolean;
  status: "pending" | "in_progress" | "completed";
  estimated_minutes: number;
  spent_minutes: number;
}

interface ParetoTimerState {
  activeTask: ParetoTask | null;
  timerMode: "pomodoro" | "short_break";
  timeLeft: number; // in seconds
  isTimerRunning: boolean;
  setActiveTask: (task: ParetoTask | null) => void;
  setTimerMode: (mode: "pomodoro" | "short_break") => void;
  setTimeLeft: (seconds: number) => void;
  setIsTimerRunning: (isRunning: boolean) => void;
}

export const useParetoTimerStore = create<ParetoTimerState>()((set) => ({
  activeTask: null,
  timerMode: "pomodoro",
  timeLeft: 25 * 60,
  isTimerRunning: false,
  setActiveTask: (task) => set({ 
    activeTask: task, 
    timerMode: "pomodoro", 
    timeLeft: task ? task.estimated_minutes * 60 : 25 * 60, 
    isTimerRunning: false 
  }),
  setTimerMode: (mode) => set({ timerMode: mode }),
  setTimeLeft: (seconds) => set({ timeLeft: seconds }),
  setIsTimerRunning: (isRunning) => set({ isTimerRunning: isRunning }),
}));
