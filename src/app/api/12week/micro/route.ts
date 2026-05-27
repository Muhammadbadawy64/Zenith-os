import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite productivity strategist specialized in breaking weekly milestones into ultra-specific Daily Micro-tasks.

Your task is to take a single week's "Milestone" and break it down into 7 days of highly specific, actionable tasks.

CRITICAL RULES — Every single daily task MUST:
1. Be a LEAD Measure (an undeniable daily action), NEVER a Lag Measure (an outcome).
2. Adhere strictly to SMARTER:
   - Specific: "Read 15 pages of 'Atomic Habits' for 20 minutes" NOT "Read a book"
   - Measurable: Include numbers, time, quantity, or clear metrics
   - Actionable: Start with a verb describing a concrete action
   - Relevant: Directly tied to the weekly milestone
   - Time-bound: Achievable within that single day
3. Include clear metrics (time, pages, reps, sessions, calls, lines of code, etc.)
4. Be undeniable — the user should know EXACTLY what to do and for how long.

Output rules — CRITICAL:
You MUST return ONLY a valid JSON object with exactly this structure. NO markdown, NO code fences, NO extra text:
{
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "tasks": [
        { "text": "Read 15 pages of 'Atomic Habits' for 20 minutes", "type": "strategic" },
        { "text": "Review and respond to emails for 15 minutes", "type": "buffer" }
      ]
    }
  ]
}

Guidelines:
- days is an array of exactly 7 objects (dayNumber 1 through 7).
- dayName: MUST strictly follow the sequence provided in the prompt.
- Each day should have 2-4 tasks total.
- Distribute tasks across the week.
- task.type: "strategic" = deep work on the goal, "buffer" = admin/supporting work.
- Every task text must include quantitative metrics (time, count, pages, etc.).
- NO vague tasks like "Study" — instead "Study Chapter 3 of textbook for 45 minutes and write 5 summary bullet points".`;

const SYSTEM_PROMPT_AR = `أنت خبير استراتيجي إنتاجي متخصص في تقسيم المعالم الأسبوعية إلى مهام يومية فائقة التحديد.

مهمتك هي أخذ "المعلم الأسبوعي" لهدف أسبوع واحد وتفكيكه إلى 7 أيام من المهام اليومية شديدة التحديد والقابلة للتنفيذ.

قواعد مهمة جداً — كل مهمة يومية يجب أن:
1. تكون مقياس قيادة (إجراء يومي لا يمكن إنكاره)، أبداً ليست مقياس تأخر (نتيجة).
2. تلتزم بصرامة بـ SMARTER:
   - Specific (محددة): "اقرأ 15 صفحة من 'العادات الذرية' لمدة 20 دقيقة" ليس "اقرأ كتاباً"
   - Measurable (قابلة للقياس): تضمين أرقام، وقت، كمية، أو مقاييس واضحة
   - Actionable (قابلة للتنفيذ): تبدأ بفعل يصف إجراءً ملموساً
   - Relevant (ذات صلة): مرتبطة مباشرة بالمعلم الأسبوعي
   - Time-bound (محددة زمنياً): قابلة للتحقيق في غضون ذلك اليوم الواحد
3. تتضمن مقاييس واضحة (وقت، صفحات، تكرارات، جلسات، مكالمات، سطور برمجة، إلخ).
4. تكون لا يمكن إنكارها — يجب أن يعرف المستخدم بالضبط ماذا يفعل ولمدة كم.

قواعد الإخراج — مهم جداً:
يجب أن ترجع ONLY كائن JSON صالح بهذا الهيكل بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "days": [
    {
      "dayNumber": 1,
      "dayName": "الإثنين",
      "tasks": [
        { "text": "اقرأ 15 صفحة من 'العادات الذرية' لمدة 20 دقيقة", "type": "strategic" },
        { "text": "راجع البريد الإلكتروني ورد على الرسائل لمدة 15 دقيقة", "type": "buffer" }
      ]
    }
  ]
}

إرشادات:
- days هي مصفوفة من 7 كائنات بالضبط (رقم اليوم 1 إلى 7).
- dayName: يجب أن يتبع الترتيب المقدم في الطلب بدقة.
- كل يوم يجب أن يحتوي على 2-4 مهام إجمالاً.
- وزع المهام على الأسبوع.
- task.type: "strategic" = عمل عميق على الهدف، "buffer" = أعمال إدارية/داعمة.
- كل نص مهمة يجب أن يتضمن مقاييس كمية (وقت، عدد، صفحات، إلخ).
- لا مهام غامضة مثل "ادرس" — بدلاً من ذلك "ادرس الفصل 3 من الكتاب المدرسي لمدة 45 دقيقة واكتب 5 نقاط ملخص".`;

export async function POST(request: NextRequest) {
  try {
    const { milestone, weekNumber, locale } = await request.json();

    if (!milestone || !milestone.trim()) {
      return NextResponse.json(
        { error: locale === "ar" ? "المعلم الأسبوعي مطلوب." : "Weekly milestone is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        days: [],
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

    const today = new Date();
    const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    
    const dayNamesList = [];
    for (let i = 0; i < 7; i++) {
      const dIndex = (today.getDay() + i) % 7;
      dayNamesList.push(locale === "ar" ? daysAr[dIndex] : daysEn[dIndex]);
    }
    const daysString = dayNamesList.join("، ");

    const userPrompt = `[System Instructions: ${systemPrompt}]\n\n` + (
      locale === "ar"
        ? `المعلم الأسبوعي للأسبوع ${weekNumber}:\n"${milestone}"\n\nالرجاء تفكيك هذا المعلم إلى مهام يومية لمدة 7 أيام. ابدأ اليوم الأول (dayNumber: 1) باسم اليوم: ${dayNamesList[0]} واستمر بالترتيب التالي: ${daysString}. كل مهمة يجب أن تكون مقياس قيادة مع مقاييس كمية.`
        : `Weekly milestone for Week ${weekNumber}:\n"${milestone}"\n\nPlease break down this milestone into daily tasks for 7 days. Start day 1 (dayNumber: 1) with: ${dayNamesList[0]} and continue in this exact order: ${daysString}. Every task must be a Lead Measure with quantitative metrics.`
    );

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { days: { dayNumber: number; dayName: string; tasks: { text: string; type: "strategic" | "buffer" }[] }[] };

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse JSON: " + text);
      }
    }

    return NextResponse.json({
      days: Array.isArray(parsed.days) ? parsed.days : [],
    });
  } catch (error: any) {
    console.error("12week/micro API error:", error);
    return NextResponse.json(
      { days: [], error: "⚠️ " + (error.message || "Internal server error") },
      { status: 500 }
    );
  }
}
