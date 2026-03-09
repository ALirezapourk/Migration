// src/lib/api.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import {
  ApiResponse,
  Candidate,
  Company,
  MatchResponse,
  RecruiterRequirements,
  SearchFilters,
} from "./types";
import { fetchCandidates as fetchCandidatesFromDB } from "./firestore";

/**
 * Search candidates with filters (local filtering).
 */
export async function searchCandidates(
  filters: SearchFilters
): Promise<ApiResponse<Candidate[]>> {
  let candidates = await fetchCandidatesFromDB(true);

  if (filters.skills && filters.skills.length > 0) {
    candidates = candidates.filter((c) =>
      filters.skills!.some((skill) =>
        c.skills.some(
          (cs) =>
            cs.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cs.toLowerCase())
        )
      )
    );
  }

  if (filters.minExperience && filters.minExperience > 0) {
    candidates = candidates.filter((c) => c.experience >= filters.minExperience!);
  }

  if (filters.workPreference && filters.workPreference !== "Any") {
    candidates = candidates.filter((c) => c.workPreference === filters.workPreference);
  }

  if (filters.workType && filters.workType !== "Any") {
    candidates = candidates.filter((c) => c.workType === filters.workType);
  }

  return { data: candidates, success: true };
}

/**
 * Call the Cloud Function URL directly (v2 functions are HTTP endpoints).
 */
async function callFunction(name: string, body: any): Promise<any> {
  // Cloud Functions v2 URL pattern:
  // https://{region}-{project-id}.cloudfunctions.net/{function-name}
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const region = "us-central1";

  const url = `https://${region}-${projectId}.cloudfunctions.net/${name}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Function call failed: ${text}`);
  }

  return res.json();
}

/**
 * AI matching: candidates against recruiter requirements.
 */
export async function matchCandidatesAI(
  candidateList: Candidate[],
  requirements: RecruiterRequirements
): Promise<ApiResponse<MatchResponse>> {
  try {
    const data = await callFunction("matchCandidates", {
      candidates: candidateList,
      requirements,
    });
    return { data: { results: data.results }, success: true };
  } catch (e) {
    return {
      data: { results: [] },
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Match companies to a candidate.
 */
export async function matchCompaniesForCandidate(
  companies: Company[],
  candidate: Candidate
): Promise<ApiResponse<MatchResponse>> {
  try {
    const data = await callFunction("matchCompanies", {
      companies,
      candidate,
      direction: "companies-for-candidate",
    });
    return { data: { results: data.results }, success: true };
  } catch (e) {
    return {
      data: { results: [] },
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/**
 * Match candidates to a company.
 */
export async function matchCandidatesForCompany(
  company: Company,
  candidateList: Candidate[]
): Promise<ApiResponse<MatchResponse>> {
  try {
    const data = await callFunction("matchCompanies", {
      companies: [company],
      candidate: candidateList,
      direction: "candidates-for-company",
    });
    return { data: { results: data.results }, success: true };
  } catch (e) {
    return {
      data: { results: [] },
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
