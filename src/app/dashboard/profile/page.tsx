"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore, useSettingsStore } from "@/lib/store";
import type { ModuleVisibility } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";

// ─── Module config ────────────────────────────────────────
const MODULE_LIST: { key: keyof ModuleVisibility; emoji: string; ar: string; en: string }[] = [
  { key: "compass", emoji: "🧭", ar: "البوصلة", en: "Compass" },
  { key: "planner", emoji: "📅", ar: "المخطط الذكي", en: "Planner" },
  { key: "roles", emoji: "🎭", ar: "الأدوار والأهداف", en: "Roles & Goals" },
  { key: "focus", emoji: "⏱️", ar: "وضع التركيز", en: "Focus Mode" },
  { key: "coach", emoji: "🤖", ar: "المرشد الذكي", en: "AI Coach" },
  { key: "analyze", emoji: "📊", ar: "التحليل الشامل", en: "Deep Analysis" },
  { key: "battle-plan", emoji: "⚔️", ar: "خطة المعركة", en: "Battle Plan" },
  { key: "insights", emoji: "💡", ar: "الرؤى", en: "Insights" },
];

// ─── Toggle Switch ────────────────────────────────────────
function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-all ${
        enabled ? "bg-brainhance-purple" : "bg-secondary"
      }`}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        animate={{ x: enabled ? 26 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </button>
  );
}

// ─── Profile Page ─────────────────────────────────────────
export default function ProfilePage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const { user, profile, setProfile } = useAuthStore();
  const { modules, toggleModule } = useSettingsStore();
  const userId = user?.id;

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Fetch profile ──────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || "");
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Save profile ───────────────────────────────────
  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);

    const trimmed = fullName.trim();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: userId, full_name: trimmed },
        { onConflict: "user_id" }
      );

    if (error) {
      showToast("error", error.message);
    } else {
      // Reflect in auth store immediately
      setProfile({ ...profile, full_name: trimmed } as any);
      showToast("success", locale === "ar" ? "تم تحديث الملف الشخصي ✅" : "Profile updated ✅");
    }

    setSaving(false);
  };

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
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span>⚙️</span>
          <span className="gradient-text">{locale === "ar" ? "الإعدادات" : "Settings"}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "الملف الشخصي وتخصيص التطبيق" : "Profile & app customization"}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Profile Section ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <GlowCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center text-2xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-lg font-bold">{locale === "ar" ? "الملف الشخصي" : "Profile Settings"}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{locale === "ar" ? "الاسم الكامل" : "Full Name"}</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={locale === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                  className="bg-background/50 border-border/50"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-background/50 border-border/50 opacity-60"
                />
                <p className="text-[10px] text-muted-foreground">
                  {locale === "ar" ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
                </p>
              </div>

              <Button
                onClick={saveProfile}
                disabled={saving || !fullName.trim()}
                className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white mt-2"
              >
                {saving
                  ? locale === "ar" ? "جاري الحفظ..." : "Saving..."
                  : locale === "ar" ? "💾 حفظ التغييرات" : "💾 Save Changes"}
              </Button>
            </div>
          </GlowCard>
        </motion.div>

        {/* ─── Modules Section ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <GlowCard>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              <span>🧩</span>
              {locale === "ar" ? "وحدات التطبيق" : "App Modules"}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              {locale === "ar"
                ? "فعّل أو عطّل الوحدات التي تريدها في الشريط الجانبي"
                : "Enable or disable modules you want in the sidebar"}
            </p>

            <div className="space-y-2">
              {MODULE_LIST.map((mod, i) => (
                <motion.div
                  key={mod.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-4 rounded-xl glass hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{mod.emoji}</span>
                    <span className="text-sm font-medium">
                      {locale === "ar" ? mod.ar : mod.en}
                    </span>
                  </div>
                  <Toggle
                    enabled={modules[mod.key]}
                    onClick={() => toggleModule(mod.key)}
                  />
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 end-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold ${
              toast.type === "success"
                ? "bg-brainhance-success/20 border border-brainhance-success/40 text-brainhance-success"
                : "bg-red-900/30 border border-red-500/40 text-red-400"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
