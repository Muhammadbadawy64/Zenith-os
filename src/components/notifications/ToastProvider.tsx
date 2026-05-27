"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, LucideIcon } from "lucide-react";
import { useLanguageStore, useNotificationStore, type NotificationType } from "@/lib/store";
import { t } from "@/lib/translations";

// Chime exported so Dashboard can play it on task completion
export const playChime = () => {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg");
  audio.volume = 0.35;
  audio.play().catch(() => {});
};


const TYPE_STYLES: Record<NotificationType, { border: string; iconColor: string; Icon: LucideIcon }> = {
  success: {
    border: "border-brainhance-success/40",
    iconColor: "text-brainhance-success",
    Icon: CheckCircle2,
  },
  alert: {
    border: "border-brainhance-danger/40",
    iconColor: "text-brainhance-danger",
    Icon: AlertTriangle,
  },
  info: {
    border: "border-brainhance-purple/40",
    iconColor: "text-brainhance-glow",
    Icon: Info,
  },
};

const TOAST_DURATION = 4000;

function ToastItem({
  id,
  title,
  description,
  type,
  onDismiss,
  isRTL,
}: {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  onDismiss: (id: string) => void;
  isRTL: boolean;
}) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.alert;
  const { Icon, border, iconColor } = style;
  const slideX = isRTL ? -100 : 100;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: slideX, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: slideX, scale: 0.9, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative w-80 glass-strong rounded-2xl p-4 shadow-xl border ${border} cursor-pointer overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      onClick={() => onDismiss(id)}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(id); }}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute bottom-0 start-0 end-0 h-0.5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: TOAST_DURATION / 1000, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { notifications, markRead, soundEnabled, clearAll } = useNotificationStore();
  const isFirstRender = useRef(true);
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCountRef.current = notifications.length;
      return;
    }

    // Play sound when a new notification arrives
    if (notifications.length > prevCountRef.current && soundEnabled) {
      const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }

    prevCountRef.current = notifications.length;
  }, [notifications.length, soundEnabled]);

  // Stable dismiss callback that won't trigger re-renders via deps
  const handleDismiss = (id: string) => markRead(id);

  return (
    <>
      {children}

      <div
        className="fixed top-20 z-[100] flex flex-col gap-3 end-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <AnimatePresence>
          {/* Unread toasts (show last 4) */}
          {notifications
            .filter((n) => !n.read)
            .slice(0, 4)
            .map((n) => (
              <ToastItem
                key={n.id}
                id={n.id}
                title={n.title}
                description={n.description}
                type={n.type}
                isRTL={isRTL}
                onDismiss={handleDismiss}
              />
            ))}

          {notifications.some((n) => !n.read) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors self-center underline underline-offset-2"
              onClick={clearAll}
            >
              {t(locale, "markAllRead")}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
