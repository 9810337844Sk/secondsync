const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY ?? "";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
// Llama 4 Scout supports vision (image inputs)
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export type DamageResult = {
  level:        "None" | "Minor" | "Moderate" | "Severe";
  score:        number;          // 0–100 damage percentage
  summary:      string;          // 1–2 sentence human-readable summary
  details:      string[];        // bullet list of observed issues
  suggestedCondition: "Like New" | "Excellent" | "Good" | "Fair";
  priceImpact:  string;          // e.g. "-10% to -20% from market value"
  confidence:   "Low" | "Medium" | "High";
};

/**
 * Convert a File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyse a product image for physical damage using Groq Vision.
 * Returns structured damage assessment.
 */
export async function detectDamage(imageFile: File): Promise<DamageResult> {
  const base64 = await fileToBase64(imageFile);

  const prompt = `You are an expert second-hand product appraiser. Analyse this product image for physical damage, wear, and defects.

Respond ONLY with a JSON object — no markdown, no explanation. Use this exact schema:
{
  "level": "None" | "Minor" | "Moderate" | "Severe",
  "score": <integer 0–100 where 0=perfect, 100=destroyed>,
  "summary": "<1–2 sentence plain English summary>",
  "details": ["<specific issue 1>", "<specific issue 2>", ...],
  "suggestedCondition": "Like New" | "Excellent" | "Good" | "Fair",
  "priceImpact": "<e.g. 'No impact' or '-10% to -20% from market value'>",
  "confidence": "Low" | "Medium" | "High"
}

Rules:
- Be objective and precise. Focus on visible physical defects: scratches, dents, cracks, stains, fading, missing parts, rust, tears.
- "Like New" = score 0–5, "Excellent" = 6–20, "Good" = 21–45, "Fair" = 46–100
- If image is unclear or low resolution, set confidence to "Low"
- details array: max 5 items, empty array [] if no damage found`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: base64 } },
            { type: "text",      text: prompt },
          ],
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 512,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq error ${res.status}`);
  }

  const json  = await res.json();
  const text  = json.choices?.[0]?.message?.content ?? "";

  // Strip any markdown code fences if present
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(clean) as DamageResult;
  } catch {
    throw new Error("Could not parse damage analysis response.");
  }
}
