import { candidates } from "./candidates";
import {
  ApiResponse,
  Candidate,
  Company,
  MatchResponse,
  RecruiterRequirements,
  SearchFilters,
} from "./types";

// Placeholder: point this at your .NET backend when ready
const BASE_URL = "/api";

/**
 * Search candidates with filters.
 * Currently returns mock data filtered locally.
 */
export async function searchCandidates(
  filters: SearchFilters
): Promise<ApiResponse<Candidate[]>> {
  let filtered = [...candidates];

  if (filters.skills && filters.skills.length > 0) {
    filtered = filtered.filter((c) =>
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
    filtered = filtered.filter((c) => c.experience >= filters.minExperience!);
  }

  if (filters.workPreference && filters.workPreference !== "Any") {
    filtered = filtered.filter(
      (c) => c.workPreference === filters.workPreference
    );
  }

  if (filters.workType && filters.workType !== "Any") {
    filtered = filtered.filter((c) => c.workType === filters.workType);
  }

  return { data: filtered, success: true };
}

/**
 * Run AI matching via edge function — candidates against recruiter requirements.
 */
export async function matchCandidatesAI(
  candidateList: Candidate[],
  requirements: RecruiterRequirements
): Promise<ApiResponse<MatchResponse>> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        data: { results: [] },
        success: false,
        error: "Backend not configured. Connect to Cloud to enable AI matching.",
      };
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/match-candidates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ candidates: candidateList, requirements }),
      }
    );

    if (res.status === 429) {
      return { data: { results: [] }, success: false, error: "Rate limit exceeded. Please wait a moment and try again." };
    }
    if (res.status === 402) {
      return { data: { results: [] }, success: false, error: "AI credits exhausted. Please top up your workspace credits." };
    }
    if (!res.ok) {
      const text = await res.text();
      return { data: { results: [] }, success: false, error: `AI matching failed: ${text}` };
    }

    const data = await res.json();
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
 * Match companies to a candidate (find best companies for a candidate).
 */
export async function matchCompaniesForCandidate(
  companies: Company[],
  candidate: Candidate
): Promise<ApiResponse<MatchResponse>> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { data: { results: [] }, success: false, error: "Backend not configured." };
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/match-companies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ companies, candidate, direction: "companies-for-candidate" }),
      }
    );

    if (res.status === 429) return { data: { results: [] }, success: false, error: "Rate limit exceeded." };
    if (res.status === 402) return { data: { results: [] }, success: false, error: "AI credits exhausted." };
    if (!res.ok) {
      const text = await res.text();
      return { data: { results: [] }, success: false, error: `Matching failed: ${text}` };
    }

    const data = await res.json();
    return { data: { results: data.results }, success: true };
  } catch (e) {
    return { data: { results: [] }, success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/**
 * Match candidates to a specific company (find best candidates for a company).
 */
export async function matchCandidatesForCompany(
  company: Company,
  candidateList: Candidate[]
): Promise<ApiResponse<MatchResponse>> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { data: { results: [] }, success: false, error: "Backend not configured." };
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/match-companies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ companies: [company], candidate: candidateList, direction: "candidates-for-company" }),
      }
    );

    if (res.status === 429) return { data: { results: [] }, success: false, error: "Rate limit exceeded." };
    if (res.status === 402) return { data: { results: [] }, success: false, error: "AI credits exhausted." };
    if (!res.ok) {
      const text = await res.text();
      return { data: { results: [] }, success: false, error: `Matching failed: ${text}` };
    }

    const data = await res.json();
    return { data: { results: data.results }, success: true };
  } catch (e) {
    return { data: { results: [] }, success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
