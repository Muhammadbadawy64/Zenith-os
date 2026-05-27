"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore, useSettingsStore, useNotificationStore, type ModuleVisibility } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { User, Bell, Award, Settings2, Sparkles, CheckCircle2, Upload, Target, Timer, Compass, Map, Volume2, VolumeX, Cloud, CloudUpload, CloudDownload, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch"; // Assuming we have a switch or we can use a custom toggle
import { useCloudSync } from "@/hooks/useCloudSync";

export default function SettingsPage() {
  const { locale } = useLanguageStore();
  const { user, setUser } = useAuthStore();
  const { modules, toggleModule } = useSettingsStore();
  const { soundEnabled, toggleSound } = useNotificationStore();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "gamification" | "modules" | "sync">("profile");
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { syncToCloud, syncFromCloud, isSyncing, lastSyncTime } = useCloudSync();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    
    let finalAvatarUrl = avatar;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (!uploadError && data) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = publicUrlData.publicUrl;
      } else {
        console.error("Avatar upload error:", uploadError);
      }
    }
    
    setUser({ ...user, name, avatar: finalAvatarUrl });
    
    const { error } = await supabase.from("profiles").update({ full_name: name, avatar_url: finalAvatarUrl }).eq("user_id", user.id);
    
    setSaving(false);
    if (error) {
      await supabase.from("profiles").upsert({ user_id: user.id, full_name: name, avatar_url: finalAvatarUrl, preferred_language: locale });
    }
    showToast("success", locale === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
  };

  const handleTestNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(locale === "ar" ? "إشعار تجريبي" : "Test Notification", {
            body: locale === "ar" ? "نظام الإشعارات يعمل بنجاح!" : "Notification system is working properly!",
            icon: "/logo.png"
          });
        } else {
          showToast("error", locale === "ar" ? "يرجى تفعيل الإشعارات من المتصفح" : "Please enable notifications in your browser");
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md ${
              toast.type === "success" ? "bg-green-500/20 text-green-200 border border-green-500/30" : "bg-red-500/20 text-red-200 border border-red-500/30"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-brainhance-purple" />
          <span className="gradient-text">{locale === "ar" ? "الإعدادات" : "Settings"}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar" ? "تحكم في حسابك، الإشعارات، والأوسمة" : "Manage your account, notifications, and badges"}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/20 pb-1 overflow-x-auto scrollbar-hide">
        {[
          { id: "profile", icon: User, label: locale === "ar" ? "الملف الشخصي" : "Profile" },
          { id: "modules", icon: Settings2, label: locale === "ar" ? "أقسام النظام" : "Modules" },
          { id: "gamification", icon: Award, label: locale === "ar" ? "الأوسمة" : "Badges" },
          { id: "notifications", icon: Bell, label: locale === "ar" ? "الإشعارات" : "Notifications" },
          { id: "sync", icon: Cloud, label: locale === "ar" ? "المزامنة السحابية" : "Cloud Sync" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-brainhance-purple text-brainhance-glow"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <div className="space-y-6">
              <GlowCard className="max-w-xl">
                <h3 className="text-lg font-bold mb-4">{locale === "ar" ? "المعلومات الأساسية" : "Basic Info"}</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brainhance-purple/20 to-brainhance-violet/20 flex items-center justify-center overflow-hidden border-2 border-brainhance-purple/30 shadow-lg shadow-brainhance-purple/10">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-brainhance-purple opacity-40" />
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                          <Upload className="w-6 h-6 text-white mb-1" />
                          <span className="text-[10px] text-white font-bold uppercase">{locale === 'ar' ? 'تغيير' : 'Change'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground">{locale === "ar" ? "الصورة الشخصية" : "Profile Picture"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{locale === "ar" ? "يفضل صورة مربعة بحجم 400x400" : "Square image 400x400 recommended"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input value={user?.email || ""} disabled className="opacity-50 bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>{locale === "ar" ? "الاسم" : "Name"}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={locale === "ar" ? "أدخل اسمك" : "Enter your name"} className="bg-background/50" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className="bg-brainhance-purple hover:bg-brainhance-violet text-white w-full sm:w-auto">
                    {saving ? "..." : (locale === "ar" ? "حفظ التعديلات" : "Save Changes")}
                  </Button>
                </div>
              </GlowCard>
            </div>
          )}

          {activeTab === "gamification" && (
            <div className="space-y-6">
              <GlowCard>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      {locale === "ar" ? "لوحة الشرف والأوسمة" : "Wall of Fame & Badges"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locale === "ar" ? "اجمع الأوسمة كلما حققت أهدافك واستمررت في التركيز" : "Collect badges as you achieve goals and maintain focus"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: locale === "ar" ? "المستكشف" : "Explorer", desc: locale === "ar" ? "أكملت الاستبيان" : "Completed onboarding", icon: Compass, unlocked: true, color: "text-blue-400" },
                    { title: locale === "ar" ? "شرارة التركيز" : "Focus Spark", desc: locale === "ar" ? "أول جلسة تركيز" : "First focus session", icon: Timer, unlocked: true, color: "text-brainhance-purple" },
                    { title: locale === "ar" ? "أسطورة الأسبوع" : "Weekly Legend", desc: locale === "ar" ? "7 أيام متتالية" : "7 day streak", icon: Award, unlocked: false, color: "text-yellow-500" },
                    { title: locale === "ar" ? "محقق الأهداف" : "Goal Crusher", desc: locale === "ar" ? "أنجزت 5 أهداف" : "Finished 5 goals", icon: Target, unlocked: false, color: "text-green-500" },
                  ].map((badge, i) => (
                    <div key={i} className={`relative p-5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-500 min-h-[160px] ${badge.unlocked ? "bg-white/5 border-brainhance-purple/30 shadow-lg shadow-brainhance-purple/5" : "bg-black/20 border-white/5 opacity-40 grayscale"}`}>
                      {badge.unlocked && <div className="absolute top-3 end-3"><CheckCircle2 className="w-4 h-4 text-brainhance-success" /></div>}
                      <badge.icon className={`w-12 h-12 mb-4 ${badge.unlocked ? badge.color : "text-muted-foreground"}`} />
                      <h4 className="font-bold text-sm mb-1">{badge.title}</h4>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">{badge.desc}</p>
                      {!badge.unlocked && <div className="mt-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{locale === 'ar' ? 'قريباً' : 'Locked'}</div>}
                    </div>
                  ))}
                </div>
              </GlowCard>
            </div>
          )}

          {activeTab === "modules" && (
            <div className="space-y-6">
              <GlowCard className="max-w-xl">
                <h3 className="text-lg font-bold mb-4">{locale === "ar" ? "أقسام النظام" : "System Modules"}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {locale === "ar" ? "قم بتفعيل أو إلغاء تفعيل الأقسام التي لا تستخدمها لتبسيط مساحة عملك." : "Enable or disable modules you don't use to simplify your workspace."}
                </p>
                <div className="space-y-4">
                  {/* Using a fixed list from the store definition to ensure new modules show up */}
                  {["compass", "roles", "tasks", "planner", "detox", "battle-plan", "energy", "focus", "content", "5whys", "idea", "store", "journal", "finances", "coach", "insights"].map((key) => {
                    const enabled = modules[key as keyof ModuleVisibility] ?? true;
                    const labelAr: Record<string, string> = {
                      compass: "البوصلة", planner: "المخطط الذكي", roles: "الأدوار والأهداف", focus: "وضع التركيز", 
                      coach: "المساعد الذكي", "battle-plan": "خطة المعركة", tasks: "مدير المهام (باريتو)",
                      insights: "الرؤى والتحليلات", energy: "إدارة الطاقة", content: "صناعة المحتوى", 
                      "5whys": "الأسئلة الخمسة", idea: "حل المشكلات (IDEA)", detox: "صيام الدوبامين",
                      store: "متجر المكافآت", journal: "التدوين اليومي", finances: "المصروفات"
                    };
                    
                    const labelEn: Record<string, string> = {
                      compass: "Compass", planner: "Planner", roles: "Roles & Goals", focus: "Focus Mode", 
                      coach: "AI Coach", "battle-plan": "Battle Plan", tasks: "Pareto Tasks",
                      insights: "Insights", energy: "Energy Management", content: "Content Studio", 
                      "5whys": "The 5 Whys", idea: "Problem Solver (IDEA)", detox: "Dopamine Detox",
                      store: "Rewards Store", journal: "Daily Journal", finances: "Finance Tracker"
                    };

                    const finalLabelAr = labelAr[key] || key;
                    const finalLabelEn = labelEn[key] || key;

                    return (
                      <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brainhance-purple/20 transition-all group">
                        <span className="text-sm font-bold text-foreground group-hover:text-brainhance-glow transition-colors">{locale === "ar" ? finalLabelAr : finalLabelEn}</span>
                        <button
                          onClick={() => toggleModule(key as any)}
                          className={`w-12 h-6 rounded-full transition-all relative duration-300 ${enabled ? "bg-brainhance-purple shadow-lg shadow-brainhance-purple/20" : "bg-white/10"}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? (isRTL ? "left-1" : "right-1") : (isRTL ? "right-1" : "left-1")}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </GlowCard>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <GlowCard className="max-w-xl">
                <h3 className="text-lg font-bold mb-4">{locale === "ar" ? "إعدادات التنبيهات" : "Alert Settings"}</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{locale === "ar" ? "تنبيهات الحركة والإطالة" : "Stretch & Movement Alerts"}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === "ar" ? "إرسال إشعارات أثناء فترات الراحة لتذكيرك بالحركة" : "Send push notifications during breaks to remind you to move"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleTestNotification}>
                      {locale === "ar" ? "تجربة الإشعار" : "Test Alert"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{locale === "ar" ? "الرسائل الصوتية" : "Voice Messages"}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === "ar" ? "نطق التشجيعات بعد انتهاء المهام" : "Speak encouragements after completing tasks"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-green-400">{locale === "ar" ? "مُفعل" : "Enabled"}</div>
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? <Volume2 className="w-5 h-5 text-brainhance-purple" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <Label className="text-base">{locale === "ar" ? "صوت الإشعارات" : "Notification Sound"}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === "ar" ? "تشغيل صوت عند ظهور إشعار جديد" : "Play a sound when new notifications arrive"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`w-12 h-6 rounded-full transition-all relative duration-300 ${soundEnabled ? "bg-brainhance-purple shadow-lg shadow-brainhance-purple/20" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${soundEnabled ? (isRTL ? "left-1" : "right-1") : (isRTL ? "right-1" : "left-1")}`} />
                    </button>
                  </div>
                </div>
              </GlowCard>
            </div>
          )}

          {activeTab === "sync" && (
            <div className="space-y-6">
              <GlowCard className="max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brainhance-purple/20 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-brainhance-glow" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{locale === "ar" ? "المزامنة السحابية" : "Cloud Sync"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "احفظ بياناتك في السحابة لاسترجاعها من أي جهاز آخر" : "Save your data to the cloud to access it from any device"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-brainhance-purple/30 bg-brainhance-purple/5">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <CloudUpload className="w-6 h-6 text-brainhance-glow" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">{locale === "ar" ? "رفع البيانات (نسخ احتياطي)" : "Backup to Cloud"}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {locale === "ar" 
                            ? "يقوم برفع كافة المصروفات واليوميات والمهام الحالية إلى حسابك في الكلاود لتأمينها."
                            : "Uploads all current expenses, journal entries, and tasks to your cloud account to secure them."}
                        </p>
                        <Button 
                          onClick={async () => {
                            await syncToCloud();
                            showToast("success", locale === "ar" ? "تم رفع البيانات للسحابة بنجاح ✅" : "Data synced to cloud successfully ✅");
                          }} 
                          disabled={isSyncing} 
                          className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white w-full sm:w-auto font-bold"
                        >
                          {isSyncing ? <RefreshCw className="w-4 h-4 me-2 animate-spin" /> : <CloudUpload className="w-4 h-4 me-2" />}
                          {locale === "ar" ? "رفع النسخة الآن" : "Backup Now"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <CloudDownload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">{locale === "ar" ? "استرجاع البيانات" : "Restore from Cloud"}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-amber-200/70">
                          {locale === "ar" 
                            ? "تحذير: سيتم الكتابة فوق أي بيانات مسجلة في هذا المتصفح واستبدالها بالنسخة السحابية المرفوعة مسبقاً. الصفحة ستقوم بإعادة التحميل."
                            : "Warning: Any data saved on this browser will be overwritten by the cloud version. The page will reload."}
                        </p>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            await syncFromCloud();
                          }} 
                          disabled={isSyncing} 
                          className="w-full sm:w-auto font-bold border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                        >
                          {isSyncing ? <RefreshCw className="w-4 h-4 me-2 animate-spin" /> : <CloudDownload className="w-4 h-4 me-2" />}
                          {locale === "ar" ? "استرجاع النسخة" : "Restore Now"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {lastSyncTime && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      {locale === "ar" ? "آخر مزامنة:" : "Last sync:"} {lastSyncTime.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                    </p>
                  )}
                </div>
              </GlowCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
