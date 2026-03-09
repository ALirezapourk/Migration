// functions/src/match-companies.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const matchCompanies = onRequest(
  { cors: true, secrets: [geminiApiKey] },
  async (req, res) => {
    try {
      const { companies, candidate, direction } = req.body;

      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let systemPrompt: string;
      let userPrompt: string;

      if (direction === "companies-for-candidate") {
        const candidateSummary = `Name: ${candidate.name} | Title: ${candidate.title} | Skills: ${candidate.skills.join(", ")} | ${candidate.experience}yr exp | ${candidate.location} | ${candidate.workPreference} | ${candidate.workType} | Domain: ${candidate.domain} | ${candidate.summary}`;

        const companySummaries = companies
          .map(
            (c: any) =>
              `ID: ${c.id} | ${c.name} | ${c.industry} | Required: ${c.requiredSkills.join(", ")} | ${c.minExperience}yr+ exp | ${c.location} | ${c.workPreference} | ${c.workType} | ${c.domain} | ${c.description}`
          )
          .join("\n");

        systemPrompt = `You are a career matching AI. Analyze companies against a candidate's profile and return a JSON array.

For each company, provide:
- id: the company's ID
- score: 0-100 compatibility score
- summary: 2-3 sentence explanation of why they match or don't

Return ONLY valid JSON array, no markdown, no explanation outside the array.`;

        userPrompt = `CANDIDATE PROFILE:\n${candidateSummary}\n\nCOMPANIES:\n${companySummaries}\n\nReturn a JSON array sorted by score descending with objects: { "id": string, "score": number, "summary": string }`;
      } else {
        // candidates-for-company
        const companySummary = `Company: ${companies[0].name} | Industry: ${companies[0].industry} | Required Skills: ${companies[0].requiredSkills.join(", ")} | Min ${companies[0].minExperience}yr exp | ${companies[0].location} | ${companies[0].workPreference} | ${companies[0].workType} | ${companies[0].domain} | ${companies[0].description} | Notes: ${companies[0].notes}`;

        const candidateSummaries = candidate
          .map(
            (c: any) =>
              `ID: ${c.id} | ${c.name} | ${c.title} | Skills: ${c.skills.join(", ")} | ${c.experience}yr exp | ${c.location} | ${c.workPreference} | ${c.workType} | ${c.domain} | ${c.summary}`
          )
          .join("\n");

        systemPrompt = `You are a recruitment matching AI. Analyze candidates against a company's requirements and return a JSON array.

For each candidate, provide:
- id: the candidate's ID
- score: 0-100 compatibility score
- summary: 2-3 sentence explanation of why they match or don't

Return ONLY valid JSON array, no markdown, no explanation outside the array.`;

        userPrompt = `COMPANY REQUIREMENTS:\n${companySummary}\n\nCANDIDATES:\n${candidateSummaries}\n\nReturn a JSON array sorted by score descending with objects: { "id": string, "score": number, "summary": string }`;
      }

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
      console.error("match-companies error:", e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
);
