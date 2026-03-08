
# AI-Powered Recruitment Matching Platform
**React Frontend with .NET Backend-Ready Architecture**

## 1. Data Layer & Types (`src/lib/types.ts`)
Define TypeScript interfaces for Candidate, RecruiterRequirements, AIMatchResult, and API response types. These will mirror the C# entity classes you'll build in .NET.

## 2. Mock Candidate Data (`src/lib/candidates.ts`)
10 hardcoded Swedish candidate profiles with diverse tech roles (Frontend, Full Stack, Data Engineer, DevOps, UX/Frontend, Backend Java, ML Engineer, Mobile, Cloud Architect, QA Automation). Each with skills, experience, location, work preference, availability, work type, domain, and summary.

## 3. Local Scoring Engine (`src/lib/scoring.ts`)
Weighted fallback scoring algorithm:
- 35% skill overlap (fuzzy substring matching)
- 25% experience ratio
- 20% work preference match
- 20% work type match

Used when AI matching hasn't been run yet.

## 4. API Service Layer (`src/lib/api.ts`)
A typed API service with placeholder base URL (`/api/`) ready to point at your .NET backend. Methods for:
- `searchCandidates(filters)` — currently returns mock data, swap for real endpoint later
- `matchCandidatesAI(candidates, requirements)` — calls the AI matching endpoint
- Error handling for 429 (rate limit) and 402 (credits exhausted)

## 5. Main Dashboard Page (`src/pages/Index.tsx`)
Single-page layout with:
- **Left sidebar**: Recruiter filter panel with skill tags input, min experience slider, work preference dropdown (Remote/Onsite/Hybrid/Any), work type dropdown (Full-time/Contract/Freelance/Any), free-text "Additional Notes" field, and "Run AI Matching" button
- **Main area**: 2-column grid of candidate cards, sorted by score. Header with result count and active filter summary.

## 6. Candidate Card Component (`src/components/CandidateCard.tsx`)
Cards showing:
- Name, title, color-coded compatibility score (green ≥80, amber ≥60, red <60)
- Skills as badges, location with MapPin icon, experience + domain
- Work preference + type, availability status
- Conditional "AI Analysis" section (Sparkles icon) when AI results are available, replacing the static summary

## 7. CV Upload Component (`src/components/CVUpload.tsx`)
Drag-and-drop upload zone (UI placeholder only):
- Accepts PDF/DOC/DOCX visual indicators
- 10MB max size indicator
- Upload animation/feedback
- "Coming soon" label — designed to later POST to your .NET API

## 8. AI Matching Integration
Edge function `match-candidates` that:
- Takes candidates + recruiter requirements
- Calls Gemini via the Lovable AI Gateway
- Returns scored results with AI-generated summaries
- Handles 429/402 errors gracefully with user-friendly toasts

## 9. Reference Documentation (`src/lib/SCHEMA.md`)
Inline documentation file containing:
- SQL schema for Candidates table (with fields for future pgvector embeddings)
- Suggested C# entity class structure
- API endpoint contract (request/response shapes)
- Notes on future architecture: pgvector, embedding pipeline, 3-stage search, CV parsing
