// functions/src/parse-cv.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const openaiApiKey = defineSecret("OPENAI_API_KEY");

export const parseCv = onRequest(
  { cors: true, secrets: [openaiApiKey] },
  async (req, res) => {
    try {
      const { cvText, fileName } = req.body;

      if (!cvText || typeof cvText !== "string") {
        res.status(400).json({ error: "cvText is required" });
        return;
      }

      const openai = new OpenAI({ apiKey: openaiApiKey.value() });

      const systemPrompt = `You are an expert CV/resume parser. Extract structured data from the CV text provided. Return a JSON object with these exact fields:
- name (string): full name
- title (string): current/desired job title
- skills (string[]): list of technical and professional skills
- experience (number): total years of professional experience (integer)
- location (string): city/country
- workPreference (string): one of "Remote", "Onsite", "Hybrid" - infer from CV or default to "Remote"
- availability (string): one of "Immediately", "2 weeks", "1 month", "3 months" - default "2 weeks"
- workType (string): one of "Full-time", "Contract", "Freelance" - infer or default to "Full-time"
- domain (string): primary professional domain (e.g. "FinTech", "HealthTech", "E-commerce")
- summary (string): 2-3 sentence professional summary

Return ONLY valid JSON, no markdown fences.`;

      const response = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV (file: ${fileName}):\n\n${cvText.slice(0, 15000)}` },
        ],
      });

      const content = response.output_text;
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse AI response:", content);
        res.status(500).json({ error: "Failed to parse AI response", raw: content });
        return;
      }

      res.json({ extracted: parsed });
    } catch (e: any) {
      console.error("parse-cv error:", e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
);
