"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Brain, Target, Calendar, Rocket, Timer, Compass, BookOpen,
  ChevronDown, Sparkles, Zap, BarChart3, Shield, ArrowLeft,
  Star, TrendingUp, Eye, Heart, Layers, MousePointerClick,
  Globe, Menu, X
} from "lucide-react";

// ─── Floating Card Component ──────────────────────────────
function FloatingCard({ children, delay = 0, className = "", y = 20 }: {
  children: React.ReactNode; delay?: number; className?: string; y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Compass Logo ─────────────────────────────────────────
function CompassLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <motion.path
        d="M20 6 L22 18 L34 20 L22 22 L20 34 L18 22 L6 20 L18 18 Z"
        fill="currentColor"
        opacity="0.9"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

// ─── 3D Tilt Card ─────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -12);
    rotateY.set(x * 12);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────
function AnimatedCounter({ target, suffix = "", label }: { target: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      setCount(current);
    }, 30);
    return () => clearInterval(interval);
  }, [started, target]);

  return (
    <motion.div
      ref={ref}
      className="text-center"
      onViewportEnter={() => setStarted(true)}
      viewport={{ once: true }}
    >
      <div className="text-3xl md:text-4xl font-black gradient-text">{count}{suffix}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

// ─── Problem Typewriter ───────────────────────────────────
function ProblemTypewriter() {
  const problems = [
    "تخطط كثيراً وتنفذ قليلاً؟",
    "شغفك مشتت بين عدة مجالات؟",
    "عقلك مزدحم بالأفكار؟",
    "تنسى أهدافك بعد أسبوع؟",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % problems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={current}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          transition={{ duration: 0.5 }}
          className="text-xl md:text-2xl font-bold text-brainhance-glow text-center"
        >
          {problems[current]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const isRTL = locale === "ar";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = {
    badge: locale === "ar" ? "نظام تشغيل حياتك الذكي — مدعوم بالذكاء الاصطناعي" : "Your Smart Life Operating System — AI Powered",
    heroTitle1: locale === "ar" ? "عقلك مليء" : "Your Mind is Full",
    heroTitle2: locale === "ar" ? "بالأفكار؟" : "of Ideas?",
    heroTitle3: locale === "ar" ? "امنحه نظام تشغيل." : "Give it an OS.",
    heroSub: locale === "ar" ? "المنصة الأولى لمتعددي الشغف. حوّل الفوضى في رأسك إلى خطة واضحة، وركّز على ما يهم فعلاً." : "The first platform for multi-passionate people. Turn the chaos in your head into a clear plan, and focus on what truly matters.",
    ctaPrimary: locale === "ar" ? "ابدأ رحلتك مجاناً" : "Start Your Journey Free",
    ctaSecondary: locale === "ar" ? "استكشف المميزات" : "Explore Features",
    isYou: locale === "ar" ? "هل هذا أنت؟" : "Is This You?",
    solutionLine1: locale === "ar" ? "الحل ليس في العمل بجهد أكبر." : "The solution isn't working harder.",
    solutionLine2Part1: locale === "ar" ? "بل في امتلاك " : "It's having a ",
    solutionLine2Highlight: locale === "ar" ? "نظام أذكى" : "smarter system",
    solutionLine2Part2: locale === "ar" ? " يفهم عقلك." : " that understands your mind.",
    featuresTag: locale === "ar" ? "كل ما تحتاجه في مكان واحد" : "Everything You Need in One Place",
    featuresTitle: locale === "ar" ? "أدوات مصممة لعقلك " : "Tools Designed for Your ",
    featuresTitleHL: locale === "ar" ? "المبدع" : "Creative Mind",
    howTag: locale === "ar" ? "كيف يعمل؟" : "How It Works?",
    howTitle: locale === "ar" ? "أربع خطوات نحو " : "Four Steps Towards ",
    howTitleHL: locale === "ar" ? "نسختك الأفضل" : "Your Best Version",
    philoTag: locale === "ar" ? "فلسفتنا" : "Our Philosophy",
    philoTitle1: locale === "ar" ? "لست مشتتاً." : "You're Not Distracted.",
    philoTitle2: locale === "ar" ? "أنت فقط " : "You're Simply ",
    philoTitle2HL: locale === "ar" ? "متعدد المواهب" : "Multi-Talented",
    philoTitle3: locale === "ar" ? "وتحتاج نظاماً يستوعبك." : "and need a system that gets you.",
    philoDesc: locale === "ar" ? "بُني Zenith OS على فلسفة أن العقل المبدع لا يحتاج إلى تقييد، بل إلى تنظيم ذكي يمنحه المساحة للإبداع في كل مجالاته. نحن لا نطلب منك اختيار شغف واحد — بل نساعدك على إدارة جميع شغفك بتوازن." : "Zenith OS is built on the philosophy that a creative mind doesn't need restriction, but smart organization that gives it space to create in all its domains. We don't ask you to choose one passion — we help you manage all of them in balance.",
    freeBadge: locale === "ar" ? "مجاني بالكامل — لا بطاقة ائتمان" : "Completely Free — No Credit Card",
    finalTitle1: locale === "ar" ? "استعد نسختك" : "Reclaim Your",
    finalTitleHL: locale === "ar" ? "الأفضل" : "Best Version",
    finalTitle2: locale === "ar" ? " اليوم." : " Today.",
    finalDesc: locale === "ar" ? "كل يوم بدون نظام هو يوم ضائع من إمكانياتك الحقيقية. ابدأ الآن." : "Every day without a system is a day wasted from your true potential. Start now.",
    finalCTA: locale === "ar" ? "ابدأ الآن — مجاناً" : "Start Now — Free",
    footerTagline: locale === "ar" ? "— نظام تشغيل حياتك" : "— Your Life OS",
    discoverMore: locale === "ar" ? "اكتشف المزيد" : "Discover More",
    navFeatures: locale === "ar" ? "المميزات" : "Features",
    navHow: locale === "ar" ? "كيف يعمل" : "How It Works",
    navPhilo: locale === "ar" ? "فلسفتنا" : "Philosophy",
    navMySite: locale === "ar" ? "موقعي" : "My Site",
    navCourse: locale === "ar" ? "كورس" : "Course",
    comingSoon: locale === "ar" ? "قريباً" : "Soon",
    navLogin: locale === "ar" ? "تسجيل الدخول" : "Login",
  };

  const features = [
    {
      icon: Target,
      title: locale === "ar" ? "المخطط الذكي" : "Smart Planner",
      titleEn: "Smart Planner",
      desc: locale === "ar" ? "خطة 6 سنوات → شهر → أسبوع → يوم. تعمّق تدريجياً في أهدافك بتأثيرات بصرية مدهشة." : "6-year plan → month → week → day. Dive deep into your goals with stunning visual transitions.",
      color: "from-violet-500/20 to-purple-600/20",
      border: "border-violet-500/30",
      span: "md:col-span-2 md:row-span-2",
    },
    {
      icon: Compass,
      title: locale === "ar" ? "بوصلة الإيكيغاي" : "Ikigai Compass",
      titleEn: "Ikigai Compass",
      desc: locale === "ar" ? "اكتشف نقطة التقاطع بين شغفك، مهارتك، ما يحتاجه العالم، وما يمكنك كسبه." : "Discover the intersection of your passion, skill, what the world needs, and what you can earn.",
      color: "from-emerald-500/20 to-teal-600/20",
      border: "border-emerald-500/30",
      span: "md:col-span-1",
    },
    {
      icon: Brain,
      title: locale === "ar" ? "مدرب ذكاء اصطناعي" : "AI Coach",
      titleEn: "AI Coach",
      desc: locale === "ar" ? "يحلل يومياتك ويقدم نصائح شخصية بناءً على أنماطك." : "Analyzes your journal and gives personalized advice based on your patterns.",
      color: "from-blue-500/20 to-cyan-600/20",
      border: "border-blue-500/30",
      span: "md:col-span-1",
    },
    {
      icon: Timer,
      title: locale === "ar" ? "وضع التركيز العميق" : "Deep Focus Mode",
      titleEn: "Deep Focus Mode",
      desc: locale === "ar" ? "بومودورو عائم مع تتبع الدورات وسجل الإنجازات." : "Floating Pomodoro timer with cycle tracking and achievement logs.",
      color: "from-orange-500/20 to-amber-600/20",
      border: "border-orange-500/30",
      span: "md:col-span-1",
    },
    {
      icon: BookOpen,
      title: locale === "ar" ? "يوميات ذكية" : "Smart Journal",
      titleEn: "Smart Journal",
      desc: locale === "ar" ? "سجّل يومياتك واحصل على تحليل ذكاء اصطناعي لأنماطك المتكررة." : "Record your journal and get AI analysis of your recurring patterns.",
      color: "from-pink-500/20 to-rose-600/20",
      border: "border-pink-500/30",
      span: "md:col-span-1",
    },
    {
      icon: BarChart3,
      title: locale === "ar" ? "تتبع الطاقة والمزاج" : "Energy & Mood Tracker",
      titleEn: "Energy & Mood Tracker",
      desc: locale === "ar" ? "راقب مستوى طاقتك ومزاجك يومياً واكتشف ما يؤثر عليك." : "Monitor your energy and mood daily and discover what affects you.",
      color: "from-yellow-500/20 to-amber-600/20",
      border: "border-yellow-500/30",
      span: "md:col-span-2",
    },
  ];

  const steps = [
    { icon: Eye, title: locale === "ar" ? "اكتشف نفسك" : "Discover Yourself", desc: locale === "ar" ? "أجب على اختبار الإيكيغاي وعجلة الحياة لتعرف من أنت فعلاً." : "Take the Ikigai test and Life Wheel to truly know yourself." },
    { icon: Target, title: locale === "ar" ? "ارسم خطتك" : "Draw Your Plan", desc: locale === "ar" ? "ضع أهدافك لـ 6 سنوات، ثم فصّلها شهرياً وأسبوعياً ويومياً." : "Set your 6-year goals, then break them down monthly, weekly, and daily." },
    { icon: Zap, title: locale === "ar" ? "ركّز وأنجز" : "Focus & Achieve", desc: locale === "ar" ? "استخدم وضع التركيز العميق لتنفيذ مهامك بدون تشتت." : "Use deep focus mode to execute tasks without distraction." },
    { icon: TrendingUp, title: locale === "ar" ? "تطوّر باستمرار" : "Evolve Constantly", desc: locale === "ar" ? "راجع تحليلاتك وتقارير الذكاء الاصطناعي وعدّل مسارك." : "Review your analytics and AI reports and adjust your course." },
  ];

  const philoCards = [
    { icon: Layers, title: locale === "ar" ? "تخطيط متدرج" : "Cascading Planning", desc: locale === "ar" ? "من الرؤية الكبرى إلى المهمة اليومية" : "From the grand vision to daily tasks" },
    { icon: Shield, title: locale === "ar" ? "حماية من التشتت" : "Distraction Shield", desc: locale === "ar" ? "وضع تركيز عميق يمنع المشتتات" : "Deep focus mode blocks distractions" },
    { icon: Heart, title: locale === "ar" ? "رعاية ذاتية" : "Self Care", desc: locale === "ar" ? "تتبع الطاقة والمزاج والعادات" : "Track energy, mood, and habits" },
  ];

  return (
    <div className="min-h-screen bg-brainhance-dark text-foreground overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* NAVIGATION BAR                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-dropdown shadow-lg shadow-brainhance-purple/5" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center group-hover:glow-purple transition-all shadow-lg text-white">
              <CompassLogo className="w-6 h-6" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">Zenith OS</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-brainhance-glow transition-colors">{t.navFeatures}</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-brainhance-glow transition-colors">{t.navHow}</a>
            <a href="#philosophy" className="text-sm text-muted-foreground hover:text-brainhance-glow transition-colors">{t.navPhilo}</a>
            
            <div className="flex items-center gap-1.5 cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-sm text-muted-foreground">{t.navMySite}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brainhance-purple/20 text-brainhance-glow font-bold tracking-widest">{t.comingSoon}</span>
            </div>
            
            <div className="flex items-center gap-1.5 cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-sm text-muted-foreground">{t.navCourse}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brainhance-purple/20 text-brainhance-glow font-bold tracking-widest">{t.comingSoon}</span>
            </div>
          </div>

          {/* Right Side: Language + Login */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-semibold text-muted-foreground hover:text-brainhance-glow transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === "ar" ? "EN" : "عربي"}
            </button>

            {/* Login Button */}
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white font-semibold text-sm glow-purple transition-all"
              >
                <Rocket className="w-3.5 h-3.5" />
                {t.navLogin}
              </motion.button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-dropdown border-t border-brainhance-purple/10 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-brainhance-glow py-2">{t.navFeatures}</a>
                <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-brainhance-glow py-2">{t.navHow}</a>
                <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-brainhance-glow py-2">{t.navPhilo}</a>
                
                <div className="flex items-center justify-between py-2 opacity-60">
                  <span className="text-sm text-muted-foreground">{t.navMySite}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brainhance-purple/20 text-brainhance-glow font-bold tracking-widest">{t.comingSoon}</span>
                </div>
                <div className="flex items-center justify-between py-2 opacity-60">
                  <span className="text-sm text-muted-foreground">{t.navCourse}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-brainhance-purple/20 text-brainhance-glow font-bold tracking-widest">{t.comingSoon}</span>
                </div>

                <Link href="/auth" className="block pt-2">
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white font-semibold text-sm">
                    {t.navLogin}
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.section
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-brainhance-purple/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brainhance-violet/6 blur-[100px]" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-brainhance-glow mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.badge}
          </motion.div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6">
            <span className="text-foreground">{t.heroTitle1}</span>
            <br />
            <span className="text-foreground">{t.heroTitle2}</span>
            <br />
            <span className="gradient-text">{t.heroTitle3}</span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.heroSub}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white font-bold text-lg glow-purple-strong flex items-center gap-3 transition-all"
              >
                <Rocket className="w-5 h-5" />
                {t.ctaPrimary}
              </motion.button>
            </Link>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.03 }}
              className="px-8 py-4 rounded-2xl glass text-foreground font-semibold text-lg flex items-center gap-3 hover:bg-white/5 transition-all"
            >
              <MousePointerClick className="w-5 h-5 text-brainhance-glow" />
              {t.ctaSecondary}
            </motion.a>
          </motion.div>
        </motion.div>

        {/* 3D Floating Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative z-10 mt-16 w-full max-w-5xl mx-auto"
        >
          <TiltCard className="relative">
            <div className="relative rounded-2xl border border-brainhance-purple/20 overflow-hidden shadow-2xl shadow-brainhance-purple/10">
              {/* Mock Dashboard */}
              <div className="bg-gradient-to-br from-brainhance-dark via-brainhance-surface to-brainhance-card p-6 md:p-8">
                {/* Top bar */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <div className="flex-1" />
                  <div className="text-xs text-muted-foreground font-mono">Zenith OS v1.0</div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {/* Sidebar */}
                  <div className="col-span-1 space-y-2">
                    {["🧭 البوصلة", "🎯 المخطط", "⏱ التركيز", "📓 اليوميات", "📊 التحليل"].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + i * 0.1 }}
                        className={`text-[10px] md:text-xs p-2 rounded-lg transition-colors ${i === 1 ? "glass-strong text-brainhance-glow font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>

                  {/* Main Content Area */}
                  <div className="col-span-3 space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm md:text-base font-bold text-foreground">أهداف هذا الشهر</div>
                        <div className="text-[10px] text-muted-foreground">مايو ٢٠٢٦</div>
                      </div>
                      <div className="text-[10px] px-2 py-1 rounded-lg bg-brainhance-success/20 text-brainhance-success font-semibold">٧٣٪ مكتمل</div>
                    </div>

                    {/* Cards Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "أهداف محققة", value: "12", color: "text-brainhance-success" },
                        { label: "ساعات تركيز", value: "47h", color: "text-brainhance-glow" },
                        { label: "نقاط الطاقة", value: "89", color: "text-brainhance-warning" },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 + i * 0.15 }}
                          className="glass rounded-xl p-3 text-center"
                        >
                          <div className={`text-lg md:text-xl font-black ${stat.color}`}>{stat.value}</div>
                          <div className="text-[9px] text-muted-foreground">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2">
                      {[
                        { label: "تعلم البرمجة", progress: 85 },
                        { label: "قراءة ٤ كتب", progress: 50 },
                        { label: "تمارين رياضية", progress: 70 },
                      ].map((goal, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.8 + i * 0.1 }}
                          className="glass rounded-lg p-2"
                        >
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-foreground/80">{goal.label}</span>
                            <span className="text-brainhance-glow">{goal.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${goal.progress}%` }}
                              transition={{ delay: 2 + i * 0.2, duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Border Effect */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.1), transparent 50%, rgba(168,85,247,0.1))",
              }} />
            </div>

            {/* Floating Badge Cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 md:-right-8 glass-strong rounded-xl p-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-2 text-xs">
                <Timer className="w-4 h-4 text-brainhance-glow" />
                <span className="font-bold text-foreground">25:00</span>
                <span className="text-muted-foreground">تركيز</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 md:-left-8 glass-strong rounded-xl p-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-brainhance-success" />
                <span className="font-bold text-brainhance-success">+15 نقطة</span>
              </div>
            </motion.div>
          </TiltCard>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground/50"
          >
            <span className="text-[10px]">{t.discoverMore}</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROBLEM & SOLUTION SECTION                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FloatingCard>
            <p className="text-sm text-muted-foreground mb-6 tracking-widest uppercase">{t.isYou}</p>
          </FloatingCard>

          <FloatingCard delay={0.2}>
            <ProblemTypewriter />
          </FloatingCard>

          <FloatingCard delay={0.4}>
            <div className="mt-12 mb-4">
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-brainhance-purple to-transparent mx-auto" />
            </div>
          </FloatingCard>

          <FloatingCard delay={0.6}>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-8">
              {t.solutionLine1}
            </p>
          </FloatingCard>

          <FloatingCard delay={0.8}>
            <p className="text-2xl md:text-3xl font-bold mt-2" dir={isRTL ? "rtl" : "ltr"}>
              {t.solutionLine2Part1}<span className="gradient-text">{t.solutionLine2Highlight}</span>{t.solutionLine2Part2}
            </p>
          </FloatingCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FEATURES BENTO GRID                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FloatingCard className="text-center mb-16">
            <p className="text-sm text-brainhance-glow font-semibold tracking-widest uppercase mb-3">{t.featuresTag}</p>
            <h2 className="text-4xl md:text-5xl font-black text-foreground">
              {t.featuresTitle}<span className="gradient-text">{t.featuresTitleHL}</span>
            </h2>
          </FloatingCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {features.map((feature, i) => (
              <FloatingCard key={i} delay={i * 0.1} className={feature.span}>
                <TiltCard>
                  <div className={`h-full group relative rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-brainhance-purple/5`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ring-1 ring-white/10 group-hover:ring-brainhance-purple/30 transition-all">
                        <feature.icon className="w-6 h-6 text-brainhance-glow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{feature.titleEn}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>

                    {/* Decorative corner glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-gradient-to-bl from-brainhance-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TiltCard>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="how" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FloatingCard className="text-center mb-16">
            <p className="text-sm text-brainhance-glow font-semibold tracking-widest uppercase mb-3">{t.howTag}</p>
            <h2 className="text-4xl md:text-5xl font-black text-foreground">
              {t.howTitle}<span className="gradient-text">{t.howTitleHL}</span>
            </h2>
          </FloatingCard>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <FloatingCard key={i} delay={i * 0.15}>
                <div className="relative text-center group">
                  {/* Connector Line */}
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 -left-3 w-6 h-[2px] bg-gradient-to-r from-brainhance-purple/50 to-transparent" />
                  )}

                  {/* Step Number */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brainhance-purple/20 to-brainhance-violet/20 border border-brainhance-purple/30 flex items-center justify-center mx-auto mb-4 group-hover:glow-purple transition-all"
                  >
                    <step.icon className="w-7 h-7 text-brainhance-glow" />
                  </motion.div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-2 right-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-brainhance-purple text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STATS SECTION                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-8 md:p-12 border border-brainhance-purple/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedCounter target={12} suffix="+" label="أداة ذكية" />
              <AnimatedCounter target={6} suffix="" label="سنوات تخطيط" />
              <AnimatedCounter target={100} suffix="%" label="مجاني" />
              <AnimatedCounter target={24} suffix="/7" label="ذكاء اصطناعي" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PHILOSOPHY SECTION                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="philosophy" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FloatingCard>
            <p className="text-sm text-brainhance-glow font-semibold tracking-widest uppercase mb-6">{t.philoTag}</p>
          </FloatingCard>

          <FloatingCard delay={0.2}>
            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight mb-8">
              {t.philoTitle1}
              <br />
              {t.philoTitle2}<span className="gradient-text">{t.philoTitle2HL}</span>
              <br />
              {t.philoTitle3}
            </h2>
          </FloatingCard>

          <FloatingCard delay={0.4}>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.philoDesc}
            </p>
          </FloatingCard>

          <FloatingCard delay={0.6} className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {philoCards.map((item, i) => (
                <div key={i} className="glass rounded-2xl p-6 text-center border border-border/20 hover:border-brainhance-purple/30 transition-all">
                  <item.icon className="w-8 h-8 text-brainhance-glow mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FINAL CTA SECTION                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        {/* Ambient Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brainhance-purple/8 blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FloatingCard>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-brainhance-success mb-8"
            >
              <Star className="w-3.5 h-3.5" />
              {t.freeBadge}
            </motion.div>
          </FloatingCard>

          <FloatingCard delay={0.2}>
            <h2 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6">
              {t.finalTitle1}
              <br />
              <span className="gradient-text">{t.finalTitleHL}</span>{t.finalTitle2}
            </h2>
          </FloatingCard>

          <FloatingCard delay={0.4}>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              {t.finalDesc}
            </p>
          </FloatingCard>

          <FloatingCard delay={0.6}>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(139,92,246,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-brainhance-purple to-brainhance-violet text-white font-bold text-xl glow-purple-strong flex items-center gap-3 mx-auto transition-all"
              >
                <Rocket className="w-6 h-6" />
                {t.finalCTA}
              </motion.button>
            </Link>
          </FloatingCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-border/10 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center text-white">
              <CompassLogo className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">Zenith OS</span>
            <span className="text-xs text-muted-foreground">{t.footerTagline}</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Zenith OS. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
            <span className="hidden md:inline">•</span>
            <span>{locale === "ar" ? "صُنع بواسطة" : "Built by"} <span className="text-brainhance-glow font-semibold">Badawy - بدوي</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
