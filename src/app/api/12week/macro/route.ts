import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT_EN = `You are an elite productivity strategist specialized in the "12-Week Year" methodology and the SMARTER goal-setting framework.

Your task is to take 1–3 macro goals with custom month-mapping and generate a high-level syllabus of Weekly Milestones for 12 weeks.

SMARTER framework rules — CRITICAL:
- Specific: Each milestone must target one precise outcome or action.
- Measurable: Must include a clear metric (numbers, pages, hours, sessions, etc.).
- Actionable: Must describe an action the user takes, not a wish.
- Relevant: Must tie directly to one of the user's macro goals.
- Time-bound: Must be achievable within that exact week.
- Evaluated: Each milestone should imply how success will be checked.
- Reviewed: The milestone should enable a clear yes/no review at week's end.

CRITICAL CONCEPT — Lead Measures vs Lag Measures:
- Lag Measures = the final result (revenue, weight lost, etc.). These are NOT actionable day-to-day.
- Lead Measures = the measurable daily/weekly actions that DRIVE the lag measure. These ARE actionable.
Every milestone MUST be a Lead Measure.

Custom Month Mapping:
The user provides a mapping of which months (1=Weeks 1-4, 2=Weeks 5-8, 3=Weeks 9-12) each goal is active in.
- If a goal is active in month 1, generate weeks 1-4 with milestones for that goal.
- If a goal is active in months 1 and 3, generate milestones in weeks 1-4 AND weeks 9-12 for that goal.
- A week may have milestones from multiple goals if they overlap.
- If no goals map to a particular month, that month's weeks still need milestones — continue the most relevant goal or build foundational habits.

Output rules — CRITICAL:
You MUST return ONLY a valid JSON object with exactly this structure. NO markdown, NO code fences, NO extra text:
{
  "weeks": [
    {
      "weekNumber": 1,
      "milestone": "Precise SMARTER milestone for this week with measurable criteria",
      "goalIndex": 0,
      "focusDescription": "Brief theme capturing this week's purpose"
    }
  ]
}

Guidelines:
- weeks is an array of exactly 12 objects (weekNumber 1 through 12).
- Each week MUST reference a goalIndex (0-based matching the user's goal array order).
- milestone must be a single sentence that is Specific, Measurable, Actionable, Relevant, Time-bound, Evaluated, and Reviewable.
- focusDescription is a 3-5 word theme.
- Do NOT generate week 13 — that is the rest/celebration week.
- CRITICAL: Do NOT invent or assume specific book titles, course names, or resources unless the user explicitly mentions them in their goal.
- If the goal is to "learn" a new skill, combine finding resources and starting the actual learning in the SAME first week (e.g., "Select a learning resource and complete the first module/chapter") so the user doesn't waste a whole week just researching.`;

