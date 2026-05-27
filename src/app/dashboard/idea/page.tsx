"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore, useNotificationStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import {
  Lightbulb, Wrench, Plus, Search, CheckCircle2, RotateCcw,
  ChevronDown, ChevronUp, Tags, Sparkles, Trash2, Archive, X,
  Target, GitBranch, ListChecks, ClipboardCheck,
} from "lucide-react";

interface IdeaProblem {
  id: string;
  title: string;
  identity: string;
  develop: string[];
  execute: string[];
  assessment: string;
  tags: string[];
  status: "active" | "solved";
  created_at: string;
}

interface AiFeedback {
  extra_solutions: string[];
  blind_spots: string[];
  encouragement: string;
  next_steps: string[];
}

export default function IdeaPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const userId = useAuthStore((s) => s.user?.id);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [problems, setProblems] = useState<IdeaProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "solved">("active");
  const [search, setSearch] = useState("");

  // New problem form
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newIdentity, setNewIdentity] = useState("");
  const [newDevelop, setNewDevelop] = useState<string[]>([""]);
  const [newExecute, setNewExecute] = useState<string[]>([""]);
  const [newAssessment, setNewAssessment] = useState("");
  const [newTags, setNewTags] = useState("");
  const [saving, setSaving] = useState(false);

  // AI feedback
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [aiProblemId, setAiProblemId] = useState<string | null>(null);

  // Expanded problem
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("problem_solver")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setProblems(data as IdeaProblem[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const filteredProblems = useMemo(() => {
    const q = search.toLowerCase();
    return problems.filter((p) => {
      if (p.status !== activeTab) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.identity.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, activeTab, search]);

  const handleAddDevelop = () => setNewDevelop((p) => [...p, ""]);
  const handleAddExecute = () => setNewExecute((p) => [...p, ""]);

  const updateDevelop = (i: number, v: string) => {
    setNewDevelop((p) => { const c = [...p]; c[i] = v; return c; });
  };

  const updateExecute = (i: number, v: string) => {
    setNewExecute((p) => { const c = [...p]; c[i] = v; return c; });
  };

  const removeDevelop = (i: number) => {
    setNewDevelop((p) => p.filter((_, idx) => idx !== i));
  };

  const removeExecute = (i: number) => {
    setNewExecute((p) => p.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setFormStep(0);
    setNewTitle("");
    setNewIdentity("");
    setNewDevelop([""]);
    setNewExecute([""]);
    setNewAssessment("");
    setNewTags("");
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!userId || !newTitle.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      title: newTitle.trim(),
      identity: newIdentity.trim(),
      develop: newDevelop.filter((d) => d.trim()),
      execute: newExecute.filter((e) => e.trim()),
      assessment: newAssessment.trim(),
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      status: "active" as const,
    };
    const { data, error } = await supabase.from("problem_solver").insert(payload).select().single();
    if (data) {
      setProblems((p) => [data as IdeaProblem, ...p]);
      addNotification({ title: t(locale, "newProblem"), description: newTitle.trim(), type: "success" });
      resetForm();
    }
    setSaving(false);
  };

  const handleStatusToggle = async (id: string, current: string) => {
    const newStatus = current === "active" ? "solved" : "active";
    await supabase.from("problem_solver").update({ status: newStatus }).eq("id", id);
    setProblems((p) => p.map((prob) => prob.id === id ? { ...prob, status: newStatus as "active" | "solved" } : prob));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("problem_solver").delete().eq("id", id);
    setProblems((p) => p.filter((prob) => prob.id !== id));
  };

  const runAiFeedback = async (problem: IdeaProblem) => {
    setAiLoading(true);
    setAiFeedback(null);
    setAiProblemId(problem.id);
    try {
      const res = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.title,
          identity: problem.identity,
          solutions: problem.develop,
          steps: problem.execute,
          locale,
        }),
      });
      const data = await res.json();
      setAiFeedback(data);
    } catch {
      // silent
    } finally {
      setAiLoading(false);
    }
  };

  const FORM_STEPS = [
    { icon: Target, key: "identity" },
    { icon: GitBranch, key: "develop" },
    { icon: ListChecks, key: "execute" },
    { icon: ClipboardCheck, key: "assessment" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex flex-col items-center gap-3">
          <motion.div className="w-8 h-8 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <p className="text-sm text-muted-foreground">{t(locale, "loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Wrench className="w-7 h-7 text-brainhance-glow" />
              <span className="gradient-text">{t(locale, "ideaSolver")}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, "ideaDesc")}</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
          >
            <Plus className="w-4 h-4 me-1.5" /> {t(locale, "newProblem")}
          </Button>
        </div>
      </motion.div>

      {/* New Problem Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <GlowCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">{t(locale, "newProblem")}</h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex gap-2 mb-6">
                {FORM_STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setFormStep(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      formStep === i
                        ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                        : i < formStep
                          ? "bg-brainhance-purple/10 text-brainhance-glow/60"
                          : "glass text-muted-foreground"
                    }`}
                  >
                    <s.icon className="w-3 h-3" />
                    {t(locale, s.key === "identity" ? "stepIdentity" : s.key === "develop" ? "stepDevelop" : s.key === "execute" ? "stepExecute" : "stepAssessment")}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={formStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {formStep === 0 && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t(locale, "problemTitle")}</label>
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t(locale, "problemTitlePlaceholder")} className="bg-background/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t(locale, "stepIdentity")}</label>
                        <p className="text-[10px] text-muted-foreground mb-2">{t(locale, "stepIdentityDesc")}</p>
                        <Textarea value={newIdentity} onChange={(e) => setNewIdentity(e.target.value)} className="bg-background/50 min-h-[80px]" />
                      </div>
                    </div>
                  )}

                  {formStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">{t(locale, "stepDevelopDesc")}</p>
                      {newDevelop.map((sol, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={sol}
                            onChange={(e) => updateDevelop(i, e.target.value)}
                            placeholder={`${t(locale, "solutionPlaceholder")} ${i + 1}`}
                            className="bg-background/50 flex-1"
                          />
                          {newDevelop.length > 1 && (
                            <button onClick={() => removeDevelop(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddDevelop} className="glass text-muted-foreground">
                        <Plus className="w-3 h-3 me-1" /> {t(locale, "addSolution")}
                      </Button>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">{t(locale, "stepExecuteDesc")}</p>
                      {newExecute.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={step}
                            onChange={(e) => updateExecute(i, e.target.value)}
                            placeholder={`${t(locale, "stepPlaceholder")} ${i + 1}`}
                            className="bg-background/50 flex-1"
                          />
                          {newExecute.length > 1 && (
                            <button onClick={() => removeExecute(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddExecute} className="glass text-muted-foreground">
                        <Plus className="w-3 h-3 me-1" /> {t(locale, "addStep")}
                      </Button>
                    </div>
                  )}

                  {formStep === 3 && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t(locale, "stepAssessment")}</label>
                        <p className="text-[10px] text-muted-foreground mb-2">{t(locale, "stepAssessmentDesc")}</p>
                        <Textarea value={newAssessment} onChange={(e) => setNewAssessment(e.target.value)} className="bg-background/50 min-h-[80px]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t(locale, "problemTags")}</label>
                        <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder={t(locale, "tagsHint")} className="bg-background/50" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => formStep > 0 ? setFormStep((p) => p - 1) : resetForm()}
                  className="glass text-muted-foreground"
                >
                  {formStep === 0 ? (locale === "ar" ? "إلغاء" : "Cancel") : (locale === "ar" ? "السابق" : "Previous")}
                </Button>
                {formStep < 3 ? (
                  <Button
                    onClick={() => setFormStep((p) => p + 1)}
                    className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                    disabled={(formStep === 0 && !newTitle.trim())}
                  >
                    {locale === "ar" ? "التالي" : "Next"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving || !newTitle.trim()}
                    className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white"
                  >
                    {saving ? "..." : t(locale, "saveReflection")}
                  </Button>
                )}
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        {(["active", "solved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "active" ? t(locale, "activeProblems") : t(locale, "solvedArchive")}
            <span className="ms-1.5 text-[10px] opacity-60">
              ({problems.filter((p) => p.status === tab).length})
            </span>
          </button>
        ))}
        <div className="relative flex-1 max-w-xs ms-auto">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(locale, "searchProblems")}
            className="bg-background/50 ps-9"
          />
        </div>
      </div>

      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <div className="text-center py-16">
          {activeTab === "active" ? (
            <>
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{t(locale, "noProblems")}</p>
            </>
          ) : (
            <>
              <Archive className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{t(locale, "noSolved")}</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProblems.map((problem, idx) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlowCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{problem.title}</h3>
                        {problem.tags && problem.tags.length > 0 && (
                          <div className="flex gap-1">
                            {problem.tags.map((tag, i) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-brainhance-purple/15 text-brainhance-glow">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {problem.identity && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{problem.identity}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(problem.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                        </span>
                        {problem.status === "solved" && (
                          <span className="text-[10px] text-brainhance-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {locale === "ar" ? "تم الحل" : "Solved"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStatusToggle(problem.id, problem.status)}
                        className="p-1.5 glass rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                        title={problem.status === "active" ? t(locale, "markSolved") : locale === "ar" ? "إعادة فتح" : "Reopen"}
                      >
                        {problem.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === problem.id ? null : problem.id)}
                        className="p-1.5 glass rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedId === problem.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(problem.id)}
                        className="p-1.5 glass rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedId === problem.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4 space-y-3"
                      >
                        {problem.identity && (
                          <div className="glass rounded-xl p-3">
                            <p className="text-[10px] text-brainhance-glow font-bold flex items-center gap-1">
                              <Target className="w-3 h-3" /> {t(locale, "stepIdentity")}
                            </p>
                            <p className="text-xs text-foreground/80 mt-1">{problem.identity}</p>
                          </div>
                        )}

                        {problem.develop && problem.develop.length > 0 && (
                          <div className="glass rounded-xl p-3">
                            <p className="text-[10px] text-brainhance-glow font-bold flex items-center gap-1 mb-2">
                              <GitBranch className="w-3 h-3" /> {t(locale, "stepDevelop")}
                            </p>
                            <ul className="space-y-1.5">
                              {problem.develop.map((sol, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                  <span className="shrink-0 w-4 h-4 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                  {sol}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {problem.execute && problem.execute.length > 0 && (
                          <div className="glass rounded-xl p-3">
                            <p className="text-[10px] text-brainhance-glow font-bold flex items-center gap-1 mb-2">
                              <ListChecks className="w-3 h-3" /> {t(locale, "stepExecute")}
                            </p>
                            <ul className="space-y-1.5">
                              {problem.execute.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                  <span className="shrink-0 w-4 h-4 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {problem.assessment && (
                          <div className="glass rounded-xl p-3">
                            <p className="text-[10px] text-brainhance-glow font-bold flex items-center gap-1 mb-1">
                              <ClipboardCheck className="w-3 h-3" /> {t(locale, "stepAssessment")}
                            </p>
                            <p className="text-xs text-foreground/80">{problem.assessment}</p>
                          </div>
                        )}

                        {/* AI Feedback */}
                        <Button
                          onClick={() => runAiFeedback(problem)}
                          disabled={aiLoading && aiProblemId === problem.id}
                          variant="outline"
                          size="sm"
                          className="glass text-muted-foreground w-full"
                        >
                          {aiLoading && aiProblemId === problem.id ? (
                            <span className="flex items-center gap-2">
                              <motion.span className="inline-block w-3 h-3 border-2 border-brainhance-purple border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                              {locale === "ar" ? "جاري التحليل..." : "Analyzing..."}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" /> {t(locale, "getAIFeedback")}
                            </span>
                          )}
                        </Button>

                        <AnimatePresence>
                          {aiFeedback && aiProblemId === problem.id && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                              <div className="glass rounded-xl p-3 bg-brainhance-purple/5 border border-brainhance-purple/20">
                                <p className="text-[10px] text-brainhance-glow font-bold mb-2">{t(locale, "aiSuggestions")}</p>

                                {aiFeedback.extra_solutions.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">{t(locale, "extraSolutions")}</p>
                                    <ul className="space-y-1">
                                      {aiFeedback.extra_solutions.map((s, i) => (
                                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-brainhance-glow mt-1.5 shrink-0" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {aiFeedback.blind_spots.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">{t(locale, "blindSpots")}</p>
                                    <ul className="space-y-1">
                                      {aiFeedback.blind_spots.map((s, i) => (
                                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {aiFeedback.encouragement && (
                                  <div className="mb-3">
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">{t(locale, "encouragement")}</p>
                                    <p className="text-xs text-foreground/80 italic">&ldquo;{aiFeedback.encouragement}&rdquo;</p>
                                  </div>
                                )}

                                {aiFeedback.next_steps.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1">{t(locale, "nextSteps")}</p>
                                    <ul className="space-y-1">
                                      {aiFeedback.next_steps.map((s, i) => (
                                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                                          <span className="shrink-0 w-4 h-4 rounded-full bg-brainhance-purple/20 text-brainhance-glow text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlowCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
