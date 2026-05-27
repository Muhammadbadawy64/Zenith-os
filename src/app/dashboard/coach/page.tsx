"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlowCard } from "@/components/ui/animations";
import { useLanguageStore, useAuthStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface JournalEntry {
  id: string;
  transcription_text: string | null;
  created_at: string;
}

// ─── Quick Prompts ─────────────────────────────────────────
const QUICK_PROMPTS_AR = [
  "ساعدني أحدد أولوياتي لهذا الأسبوع",
  "كيف أوازن بين شغفي المتعدد؟",
  "أشعر بالتشتت، ما نصيحتك؟",
  "اكتب لي خطة المعركة الأسبوعية",
  "كيف أحسن نسبة التوافق مع رسالتي؟",
  "اقترح روتين صباحي مثالي",
];

const QUICK_PROMPTS_EN = [
  "Help me set my priorities this week",
  "How to balance multiple passions?",
  "I feel scattered, what's your advice?",
  "Write my weekly battle plan",
  "How to improve my alignment score?",
  "Suggest an ideal morning routine",
];

// ─── Mic Button ────────────────────────────────────────────
function MicButton({
  isRecording,
  onClick,
}: {
  isRecording: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
        isRecording
          ? "bg-brainhance-danger/20"
          : "bg-brainhance-purple/20 hover:bg-brainhance-purple/30"
      }`}
      whileTap={{ scale: 0.92 }}
    >
      {isRecording && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-brainhance-danger"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-brainhance-danger"
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </>
      )}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-10 h-10 relative z-10 ${
          isRecording ? "text-brainhance-danger" : "text-brainhance-glow"
        }`}
        animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </motion.svg>
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function CoachPage() {
  const { locale } = useLanguageStore();
  const isRTL = locale === "ar";
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // ─── Tab state ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"journal" | "chat">("chat");

  // ─── Voice Journal state ──────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [journalsLoading, setJournalsLoading] = useState(true);

  // ─── Chat state ───────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickPrompts = locale === "ar" ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;
  const [chatInitLoading, setChatInitLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Fetch journals ───────────────────────────────────
  const fetchJournals = useCallback(async () => {
    if (!userId) return;
    setJournalsLoading(true);
    const { data } = await supabase
      .from("voice_journals")
      .select("id, transcription_text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setJournals(data as JournalEntry[]);
    setJournalsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  // ─── Fetch chat history ───────────────────────────────
  const fetchChatHistory = useCallback(async () => {
    if (!userId) return;
    setChatInitLoading(true);
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, role, message, created_at")
      .eq("user_id", userId)
      .eq("context_type", "coach")
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.message,
          created_at: m.created_at,
        }))
      );
    }
    // Add welcome message if no history
    if (!data || data.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            locale === "ar"
              ? "مرحباً يا مُبدع! 🧠✨ أنا مرشدك الذكي في Zenith OS. أنا هنا لمساعدتك على التركيز، تحقيق أهدافك، والعيش وفق رسالة حياتك.\n\nكيف يمكنني مساعدتك اليوم؟"
              : "Welcome, Creator! 🧠✨ I'm your AI Coach in Zenith OS. I'm here to help you focus, achieve your goals, and live aligned with your life message.\n\nHow can I help you today?",
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setChatInitLoading(false);
  }, [userId, locale]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  // ─── Recording logic ──────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        setIsTranscribing(true);

        // Simulate transcription delay
        await new Promise((r) => setTimeout(r, 2000));

        const mockTranscription =
          locale === "ar"
            ? "هذا تفريغ نصي تجريبي لتسجيلي الصوتي. أشعر أن يومي كان منتجاً وأريد الاستمرار في هذا المنحى."
            : "This is a sample transcription of my voice recording. I feel my day was productive and I want to keep this momentum going.";

        setTranscription(mockTranscription);

        // Save to Supabase
        if (userId) {
          await supabase.from("voice_journals").insert({
            user_id: userId,
            audio_url: "mock-audio-url",
            transcription_text: mockTranscription,
            ai_summary: null,
          });
        }

        setIsTranscribing(false);
        fetchJournals();
      };

      recorder.start();
      setIsRecording(true);

      let sec = 0;
      timerRef.current = setInterval(() => {
        sec++;
        setRecordingDuration(sec);
      }, 1000);
    } catch {
      alert(
        locale === "ar"
          ? "⚠️ لا يمكن الوصول إلى الميكروفون."
          : "⚠️ Cannot access microphone."
      );
    }
  }, [locale, userId, fetchJournals]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ─── Chat logic ───────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || chatLoading || !userId) return;

      const trimmed = content.trim();

      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setChatLoading(true);

      // Insert user message to Supabase
      await supabase.from("ai_conversations").insert({
        user_id: userId,
        role: "user",
        message: trimmed,
        context_type: "coach",
      });

      // Call the real AI API
      try {
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, locale }),
        });

        const data = await response.json();
        const reply = data.reply || (locale === "ar" ? "عذراً، حاول مرة أخرى." : "Sorry, try again.");

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        await supabase.from("ai_conversations").insert({
          user_id: userId,
          role: "assistant",
          message: reply,
          context_type: "coach",
        });
      } catch {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            locale === "ar"
              ? "⚠️ حدث خطأ في الاتصال. حاول مرة أخرى."
              : "⚠️ Connection error. Try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, userId, messages, locale]
  );

  const clearChat = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("ai_conversations")
      .delete()
      .eq("user_id", userId)
      .eq("context_type", "coach");

    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content:
          locale === "ar"
            ? "تم مسح المحادثة. كيف أقدر أساعدك؟ 🧠"
            : "Chat cleared. How can I help? 🧠",
        created_at: new Date().toISOString(),
      },
    ]);
  }, [userId, locale]);

  const formatEntryDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span>🧠</span>
          <span className="gradient-text">{t(locale, "aiCoach")}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "سجل تأملاتك الصوتية وتحدث مع مرشدك الذكي"
            : "Record voice journals and chat with your AI coach"}
        </p>
      </div>

      {/* ─── Tabs ───────────────────────────────────────── */}
      <div className="flex gap-2">
        {(["chat", "journal"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-brainhance-purple/20 text-brainhance-glow border border-brainhance-purple/30"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "chat" ? "🤖 " : "🎙️ "}
            {tab === "chat"
              ? locale === "ar"
                ? "المرشد الذكي"
                : "AI Coach"
              : locale === "ar"
                ? "المذكرات الصوتية"
                : "Voice Journal"}
          </button>
        ))}
      </div>

      {/* ─── VOICE JOURNAL TAB ───────────────────────────── */}
      {activeTab === "journal" && (
        <motion.div
          className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Recorder */}
          <div className="space-y-4">
            <GlowCard className="flex flex-col items-center py-10">
              <MicButton
                isRecording={isRecording}
                onClick={isRecording ? stopRecording : startRecording}
              />

              {isRecording && (
                <motion.div
                  className="mt-4 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span
                    className="w-2 h-2 rounded-full bg-brainhance-danger"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-sm font-medium text-brainhance-danger">
                    {locale === "ar" ? "جاري التسجيل..." : "Recording..."}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatTime(recordingDuration)}
                  </span>
                </motion.div>
              )}

              {isTranscribing && (
                <motion.div
                  className="mt-4 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-brainhance-purple"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-brainhance-glow">
                    {locale === "ar" ? "جاري التفريغ..." : "Transcribing..."}
                  </span>
                </motion.div>
              )}

              {transcription && !isRecording && !isTranscribing && (
                <motion.div
                  className="mt-4 w-full glass rounded-xl p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-[10px] text-brainhance-glow mb-1">
                    📝 {t(locale, "transcription")}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;{transcription}&rdquo;
                  </p>
                  <Button
                    onClick={() => setTranscription(null)}
                    variant="outline"
                    size="xs"
                    className="mt-3 glass border-border/30 text-xs"
                  >
                    {locale === "ar" ? "تسجيل جديد" : "Record New"} 🎙️
                  </Button>
                </motion.div>
              )}

              {!isRecording && !isTranscribing && !transcription && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "اضغط على الميكروفون لبدء التسجيل"
                    : "Tap the mic to start recording"}
                </p>
              )}
            </GlowCard>
          </div>

          {/* Past Journals */}
          <div className="space-y-4 min-h-0 overflow-y-auto pr-1">
            <GlowCard>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span>📚</span>
                {locale === "ar" ? "التسجيلات السابقة" : "Past Recordings"}
              </h3>

              {journalsLoading ? (
                <div className="flex justify-center py-8">
                  <motion.div
                    className="w-6 h-6 border-2 border-brainhance-purple border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : journals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🎙️</p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar"
                      ? "لا توجد تسجيلات بعد"
                      : "No recordings yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {journals.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass rounded-xl p-4"
                      >
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {formatEntryDate(entry.created_at)}
                        </p>
                        {entry.transcription_text ? (
                          <p className="text-xs text-foreground/80 italic line-clamp-3">
                            &ldquo;{entry.transcription_text}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {locale === "ar" ? "بدون تفريغ" : "No transcription"}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </GlowCard>
          </div>
        </motion.div>
      )}

      {/* ─── AI COACH TAB ────────────────────────────────── */}
      {activeTab === "chat" && (
        <motion.div
          className="flex-1 flex gap-6 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <GlowCard className="flex-1 flex flex-col min-h-0 !p-0 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatInitLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      className="w-6 h-6 border-2 border-brainhance-purple border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.role === "user"
                              ? "bg-brainhance-purple/20 border border-brainhance-purple/30"
                              : "glass"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">
                              {message.role === "user" ? "👤" : "🤖"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.created_at).toLocaleTimeString(
                                locale === "ar" ? "ar-EG" : "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Loading indicator */}
                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="glass rounded-2xl p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span>🤖</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-brainhance-purple"
                              animate={{ y: [0, -6, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border/20 p-4">
                <div className="flex gap-3">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage(chatInput)
                    }
                    placeholder={t(locale, "askCoach")}
                    className="flex-1 bg-background/50 border-border/50"
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={() => sendMessage(chatInput)}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white px-6 shrink-0"
                  >
                    {locale === "ar" ? "إرسال" : "Send"} 🚀
                  </Button>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* ─── Side Panel ─────────────────────────────── */}
          <div className="w-72 space-y-4 shrink-0 hidden lg:block">
            {/* Quick Prompts */}
            <GlowCard>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span>💡</span>
                {locale === "ar" ? "اسأل عن..." : "Ask about..."}
              </h4>
              <div className="space-y-2">
                {quickPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-start text-xs glass rounded-xl p-3 text-muted-foreground hover:text-foreground hover:bg-brainhance-purple/10 transition-all"
                    whileHover={{ x: isRTL ? -3 : 3 }}
                    disabled={chatLoading}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </GlowCard>

            {/* Coach personality */}
            <GlowCard>
              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span>🧠</span>
                {locale === "ar" ? "عن المرشد" : "About Coach"}
              </h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  {locale === "ar"
                    ? "مرشد مدرب على منهج المتخصص العام (Generalized Specialist) ونموذج Creatorpreneur."
                    : "Trained on the Generalized Specialist method and the Creatorpreneur model."}
                </p>
                <p>
                  {locale === "ar"
                    ? "يساعدك على ربط أهدافك بأدوارك ورسالة حياتك."
                    : "Helps you connect your goals with your roles and life message."}
                </p>
              </div>
            </GlowCard>

            {/* Clear chat */}
            <Button
              variant="outline"
              onClick={clearChat}
              disabled={chatLoading}
              className="w-full glass border-border/30 text-sm"
            >
              {locale === "ar" ? "🗑️ مسح المحادثة" : "🗑️ Clear Chat"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
