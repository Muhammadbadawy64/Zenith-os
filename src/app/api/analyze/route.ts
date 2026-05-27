import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT_AR = `أنت محلل حياة متخصص في تحليل شامل لمستخدمي Zenith OS (متعددي الشغف).

دورك هو تحليل بيانات المستخدم من عدة مصادر وتقديم تحليل متكامل يشمل:

1. **ملخص الحالة الراهنة** - نظرة عامة على حياة المستخدم بناءً على:
   - أدوار الحياة وتوزيعها
   - تقدم الأهداف
   - جلسات التركيز والإنتاجية
   - تقييم عجلة الحياة
   - تقييم الإيكيغاي

2. **أنماط متكررة** - اكتشاف أنماط إيجابية وسلبية في سلوك المستخدم

3. **فجوات التوازن** - أبرز القطاعات التي تحتاج تحسيناً بناءً على عجلة الحياة

4. **توصيات مخصصة** - 3-5 توصيات عملية قابلة للتنفيذ

5. **مؤشر التوافق الكلي** - نسبة تقديرية لمدى توافق حياة المستخدم مع رسالته وإيكيغاي

كن موضوعياً ومباشراً. استخدم إيموجي بذكاء. قدم التحليل بلغة عربية فصيحة بسيطة.`;

const SYSTEM_PROMPT_EN = `You are a life analysis specialist for Zenith OS users (Multi-Passionate Creatives).

Your role is to analyze user data from multiple sources and provide a comprehensive analysis including:

1. **Current State Summary** - Overview of the user's life based on:
   - Life roles and distribution
   - Goal progress
   - Focus sessions and productivity
   - Wheel of life assessment
   - Ikigai assessment

2. **Recurring Patterns** - Discover positive and negative patterns in user behavior

3. **Balance Gaps** - Areas needing improvement based on wheel of life

4. **Personalized Recommendations** - 3-5 actionable recommendations

5. **Overall Alignment Score** - Estimated percentage of how aligned the user's life is with their mission and ikigai

Be objective and direct. Use emojis wisely.`;

export async function POST(request: NextRequest) {
  try {
    const { locale, roles, goals, focusSessions, voiceJournals, wheelOfLife, ikigai } = await request.json();

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
      return NextResponse.json({
        analysis: locale === "ar"
          ? "⚠️ مفتاح Gemini API غير مُعد بعد."
          : "⚠️ Gemini API key not configured.",
      });
    }

    const systemPrompt = locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

    const sections: string[] = [];

    if (roles && roles.length > 0) {
      sections.push(
        locale === "ar" ? "**الأدوار:**" : "**Roles:**",
        roles.map((r: any) => `- ${r.icon} ${r.role_name} (${r.category}) - ${r.weekly_hours_goal}h/أسبوع`).join("\n")
      );
    }

    if (goals && goals.length > 0) {
      sections.push(
        locale === "ar" ? "**الأهداف:**" : "**Goals:**",
        goals.map((g: any) => `- ${g.title} [${g.progress_percentage}%] - ${g.status}`).join("\n")
      );
    }

    if (focusSessions && focusSessions.length > 0) {
      const totalSessions = focusSessions.length;
      const totalTime = focusSessions.reduce((acc: number, s: any) => {
        if (s.start_time && s.end_time) {
          return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000;
        }
        return acc;
      }, 0);
      const distracted = focusSessions.filter((s: any) => s.is_distracted).length;
      sections.push(
        locale === "ar" ? "**جلسات التركيز:**" : "**Focus Sessions:**",
        locale === "ar"
          ? `- ${totalSessions} جلسة، ${Math.round(totalTime / 60)} دقيقة إجمالي، ${distracted} جلسة بها تشتت`
          : `- ${totalSessions} sessions, ${Math.round(totalTime / 60)} min total, ${distracted} with distractions`
      );
    }

    if (voiceJournals && voiceJournals.length > 0) {
      sections.push(
        locale === "ar" ? "**المذكرات الصوتية الأخيرة:**" : "**Recent Voice Journals:**",
        voiceJournals.map((v: any) => `- ${v.transcription_text || (locale === "ar" ? "بدون نص" : "No text")}`).join("\n")
      );
    }

    if (wheelOfLife) {
      const entries = Object.entries(wheelOfLife).filter(([k]) => k !== "id" && k !== "user_id" && k !== "scores_json" && k !== "assessment_date");
      sections.push(
        locale === "ar" ? "**عجلة الحياة:**" : "**Wheel of Life:**",
        entries.map(([k, v]) => `- ${k}: ${v}/10`).join("\n")
      );
    }

    if (ikigai) {
      sections.push(
        locale === "ar" ? "**الإيكيغاي:**" : "**Ikigai:**",
        locale === "ar"
          ? `- يحب: ${(ikigai.love || []).join(", ")}`
          : `- Loves: ${(ikigai.love || []).join(", ")}`,
        locale === "ar"
          ? `- يجيد: ${(ikigai.good_at || []).join(", ")}`
          : `- Good at: ${(ikigai.good_at || []).join(", ")}`,
        locale === "ar"
          ? `- العالم يحتاج: ${(ikigai.world_needs || []).join(", ")}`
          : `- World needs: ${(ikigai.world_needs || []).join(", ")}`,
        locale === "ar"
          ? `- يمكن الدفع مقابل: ${(ikigai.paid_for || []).join(", ")}`
          : `- Paid for: ${(ikigai.paid_for || []).join(", ")}`
      );
    }

    const userPrompt = sections.join("\n\n");

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt || (locale === "ar" ? "حلل حالتي الحالية" : "Analyze my current state") }] }],
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini analyze error:", errorText);
      return NextResponse.json({
        analysis: locale === "ar"
          ? "⚠️ حدث خطأ أثناء التحليل. حاول مرة أخرى."
          : "⚠️ Error during analysis. Please try again.",
      });
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (locale === "ar" ? "عذراً، لم أتمكن من إجراء التحليل." : "Sorry, I couldn't perform the analysis.");

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { analysis: "⚠️ Internal server error" },
      { status: 500 }
    );
  }
}
