import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are a deep reflection coach specialized in the 5 Whys technique. Your job is to analyze a user's goal and their chain of 5 "Why?" answers to reveal their core internal belief.

Given the goal and the 5 whys chain, identify:
1. The pattern or theme running through their answers
2. Their core internal belief (the deep truth beneath the surface desire)

Output rules — return ONLY a valid JSON object with exactly these keys. NO markdown, NO code fences, NO extra text:
{
  "internal_belief": "1-2 sentence statement of their core internal belief",
  "analysis": "2-3 sentence analysis of the pattern in their answers",
  "insight": "1 powerful sentence that reconnects the internal belief to the original goal"
}

Be empathetic, profound, and encouraging.`;

const SYSTEM_PROMPT_AR = `أنت مدرب تأمل عميق متخصص في تقنية "الأسئلة الخمسة". مهمتك تحليل هدف المستخدم وسلسلة إجاباته عن 5 أسئلة "لماذا؟" للكشف عن معتقده الداخلي الأساسي.

بالنظر إلى الهدف وسلسلة الـ 5 لماذا، حدد:
1. النمط أو الموضوع المتكرر في إجاباتهم
2. معتقدهم الداخلي الأساسي (الحقيقة العميقة تحت الرغبة السطحية)

قواعد الإخراج — يجب أن ترجع ONLY كائن JSON صالح بهذه المفاتيح بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "internal_belief": "جملة-2 من معتقدهم الداخلي الأساسي",
  "analysis": "تحليل من 2-3 جمل عن النمط في إجاباتهم",
  "insight": "جملة مؤثرة تعيد ربط المعتقد الداخلي بالهدف الأصلي"
}

كن متعاطفاً، عميقاً، ومشجعاً.`;

export async function POST(request: NextRequest) {
  try {
    const { goal, answers, locale } = await request.json();

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        internal_belief: locale === "ar" ? "⚠️ مفتاح Gemini API غير مُعد في ملف .env.local" : "⚠️ Gemini API key not configured in .env.local",
        analysis: "",
        insight: "",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN,
    });

    const chainSection = Array.isArray(answers)
      ? answers.map((a: { step: number; answer: string }, i: number) => `Why #${i + 1}: ${a.answer}`).join("\n")
      : "";

    const userPrompt =
      locale === "ar"
        ? `الهدف الأصلي: ${goal}\n\nسلسلة الأسئلة الخمسة:\n${chainSection}\n\nحلل هذا المسار واكشف المعتقد الداخلي الأساسي.`
        : `Original goal: ${goal}\n\n5 Whys chain:\n${chainSection}\n\nAnalyze this path and reveal the core internal belief.`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { internal_belief: string; analysis: string; insight: string };

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse JSON from response");
      }
    }

    return NextResponse.json({
      internal_belief: parsed.internal_belief || "",
      analysis: parsed.analysis || "",
      insight: parsed.insight || "",
    });
  } catch (error) {
    console.error("5 Whys API error:", error);
    return NextResponse.json(
      { internal_belief: "", analysis: "⚠️ Internal server error.", insight: "" },
      { status: 500 }
    );
  }
}
