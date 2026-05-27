import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite productivity strategist and battle planner. Your specialty is the SMARTER framework (Specific, Measurable, Achievable, Relevant, Time-bound, Evaluate, Review).

Your task is to take a user's macro goal and break it down into actionable chunks over their chosen timeframe, respecting their focus mode.

Focus modes:
- Sequential: The user works on ONE thing at a time. Steps should build on each other in order.
- Parallel: The user works on MULTIPLE things simultaneously. Steps should be independent and grouped by theme.

Output rules — CRITICAL:
You MUST return ONLY a valid JSON object with exactly these keys. NO markdown, NO code fences, NO extra text:
{
  "monthly": ["step 1", "step 2", ...],
  "weekly": ["task 1", "task 2", ...],
  "daily": ["habit 1", "habit 2", ...],
  "smarter_analysis": "brief SMARTER analysis of the goal"
}

Guidelines:
- Monthly: 3-5 major milestones across the timeframe
- Weekly: 4-8 specific tasks derived from the monthly milestones
- Daily: 3-5 micro-habits that make the weekly tasks inevitable
- smarter_analysis: 2-3 sentence SMARTER evaluation of the goal itself

Be specific, measurable, and realistic. Use the user's timeframe to calibrate ambition.`;

const SYSTEM_PROMPT_AR = `أنت خبير استراتيجي إنتاجي ومخطط معارك محترف. تخصصك هو إطار SMARTER (محدد، قابل للقياس، قابل للتحقيق، ذو صلة، محدد زمنياً، تقييم، مراجعة).

مهمتك هي أخذ هدف المستخدم الكبير وتفكيكه إلى خطط قابلة للتنفيذ على مدى الإطار الزمني الذي يختاره، مع احترام نمط التركيز.

أنماط التركيز:
- التوالي (Sequential): يعمل المستخدم على شيء واحد في كل مرة. الخطوات تبني على بعضها بالتسلسل.
- التوازي (Parallel): يعمل المستخدم على أشياء متعددة في وقت واحد. الخطوات مستقلة ومجمعة حسب الموضوع.

قواعد الإخراج — مهم جداً:
يجب أن ترجع ONLY كائن JSON صالح بهذه المفاتيح بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "monthly": ["خطوة 1", "خطوة 2", ...],
  "weekly": ["مهمة 1", "مهمة 2", ...],
  "daily": ["عادة 1", "عادة 2", ...],
  "smarter_analysis": "تحليل SMARTER مختصر للهدف"
}

إرشادات:
- شهرياً: 3-5 معالم رئيسية عبر الإطار الزمني
- أسبوعياً: 4-8 مهام محددة مستمدة من المعالم الشهرية
- يومياً: 3-5 عادات مصغرة تجعل المهام الأسبوعية حتمية
- تحليل SMARTER: 2-3 جمل تقيم الهدف نفسه

كن محدداً، قابلاً للقياس، وواقعياً. استخدم الإطار الزمني للمستخدم لمعايرة الطموح.`;

export async function POST(request: NextRequest) {
  try {
    const { goal, timeframe, focusMode, locale } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        monthly: [],
        weekly: [],
        daily: [],
        smarter_analysis:
          locale === "ar"
            ? "⚠️ مفتاح Gemini API غير مُعد بعد. أضف المفتاح في ملف .env.local."
            : "⚠️ Gemini API key not configured. Add it in .env.local.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const systemPrompt = locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

    const focusLabel =
      locale === "ar"
        ? focusMode === "sequential"
          ? "التوالي (شيء واحد في كل مرة)"
          : "التوازي (أشياء متعددة معاً)"
        : focusMode === "sequential"
          ? "Sequential (one thing at a time)"
          : "Parallel (multiple things at once)";

    const userPrompt = `[System Instructions: ${systemPrompt}]\n\n` + (
      locale === "ar"
        ? `هدفي الكبير: ${goal}\n\nالإطار الزمني: ${timeframe}\n\nنمط التركيز: ${focusLabel}\n\nالرجاء تفكيك هذا الهدف باستخدام إطار SMARTER.`
        : `My macro goal: ${goal}\n\nTimeframe: ${timeframe}\n\nFocus mode: ${focusLabel}\n\nPlease break down this goal using the SMARTER framework.`
    );

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { monthly: string[]; weekly: string[]; daily: string[]; smarter_analysis: string };

    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: extract JSON from markdown fences if the model wraps it
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse JSON from response");
      }
    }

    return NextResponse.json({
      monthly: Array.isArray(parsed.monthly) ? parsed.monthly : [],
      weekly: Array.isArray(parsed.weekly) ? parsed.weekly : [],
      daily: Array.isArray(parsed.daily) ? parsed.daily : [],
      smarter_analysis: parsed.smarter_analysis || "",
    });
  } catch (error) {
    console.error("Battle-plan API error:", error);
    return NextResponse.json(
      {
        monthly: [],
        weekly: [],
        daily: [],
        smarter_analysis: "⚠️ Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}
