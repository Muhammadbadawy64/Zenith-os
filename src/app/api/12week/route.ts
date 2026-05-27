import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite productivity strategist specialized in the "12-Week Year" methodology created by Brian P. Moran and Michael Lennington.

Your task is to take 1–3 macro goals from the user and break them into a strict 12-week execution plan.

CRITICAL CONCEPT — Lead Measures vs Lag Measures:
- Lag Measures = the final result (revenue, weight lost, etc.). These are NOT actionable day-to-day.
- Lead Measures = the measurable daily/weekly actions that DRIVE the lag measure. These ARE actionable.
You MUST focus on Lead Measures only.

Strategy modes:
- Series: Goals depend on each other or require intense focus one at a time. Month 1 = Goal A, Month 2 = Goal B, Month 3 = Goal C. The user focuses on ONE goal per month.
- Parallel: Goals run concurrently across all 12 weeks. Every week has tasks for ALL goals.

Output rules — CRITICAL:
You MUST return ONLY a valid JSON object with exactly this structure. NO markdown, NO code fences, NO extra text:
{
  "weeks": [
    {
      "weekNumber": 1,
      "tasks": [
        { "goalIndex": 0, "text": "Specific actionable task for this week", "type": "strategic" | "buffer" }
      ],
      "focusDescription": "Brief 1-sentence description of this week's theme"
    }
  ]
}

Guidelines for each week:
- Week 1-12: Execution weeks. Each week should have 3-7 tasks total.
  - Week 13 is NOT in this array — it's the rest/celebration week.
- Each task must be a LEAD measure (daily/weekly action, NOT an outcome).
- task.type: "strategic" = deep work on the goal, "buffer" = admin/supporting work.
- goalIndex: 0-based index matching the goal's position in the user's input array.
- For series mode: weeks 1-4 focus on goal 0, weeks 5-8 on goal 1, weeks 9-12 on goal 2 (or distribute evenly if fewer goals).
- For parallel mode: every week has tasks for all goals.
- Keep tasks specific, measurable, and executable within one week.
- focusDescription should capture the weekly theme clearly.`;

const SYSTEM_PROMPT_AR = `أنت خبير استراتيجي إنتاجي متخصص في منهجية "السنة ذات 12 أسبوعاً" التي ابتكرها برايان بي موران ومايكل لينينغتون.

مهمتك هي أخذ 1-3 أهداف رئيسية من المستخدم وتقسيمها إلى خطة تنفيذ صارمة مدتها 12 أسبوعاً.

مفهوم حاسم — مقاييس القيادة مقابل مقاييس التأخر:
- مقاييس التأخر = النتيجة النهائية (الإيرادات، الوزن المفقود، إلخ). هذه ليست قابلة للتنفيذ يومياً.
- مقاييس القيادة = الإجراءات اليومية/الأسبوعية القابلة للقياس التي تقود مقاييس التأخر. هذه قابلة للتنفيذ.
يجب أن تركز ONLY على مقاييس القيادة.

أنماط الاستراتيجية:
- التسلسل (Series): الأهداف تعتمد على بعضها أو تتطلب تركيزاً مكثفاً على هدف واحد في كل مرة. الشهر 1 = الهدف أ، الشهر 2 = الهدف ب، الشهر 3 = الهدف ج.
- التوازي (Parallel): الأهداف تعمل بالتزامن عبر جميع الأسابيع الـ 12. كل أسبوع يحتوي على مهام لجميع الأهداف.

قواعد الإخراج — مهم جداً:
يجب أن ترجع ONLY كائن JSON صالح بهذا الهيكل بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "weeks": [
    {
      "weekNumber": 1,
      "tasks": [
        { "goalIndex": 0, "text": "مهمة محددة قابلة للتنفيذ لهذا الأسبوع", "type": "strategic" | "buffer" }
      ],
      "focusDescription": "وصف جملة واحدة لموضوع هذا الأسبوع"
    }
  ]
}

إرشادات لكل أسبوع:
- الأسبوع 1-12: أسابيع التنفيذ. يجب أن يحتوي كل أسبوع على 3-7 مهام إجمالاً.
  - الأسبوع 13 ليس في هذه المصفوفة — إنه أسبوع الراحة والاحتفال.
- كل مهمة يجب أن تكون مقياس قيادة (إجراء يومي/أسبوعي، وليس نتيجة).
- task.type: "strategic" = عمل عميق على الهدف، "buffer" = أعمال إدارية/داعمة.
- goalIndex: فهرس يبدأ من 0 يطابق ترتيب الهدف في مصفوفة أهداف المستخدم.
- لوضع التسلسل: الأسابيع 1-4 تركز على الهدف 0، الأسابيع 5-8 على الهدف 1، الأسابيع 9-12 على الهدف 2 (أو وزع بالتساوي إذا كانت الأهداف أقل).
- لوضع التوازي: كل أسبوع يحتوي على مهام لجميع الأهداف.
- اجعل المهام محددة وقابلة للقياس وقابلة للتنفيذ في غضون أسبوع واحد.`;

export async function POST(request: NextRequest) {
  try {
    const { goals, strategy, locale } = await request.json();

    if (!goals || !Array.isArray(goals) || goals.length === 0 || goals.length > 3) {
      return NextResponse.json(
        { error: locale === "ar" ? "يرجى إدخال 1 إلى 3 أهداف." : "Please enter 1 to 3 goals." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        weeks: [],
        error: locale === "ar"
          ? "⚠️ مفتاح Gemini API غير مُعد بعد. أضف المفتاح في ملف .env.local."
          : "⚠️ Gemini API key not configured. Add it in .env.local.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const systemPrompt = locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;
    const strategyLabel = locale === "ar"
      ? strategy === "series" ? "التسلسل (هدف واحد كل شهر)" : "التوازي (جميع الأهداف معاً)"
      : strategy === "series" ? "Series (one goal per month)" : "Parallel (all goals together)";

    const goalsText = goals.map((g: string, i: number) => `Goal ${i + 1}: ${g}`).join("\n");

    const userPrompt = `[System Instructions: ${systemPrompt}]\n\n` + (
      locale === "ar"
        ? `أهدافي:\n${goalsText}\n\nالاستراتيجية: ${strategyLabel}\n\nالرجاء تفكيك هذه الأهداف إلى خطة 12 أسبوعاً مع التركيز على مقاييس القيادة.`
        : `My goals:\n${goalsText}\n\nStrategy: ${strategyLabel}\n\nPlease break down these goals into a 12-week execution plan focusing on Lead Measures.`
    );

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { weeks: { weekNumber: number; tasks: { goalIndex: number; text: string; type: "strategic" | "buffer" }[]; focusDescription: string }[] };

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
      weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
    });
  } catch (error) {
    console.error("12week API error:", error);
    return NextResponse.json(
      { weeks: [], error: "⚠️ Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