const SYSTEM_PROMPT_AR = `أنت خبير استراتيجي إنتاجي متخصص في منهجية "السنة ذات 12 أسبوعاً" وإطار SMARTER لتحديد الأهداف.

مهمتك هي أخذ 1-3 أهداف رئيسية مع تخصيص الشهور وإنتاج منهج عالي المستوى من المعالم الأسبوعية لـ 12 أسبوعاً.

قواعد إطار SMARTER — مهم جداً:
- Specific (محدد): كل معلم يجب أن يستهدف نتيجة أو إجراء واحد دقيق.
- Measurable (قابل للقياس): يجب أن يتضمن مقياساً واضحاً (أرقام، صفحات، ساعات، جلسات، إلخ).
- Actionable (قابل للتنفيذ): يجب أن يصف إجراءً يتخذه المستخدم، وليس أمنية.
- Relevant (ذو صلة): يجب أن يرتبط مباشرة بأحد أهداف المستخدم الرئيسية.
- Time-bound (محدد زمنياً): يجب أن يكون قابلاً للتحقيق في غضون ذلك الأسبوع بالضبط.
- Evaluated (قابل للتقييم): يجب أن يتضمن المعلم كيفية التحقق من النجاح.
- Reviewed (قابل للمراجعة): يجب أن يمكن المعلم من إجابة بنعم/لا واضحة في نهاية الأسبوع.

مفهوم حاسم — مقاييس القيادة مقابل مقاييس التأخر:
- مقاييس التأخر = النتيجة النهائية (الإيرادات، الوزن المفقود، إلخ). هذه ليست قابلة للتنفيذ يومياً.
- مقاييس القيادة = الإجراءات اليومية/الأسبوعية القابلة للقياس التي تقود مقاييس التأخر. هذه قابلة للتنفيذ.
يجب أن يكون كل معلم أسبوعي مقياس قيادة.

تخصيص الشهر المخصص:
يقدم المستخدم خريطة لأي الأشهر (1=الأسابيع 1-4، 2=الأسابيع 5-8، 3=الأسابيع 9-12) يكون كل هدف نشط فيها.
- إذا كان الهدف نشطاً في الشهر 1، قم بتوليد الأسابيع 1-4 بمعالم لذلك الهدف.
- إذا كان الهدف نشطاً في الشهرين 1 و 3، قم بتوليد معالم في الأسابيع 1-4 والأسابيع 9-12 لذلك الهدف.
- قد يحتوي الأسبوع على معالم من أهداف متعددة إذا تداخلت.
- إذا لم يتم تعيين أهداف لشهر معين، فلا تزال أسابيع ذلك الشهر بحاجة إلى معالم — استمر في الهدف الأكثر صلة أو ابنِ عادات أساسية.

قواعد الإخراج — مهم جداً:
يجب أن ترجع ONLY كائن JSON صالح بهذا الهيكل بالضبط. لا MARKDOWN، لا أقواس تعليمات برمجية، لا نص إضافي:
{
  "weeks": [
    {
      "weekNumber": 1,
      "milestone": "معلم SMARTER دقيق لهذا الأسبوع مع معايير قابلة للقياس",
      "goalIndex": 0,
      "focusDescription": "موضوع مختصر يلتقط هدف هذا الأسبوع"
    }
  ]
}

إرشادات:
- weeks هي مصفوفة من 12 كائناً بالضبط (رقم الأسبوع 1 إلى 12).
- كل أسبوع يجب أن يشير إلى goalIndex (فهرس يبدأ من 0 يطابق ترتيب أهداف المستخدم).
- milestone يجب أن يكون جملة واحدة محددة وقابلة للقياس وقابلة للتنفيذ وذات صلة ومحددة زمنياً وقابلة للتقييم والمراجعة.
- focusDescription هو موضوع من 3-5 كلمات.
- لا تقم بتوليد الأسبوع 13 — إنه أسبوع الراحة والاحتفال.
- هام جداً: لا تخترع أو تفترض أسماء كتب أو دورات أو مصادر تعليمية محددة ما لم يذكرها المستخدم صراحة في هدفه.
- إذا كان الهدف هو "تعلم" مهارة جديدة، ادمج عملية البحث عن المصادر مع البدء الفعلي في التعلم في نفس الأسبوع الأول (مثل: "اختيار كورس أو كتاب وإكمال الوحدة الأولى/الفصل الأول منه") لكي لا يضيع أسبوع كامل في البحث فقط. لا تفترض معلومات متقدمة لا يعرفها المستخدم بعد.`;

export async function POST(request: NextRequest) {
  try {
    const { goals, monthMapping, locale } = await request.json();

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

    const goalsText = goals.map((g: string, i: number) => {
      const months = (monthMapping && monthMapping[String(i)]) || [1, 2, 3];
      return `Goal ${i + 1}: "${g}" — Active months: ${(months as number[]).map((m: number) => `Month ${m} (Weeks ${(m - 1) * 4 + 1}-${m * 4})`).join(", ")}`;
    }).join("\n");

    const mappingText = JSON.stringify(monthMapping || {});

    const userPrompt = `[System Instructions: ${systemPrompt}]\n\n` + (
      locale === "ar"
        ? `أهدافي:\n${goalsText}\n\nخريطة تخصيص الأشهر (JSON): ${mappingText}\n\nالرجاء توليد معالم أسبوعية SMARTER لـ 12 أسبوعاً بناءً على هذه الخريطة المخصصة.`
        : `My goals:\n${goalsText}\n\nMonth mapping (JSON): ${mappingText}\n\nPlease generate SMARTER weekly milestones for 12 weeks based on this custom mapping.`
    );

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    let parsed: { weeks: { weekNumber: number; milestone: string; goalIndex: number; focusDescription: string }[] };

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
      weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
    });
  } catch (error: any) {
    console.error("12week/macro API error:", error);
    return NextResponse.json(
      { weeks: [], error: "⚠️ " + (error.message || "Internal server error") },
      { status: 500 }
    );
  }
}
