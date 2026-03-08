// TypeScript interfaces mirroring future C# entity classes

export type WorkPreference = "Remote" | "Onsite" | "Hybrid";
export type WorkType = "Full-time" | "Contract" | "Freelance";
export type Availability = "Immediately" | "2 weeks" | "1 month" | "3 months";

export interface Candidate {
  id: string;
  name: string;
  title: string;
  skills: string[];
  experience: number; // years
  location: string;
  workPreference: WorkPreference;
  availability: Availability;
  workType: WorkType;
  domain: string;
  summary: string;
}

export interface RecruiterRequirements {
  skills: string[];
  minExperience: number;
  workPreference: WorkPreference | "Any";
  workType: WorkType | "Any";
  notes: string;
}

export interface AIMatchResult {
  id: string;
  score: number; // 0-100
  summary: string; // AI-generated 2-3 sentence explanation
}

export interface ScoredCandidate extends Candidate {
  score: number;
  aiSummary?: string;
}

// API response types matching future .NET backend contracts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface SearchFilters {
  skills?: string[];
  minExperience?: number;
  workPreference?: WorkPreference | "Any";
  workType?: WorkType | "Any";
  page?: number;
  pageSize?: number;
}

export interface MatchRequest {
  candidates: Candidate[];
  requirements: RecruiterRequirements;
}

export interface MatchResponse {
  results: AIMatchResult[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  location: string;
  size: string;
  requiredSkills: string[];
  minExperience: number;
  workPreference: WorkPreference;
  workType: WorkType;
  domain: string;
  budgetRange: string;
  openPositions: number;
  notes: string;
}

export interface ScoredCompany extends Company {
  score: number;
  aiSummary?: string;
}

export interface CompanyMatchRequest {
  companies: Company[];
  candidate: Candidate;
}

export interface CompanyMatchResponse {
  results: AIMatchResult[];
}
