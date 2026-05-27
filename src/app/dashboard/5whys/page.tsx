"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { HelpCircle, Sparkles, Lightbulb, ChevronDown, RotateCcw, ScrollText, Brain, Gem, Trash2 } from "lucide-react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface WhysSession {
  id: string;
  goal: string;
  answers: { step: number; answer: string }[];
  internal_belief: string;
  insight: string;
  analysis: string;
  created_at: string;
}

export default function FiveWhysPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const userId = useAuthStore((s) => s.user?.id);

  const [step, setStep] = useState<"input" | "reflecting" | "result">("input");
  const [goal, setGoal] = useState("");
  const [currentWhy, setCurrentWhy] = useState(0);
  const [answers, setAnswers] = useState<{ step: number; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ internal_belief: string; analysis: string; insight: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<WhysSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("five_whys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setHistory(data as WhysSession[]);
  }, [userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleStart = () => {
    if (!goal.trim()) return;
    setAnswers([]);
    setCurrentWhy(0);
    setCurrentAnswer("");
    setResult(null);
    setSaved(false);
    setStep("reflecting");
  };

  const handleAnswer = () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [...answers, { step: currentWhy + 1, answer: currentAnswer.trim() }];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentWhy >= 4) {
      runAnalysis(goal, newAnswers);
    } else {
      setCurrentWhy((p) => p + 1);
    }
  };

  const runAnalysis = async (g: string, ans: { step: number; answer: string }[]) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/5whys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: g, answers: ans, locale }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      setResult({ internal_belief: "", analysis: "⚠️ Error analyzing.", insight: "" });
      setStep("result");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !result) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      goal,
      answers,
      internal_belief: result.internal_belief,
      analysis: result.analysis,
      insight: result.insight,
    };
    const { error } = await supabase.from("five_whys").insert(payload);
    if (!error) {
      setSaved(true);
      fetchHistory();
    }
    setSaving(false);
  };

  const handleReset = () => {
    setStep("input");
    setGoal("");
    setAnswers([]);
    setCurrentWhy(0);
    setCurrentAnswer("");
    setResult(null);
    setSaved(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    await supabase.from("five_whys").delete().eq("id", id);
    setHistory((prev) => prev.filter((s) => s.id !== id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <HelpCircle className="w-7 h-7 text-brainhance-glow" />
              <span className="gradient-text">{t(locale, "fiveWhys")}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, "fiveWhysDesc")}</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ScrollText className="w-4 h-4" />
            {t(locale, "pastReflections")}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {step === "input" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlowCard>
                <div className="space-y-4">
                  <label className="block text-sm font-medium">{t(locale, "whatDoYouWant")}</label>
                  <Textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={t(locale, "goalPlaceholder")}
                    className="bg-background/50 min-h-[100px]"
                  />
                  <Button
                    onClick={handleStart}
                    disabled={!goal.trim()}
                    className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                  >
                    <Sparkles className="w-4 h-4 me-1.5" /> {t(locale, "startReflection")}
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          )}

          {step === "reflecting" && (
            <div className="space-y-4">
              {/* Goal reminder */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{locale === "ar" ? "هدفك" : "Your goal"}</p>
                <p className="text-sm font-semibold mt-0.5">{goal}</p>
              </motion.div>

              {/* Previous answers */}
              {answers.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl p-4 border-s-3 border-brainhance-purple/30"
                >
                  <p className="text-[10px] text-brainhance-glow font-bold mb-1">
                    {t(locale, "whyStep")} #{i + 1}
                  </p>
                  <p className="text-xs text-foreground/80">{a.answer}</p>
                </motion.div>
              ))}

              {/* Current Why */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWhy}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <GlowCard className={currentWhy === 0 ? "border-brainhance-purple/40" : ""}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Brain className="w-6 h-6 text-brainhance-purple" />
                        </motion.div>
                        <div>
                          <p className="text-xs text-brainhance-glow font-bold">
                            {t(locale, "whyQuestion")} #{currentWhy + 1}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {currentWhy === 0
                              ? locale === "ar"
                                ? `لماذا تريد "${goal}"؟`
                                : `Why do you want to "${goal}"?`
                              : locale === "ar"
                                ? `لماذا "${answers[currentWhy - 1]?.answer}"؟`
                                : `Why "${answers[currentWhy - 1]?.answer}"?`}
                          </p>
                        </div>
                      </div>
                      <Textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder={t(locale, "whyHint")}
                        className="bg-background/50 min-h-[80px]"
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnswer(); } }}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">
                          {locale === "ar" ? `السؤال ${currentWhy + 1} من 5` : `Question ${currentWhy + 1} of 5`}
                        </span>
                        <Button
                          onClick={handleAnswer}
                          disabled={!currentAnswer.trim()}
                          size="sm"
                          className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                        >
                          {currentWhy < 4 ? t(locale, "nextQuestion") : locale === "ar" ? "اكتشف المعتقد" : "Reveal Belief"}
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {step === "result" && (
            <div className="space-y-4">
              {analyzing ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "تحليل مسار التأمل..." : "Analyzing reflection path..."}</p>
                  </div>
                </div>
              ) : result && (
                <>
                  {/* Reflection Chain */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlowCard>
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <ChevronDown className="w-4 h-4 text-brainhance-glow" />
                        {t(locale, "reflectionChain")}
                      </h3>
                      <div className="space-y-3">
                        <div className="glass rounded-xl p-3 border-s-2 border-brainhance-purple/20">
                          <p className="text-[10px] text-muted-foreground">{locale === "ar" ? "الهدف" : "Goal"}</p>
                          <p className="text-xs font-semibold mt-0.5">{goal}</p>
                        </div>
                        {answers.map((a, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass rounded-xl p-3 border-s-2 border-brainhance-purple/30"
                          >
                            <p className="text-[10px] text-brainhance-glow font-bold">{t(locale, "whyStep")} #{i + 1}</p>
                            <p className="text-xs text-foreground/80 mt-0.5">{a.answer}</p>
                          </motion.div>
                        ))}
                      </div>
                    </GlowCard>
                  </motion.div>

                  {/* Internal Belief */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlowCard className="border-brainhance-glow/30">
                      <div className="text-center space-y-4 py-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                          className="flex justify-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-brainhance-purple/10 flex items-center justify-center border border-brainhance-purple/30 shadow-lg shadow-brainhance-purple/10">
                            <Gem className="w-8 h-8 text-brainhance-glow" />
                          </div>
                        </motion.div>
                        <div>
                          <h3 className="text-sm font-bold gradient-text mb-1">{t(locale, "internalBelief")}</h3>
                          <p className="text-sm text-foreground/90 leading-relaxed">{result.internal_belief}</p>
                        </div>
                        {result.analysis && (
                          <div className="glass rounded-xl p-3 text-start">
                            <p className="text-[10px] text-brainhance-glow font-bold mb-1">{t(locale, "insight")}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{result.analysis}</p>
                          </div>
                        )}
                        {result.insight && (
                          <div className="glass rounded-xl p-3 text-start bg-brainhance-purple/10 border border-brainhance-purple/20">
                            <p className="text-[10px] text-brainhance-glow font-bold mb-1">
                              <Lightbulb className="w-3 h-3 inline me-1" />{locale === "ar" ? "بصيرة" : "Insight"}
                            </p>
                            <p className="text-xs text-foreground/90 italic leading-relaxed">&ldquo;{result.insight}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </GlowCard>
                  </motion.div>

                  {/* Actions */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                    >
                      {saving ? "..." : saved
                        ? (locale === "ar" ? "تم الحفظ ✓" : "Saved ✓")
                        : t(locale, "saveReflection")}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="glass text-muted-foreground"
                    >
                      <RotateCcw className="w-4 h-4 me-1.5" /> {locale === "ar" ? "تأمل جديد" : "New Reflection"}
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>

        {/* History sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
            >
              <GlowCard>
                <h3 className="text-sm font-bold mb-4">{t(locale, "pastReflections")}</h3>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <ScrollText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">{t(locale, "noReflections")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {history.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass rounded-xl p-3 cursor-pointer hover:border-brainhance-purple/20 border border-transparent transition-all group relative"
                        onClick={() => {
                          setGoal(session.goal);
                          setAnswers(session.answers);
                          setResult({
                            internal_belief: session.internal_belief,
                            analysis: session.analysis,
                            insight: session.insight,
                          });
                          setStep("result");
                          setSaved(true);
                        }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{session.goal}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(session.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                            </p>
                            {session.internal_belief && (
                              <p className="text-[10px] text-brainhance-glow mt-1 truncate">{session.internal_belief}</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ id: session.id, name: session.goal });
                            }}
                            className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
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
