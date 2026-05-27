"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingParticles } from "@/components/ui/animations";
import ToastProvider from "@/components/notifications/ToastProvider";
import SmartNotifier from "@/components/notifications/SmartNotifier";
import PunishmentModal from "@/components/notifications/PunishmentModal";
import ParetoTimerWidget from "@/components/ui/ParetoTimerWidget";
import { useLanguageStore, useThemeStore, useAuthStore, useSettingsStore, useNotificationStore } from "@/lib/store";
import type { ModuleVisibility } from "@/lib/store";
import { t } from "@/lib/translations";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Compass, CalendarDays, Target, 
  Timer, Bot, BarChart2, Swords, Lightbulb, 
  Moon, Sun, Globe, User, LogOut, Settings, Bell, Zap, Sparkles, Film,
  CheckCircle2, AlertTriangle, Info, Volume2, VolumeX,
  HelpCircle, Wrench, Activity, ChevronLeft, ChevronRight, Menu, Gift,
  Wallet, BookOpen, Trash2
} from "lucide-react";
import { playChime } from "@/components/notifications/ToastProvider";

// ─── Compass Logo ─────────────────────────────────────────
function CompassLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="1.5" opacity="0.3" />
      <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="1.2" opacity="0.5" />
      <motion.path
        d="M20 6 L22 18 L34 20 L22 22 L20 34 L18 22 L6 20 L18 18 Z"
        fill="white"
        opacity="0.9"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <circle cx="20" cy="20" r="3" fill="white" />
    </svg>
  );
}

// ─── Nav Items ─────────────────────────────────────────────
interface NavItem {
  id: keyof ModuleVisibility | "dashboard" | "settings";
  path: string;
  icon: React.ElementType;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", path: "/dashboard", icon: LayoutDashboard },
  { id: "compass", path: "/dashboard/compass", icon: Compass },
  { id: "roles", path: "/dashboard/roles", icon: Target },
  { id: "planner", path: "/dashboard/planner", icon: CalendarDays },
  { id: "tasks", path: "/dashboard/tasks", icon: CheckCircle2 },
  { id: "detox", path: "/dashboard/detox", icon: Activity },
  { id: "battle-plan", path: "/dashboard/battle-plan", icon: Swords },
  { id: "energy", path: "/dashboard/energy", icon: Zap },
  { id: "focus", path: "/dashboard/focus", icon: Timer },
  { id: "content", path: "/dashboard/content", icon: Film },
  { id: "5whys", path: "/dashboard/5whys", icon: HelpCircle },
  { id: "idea", path: "/dashboard/idea", icon: Wrench },
  { id: "journal", path: "/dashboard/journal", icon: BookOpen },
  { id: "finances", path: "/dashboard/finances", icon: Wallet },
  { id: "coach", path: "/dashboard/coach", icon: Bot },
  { id: "insights", path: "/dashboard/insights", icon: Lightbulb },
  { id: "store", path: "/dashboard/store", icon: Gift },
  { id: "settings", path: "/dashboard/settings", icon: Settings },
];

