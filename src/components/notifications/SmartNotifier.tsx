"use client";

import { useEffect, useRef } from "react";
import { useOnboardingStore, useNotificationStore, useLanguageStore, useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const NOTIFICATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export default function SmartNotifier() {
  const { data } = useOnboardingStore();
  const { addNotification } = useNotificationStore();
  const { locale } = useLanguageStore();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";
  
  const lastNotifiedRef = useRef<number>(0);

  useEffect(() => {
    // 1. Onboarding Reminders
    const checkAndNotifyOnboarding = () => {
      const now = Date.now();
      if (now - lastNotifiedRef.current < NOTIFICATION_INTERVAL_MS) return;
      
      const { theWhy, ikigai } = data;
      const messages = [];

      if (theWhy.lifeMessage) {
        messages.push(
          isRTL 
            ? `تذكر رسالتك في الحياة: "${theWhy.lifeMessage}". كل خطوة اليوم تقربك منها!`
            : `Remember your life message: "${theWhy.lifeMessage}". Every step today counts!`
        );
      }

      if (theWhy.drivingForce) {
        messages.push(
          isRTL
            ? `دافعك الأكبر: "${theWhy.drivingForce}". اجعله وقودك الآن لإنجاز مهامك!`
            : `Your driving force: "${theWhy.drivingForce}". Let it fuel your work right now!`
        );
      }

      if (ikigai.worldNeeds && ikigai.worldNeeds.length > 0) {
        const need = ikigai.worldNeeds[0];
        messages.push(
          isRTL
            ? `العالم يحتاج إليك في: "${need}". لا تتوقف، استمر في العطاء والتعلم.`
            : `The world needs your: "${need}". Don't stop, keep pushing forward.`
        );
      }

      if (messages.length > 0) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        addNotification({
          title: isRTL ? "💡 تذكير استراتيجي" : "💡 Strategic Reminder",
          description: randomMessage,
          type: "info"
        });
        lastNotifiedRef.current = now;
      }
    };

    // 2. Content Reminders
    const checkContentReminders = async () => {
      if (!user?.id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split("T")[0];
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data: contentData } = await supabase
        .from("content_studio")
        .select("id, title, stage, scheduled_date")
        .eq("user_id", user.id)
        .in("scheduled_date", [todayStr, tomorrowStr])
        .neq("stage", "published");

      if (contentData && contentData.length > 0) {
        contentData.forEach((item) => {
          const isToday = item.scheduled_date === todayStr;
          const storageKey = `notified_content_${item.id}_${item.scheduled_date}`;
          
          if (!localStorage.getItem(storageKey)) {
            const stageText = isRTL 
              ? (item.stage === 'idea' ? 'هل كتبت السكريبت؟' : item.stage === 'scripting' ? 'هل قمت بالتصوير؟' : item.stage === 'filming' ? 'هل قمت بالمونتاج؟' : 'هل المحتوى جاهز؟')
              : (item.stage === 'idea' ? 'Is the script ready?' : item.stage === 'scripting' ? 'Have you filmed it?' : item.stage === 'filming' ? 'Is the editing done?' : 'Is it ready?');

            addNotification({
              title: isRTL ? (isToday ? "🎬 محتوى اليوم!" : "📅 محتوى غداً!") : (isToday ? "🎬 Today's Content!" : "📅 Tomorrow's Content!"),
              description: isRTL 
                ? `لديك فكرة محتوى بعنوان "${item.title}". ${stageText}`
                : `You have content titled "${item.title}". ${stageText}`,
              type: "alert"
            });
            localStorage.setItem(storageKey, "true");
          }
        });
      }
    };

    checkAndNotifyOnboarding();
    checkContentReminders();
    
    const interval = setInterval(() => {
      checkAndNotifyOnboarding();
      checkContentReminders();
    }, 5 * 60 * 1000); // Check every 5 mins
    
    return () => clearInterval(interval);
  }, [data, addNotification, isRTL, user?.id]);

  return null;
}
