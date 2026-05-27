"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore, useOnboardingStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, Heart, Activity, Wallet, BookOpen, Gamepad2, Home, Sparkles,
  HeartHandshake, Star, Globe, Gem, User, BarChart2, CircleDot, Target, Lightbulb, Save
} from "lucide-react";

// ─── Wheel labels ─────────────────────────────────────────
const WHEEL_KEYS = [
  "career",
  "relationships",
  "health",
  "finances",
  "personal_growth",
  "fun",
  "physical_env",
  "spirituality",
] as const;

const WHEEL_ICONS: Record<string, React.ElementType> = {
  career: Briefcase,
  relationships: Heart,
  health: Activity,
  finances: Wallet,
  personal_growth: BookOpen,
  fun: Gamepad2,
  physical_env: Home,
  spirituality: Sparkles,
};

// ─── Ikigai fields ────────────────────────────────────────
const IKIGAI_KEYS = ["love", "good_at", "world_needs", "paid_for"] as const;

const IKIGAI_LABELS: Record<string, { ar: string; en: string }> = {
  love: { ar: "ما تحب", en: "What You Love" },
  good_at: { ar: "ما تبرع فيه", en: "What You're Good At" },
  world_needs: { ar: "ما يحتاجه العالم", en: "What The World Needs" },
  paid_for: { ar: "ما يمكن أن تُدفع مقابله", en: "What You Can Be Paid For" },
};

const IKIGAI_ICONS: Record<string, React.ElementType> = {
  love: HeartHandshake,
  good_at: Star,
  world_needs: Globe,
  paid_for: Gem,
};

// ─── Life Message fields ──────────────────────────────────
const MESSAGE_FIELDS = [
  { key: "core_message" as const, ar: "رسالتي في الحياة", en: "My Life Message" },
  { key: "how_people_perceive_me" as const, ar: "كيف يراني الناس", en: "How People Perceive Me" },
  { key: "impact_i_want" as const, ar: "الأثر الذي أريد أن أتركه", en: "Impact I Want to Leave" },
  { key: "legacy_statement" as const, ar: "بيان الإرث", en: "Legacy Statement" },
];

