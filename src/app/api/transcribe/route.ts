import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const locale = (formData.get("locale") as string) || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
      return NextResponse.json({
        transcription:
          locale === "ar"
            ? "⚠️ مفتاح Gemini API غير مُعد بعد. أضف المفتاح في ملف .env.local."
            : "⚠️ Gemini API key is not configured. Add it to .env.local.",
      });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    const prompt =
      locale === "ar"
        ? "قم بتفريغ التسجيل الصوتي التالي كتابياً بالنص الحرفي. أخرج النص فقط بدون أي إضافات أو تعليقات. إذا كان التسجيل فارغاً أو غير مفهوم، اكتب: 'لم يتم التعرف على كلام واضح.'"
        : "Transcribe the following audio recording verbatim. Output only the transcribed text with no additional commentary. If the recording is empty or unintelligible, write: 'No clear speech detected.'";

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini transcription error:", errorText);
      return NextResponse.json({
        transcription:
          locale === "ar"
            ? "⚠️ حدث خطأ أثناء التفريغ النصي. حاول مرة أخرى."
            : "⚠️ Transcription error. Please try again.",
      });
    }

    const data = await response.json();
    const transcription =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { transcription: "⚠️ Internal server error" },
      { status: 500 }
    );
  }
}
