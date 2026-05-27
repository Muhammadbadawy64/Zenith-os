"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import type { LifeRole, Goal, RoleCategory, GoalStatus } from "@/lib/types";
import { 
  Target, Users, Flame, Handshake, User2, Timer, Archive, CheckCircle, 
  RefreshCw, Trash2, Calendar, Plus, Swords, PenLine
} from "lucide-react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

const ROLE_ICONS = ["🎯", "💻", "📚", "🎨", "🏃", "💼", "🎵", "📷", "✍️", "🔬", "🎭", "🌍", "💡", "🧘", "👨‍👩‍👧", "❤️", "🤝", "📊", "🎓", "🚀"];
const ROLE_COLORS = ["#8B5CF6", "#F87171", "#34D399", "#60A5FA", "#FBBF24", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"];

const CATEGORIES: { key: RoleCategory; Icon: React.ElementType }[] = [
  { key: "self", Icon: User2 },
  { key: "passion", Icon: Flame },
  { key: "others", Icon: Handshake },
];

// ─── Add Role Dialog ─────────────────────────────────────
function AddRoleDialog({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  locale,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (role: LifeRole) => void;
  onUpdate?: (role: LifeRole) => void;
  locale: "ar" | "en";
  editData?: LifeRole | null;
}) {
  const [name, setName] = useState(editData?.role_name || "");
  const [desc, setDesc] = useState(editData?.description || "");
  const [category, setCategory] = useState<RoleCategory>(editData?.category || "passion");
  const [icon, setIcon] = useState(editData?.icon || "🎯");
  const [color, setColor] = useState(editData?.color || "#8B5CF6");
  const [hours, setHours] = useState(editData?.weekly_hours_goal || 10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.role_name);
      setDesc(editData.description || "");
      setCategory(editData.category);
      setIcon(editData.icon);
      setColor(editData.color);
      setHours(editData.weekly_hours_goal);
    }
  }, [editData]);

  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const handleSubmit = async () => {
    if (!name.trim()) return alert(locale === "ar" ? "يرجى كتابة اسم الدور أولاً" : "Please enter a role name");
    if (!userId) return alert(locale === "ar" ? "يرجى تسجيل الدخول مجدداً، لم يتم العثور على حسابك" : "Please login again, user not found");
    setSaving(true);
    
    if (editData) {
      const { data, error } = await supabase
        .from("life_roles")
        .update({
          role_name: name.trim(),
          category,
          description: desc.trim(),
          icon,
          color,
          weekly_hours_goal: hours,
        })
        .eq("id", editData.id)
        .select()
        .single();
        
      if (!error && data && onUpdate) {
        onUpdate(data as LifeRole);
      } else if (error) {
        alert("Error saving role: " + error.message);
      }
    } else {
      const { data, error } = await supabase
        .from("life_roles")
        .insert({
          user_id: userId,
          role_name: name.trim(),
          category,
          description: desc.trim(),
          icon,
          color,
          weekly_hours_goal: hours,
        })
        .select()
        .single();

      if (!error && data) {
        onAdd(data as LifeRole);
      } else if (error) {
        alert("Error saving role: " + error.message);
      }
    }

    setSaving(false);
    setName("");
    setDesc("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative glass-strong rounded-3xl p-6 w-full max-w-lg z-10 flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold gradient-text mb-4">
          {editData ? (locale === "ar" ? "تعديل الدور" : "Edit Role") : t(locale, "addRole")}
        </h3>

        <div className="space-y-4">
          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t(locale, "roleName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/50 h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t(locale, "roleCategory")}</Label>
              <div className="flex gap-1 h-9">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex-1 rounded-lg text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1 ${category === cat.key ? "bg-brainhance-purple/30 border border-brainhance-purple text-foreground" : "glass text-muted-foreground"}`}
                  >
                    <cat.Icon className="w-3.5 h-3.5" /> <span>{t(locale, cat.key)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t(locale, "roleDescription")}</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-background/50 border-border/50 h-9 text-sm" />
          </div>

          {/* Row 3: Icon and Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t(locale, "selectIcon")}</Label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-hide p-1">
                {ROLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all ${icon === ic ? "bg-brainhance-purple/30 ring-1 ring-brainhance-purple" : "glass hover:bg-white/10"}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Color</Label>
              <div className="flex flex-wrap gap-1">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Hours */}
          <div className="space-y-2 pt-2 border-t border-border/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t(locale, "weeklyHoursGoal")}</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center glass rounded-lg border border-white/10 overflow-hidden">
                  <button type="button" onClick={() => setHours(Math.max(1, hours - 1))} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-muted-foreground transition-colors">-</button>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={hours} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setHours(val);
                      else if (e.target.value === "") setHours(0);
                    }} 
                    className="w-10 h-7 text-xs font-bold text-center bg-transparent border-none focus:ring-0 focus:outline-none" 
                  />
                  <button type="button" onClick={() => setHours(Math.min(168, hours + 1))} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-muted-foreground transition-colors">+</button>
                </div>
                <span className="text-xs text-muted-foreground">{t(locale, "hours")}</span>
              </div>
            </div>
            <Slider dir={locale === "ar" ? "rtl" : "ltr"} value={[Math.min(hours, 60)]} onValueChange={(val) => setHours(Array.isArray(val) ? val[0] : val)} min={1} max={60} step={1} className="py-2" />
            <AnimatePresence>
              {hours > 40 && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] text-amber-500/90 flex items-center gap-1"
                >
                  ⚠️ {locale === "ar" ? "تنبيه: هذا العدد من الساعات كبير لدور واحد (يعادل أكثر من وظيفة بدوام كامل)!" : "Warning: This is a lot of hours for a single role (more than a full-time job)!"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-border/10 shrink-0">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white">
            {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : t(locale, "save")}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 glass border-border/30">
            {t(locale, "cancel")}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Goal Dialog ─────────────────────────────────────
function AddGoalDialog({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  roles,
  locale,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Goal) => void;
  onUpdate?: (goal: Goal) => void;
  roles: LifeRole[];
  locale: "ar" | "en";
  editData?: Goal | null;
}) {
  const [title, setTitle] = useState(editData?.title || "");
  const [desc, setDesc] = useState(editData?.description || "");
  const [roleId, setRoleId] = useState<string | null>(editData?.role_id || null);
  const [deadline, setDeadline] = useState(editData?.deadline || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setDesc(editData.description || "");
      setRoleId(editData.role_id || null);
      setDeadline(editData.deadline || "");
    }
  }, [editData]);

  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const handleSubmit = async () => {
    if (!title.trim()) return alert(locale === "ar" ? "يرجى كتابة اسم الهدف أولاً" : "Please enter a goal title");
    if (!userId) return alert(locale === "ar" ? "يرجى تسجيل الدخول مجدداً، لم يتم العثور على حسابك" : "Please login again, user not found");
    setSaving(true);
    
    if (editData) {
      const { data, error } = await supabase
        .from("goals")
        .update({
          role_id: roleId,
          title: title.trim(),
          description: desc.trim(),
          deadline: deadline || null,
        })
        .eq("id", editData.id)
        .select()
        .single();
        
      if (!error && data && onUpdate) {
        onUpdate(data as Goal);
      } else if (error) {
        alert("Error saving goal: " + error.message);
      }
    } else {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          role_id: roleId,
          title: title.trim(),
          description: desc.trim(),
          deadline: deadline || null,
          status: "active",
          progress_percentage: 0,
        })
        .select()
        .single();

      if (!error && data) {
        onAdd(data as Goal);
      } else if (error) {
        alert("Error saving goal: " + error.message);
      }
    }

    setSaving(false);
    setTitle("");
    setDesc("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative glass-strong rounded-3xl p-8 w-full max-w-lg z-10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold gradient-text mb-6">
          {editData ? (locale === "ar" ? "تعديل الهدف" : "Edit Goal") : t(locale, "addGoal")}
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">{t(locale, "goalTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t(locale, "goalDescription")}</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-background/50 border-border/50 resize-none" rows={2} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t(locale, "linkedRole")}</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoleId(r.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${roleId === r.id ? "ring-2" : "glass"}`}
                  style={roleId === r.id ? { background: `${r.color}30`, borderColor: r.color } : {}}
                >
                  <span>{r.icon}</span> {r.role_name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t(locale, "goalDeadline")}</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-background/50 border-border/50" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white">
            {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : t(locale, "save")}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 glass border-border/30">
            {t(locale, "cancel")}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Roles & Goals Page ─────────────────────────────
export default function RolesGoalsPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [roles, setRoles] = useState<LifeRole[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingRole, setEditingRole] = useState<LifeRole | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeCategory, setActiveCategory] = useState<RoleCategory | "all">("all");
  const [activeTab, setActiveTab] = useState<"roles" | "goals">("roles");
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "role" | "goal"; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [rolesRes, goalsRes] = await Promise.all([
      supabase.from("life_roles").select("*").eq("user_id", userId),
      supabase.from("goals").select("*").eq("user_id", userId),
    ]);
    if (!rolesRes.error) {
      setRoles(rolesRes.data as LifeRole[]);
    } else {
      console.error("Fetch Roles Error:", rolesRes.error);
      alert("Error fetching roles: " + rolesRes.error.message);
    }
    
    if (!goalsRes.error) {
      setGoals(goalsRes.data as Goal[]);
    } else {
      console.error("Fetch Goals Error:", goalsRes.error);
      alert("Error fetching goals: " + goalsRes.error.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "role") {
      const { error } = await supabase.from("life_roles").delete().eq("id", deleteTarget.id);
      if (!error) setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } else {
      const { error } = await supabase.from("goals").delete().eq("id", deleteTarget.id);
      if (!error) setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const updateGoalStatus = async (id: string, status: GoalStatus) => {
    const { error } = await supabase.from("goals").update({ status }).eq("id", id);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  };

  const updateGoalProgress = async (id: string, progress_percentage: number) => {
    const { error } = await supabase.from("goals").update({ progress_percentage }).eq("id", id);
    if (!error) setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, progress_percentage } : g)));
  };

  const filteredRoles =
    activeCategory === "all" ? roles : roles.filter((r) => r.category === activeCategory);

  const filteredGoals =
    selectedStatus === "all"
      ? goals
      : goals.filter((g) => g.status === selectedStatus);

  const getStatusColor = (status: GoalStatus) => {
    if (status === "completed") return "#34D399";
    if (status === "archived") return "#6B7280";
    return "#8B5CF6";
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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Tabs */}
      <div className="flex gap-2">
        {(["roles", "goals"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" : "glass text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "roles" 
              ? <><Users className="w-4 h-4" /> {t(locale, "roles")}</>
              : <><Target className="w-4 h-4" /> {t(locale, "goals")}</>}
          </button>
        ))}
      </div>

      {/* ─── ROLES TAB ───────────────────────────────── */}
      {activeTab === "roles" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeCategory === "all" ? "bg-brainhance-purple/20 text-brainhance-glow" : "glass text-muted-foreground"}`}
              >
                {locale === "ar" ? "الكل" : "All"}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeCategory === cat.key ? "bg-brainhance-purple/20 text-brainhance-glow" : "glass text-muted-foreground"}`}
                >
                  <cat.Icon className="w-3 h-3" /> {t(locale, cat.key)}
                </button>
              ))}
            </div>
            <Button onClick={() => { setEditingRole(null); setShowAddRole(true); }} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white text-sm">
              + {t(locale, "addRole")}
            </Button>
          </div>

          {/* Roles Grid */}
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">{t(locale, "noRoles")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredRoles.map((role, i) => (
                  <motion.div
                    key={role.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlowCard>
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: `${role.color}20`, border: `1px solid ${role.color}40` }}
                        >
                          {role.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{role.role_name}</h3>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: `${role.color}20`, color: role.color }}
                            >
                              {t(locale, role.category)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Timer className="w-3 h-3" />
                              <span>{role.weekly_hours_goal} {t(locale, "hours")}/{locale === "ar" ? "أسبوع" : "week"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="w-3 h-3" />
                              <span>{goals.filter((g) => g.role_id === role.id).length} {t(locale, "goals")}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setShowAddRole(true);
                              }}
                              className="text-[10px] text-muted-foreground hover:text-brainhance-purple transition-colors flex items-center gap-1"
                            >
                              <PenLine className="w-3 h-3" /> {locale === "ar" ? "تعديل" : "Edit"}
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: role.id, type: "role", name: role.role_name })}
                              className="text-[10px] text-muted-foreground hover:text-brainhance-danger transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> {locale === "ar" ? "حذف" : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── GOALS TAB ───────────────────────────────── */}
      {activeTab === "goals" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["all", "active", "completed", "archived"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedStatus === status ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30" : "glass text-muted-foreground hover:text-foreground"}`}
                >
                  {status === "all"
                    ? locale === "ar" ? "الكل" : "All"
                    : t(locale, status)}
                </button>
              ))}
            </div>
            <Button onClick={() => { setEditingGoal(null); setShowAddGoal(true); }} className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white text-sm">
              + {t(locale, "addGoal")}
            </Button>
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">{t(locale, "noGoals")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredGoals.map((goal, i) => {
                  const role = roles.find((r) => r.id === goal.role_id);
                  return (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GlowCard>
                        <div className="flex items-start gap-4">
                          {role && (
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                              style={{ background: `${role.color}20` }}
                            >
                              {role.icon}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-foreground">{goal.title}</h3>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: `${getStatusColor(goal.status)}20`, color: getStatusColor(goal.status) }}
                              >
                                {t(locale, goal.status)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{goal.description}</p>
                            {role && (
                              <span className="inline-flex items-center gap-1 text-[10px] mt-2 px-2 py-0.5 rounded-full" style={{ background: `${role.color}15`, color: role.color }}>
                                {role.icon} {role.role_name}
                              </span>
                            )}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t(locale, "goalProgress")}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateGoalProgress(goal.id, Math.max(0, goal.progress_percentage - 10))}
                                    className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] hover:bg-brainhance-purple/20 transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold w-8 text-center" style={{ color: getStatusColor(goal.status) }}>
                                    {goal.progress_percentage}%
                                  </span>
                                  <button
                                    onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress_percentage + 10))}
                                    className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] hover:bg-brainhance-purple/20 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: role?.color || "#8B5CF6" }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${goal.progress_percentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                            {goal.deadline && (
                              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {t(locale, "goalDeadline")}: {goal.deadline}
                              </p>
                            )}
                            {/* Actions */}
                            <div className="flex gap-3 mt-3">
                              {goal.status === "active" && (
                                <>
                                  <button
                                    onClick={() => updateGoalStatus(goal.id, "completed")}
                                    className="text-[10px] text-brainhance-success hover:underline transition-all flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" /> {locale === "ar" ? "إكمال" : "Complete"}
                                  </button>
                                  <button
                                    onClick={() => updateGoalStatus(goal.id, "archived")}
                                    className="text-[10px] text-muted-foreground hover:underline transition-all flex items-center gap-1"
                                  >
                                    <Archive className="w-3 h-3" /> {locale === "ar" ? "أرشفة" : "Archive"}
                                  </button>
                                </>
                              )}
                              {goal.status === "completed" && (
                                <button
                                  onClick={() => updateGoalStatus(goal.id, "active")}
                                  className="text-[10px] text-brainhance-glow hover:underline transition-all flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" /> {locale === "ar" ? "إعادة تفعيل" : "Reactivate"}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingGoal(goal);
                                  setShowAddGoal(true);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-brainhance-purple transition-colors flex items-center gap-1"
                              >
                                <PenLine className="w-3 h-3" /> {locale === "ar" ? "تعديل" : "Edit"}
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: goal.id, type: "goal", name: goal.title })}
                                className="text-[10px] text-muted-foreground hover:text-brainhance-danger transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> {locale === "ar" ? "حذف" : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {showAddRole && (
          <AddRoleDialog
            isOpen={showAddRole}
            onClose={() => { setShowAddRole(false); setEditingRole(null); }}
            onAdd={(role) => setRoles((prev) => [...prev, role])}
            onUpdate={(role) => setRoles((prev) => prev.map((r) => r.id === role.id ? role : r))}
            editData={editingRole}
            locale={locale}
          />
        )}
        {showAddGoal && (
          <AddGoalDialog
            isOpen={showAddGoal}
            onClose={() => { setShowAddGoal(false); setEditingGoal(null); }}
            onAdd={(goal) => setGoals((prev) => [...prev, goal])}
            onUpdate={(goal) => setGoals((prev) => prev.map((g) => g.id === goal.id ? goal : g))}
            editData={editingGoal}
            roles={roles}
            locale={locale}
          />
        )}
      </AnimatePresence>

      {!!deleteTarget && (
        <DeleteConfirmModal open={!!deleteTarget}
          itemName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
