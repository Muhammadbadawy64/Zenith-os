import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite AI Growth Strategist for content creators. Your job is to analyze the user's niche, platform links, and goal to provide actionable growth advice.

Output rules — return ONLY a valid JSON object with exactly these keys. NO markdown, NO code fences, NO extra text:
{
  "trend_analysis": "2-3 sentence analysis of current trends in their niche",
  "video_ideas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"],
  "optimization_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "viral_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "competitor_analysis": "2-3 sentence analysis of competitors in their niche"
}

Be specific, actionable, and data-driven.`;

const SYSTEM_PROMPT_AR = `أنت مستشار نمو ذكي لمنشئي المحتوى. مهمتك تحليل مجال المستخدم، روابط منصاته، وأهدافه لتقديم نصائح نمو قابلة للتنفيذ.

قواعد الإخراج — يجب أن ترجع ONLY كائن JSON صالح بهذه المفاتيح بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "trend_analysis": "تحليل من 2-3 جمل عن الاتجاهات الحالية في مجالهم",
  "video_ideas": ["فكرة 1", "فكرة 2", "فكرة 3", "فكرة 4", "فكرة 5"],
  "optimization_tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3", "نصيحة 4", "نصيحة 5"],
  "viral_suggestions": ["اقتراح 1", "اقتراح 2", "اقتراح 3"],
  "competitor_analysis": "تحليل من 2-3 جمل عن المنافسين في مجالهم"
}

كن محدداً وعملياً.`;

export async function POST(request: NextRequest) {
  try {
    const { niche, platformLinks, locale } = await request.json();

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        trend_analysis: locale === "ar" ? "⚠️ مفتاح Gemini API غير مُعد." : "⚠️ Gemini API key not configured.",
        video_ideas: [],
        optimization_tips: [],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN,
    });

    const linksSection =
      platformLinks && platformLinks.length > 0
        ? platformLinks.map((p: { platform: string; url: string }) => `- ${p.platform}: ${p.url}`).join("\n")
        : locale === "ar" ? "لا توجد روابط منصات." : "No platform links provided.";

    const userPrompt =
      locale === "ar"
        ? `مجالي: ${niche || "غير محدد"}\n\nروابط منصاتي:\n${linksSection}\n\nقدم لي تحليل نمو شامل.`
        : `My niche: ${niche || "Not specified"}\n\nMy platform links:\n${linksSection}\n\nProvide a comprehensive growth analysis.`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { trend_analysis: string; video_ideas: string[]; optimization_tips: string[]; viral_suggestions: string[]; competitor_analysis: string };

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
      trend_analysis: parsed.trend_analysis || "",
      video_ideas: Array.isArray(parsed.video_ideas) ? parsed.video_ideas : [],
      optimization_tips: Array.isArray(parsed.optimization_tips) ? parsed.optimization_tips : [],
      viral_suggestions: Array.isArray(parsed.viral_suggestions) ? parsed.viral_suggestions : [],
      competitor_analysis: parsed.competitor_analysis || "",
    });
  } catch (error) {
    console.error("AI Growth API error:", error);
    return NextResponse.json(
      { trend_analysis: "⚠️ Internal server error.", video_ideas: [], optimization_tips: [], viral_suggestions: [], competitor_analysis: "" },
      { status: 500 }
    );
  }
}
