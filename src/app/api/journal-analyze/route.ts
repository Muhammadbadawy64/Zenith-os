import { NextRequest, NextResponse } from "next/server";

interface JournalEntry {
  id: string;
  date: string;
  happened: string;
  felt: string;
  tomorrow: string;
  mood: number;
}

export async function POST(request: NextRequest) {
  try {
    const { entries, locale } = (await request.json()) as {
      entries: JournalEntry[];
      locale: "ar" | "en";
    };

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        {
          analysis:
            locale === "ar"
              ? "لا توجد مدخلات كافية للتحليل. أضف بعض المدخلات أولاً."
              : "Not enough entries to analyze. Add some entries first.",
        },
        { status: 200 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          analysis:
            locale === "ar"
              ? "⚠️ مفتاح Gemini API غير مُعد بعد. أضف المفتاح في ملف .env.local لتفعيل تحليل اليوميات."
              : "⚠️ Gemini API key is not configured yet. Add your key in .env.local to activate journal analysis.",
        },
        { status: 200 }
      );
    }

    // Build the journal context
    const journalContext = entries
      .map((entry, i) => {
        const lines =
          locale === "ar"
            ? [
                `--- المدخلة ${i + 1} (${entry.date}) | المزاج: ${entry.mood}/5 ---`,
                `ماذا حدث: ${entry.happened}`,
                `المشاعر: ${entry.felt}`,
                `مهام الغد: ${entry.tomorrow}`,
              ]
            : [
                `--- Entry ${i + 1} (${entry.date}) | Mood: ${entry.mood}/5 ---`,
                `What happened: ${entry.happened}`,
                `Feelings: ${entry.felt}`,
                `Tomorrow's tasks: ${entry.tomorrow}`,
              ];
        return lines.join("\n");
      })
      .join("\n\n");

    const prompt =
      locale === "ar"
        ? `أنت محلل نفسي وخبير إنتاجية ذكي ضمن تطبيق Brainhance OS. قم بتحليل مدخلات اليوميات التالية وقدم:

1. **الأنماط المتكررة**: حدد الأنماط الإيجابية والسلبية المتكررة في حياة المستخدم
2. **الأخطاء المتكررة**: حدد الأخطاء أو العادات السلبية التي تتكرر
3. **اتجاه المزاج**: حلل اتجاه المزاج العام
4. **3 نصائح عملية**: قدم 3 نصائح محددة وقابلة للتنفيذ فوراً

استخدم الإيموجي بذكاء. كن مشجعاً لكن صادقاً. اجعل التحليل عميقاً ومفيداً.

اكتب الرد بالعربية فقط.

${journalContext}`
        : `You are a smart psychology analyst and productivity expert within the Brainhance OS app. Analyze the following journal entries and provide:

1. **Recurring Patterns**: Identify both positive and negative recurring patterns in the user's life
2. **Repeated Mistakes**: Identify mistakes or negative habits that keep repeating
3. **Mood Trend**: Analyze the overall mood trajectory
4. **3 Actionable Tips**: Provide 3 specific, immediately actionable tips

Use emojis wisely. Be encouraging but honest. Make the analysis deep and valuable.

Write the response in English only.

${journalContext}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        {
          analysis:
            locale === "ar"
              ? "⚠️ حدث خطأ أثناء التحليل. حاول مرة أخرى لاحقاً."
              : "⚠️ An error occurred during analysis. Please try again later.",
        },
        { status: 500 }
      );
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json(
        {
          analysis:
            locale === "ar"
              ? "⚠️ لم يتم الحصول على رد من الذكاء الاصطناعي. حاول مرة أخرى."
              : "⚠️ No response from AI. Please try again.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ analysis: reply });
  } catch (error) {
    console.error("Journal analysis error:", error);
    return NextResponse.json(
      {
        analysis:
          "⚠️ Error: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
