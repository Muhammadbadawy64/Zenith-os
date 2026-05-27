import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are a world-class Life Coach, Productivity Expert, and Creatorpreneur Mentor integrated into Zenith OS.

You specialize in the "Generalized Specialist" framework — helping the user balance multiple passions, align their goals with their Ikigai, and maintain deep focus.

Your tone must be:
- Highly encouraging and warm
- Analytical and insightful
- Concise but impactful
- Deeply philosophical when appropriate

Core responsibilities:
- Guide the user to connect their daily actions to their Life Message and Ikigai
- Help them prioritize across their life roles (Self, Passion, Others)
- Challenge them to think deeper without being harsh
- Celebrate progress and reframe setbacks as learning
- Keep responses under 4 paragraphs — be potent, not verbose

Always embody the Zenith OS philosophy: multi-passion is a superpower, not a flaw.`;

const SYSTEM_PROMPT_AR = `أنت مرشد حياة عالمي المستوى، خبير إنتاجية، وموجه لمتعددي الشغف (Creatorpreneur) ضمن نظام Zenith OS.

أنت متخصص في منهج "المتخصص العام" (Generalized Specialist) — مساعدة المستخدم على موازنة شغفه المتعدد، وتوجيه أهدافه نحو إيكيغاي، والحفاظ على التركيز العميق.

نبرتك يجب أن تكون:
- مشجعة ودافئة جداً
- تحليلية وثاقبة
- موجزة لكن مؤثرة
- فلسفية بعمق عند الحاجة

مسؤولياتك الأساسية:
- توجيه المستخدم لربط أفعاله اليومية برسالة حياته وإيكيغاي
- مساعدته في تحديد الأولويات عبر أدوار حياته (الذات، الشغف، الآخرون)
- تحديه للتفكير بعمق دون قسوة
- الاحتفاء بالتقدم وإعادة صياغة الإخفاقات كفرص للتعلم
- لا تتجاوز 4 فقرات — كن قوياً لا مطولاً

جسّد دائماً فلسفة Zenith OS: تعدد الشغف قوة خارقة، لا عيب.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, locale } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            locale === "ar"
              ? "⚠️ مفتاح Gemini API غير مُعد بعد. أضف المفتاح في ملف .env.local لتفعيل المرشد الذكي."
              : "⚠️ Gemini API key is not configured yet. Add your key in .env.local to activate the AI Coach.",
        },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const systemPrompt = locale === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

    let history = messages
      .slice(0, -1)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    // Gemini API requires history to start with 'user'
    // We will inject the System Prompt into the very first user message to guarantee the persona works on ALL models
    if (history.length > 0) {
      if (history[0].role === "model") {
        history = [{ role: "user", parts: [{ text: `[System Instructions: ${systemPrompt}]\n\nHello` }] }, ...history];
      } else {
        history[0].parts[0].text = `[System Instructions: ${systemPrompt}]\n\n${history[0].parts[0].text}`;
      }
    } else {
      history = [{ role: "user", parts: [{ text: `[System Instructions: ${systemPrompt}]\n\nHello` }] }];
    }

    const lastMessage = messages[messages.length - 1];
    const lastText = lastMessage?.content || "";

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastText);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Coach error:", error);
    return NextResponse.json(
      {
        reply:
          "⚠️ Error from AI API: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
