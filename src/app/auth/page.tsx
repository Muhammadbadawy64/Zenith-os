"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingParticles, SubmarineLoader } from "@/components/ui/animations";
import { useAuthStore, useLanguageStore } from "@/lib/store";
import { t } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { locale } = useLanguageStore();
  const { setUser, setOnboarded } = useAuthStore();
  const isRTL = locale === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        
        setUser({ id: data.user?.id || "", email: data.user?.email || "", name: fullName });
        setOnboarded(false);
        window.location.href = "/onboarding";
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setUser({ id: data.user?.id || "", email: data.user?.email || "", name: data.user?.user_metadata?.full_name });
        // Ideally check profile to see if onboarded, but for now:
        setOnboarded(true);
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) alert(error.message);
  };

  const toggleMode = () => setMode(mode === "login" ? "signup" : "login");

  return (
    <div
      className="min-h-screen bg-gradient-animated flex items-center justify-center p-4 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <FloatingParticles />

      {/* Back to Home */}
      <Link href="/" className="absolute top-6 start-6 z-20">
        <motion.button
          className="glass px-4 py-2 rounded-full text-sm text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRTL ? "الرئيسية" : "Home"}
        </motion.button>
      </Link>

      {/* Language Switcher */}
      <motion.button
        className="absolute top-6 end-6 z-20 glass px-4 py-2 rounded-full text-sm text-foreground/70 hover:text-foreground transition-colors"
        onClick={() =>
          useLanguageStore.getState().setLocale(locale === "ar" ? "en" : "ar")
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {locale === "ar" ? "English" : "عربي"}
      </motion.button>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo & Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Brain Icon */}
          <motion.div
            className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-brainhance-purple to-brainhance-violet flex items-center justify-center glow-purple"
            animate={{
              boxShadow: [
                "0 0 20px rgba(139, 92, 246, 0.3)",
                "0 0 40px rgba(139, 92, 246, 0.6)",
                "0 0 20px rgba(139, 92, 246, 0.3)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="1.5" opacity="0.3" />
              <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="1.2" opacity="0.5" />
              <motion.path
                d="M20 6 L22 18 L34 20 L22 22 L20 34 L18 22 L6 20 L18 18 Z"
                fill="white"
                opacity="0.9"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "20px 20px" }}
              />
              <circle cx="20" cy="20" r="3" fill="white" />
            </svg>
          </motion.div>

          <h1 className="text-3xl font-bold gradient-text mb-2">
            {t(locale, "appName")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(locale, "appTagline")}
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          className="glass-strong rounded-3xl p-8 space-y-6"
          layout
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-1">
                {mode === "login"
                  ? t(locale, "welcomeBack")
                  : t(locale, "createAccount")}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {mode === "login"
                  ? t(locale, "appDescription")
                  : t(locale, "startJourney")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="fullName" className="text-sm text-foreground/80">
                      {t(locale, "fullName")}
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background/50 border-border/50 focus:border-brainhance-purple transition-colors"
                      placeholder={
                        locale === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"
                      }
                    />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground/80">
                    {t(locale, "email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-brainhance-purple transition-colors"
                    placeholder="hello@yourdomain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-foreground/80">
                    {t(locale, "password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-brainhance-purple transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-brainhance-purple hover:text-brainhance-glow transition-colors"
                  >
                    {t(locale, "forgotPassword")}
                  </button>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-brainhance-purple to-brainhance-violet hover:from-brainhance-deep hover:to-brainhance-purple text-white font-semibold py-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-brainhance-purple/30"
                >
                  {isLoading ? (
                    <SubmarineLoader />
                  ) : mode === "login" ? (
                    t(locale, "login")
                  ) : (
                    t(locale, "signup")
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-transparent text-muted-foreground">
                    {t(locale, "orContinueWith")}
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => handleOAuth('google')}
                  type="button"
                  className="flex items-center justify-center gap-2 glass rounded-xl py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </motion.button>

                <motion.button
                  onClick={() => handleOAuth('github')}
                  type="button"
                  className="flex items-center justify-center gap-2 glass rounded-xl py-3 text-sm text-foreground/70 hover:text-foreground hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Toggle Login/Signup */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? t(locale, "dontHaveAccount")
                : t(locale, "alreadyHaveAccount")}{" "}
              <button
                onClick={toggleMode}
                className="text-brainhance-purple hover:text-brainhance-glow font-semibold transition-colors"
              >
                {mode === "login" ? t(locale, "signup") : t(locale, "login")}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          className="text-center text-xs text-muted-foreground/50 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {locale === "ar"
            ? "صُمم لمتعددي الشغف • المتخصص العام"
            : "Designed for Multi-Passionate Creatives • The Generalized Specialist"}
        </motion.p>
      </motion.div>
    </div>
  );
}
