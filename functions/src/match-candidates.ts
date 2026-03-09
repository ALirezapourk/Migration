// functions/src/match-candidates.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const matchCandidates = onRequest(
  { cors: true, secrets: [geminiApiKey] },
  async (req, res) => {
    try {
      const { candidates, requirements } = req.body;

      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const candidateSummaries = candidates
        .map(
          (c: any) =>
            `ID: ${c.id} | ${c.name} | ${c.title} | Skills: ${c.skills.join(", ")} | ${c.experience}yr exp | ${c.location} | ${c.workPreference} | ${c.workType} | ${c.domain} | ${c.summary}`
        )
        .join("\n");

      const requirementsSummary = `
Required Skills: ${requirements.skills.join(", ") || "None specified"}
Min Experience: ${requirements.minExperience}+ years
Work Preference: ${requirements.workPreference}
Work Type: ${requirements.workType}
Additional Notes: ${requirements.notes || "None"}`.trim();

      const systemPrompt = `You are a recruitment matching AI. Analyze candidates against recruiter requirements and return a JSON array.

For each candidate, provide:
- id: the candidate's ID
- score: 0-100 compatibility score
- summary: 2-3 sentence explanation of why they match or don't match

Consider skill overlap, experience level, work preference alignment, work type match, domain relevance, and any additional notes from the recruiter.

Return ONLY valid JSON array, no markdown, no explanation outside the array.`;

      const userPrompt = `RECRUITER REQUIREMENTS:
${requirementsSummary}

CANDIDATES:
${candidateSummaries}

Return a JSON array sorted by score descending with objects: { "id": string, "score": number, "summary": string }`;

      const result = await model.generateContent([systemPrompt, userPrompt]);
      const content = result.response.text();

      let results;
      try {
        const cleaned = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        results = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse AI response:", content);
        results = [];
      }

      res.json({ results });
    } catch (e: any) {
      console.error("match-candidates error:", e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
);