// ─── Sidebar ───────────────────────────────────────────────
function Sidebar({ onNav, isCollapsed, toggleCollapse }: { onNav: () => void, isCollapsed: boolean, toggleCollapse: () => void }) {
  const { locale } = useLanguageStore();
  const { toggleTheme, theme } = useThemeStore();
  const { modules } = useSettingsStore();
  const pathname = usePathname();
  const router = useRouter();

  const labels: Record<string, string> = {
    dashboard: t(locale, "dashboard"),
    compass: locale === "ar" ? "البوصلة" : "Compass",
    planner: t(locale, "planner"),
    roles: `${t(locale, "roles")} & ${t(locale, "goals")}`,
    tasks: locale === "ar" ? "مدير المهام (باريتو)" : "Pareto Tasks",
    detox: locale === "ar" ? "صيام الدوبامين" : "Dopamine Detox",
    focus: t(locale, "focusMode"),
    coach: t(locale, "aiCoach"),
    "battle-plan": locale === "ar" ? "خطة المعركة" : "Battle Plan",
    insights: locale === "ar" ? "الرؤى" : "Insights",
    energy: locale === "ar" ? "الطاقة" : "Energy",
    content: locale === "ar" ? "المحتوى" : "Content",
    "5whys": locale === "ar" ? "الأسئلة الخمسة" : "5 Whys",
    idea: locale === "ar" ? "حل المشكلات" : "IDEA Solver",
    store: locale === "ar" ? "متجر المكافآت" : "Rewards Store",
    finances: locale === "ar" ? "المصروفات" : "Finances",
    journal: locale === "ar" ? "التدوين اليومي" : "Journal",
    settings: locale === "ar" ? "الإعدادات" : "Settings",
  };

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.id === "dashboard" || item.id === "settings") return true;
    // Ensure new modules show up even if the user has an old persisted store
    if (modules[item.id as keyof ModuleVisibility] === undefined) return true;
    return modules[item.id as keyof ModuleVisibility];
  });

  return (
    <motion.aside
      className={`h-screen glass-strong p-4 flex flex-col gap-1 fixed top-0 ${locale === "ar" ? "right-0" : "left-0"} z-30 transition-all duration-300 overflow-hidden`}
      style={{ width: isCollapsed ? '96px' : '256px' }}
      initial={{ x: locale === "ar" ? 100 : -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header / Logo */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-6 shrink-0`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center shrink-0">
              <CompassLogo />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold gradient-text truncate">Zenith OS</h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {t(locale, "appTagline")}
              </p>
            </div>
          </div>
        )}
        <button 
          onClick={toggleCollapse} 
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-foreground shrink-0"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : (locale === "ar" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
        </button>
      </div>

      {/* Nav Items - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-1 px-0 scrollbar-hide">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          return (
            <motion.button
              key={item.id}
              onClick={() => { router.push(item.path); onNav(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-brainhance-purple/20 text-brainhance-glow font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              whileHover={{ x: isCollapsed ? 0 : (locale === "ar" ? -4 : 4) }}
              whileTap={{ scale: 0.97 }}
              title={isCollapsed ? labels[item.id] : undefined}
            >
              <item.icon className="w-5 h-5 opacity-80 shrink-0" />
              {!isCollapsed && <span className="truncate">{labels[item.id]}</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className={`mt-auto space-y-2 shrink-0 pt-4 border-t border-border/20 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? t(locale, "darkMode") : t(locale, "lightMode")}
          className={`flex items-center gap-3 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${isCollapsed ? "justify-center w-12 px-0" : "w-full px-4"}`}
        >
          {theme === "dark" ? <Moon className="w-5 h-5 opacity-80 shrink-0" /> : <Sun className="w-5 h-5 opacity-80 shrink-0" />}
          {!isCollapsed && t(locale, "darkMode")}
        </button>
        <button
          onClick={() =>
            useLanguageStore.getState().setLocale(locale === "ar" ? "en" : "ar")
          }
          title={locale === "ar" ? "English" : "عربي"}
          className={`flex items-center gap-3 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ${isCollapsed ? "justify-center w-12 px-0" : "w-full px-4"}`}
        >
          <Globe className="w-5 h-5 opacity-80 shrink-0" />
          {!isCollapsed && (locale === "ar" ? "English" : "عربي")}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── User Dropdown ─────────────────────────────────────────
function UserDropdown({ locale }: { locale: "ar" | "en" }) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity overflow-hidden"
      >
        {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : initial}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute end-0 top-12 w-48 glass-dropdown rounded-2xl p-2 shadow-2xl z-50`}
          >
            <div className="px-3 py-2 border-b border-border/20 mb-1">
              <p className="text-sm font-semibold truncate">{user?.name || user?.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { router.push("/dashboard/settings"); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <User className="w-4 h-4" />
              {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
            </button>
            <button
              onClick={() => { logout(); router.push("/auth"); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {t(locale, "logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Notification Dropdown ─────────────────────────────────
function NotificationDropdown({ locale }: { locale: "ar" | "en" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markRead, clearAll } = useNotificationStore();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full glass-strong hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-background"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute end-0 top-12 w-80 glass-dropdown rounded-2xl p-3 shadow-2xl z-50`}
          >
            <div className="flex items-center justify-between px-2 py-2 border-b border-border/20 mb-2">
              <h3 className="font-bold text-sm">{locale === "ar" ? "الإشعارات" : "Notifications"}</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={clearAll} 
                  className="flex items-center gap-1 text-[11px] text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                  {locale === "ar" ? "مسح الكل" : "Clear all"}
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-muted-foreground">{locale === "ar" ? "لا توجد إشعارات" : "No notifications"}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                      n.read ? "opacity-50 hover:opacity-80" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      ) : n.type === "alert" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? "font-normal" : "font-semibold"}`}>{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.description}</p>
                        <p className="text-[10px] text-brainhance-purple mt-1">{formatTime(n.time)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Top Navbar ────────────────────────────────────────────
function TopNavbar() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { points } = useAuthStore();
  const { soundEnabled } = useNotificationStore();

  return (
    <motion.header
      className="h-16 glass border-b border-border/20 flex items-center justify-between px-6 sticky top-0 z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Level & XP display */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/dashboard/store"} title={locale === "ar" ? "متجر المكافآت" : "Rewards Store"}>
        <motion.div
          className="flex flex-col items-end gap-1"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
              {locale === "ar" ? "مستوى" : "LVL"} {Math.floor(points / 500) + 1}
            </span>
            <span className="text-sm font-bold text-brainhance-glow">{points} <span className="text-[10px] opacity-70">XP</span></span>
          </div>
          <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-brainhance-purple to-brainhance-glow" 
              initial={{ width: 0 }}
              animate={{ width: `${(points % 500) / 500 * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>
        <motion.div 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-brainhance-purple/20 to-brainhance-glow/20 flex items-center justify-center border border-brainhance-glow/30 shadow-lg shadow-brainhance-glow/10"
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="w-5 h-5 text-brainhance-glow fill-brainhance-glow drop-shadow-md" />
        </motion.div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2" dir={isRTL ? "rtl" : "ltr"}>
        <span className="text-sm text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
        <div className="flex items-center gap-3">
          <NotificationDropdown locale={locale} />
          <button
            onClick={() => useNotificationStore.getState().toggleSound()}
            className="relative w-9 h-9 flex items-center justify-center rounded-full glass-strong hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
            title={soundEnabled ? t(locale, "soundOn") : t(locale, "soundOff")}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <UserDropdown locale={locale} />
        </div>
      </div>
    </motion.header>
  );
}

// ─── Main Layout ───────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <FloatingParticles />
      <Sidebar onNav={() => {}} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div 
        className="flex flex-col min-h-screen relative z-10 transition-all duration-300"
        style={{ [isRTL ? 'marginRight' : 'marginLeft']: isCollapsed ? '96px' : '256px' }}
      >
        <TopNavbar />
        <main className="flex-1 p-8">
          <SmartNotifier />
          <PunishmentModal />
          <ParetoTimerWidget />
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
