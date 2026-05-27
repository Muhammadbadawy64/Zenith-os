"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { FloatingParticles } from "@/components/ui/animations";
import { useOnboardingStore, useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";

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
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-${color}/20 text-${color} border border-${color}/30`}
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "#C084FC",
                borderColor: "rgba(139, 92, 246, 0.3)",
              }}
            >
              <span className="text-xs text-muted-foreground me-1">
                {i + 1}
              </span>
              {tag}
              <button
                onClick={() => onRemove(i)}
                className="ms-1 text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 1: Who Am I ─────────────────────────────────────
function StepWhoAmI({ locale }: { locale: "ar" | "en" }) {
  const { data, updateWhoAmI } = useOnboardingStore();

  const addSkill = (skill: string) => {
    if (data.whoAmI.skills.length < 20) {
      updateWhoAmI([...data.whoAmI.skills, skill], data.whoAmI.passions, data.whoAmI.values || []);
    }
  };
  const removeSkill = (i: number) => {
    updateWhoAmI(
      data.whoAmI.skills.filter((_, idx) => idx !== i),
      data.whoAmI.passions,
      data.whoAmI.values || []
    );
  };
  const addPassion = (passion: string) => {
    if (data.whoAmI.passions.length < 20) {
      updateWhoAmI(data.whoAmI.skills, [...data.whoAmI.passions, passion], data.whoAmI.values || []);
    }
  };
  const removePassion = (i: number) => {
    updateWhoAmI(
      data.whoAmI.skills,
      data.whoAmI.passions.filter((_, idx) => idx !== i),
      data.whoAmI.values || []
    );
  };
  const addValue = (value: string) => {
    if ((data.whoAmI.values || []).length < 10) {
      updateWhoAmI(data.whoAmI.skills, data.whoAmI.passions, [...(data.whoAmI.values || []), value]);
    }
  };
  const removeValue = (i: number) => {
    updateWhoAmI(
      data.whoAmI.skills,
      data.whoAmI.passions,
      (data.whoAmI.values || []).filter((_, idx) => idx !== i)
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          🧠
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">
          {t(locale, "whoAmI")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t(locale, "whoAmIDesc")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-foreground/80 font-semibold text-sm mb-2 block">
            {t(locale, "skills")} ({data.whoAmI.skills.length}/20)
          </Label>
          <TagInput
            tags={data.whoAmI.skills}
            onAdd={addSkill}
            onRemove={removeSkill}
            placeholder={t(locale, "typeAndEnter")}
          />
        </div>

        <div>
          <Label className="text-foreground/80 font-semibold text-sm mb-2 block">
            {t(locale, "passions")} ({data.whoAmI.passions.length}/20)
          </Label>
          <TagInput
            tags={data.whoAmI.passions}
            onAdd={addPassion}
            onRemove={removePassion}
            placeholder={t(locale, "typeAndEnter")}
          />
        </div>
        <div>
          <Label className="text-foreground/80 font-semibold text-sm mb-2 block">
            {locale === "ar" ? "أهم 10 قيم في حياتك" : "Top 10 Values"} ({(data.whoAmI.values || []).length}/10)
          </Label>
          <TagInput
            tags={data.whoAmI.values || []}
            onAdd={addValue}
            onRemove={removeValue}
            placeholder={t(locale, "typeAndEnter")}
            color="brainhance-success"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: The Why ──────────────────────────────────────
function StepTheWhy({ locale }: { locale: "ar" | "en" }) {
  const { data, updateTheWhy } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-4"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        >
          🧭
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">
          {t(locale, "theWhy")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t(locale, "theWhyDesc")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground/80 font-semibold text-sm">
            {t(locale, "drivingForce")}
          </Label>
          <Textarea
            value={data.theWhy.drivingForce}
            onChange={(e) =>
              updateTheWhy(e.target.value, data.theWhy.lifeMessage)
            }
            placeholder={t(locale, "drivingForceHint")}
            className="bg-background/50 border-border/50 focus:border-brainhance-purple min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/80 font-semibold text-sm">
            {t(locale, "lifeMessage")}
          </Label>
          <Textarea
            value={data.theWhy.lifeMessage}
            onChange={(e) =>
              updateTheWhy(data.theWhy.drivingForce, e.target.value)
            }
            placeholder={t(locale, "lifeMessageHint")}
            className="bg-background/50 border-border/50 focus:border-brainhance-purple min-h-[120px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Ikigai ───────────────────────────────────────
function StepIkigai({ locale }: { locale: "ar" | "en" }) {
  const { data, updateIkigai } = useOnboardingStore();

  const circles = [
    {
      key: "love" as const,
      label: t(locale, "whatYouLove"),
      color: "#F87171",
      emoji: "❤️",
    },
    {
      key: "goodAt" as const,
      label: t(locale, "whatYoureGoodAt"),
      color: "#60A5FA",
      emoji: "⭐",
    },
    {
      key: "worldNeeds" as const,
      label: t(locale, "whatWorldNeeds"),
      color: "#34D399",
      emoji: "🌍",
    },
    {
      key: "paidFor" as const,
      label: t(locale, "whatYouCanBePaidFor"),
      color: "#FBBF24",
      emoji: "💰",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          ☯️
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">
          {t(locale, "ikigai")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t(locale, "ikigaiDesc")}
        </p>
      </div>

      {/* Simple Venn preview */}
      <div className="relative h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-48 h-48">
          {[
            { cx: 85, cy: 80, fill: "rgba(248,113,113,0.15)", stroke: "#F87171" },
            { cx: 115, cy: 80, fill: "rgba(96,165,250,0.15)", stroke: "#60A5FA" },
            { cx: 85, cy: 110, fill: "rgba(52,211,153,0.15)", stroke: "#34D399" },
            { cx: 115, cy: 110, fill: "rgba(251,191,36,0.15)", stroke: "#FBBF24" },
          ].map((c, i) => (
            <motion.circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r="45"
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth="1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
            />
          ))}
          <text
            x="100"
            y="97"
            textAnchor="middle"
            fill="#C084FC"
            fontSize="8"
            fontWeight="bold"
          >
            IKIGAI
          </text>
        </svg>
      </div>

      <div className="grid gap-4">
        {circles.map((circle) => (
          <div
            key={circle.key}
            className="glass rounded-xl p-4"
            style={{ borderColor: `${circle.color}30` }}
          >
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{circle.emoji}</span>
              <span style={{ color: circle.color }}>{circle.label}</span>
            </Label>
            <TagInput
              tags={data.ikigai[circle.key]}
              onAdd={(tag) =>
                updateIkigai({
                  ...data.ikigai,
                  [circle.key]: [...data.ikigai[circle.key], tag],
                })
              }
              onRemove={(i) =>
                updateIkigai({
                  ...data.ikigai,
                  [circle.key]: data.ikigai[circle.key].filter(
                    (_, idx) => idx !== i
                  ),
                })
              }
              placeholder={t(locale, "typeAndEnter")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Wheel of Life ────────────────────────────────
function StepWheelOfLife({ locale }: { locale: "ar" | "en" }) {
  const { data, updateWheelOfLife } = useOnboardingStore();

  const sectors = [
    { key: "career" as const, label: t(locale, "career"), emoji: "💼" },
    { key: "relationships" as const, label: t(locale, "relationships"), emoji: "❤️" },
    { key: "health" as const, label: t(locale, "health"), emoji: "🏃" },
    { key: "finances" as const, label: t(locale, "finances"), emoji: "💰" },
    { key: "personalGrowth" as const, label: t(locale, "personalGrowth"), emoji: "📚" },
    { key: "fun" as const, label: t(locale, "fun"), emoji: "🎮" },
    { key: "physicalEnv" as const, label: t(locale, "physicalEnv"), emoji: "🏠" },
    { key: "spirituality" as const, label: t(locale, "spirituality"), emoji: "🕊️" },
  ];

  const getColor = (value: number) => {
    if (value <= 3) return "#F87171";
    if (value <= 6) return "#FBBF24";
    return "#34D399";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          🎯
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">
          {t(locale, "wheelOfLife")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t(locale, "wheelOfLifeDesc")}
        </p>
      </div>

      <div className="space-y-4">
        {sectors.map((sector) => (
          <motion.div
            key={sector.key}
            className="glass rounded-xl p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: sectors.indexOf(sector) * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <span>{sector.emoji}</span>
                {sector.label}
              </Label>
              <motion.span
                key={data.wheelOfLife[sector.key]}
                className="text-lg font-bold"
                style={{ color: getColor(data.wheelOfLife[sector.key]) }}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
              >
                {data.wheelOfLife[sector.key]}
              </motion.span>
            </div>
            <Slider
              value={[data.wheelOfLife[sector.key]]}
              onValueChange={(val) =>
                updateWheelOfLife({ ...data.wheelOfLife, [sector.key]: Array.isArray(val) ? val[0] : val })
              }
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Life Reevaluation (SWOT) ─────────────────────
function StepLifeReevaluation({ locale }: { locale: "ar" | "en" }) {
  const { data, updateLifeReevaluation } = useOnboardingStore();

  const swotSections = [
    {
      key: "strengths" as const,
      label: t(locale, "strengths"),
      color: "#34D399",
      emoji: "💪",
    },
    {
      key: "weaknesses" as const,
      label: t(locale, "weaknesses"),
      color: "#F87171",
      emoji: "⚠️",
    },
    {
      key: "opportunities" as const,
      label: t(locale, "opportunities"),
      color: "#60A5FA",
      emoji: "🚀",
    },
    {
      key: "threats" as const,
      label: t(locale, "threats"),
      color: "#FBBF24",
      emoji: "🛡️",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-4"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📊
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">
          {t(locale, "lifeReevaluation")}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">
          {t(locale, "lifeReevaluationDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swotSections.map((section) => (
          <div
            key={section.key}
            className="glass rounded-xl p-4"
            style={{ borderColor: `${section.color}30` }}
          >
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{section.emoji}</span>
              <span style={{ color: section.color }}>{section.label}</span>
            </Label>
            <TagInput
              tags={data.lifeReevaluation[section.key]}
              onAdd={(tag) =>
                updateLifeReevaluation({
                  ...data.lifeReevaluation,
                  [section.key]: [
                    ...data.lifeReevaluation[section.key],
                    tag,
                  ],
                })
              }
              onRemove={(i) =>
                updateLifeReevaluation({
                  ...data.lifeReevaluation,
                  [section.key]: data.lifeReevaluation[section.key].filter(
                    (_, idx) => idx !== i
                  ),
                })
              }
              placeholder={t(locale, "typeAndEnter")}
            />
          </div>
        ))}
      </div>

      {/* Priorities */}
      <div className="glass rounded-xl p-4">
        <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
          <span>🎯</span>
          <span className="text-brainhance-purple">{t(locale, "priorities")}</span>
        </Label>
        <TagInput
          tags={data.lifeReevaluation.priorities}
          onAdd={(tag) =>
            updateLifeReevaluation({
              ...data.lifeReevaluation,
              priorities: [...data.lifeReevaluation.priorities, tag],
            })
          }
          onRemove={(i) =>
            updateLifeReevaluation({
              ...data.lifeReevaluation,
              priorities: data.lifeReevaluation.priorities.filter(
                (_, idx) => idx !== i
              ),
            })
          }
          placeholder={t(locale, "typeAndEnter")}
        />
      </div>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────
export default function OnboardingPage() {
  const { data, setStep } = useOnboardingStore();
  const { setOnboarded } = useAuthStore();
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const totalSteps = 5;

  const steps = [
    { component: StepWhoAmI, label: t(locale, "whoAmI") },
    { component: StepTheWhy, label: t(locale, "theWhy") },
    { component: StepIkigai, label: t(locale, "ikigai") },
    { component: StepWheelOfLife, label: t(locale, "wheelOfLife") },
    { component: StepLifeReevaluation, label: t(locale, "lifeReevaluation") },
  ];

  const CurrentStep = steps[data.step - 1].component;

  const handleNext = useCallback(() => {
    if (data.step < totalSteps) {
      setStep(data.step + 1);
    }
  }, [data.step, setStep]);

  const handlePrev = useCallback(() => {
    if (data.step > 1) {
      setStep(data.step - 1);
    }
  }, [data.step, setStep]);

  const handleFinish = useCallback(() => {
    setOnboarded(true);
    window.location.href = "/dashboard";
  }, [setOnboarded]);

  return (
    <div
      className="min-h-screen bg-gradient-animated flex flex-col items-center p-4 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <FloatingParticles />

      {/* Header with progress */}
      <div className="relative z-10 w-full max-w-2xl mt-8 mb-6">
        {/* Step counter */}
        <div className="text-center mb-4">
          <span className="text-sm text-muted-foreground">
            {t(locale, "onboarding")} •{" "}
            <span className="text-brainhance-purple font-semibold">
              {data.step}
            </span>{" "}
            {t(locale, "stepOf")} {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet"
            initial={{ width: 0 }}
            animate={{ width: `${(data.step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`text-xs transition-colors ${
                i + 1 === data.step
                  ? "text-brainhance-purple font-semibold"
                  : i + 1 < data.step
                  ? "text-brainhance-glow"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="relative z-10 w-full max-w-2xl flex-1">
        <motion.div className="glass-strong rounded-3xl p-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={data.step}
              initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStep locale={locale} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-4 pb-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={data.step === 1}
            className="glass border-brainhance-purple/30 hover:bg-brainhance-purple/10 px-8"
          >
            {t(locale, "previous")}
          </Button>

          {data.step < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet hover:from-brainhance-deep hover:to-brainhance-purple text-white px-8"
            >
              {t(locale, "next")}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-brainhance-success to-emerald-400 hover:from-emerald-600 hover:to-emerald-400 text-white px-8"
            >
              {t(locale, "finish")} 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
