import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are a structured problem-solving coach using the IDEA framework (Identity, Develop, Execute, Assessment). Your job is to analyze a user's problem and their proposed solutions, then provide actionable suggestions.

Given the problem, identity description, proposed solutions, and execution steps:
1. Suggest 1-2 additional solutions they may have missed
2. Identify blind spots or risks in their plan
3. Provide encouragement and next-step clarity

Output rules — return ONLY a valid JSON object with exactly these keys. NO markdown, NO code fences, NO extra text:
{
  "extra_solutions": ["Solution 1", "Solution 2"],
  "blind_spots": ["Blind spot 1", "Blind spot 2"],
  "encouragement": "1-2 sentence encouragement",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}

Be specific, actionable, and supportive.`;

const SYSTEM_PROMPT_AR = `أنت مدرب حل مشكلات منظم باستخدام إطار IDEA (تحديد، تطوير، تنفيذ، تقييم). مهمتك تحليل مشكلة المستخدم وحلوله المقترحة، ثم تقديم اقتراحات قابلة للتنفيذ.

بالنظر إلى المشكلة، وصف الهوية، الحلول المقترحة، وخطوات التنفيذ:
1. اقترح 1-2 حل إضافي قد يكون فاته
2. حدد النقاط العمياء أو المخاطر في خطته
3. قدم تشجيعاً ووضوحاً للخطوة التالية

قواعد الإخراج — يجب أن ترجع ONLY كائن JSON صالح بهذه المفاتيح بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "extra_solutions": ["حل 1", "حل 2"],
  "blind_spots": ["نقطة عمياء 1", "نقطة عمياء 2"],
  "encouragement": "جملة-2 تشجيع",
  "next_steps": ["خطوة 1", "خطوة 2", "خطوة 3"]
}

كن محدداً، عملياً، وداعماً.`;

export async function POST(request: NextRequest) {
  try {
    const { problem, identity, solutions, steps, locale } = await request.json();

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        extra_solutions: [],
        blind_spots: [],
        encouragement: locale === "ar" ? "⚠️ مفتاح Gemini API غير مُعد." : "⚠️ Gemini API key not configured.",
        next_steps: [],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN,
    });

    const solutionsSection = Array.isArray(solutions)
      ? solutions.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
      : locale === "ar" ? "لا توجد حلول مقترحة." : "No solutions proposed.";

    const stepsSection = Array.isArray(steps)
      ? steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
      : locale === "ar" ? "لا توجد خطوات تنفيذ." : "No execution steps.";

    const userPrompt =
      locale === "ar"
        ? `المشكلة: ${problem}\n\nوصف الهوية: ${identity || "غير محدد"}\n\nالحلول المقترحة:\n${solutionsSection}\n\nخطوات التنفيذ:\n${stepsSection}\n\nقدم تحليلاً لإطار IDEA.`
        : `Problem: ${problem}\n\nIdentity description: ${identity || "Not specified"}\n\nProposed solutions:\n${solutionsSection}\n\nExecution steps:\n${stepsSection}\n\nProvide IDEA framework analysis.`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { extra_solutions: string[]; blind_spots: string[]; encouragement: string; next_steps: string[] };

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
      extra_solutions: Array.isArray(parsed.extra_solutions) ? parsed.extra_solutions : [],
      blind_spots: Array.isArray(parsed.blind_spots) ? parsed.blind_spots : [],
      encouragement: parsed.encouragement || "",
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    });
  } catch (error) {
    console.error("IDEA API error:", error);
    return NextResponse.json(
      { extra_solutions: [], blind_spots: [], encouragement: "⚠️ Internal server error.", next_steps: [] },
      { status: 500 }
    );
  }
}
