import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite Energy & Productivity Analyst. Your job is to analyze 7 days of the user's energy levels (morning, afternoon, evening) and suggest their optimal deep-work windows.

Given the energy data, determine:
1. Which time-of-day consistently has the highest energy
2. Which time-of-day is best for creative vs administrative work
3. Specific recommendations for scheduling deep work

Output rules — return ONLY a valid JSON object with exactly these keys. NO markdown, NO code fences, NO extra text:
{
  "peak_time": "morning | afternoon | evening",
  "peak_analysis": "2-3 sentence analysis of their energy patterns",
  "deep_work_window": "Specific time range recommendation like 8am-12pm",
  "creative_window": "Specific time range for creative work",
  "admin_window": "Specific time range for admin tasks",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Be specific, actionable, and data-driven.`;

const SYSTEM_PROMPT_AR = `أنت محلل طاقة وإنتاجية ذكي. مهمتك تحليل 7 أيام من مستويات طاقة المستخدم (صباح، ظهر، مساء) واقتراح أفضل نوافذ العمل العميق.

بناءً على بيانات الطاقة، حدد:
1. أي وقت من اليوم لديه أعلى طاقة باستمرار
2. أي وقت من اليوم أفضل للعمل الإبداعي مقابل العمل الإداري
3. توصيات محددة لجدولة العمل العميق

قواعد الإخراج — يجب أن ترجع ONLY كائن JSON صالح بهذه المفاتيح بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "peak_time": "morning | afternoon | evening",
  "peak_analysis": "تحليل من 2-3 جمل عن أنماط طاقتهم",
  "deep_work_window": "نطاق زمني محدد مثل 8ص-12م",
  "creative_window": "نطاق زمني للعمل الإبداعي",
  "admin_window": "نطاق زمني للمهام الإدارية",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"]
}

كن محدداً وعملياً.`;

export async function POST(request: NextRequest) {
  try {
    const { energyData, locale } = await request.json();

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        peak_time: "morning",
        peak_analysis: locale === "ar" ? "⚠️ مفتاح Gemini API غير مُعد." : "⚠️ Gemini API key not configured.",
        deep_work_window: "8:00 AM - 12:00 PM",
        creative_window: "1:00 PM - 4:00 PM",
        admin_window: "4:00 PM - 6:00 PM",
        recommendations: [],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN,
    });

    const dataSection =
      Array.isArray(energyData) && energyData.length > 0
        ? energyData.map((d: { date: string; morning: number; afternoon: number; evening: number }) =>
            `- ${d.date}: Morning=${d.morning}/10, Afternoon=${d.afternoon}/10, Evening=${d.evening}/10`
          ).join("\n")
        : locale === "ar" ? "لا توجد بيانات طاقة." : "No energy data provided.";

    const userPrompt =
      locale === "ar"
        ? `بيانات الطاقة لآخر 7 أيام:\n${dataSection}\n\nحلل نمط طاقتي واقترح أفضل أوقات العمل العميق.`
        : `My energy data for the last 7 days:\n${dataSection}\n\nAnalyze my energy pattern and suggest optimal deep work windows.`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { peak_time: string; peak_analysis: string; deep_work_window: string; creative_window: string; admin_window: string; recommendations: string[] };

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
      peak_time: parsed.peak_time || "morning",
      peak_analysis: parsed.peak_analysis || "",
      deep_work_window: parsed.deep_work_window || "",
      creative_window: parsed.creative_window || "",
      admin_window: parsed.admin_window || "",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    });
  } catch (error) {
    console.error("AI Energy API error:", error);
    return NextResponse.json(
      { peak_time: "morning", peak_analysis: "⚠️ Internal server error.", deep_work_window: "", creative_window: "", admin_window: "", recommendations: [] },
      { status: 500 }
    );
  }
}