// ─── Tag Input Component ─────────────────────────────────
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  color = "brainhance-purple",
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  color?: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="space-y-3">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-background/50 border-border/50 focus:border-brainhance-purple"
      />
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {tags.map((tag, i) => (
            <motion.span
              key={`${tag}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border`}
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "#C084FC",
                borderColor: "rgba(139, 92, 246, 0.3)",
              }}
            >
              <span className="text-xs text-muted-foreground me-1">{i + 1}</span>
              {tag}
              <button onClick={() => onRemove(i)} className="ms-1 text-current opacity-50 hover:opacity-100 transition-opacity">×</button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Identity (Who Am I) Tab ────────────────────────────────
function IdentityTab({ locale }: { locale: "ar" | "en" }) {
  const { data, updateWhoAmI } = useOnboardingStore();

  const handleUpdate = (key: "skills" | "passions" | "values", items: string[]) => {
    updateWhoAmI(
      key === "skills" ? items : data.whoAmI.skills,
      key === "passions" ? items : data.whoAmI.passions,
      key === "values" ? items : (data.whoAmI.values || [])
    );
  };

  const renderSection = (title: string, emoji: string, IconComp: React.ElementType, key: "skills" | "passions" | "values", color: string, limit: number) => (
    <GlowCard>
      <Label className="text-sm font-semibold mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComp className="w-4 h-4" style={{ color }} />
          <span style={{ color }}>{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{(data.whoAmI[key] || []).length}/{limit}</span>
      </Label>
      <TagInput
        tags={data.whoAmI[key] || []}
        onAdd={(tag) => {
          if ((data.whoAmI[key] || []).length < limit) {
            handleUpdate(key, [...(data.whoAmI[key] || []), tag]);
          }
        }}
        onRemove={(i) => {
          handleUpdate(key, (data.whoAmI[key] || []).filter((_, idx) => idx !== i));
        }}
        placeholder={locale === "ar" ? "اكتب واضغط Enter..." : "Type and press Enter..."}
        color="brainhance-purple"
      />
    </GlowCard>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSection(locale === "ar" ? "أهم 10 قيم" : "Top 10 Values", "💎", Gem, "values", "#34D399", 10)}
        {renderSection(locale === "ar" ? "أعلى المهارات" : "Top Skills", "🧠", Star, "skills", "#60A5FA", 20)}
      </div>
      {renderSection(locale === "ar" ? "أكبر الشغف" : "Biggest Passions", "❤️", HeartHandshake, "passions", "#F87171", 20)}
    </div>
  );
}

// ─── SWOT (Life Reevaluation) Tab ─────────────────────────
function SwotTab({ locale }: { locale: "ar" | "en" }) {
  const { data, updateLifeReevaluation } = useOnboardingStore();

  const swotSections = [
    { key: "strengths" as const, label: t(locale, "strengths"), color: "#34D399", emoji: "💪" },
    { key: "weaknesses" as const, label: t(locale, "weaknesses"), color: "#F87171", emoji: "⚠️" },
    { key: "opportunities" as const, label: t(locale, "opportunities"), color: "#60A5FA", emoji: "🚀" },
    { key: "threats" as const, label: t(locale, "threats"), color: "#FBBF24", emoji: "🛡️" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swotSections.map((sec) => (
          <GlowCard key={sec.key}>
            <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>{sec.emoji}</span>
              <span style={{ color: sec.color }}>{sec.label}</span>
            </Label>
            <TagInput
              tags={data.lifeReevaluation[sec.key]}
              onAdd={(tag) =>
                updateLifeReevaluation({ ...data.lifeReevaluation, [sec.key]: [...data.lifeReevaluation[sec.key], tag] })
              }
              onRemove={(i) =>
                updateLifeReevaluation({ ...data.lifeReevaluation, [sec.key]: data.lifeReevaluation[sec.key].filter((_, idx) => idx !== i) })
              }
              placeholder={locale === "ar" ? "اكتب واضغط Enter..." : "Type and press Enter..."}
            />
          </GlowCard>
        ))}
      </div>
      <GlowCard>
        <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>🎯</span>
          <span className="text-brainhance-purple">{t(locale, "priorities")}</span>
        </Label>
        <TagInput
          tags={data.lifeReevaluation.priorities}
          onAdd={(tag) =>
            updateLifeReevaluation({ ...data.lifeReevaluation, priorities: [...data.lifeReevaluation.priorities, tag] })
          }
          onRemove={(i) =>
            updateLifeReevaluation({ ...data.lifeReevaluation, priorities: data.lifeReevaluation.priorities.filter((_, idx) => idx !== i) })
          }
          placeholder={locale === "ar" ? "أدخل أهم أولوياتك الحالية..." : "Enter your current top priorities..."}
        />
      </GlowCard>
    </div>
  );
}

// ─── Wheel of Life Tab ────────────────────────────────────
function WheelTab({
  locale,
  data,
  onChange,
  saving,
}: {
  locale: "ar" | "en";
  data: Record<string, number>;
  onChange: (key: string, value: number) => void;
  saving: boolean;
}) {
  const wheelLabels: Record<string, string> = {
    career: t(locale, "career"),
    relationships: t(locale, "relationships"),
    health: t(locale, "health"),
    finances: t(locale, "finances"),
    personal_growth: t(locale, "personalGrowth"),
    fun: t(locale, "fun"),
    physical_env: t(locale, "physicalEnv"),
    spirituality: t(locale, "spirituality"),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {WHEEL_KEYS.map((key, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <GlowCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  {(() => { const WheelIcon = WHEEL_ICONS[key]; return <WheelIcon className="w-4 h-4" style={{ color: data[key] <= 3 ? '#F87171' : data[key] <= 6 ? '#FBBF24' : '#34D399' }} />; })()}
                  {wheelLabels[key]}
                </Label>
                <motion.span
                  key={data[key]}
                  className="text-2xl font-bold"
                  style={{
                    color:
                      data[key] <= 3
                        ? "#F87171"
                        : data[key] <= 6
                          ? "#FBBF24"
                          : "#34D399",
                  }}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                >
                  {data[key]}
                </motion.span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">1</span>
                <Slider
                  value={[data[key]]}
                  onValueChange={(val) =>
                    onChange(key, Array.isArray(val) ? val[0] : val)
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  disabled={saving}
                />
                <span className="text-xs text-muted-foreground">10</span>
              </div>
              {/* Mini bar */}
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      data[key] <= 3
                        ? "#F87171"
                        : data[key] <= 6
                          ? "#FBBF24"
                          : "#34D399",
                    width: `${(data[key] / 10) * 100}%`,
                  }}
                  layout
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </div>
            </div>
          </GlowCard>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Ikigai Tab ───────────────────────────────────────────
function IkigaiTab({
  locale,
  love,
  goodAt,
  worldNeeds,
  paidFor,
  statement,
  onChangeList,
  onChangeStatement,
  saving,
}: {
  locale: "ar" | "en";
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
  statement: string;
  onChangeList: (key: string, value: string[]) => void;
  onChangeStatement: (value: string) => void;
  saving: boolean;
}) {
  const listData: Record<string, string[]> = { love, good_at: goodAt, world_needs: worldNeeds, paid_for: paidFor };

  const handleListChange = (key: string, raw: string) => {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChangeList(key, items);
  };

  const toCsv = (arr: string[]) => arr.join(", ");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {IKIGAI_KEYS.map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlowCard>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                {(() => { const IkigaiIcon = IKIGAI_ICONS[key]; return <IkigaiIcon className="w-4 h-4 text-brainhance-purple" />; })()}
                {IKIGAI_LABELS[key][locale]}
              </Label>
              <Input
                value={toCsv(listData[key])}
                onChange={(e) => handleListChange(key, e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "افصل بين القيم بفاصلة"
                    : "Separate values with commas"
                }
                className="bg-background/50 border-border/50"
                disabled={saving}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {locale === "ar"
                  ? "أدخل قيماً مفصولة بفواصل"
                  : "Enter comma-separated values"}
              </p>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Ikigai Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlowCard>
          <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-brainhance-purple" />
            {locale === "ar" ? "بيان الإيكيغاي" : "Ikigai Statement"}
          </Label>
          <Textarea
            value={statement}
            onChange={(e) => onChangeStatement(e.target.value)}
            placeholder={
              locale === "ar"
                ? "اكتب بيان إيكيغاي الخاص بك..."
                : "Write your Ikigai statement..."
            }
            className="bg-background/50 border-border/50 resize-none min-h-[80px]"
            disabled={saving}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {locale === "ar"
              ? "جملة واحدة تلخص تقاطع شغفك، مهاراتك، حاجة العالم، وما يمكنك أن تُدفع مقابله"
              : "One sentence summarizing the intersection of your passion, skills, world needs, and potential income"}
          </p>
        </GlowCard>
      </motion.div>
    </div>
  );
}

// ─── Life Message Tab ─────────────────────────────────────
function MessageTab({
  locale,
  data,
  onChange,
  saving,
}: {
  locale: "ar" | "en";
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      {MESSAGE_FIELDS.map((field, i) => (
        <motion.div
          key={field.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <GlowCard>
            <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
              <span>
                {["🌟", "👁️", "🔥", "🏛️"][i]}
              </span>
              {locale === "ar" ? field.ar : field.en}
            </Label>
            <Textarea
              value={data[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={
                locale === "ar"
                  ? `اكتب ${field.ar}...`
                  : `Write your ${field.en}...`
              }
              className="bg-background/50 border-border/50 resize-none min-h-[100px]"
              disabled={saving}
            />
          </GlowCard>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Compass Page ────────────────────────────────────
export default function CompassPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<"identity" | "swot" | "wheel" | "ikigai" | "message">("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Wheel state
  const [wheelId, setWheelId] = useState<string | null>(null);
  const [wheel, setWheel] = useState<Record<string, number>>({
    career: 5,
    relationships: 5,
    health: 5,
    finances: 5,
    personal_growth: 5,
    fun: 5,
    physical_env: 5,
    spirituality: 5,
  });

  // Ikigai state
  const [ikigaiId, setIkigaiId] = useState<string | null>(null);
  const [love, setLove] = useState<string[]>([]);
  const [goodAt, setGoodAt] = useState<string[]>([]);
  const [worldNeeds, setWorldNeeds] = useState<string[]>([]);
  const [paidFor, setPaidFor] = useState<string[]>([]);
  const [ikigaiStatement, setIkigaiStatement] = useState("");

  // Life message state
  const [messageData, setMessageData] = useState<Record<string, string>>({
    core_message: "",
    how_people_perceive_me: "",
    impact_i_want: "",
    legacy_statement: "",
  });

  // ─── Fetch ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const onboardingData = useOnboardingStore.getState().data;

      const [wheelRes, ikigaiRes, msgRes] = await Promise.all([
        supabase
          .from("assessments_wheel_of_life")
          .select("*")
          .eq("user_id", userId)
          .order("assessment_date", { ascending: false })
          .limit(1),
        supabase
          .from("assessments_ikigai")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("life_message").select("*").eq("user_id", userId).maybeSingle(),
      ]);

      if (wheelRes.error) console.error("Wheel Error:", wheelRes.error);
      if (ikigaiRes.error) console.error("Ikigai Error:", ikigaiRes.error);
      if (msgRes.error) console.error("Message Error:", msgRes.error);

      if (wheelRes.error || ikigaiRes.error || msgRes.error) {
         alert("Error fetching data: " + (wheelRes.error?.message || ikigaiRes.error?.message || msgRes.error?.message));
      }

      // Wheel — fallback to onboarding
      const w = wheelRes.data?.[0];
      if (w) {
        setWheelId(w.id);
        setWheel({
          career: w.career ?? 5,
          relationships: w.relationships ?? 5,
          health: w.health ?? 5,
          finances: w.finances ?? 5,
          personal_growth: w.personal_growth ?? 5,
          fun: w.fun ?? 5,
          physical_env: w.physical_env ?? 5,
          spirituality: w.spirituality ?? 5,
        });
      } else {
        const ow = onboardingData.wheelOfLife;
        setWheel({
          career: ow.career,
          relationships: ow.relationships,
          health: ow.health,
          finances: ow.finances,
          personal_growth: ow.personalGrowth,
          fun: ow.fun,
          physical_env: ow.physicalEnv,
          spirituality: ow.spirituality,
        });
      }

      // Ikigai — fallback to onboarding
      const ik = ikigaiRes.data?.[0];
      if (ik) {
        setIkigaiId(ik.id);
        setLove(ik.love || []);
        setGoodAt(ik.good_at || []);
        setWorldNeeds(ik.world_needs || []);
        setPaidFor(ik.paid_for || []);
        setIkigaiStatement(ik.ikigai_statement || "");
      } else {
        const oi = onboardingData.ikigai;
        setLove(oi.love);
        setGoodAt(oi.goodAt);
        setWorldNeeds(oi.worldNeeds);
        setPaidFor(oi.paidFor);
        setIkigaiStatement("");
      }

      // Life message — fallback to onboarding theWhy.lifeMessage
      if (msgRes.data) {
        setMessageData({
          core_message: msgRes.data.core_message || "",
          how_people_perceive_me: msgRes.data.how_people_perceive_me || "",
          impact_i_want: msgRes.data.impact_i_want || "",
          legacy_statement: msgRes.data.legacy_statement || "",
        });
      } else if (onboardingData.theWhy.lifeMessage) {
        setMessageData((prev) => ({
          ...prev,
          core_message: onboardingData.theWhy.lifeMessage,
        }));
      }
    } catch (err: any) {
      console.error("Fetch exception:", err);
      alert("System error fetching data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Show toast ─────────────────────────────────────
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Save Wheel ─────────────────────────────────────
  const saveWheel = async () => {
    if (!userId) return;
    setSaving(true);
    const payload = { user_id: userId, ...wheel, scores_json: {}, assessment_date: new Date().toISOString().split("T")[0] };

    let error: any = null;
    if (wheelId) {
      const res = await supabase.from("assessments_wheel_of_life").update(payload).eq("id", wheelId);
      error = res.error;
    } else {
      const res = await supabase.from("assessments_wheel_of_life").insert(payload).select().single();
      if (res.data) setWheelId(res.data.id);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", locale === "ar" ? "تم حفظ عجلة الحياة ✅" : "Wheel of Life saved ✅");
    }
  };

  // ─── Save Ikigai ────────────────────────────────────
  const saveIkigai = async () => {
    if (!userId) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      love,
      good_at: goodAt,
      world_needs: worldNeeds,
      paid_for: paidFor,
      ikigai_statement: ikigaiStatement,
    };

    let error: any = null;
    if (ikigaiId) {
      const res = await supabase.from("assessments_ikigai").update(payload).eq("id", ikigaiId);
      error = res.error;
    } else {
      const res = await supabase.from("assessments_ikigai").insert(payload).select().single();
      if (res.data) setIkigaiId(res.data.id);
      error = res.error;
    }

    setSaving(false);
    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", locale === "ar" ? "تم حفظ الإيكيغاي ✅" : "Ikigai saved ✅");
    }
  };

  // ─── Save Life Message ──────────────────────────────
  const saveMessage = async () => {
    if (!userId) return;
    setSaving(true);

    const payload = { user_id: userId, ...messageData };
    const { error } = await supabase.from("life_message").upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", locale === "ar" ? "تم حفظ رسالة الحياة ✅" : "Life Message saved ✅");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="w-10 h-10 border-2 border-brainhance-purple border-t-transparent rounded-full"
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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <CircleDot className="w-7 h-7 text-brainhance-purple" />
          <span className="gradient-text">{locale === "ar" ? "بوصلة الحياة" : "Life Compass"}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "أسس حياتك: عجلة التوازن، إيكيغاي، ورسالة الحياة"
            : "Your life foundations: Balance Wheel, Ikigai, and Life Message"}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "identity", Icon: User, ar: "هويتي والقيم", en: "Identity & Values" },
          { key: "swot", Icon: BarChart2, ar: "تحليل حياتي", en: "Life SWOT" },
          { key: "wheel", Icon: Activity, ar: "عجلة الحياة", en: "Wheel of Life" },
          { key: "ikigai", Icon: Target, ar: "الإيكيغاي", en: "Ikigai" },
          { key: "message", Icon: Lightbulb, ar: "رسالة الحياة", en: "Life Message" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.Icon className="w-4 h-4" /> {locale === "ar" ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "identity" && <IdentityTab locale={locale} />}
          {activeTab === "swot" && <SwotTab locale={locale} />}
          {activeTab === "wheel" && (
            <div className="space-y-6">
              <WheelTab
                locale={locale}
                data={wheel}
                onChange={(key, value) => setWheel((p) => ({ ...p, [key]: value }))}
                saving={saving}
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveWheel}
                  disabled={saving}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-8"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ عجلة الحياة" : "Save Wheel of Life")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "ikigai" && (
            <div className="space-y-6">
              <IkigaiTab
                locale={locale}
                love={love}
                goodAt={goodAt}
                worldNeeds={worldNeeds}
                paidFor={paidFor}
                statement={ikigaiStatement}
                onChangeList={(key, val) => {
                  if (key === "love") setLove(val);
                  else if (key === "good_at") setGoodAt(val);
                  else if (key === "world_needs") setWorldNeeds(val);
                  else if (key === "paid_for") setPaidFor(val);
                }}
                onChangeStatement={setIkigaiStatement}
                saving={saving}
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveIkigai}
                  disabled={saving}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-8"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ الإيكيغاي" : "Save Ikigai")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "message" && (
            <div className="space-y-6">
              <MessageTab
                locale={locale}
                data={messageData}
                onChange={(key, value) => setMessageData((p) => ({ ...p, [key]: value }))}
                saving={saving}
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveMessage}
                  disabled={saving}
                  className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-8"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ رسالة الحياة" : "Save Life Message")}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

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
