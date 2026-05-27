import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT_AR = `أنت خبير تحليل أنماط حياة لمستخدمي Zenith OS.

دورك هو تحليل بيانات المستخدم التاريخية واستخراج رؤى عميقة حول:

1. **اتجاهات الإنتاجية** - هل تتحسن إنتاجية المستخدم أم تنخفض؟ ما أيام الأسبوع الأكثر إنتاجية؟

2. **أنماط الطاقة** - ارتباط مستوى الطاقة بجلسات التركيز والمزاج العام

3. **تقدم الأهداف** - معدل إنجاز الأهداف وهل هناك أهداف متعثرة

4. **التأملات الصوتية** - المواضيع المتكررة في المذكرات الصوتية (القلق، الطموح، الامتنان...)

5. **توصيات ذكية** - 3 توصيات محددة مبنية على البيانات (مثل: "لاحظت أن إنتاجيتك ترتفع أيام الثلاثاء، خصص هذا اليوم للمهام العميقة")

6. **سؤال تأملي** - سؤال واحد عميق يساعد المستخدم على التفكير في مسيرته

كن دقيقاً ومحدداً. استخدم الأرقام والنسب المئوية حيثما أمكن. أظهر حماساً ذكياً.`;

const SYSTEM_PROMPT_EN = `You are a life pattern analysis expert for Zenith OS users.

Your role is to analyze the user's historical data and extract deep insights about:

1. **Productivity Trends** - Is the user's productivity improving or declining? Which days are most productive?

2. **Energy Patterns** - Correlation between energy levels, focus sessions, and overall mood

3. **Goal Progress** - Goal completion rate and any stuck goals

4. **Voice Reflections** - Recurring themes in voice journals (anxiety, ambition, gratitude...)

5. **Smart Recommendations** - 3 specific recommendations based on data (e.g., "I noticed your productivity peaks on Tuesdays, reserve this day for deep work")

6. **Reflection Question** - One deep question to help the user reflect on their journey

Be precise and specific. Use numbers and percentages where possible. Show intelligent enthusiasm.`;

export async function POST(request: NextRequest) {
  try {
    const { locale, focusSessions, voiceJournals, goals, dailyEnergy } = await request.json();

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
      return NextResponse.json({
        insights: locale === "ar"
          ? "⚠️ مفتاح Gemini API غير مُعد بعد."
          : "⚠️ Gemini API key not configured.",
      });
    }

    const systemPrompt = locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;
    const sections: string[] = [];

    if (focusSessions && focusSessions.length > 0) {
      const total = focusSessions.length;
      const totalMin = focusSessions.reduce((acc: number, s: any) => {
        if (s.start_time && s.end_time) {
          return acc + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
        }
        return acc;
      }, 0);
      const avgMin = Math.round(totalMin / total);
      const distracted = focusSessions.filter((s: any) => s.is_distracted).length;
      sections.push(
        locale === "ar" ? "**جلسات التركيز:**" : "**Focus Sessions:**",
        locale === "ar"
          ? `- ${total} جلسة، متوسط ${avgMin} دقيقة/جلسة`
          : `- ${total} sessions, avg ${avgMin} min/session`,
        locale === "ar"
          ? `- ${distracted} جلسة (${Math.round(distracted/total*100)}%) بها تشتت`
          : `- ${distracted} (${Math.round(distracted/total*100)}%) sessions distracted`
      );
    }

    if (voiceJournals && voiceJournals.length > 0) {
      sections.push(
        locale === "ar" ? "**المذكرات الصوتية:**" : "**Voice Journals:**",
        voiceJournals.map((v: any) => `- ${v.transcription_text || ""}${v.ai_summary ? ` [ملخص: ${v.ai_summary}]` : ""}`).join("\n")
      );
    }

    if (goals && goals.length > 0) {
      const activeGoals = goals.filter((g: any) => g.status === "active").length;
      const completedGoals = goals.filter((g: any) => g.status === "completed").length;
      const avgProgress = goals.reduce((acc: number, g: any) => acc + (g.progress_percentage || 0), 0) / goals.length;
      sections.push(
        locale === "ar" ? "**الأهداف:**" : "**Goals:**",
        locale === "ar"
          ? `- ${activeGoals} نشط، ${completedGoals} مكتمل`
          : `- ${activeGoals} active, ${completedGoals} completed`,
        locale === "ar"
          ? `- متوسط التقدم: ${Math.round(avgProgress)}%`
          : `- Avg progress: ${Math.round(avgProgress)}%`
      );
    }

    if (dailyEnergy && dailyEnergy.length > 0) {
      const avgEnergy = dailyEnergy.reduce((acc: number, d: any) => acc + d.energy_level, 0) / dailyEnergy.length;
      sections.push(
        locale === "ar" ? "**الطاقة اليومية:**" : "**Daily Energy:**",
        locale === "ar"
          ? `- متوسط الطاقة: ${avgEnergy.toFixed(1)}/10`
          : `- Avg energy: ${avgEnergy.toFixed(1)}/10`
      );
    }

    const userPrompt = sections.join("\n\n");

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt || (locale === "ar" ? "استخرج رؤى من بياناتي" : "Extract insights from my data") }] }],
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini insights error:", errorText);
      return NextResponse.json({
        insights: locale === "ar"
          ? "⚠️ حدث خطأ أثناء استخراج الرؤى. حاول مرة أخرى."
          : "⚠️ Error extracting insights. Please try again.",
      });
    }

    const data = await response.json();
    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (locale === "ar" ? "عذراً، لم أتمكن من استخراج الرؤى." : "Sorry, I couldn't extract insights.");

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { insights: "⚠️ Internal server error" },
      { status: 500 }
    );
  }
}
