# AI Agents Architecture
**Elvish Talents - Recruitment Matching Platform**

---

## Overview

The platform uses **three specialized AI agents** powered by **Google Gemini 3 Flash Preview** via the **Lovable AI Gateway**. Each agent is a Deno edge function that receives structured data, sends it to the Gemini model, and returns scored results with AI-generated explanations.

**Key Details:**
- **Model**: `google/gemini-3-flash-preview` (fast, cost-effective)
- **Gateway**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Auth**: Uses `LOVABLE_API_KEY` (auto-provisioned in Lovable Cloud)
- **Error Handling**: Graceful 429 (rate limit) and 402 (credit exhaustion) responses

---

## Agent 1: CV Parser (`parse-cv`)

### Purpose
Extracts structured candidate profile data from raw CV/resume text.

### Location
`supabase/functions/parse-cv/index.ts`

### Input
```json
{
  "cvText": "string (max 15,000 chars)",
  "fileName": "string (e.g., 'resume.pdf')"
}
```

### Output
```json
{
  "extracted": {
    "name": "string",
    "title": "string",
    "skills": ["string"],
    "experience": "number (years)",
    "location": "string",
    "workPreference": "Remote | Onsite | Hybrid",
    "availability": "Immediately | 2 weeks | 1 month | 3 months",
    "workType": "Full-time | Contract | Freelance",
    "domain": "string (e.g., FinTech, HealthTech)",
    "summary": "string (2-3 sentences)"
  }
}
```

### System Prompt Logic
```
Role: Expert CV/resume parser
Task: Extract 9 structured fields from CV text
Constraints:
  - Must return ONLY valid JSON
  - Default values for missing fields (e.g., "Remote", "2 weeks", "Full-time")
  - Infer domain from context
  - Generate a brief 2-3 sentence professional summary
```

### User Flow Sketch
```
Candidate uploads CV
         ↓
Browser reads file as text
         ↓
Client calls: supabase.functions.invoke('parse-cv', { cvText, fileName })
         ↓
Edge function sends → Gemini
         ↓
Gemini extracts structured JSON
         ↓
Edge function cleans markdown, parses JSON
         ↓
Client receives extracted data
         ↓
Candidate reviews & edits fields in form
         ↓
(Manual validation before publishing to DB)
```

---

## Agent 2: Candidate Matcher (`match-candidates`)

### Purpose
Evaluates how well candidates match recruiter requirements. **Recruiter → Candidates** matching.

### Location
`supabase/functions/match-candidates/index.ts`

### Input
```json
{
  "candidates": [
    {
      "id": "uuid",
      "name": "string",
      "title": "string",
      "skills": ["string"],
      "experience": "number",
      "location": "string",
      "workPreference": "Remote | Onsite | Hybrid",
      "workType": "Full-time | Contract | Freelance",
      "domain": "string",
      "summary": "string"
    }
  ],
  "requirements": {
    "skills": ["string"],
    "minExperience": "number",
    "workPreference": "Remote | Onsite | Hybrid | Any",
    "workType": "Full-time | Contract | Freelance | Any",
    "notes": "string (additional context)"
  }
}
```

### Output
```json
{
  "results": [
    {
      "id": "uuid",
      "score": "0-100",
      "summary": "string (2-3 sentence AI explanation)"
    }
  ]
}
```
**Sorted by score descending.**

### System Prompt Logic
```
Role: Recruitment matching AI
Task: Analyze candidates against recruiter requirements
Scoring Factors (holistic, no explicit weights given to Gemini):
  - Skill overlap (keyword matching, domain relevance)
  - Experience level (years vs. minimum)
  - Work preference alignment (Remote/Onsite/Hybrid)
  - Work type match (Full-time/Contract/Freelance)
  - Domain relevance (candidate's domain vs. implied company domain)
  - Additional recruiter notes (custom context)
Output:
  - 0-100 compatibility score
  - 2-3 sentence explanation
  - JSON array sorted by score descending
```

### Recruiter Flow Sketch
```
Recruiter on Dashboard
         ↓
Sets filters:
  - Select desired skills
  - Set min experience (slider)
  - Choose work preference (Any/Remote/Onsite/Hybrid)
  - Choose work type (Any/Full-time/Contract/Freelance)
  - Add optional notes (e.g., "Startup culture, fast-paced")
         ↓
Clicks "AI Match" button
         ↓
Client sends: matchCandidatesAI(filteredCandidates, requirements)
         ↓
Edge function builds candidate summaries:
  ID | Name | Title | Skills | Experience | Location | ... | Summary
         ↓
Edge function builds requirements summary:
  Required Skills | Min Experience | Work Preference | Notes
         ↓
Sends both → Gemini with system prompt
         ↓
Gemini ranks candidates holistically
         ↓
Edge function parses JSON, handles errors
         ↓
Client receives ranked results
         ↓
Dashboard displays sorted cards with AI scores
         ↓
Recruiter can click on each card to see "AI Analysis" explanation
```

---

## Agent 3: Bidirectional Company Matcher (`match-companies`)

### Purpose
Enables **two matching directions**:
1. **Candidate → Companies**: "Which companies are best for me?"
2. **Company → Candidates**: "Who are the best candidates for this role?"

### Location
`supabase/functions/match-companies/index.ts`

### Input (Direction: `companies-for-candidate`)
```json
{
  "companies": [
    {
      "id": "uuid",
      "name": "string",
      "industry": "string",
      "description": "string",
      "location": "string",
      "requiredSkills": ["string"],
      "minExperience": "number",
      "workPreference": "Remote | Onsite | Hybrid",
      "workType": "Full-time | Contract | Freelance",
      "domain": "string"
    }
  ],
  "candidate": {
    "id": "uuid",
    "name": "string",
    "title": "string",
    "skills": ["string"],
    "experience": "number",
    "location": "string",
    "workPreference": "Remote | Onsite | Hybrid",
    "workType": "Full-time | Contract | Freelance",
    "domain": "string",
    "summary": "string"
  },
  "direction": "companies-for-candidate"
}
```

### Input (Direction: `candidates-for-company`)
```json
{
  "companies": [{ /* single company */ }],
  "candidate": [ /* array of candidates */ ],
  "direction": "candidates-for-company"
}
```

### Output
```json
{
  "results": [
    {
      "id": "uuid",
      "score": "0-100",
      "summary": "string (2-3 sentence AI explanation)"
    }
  ]
}
```

### System Prompt Logic (Candidate → Companies)
```
Role: Career matching AI
Task: Analyze companies against a candidate's profile
Factors:
  - Skill requirements alignment
  - Experience level match
  - Work preference compatibility
  - Work type fit
  - Domain relevance
  - Location & company culture fit
Output:
  - 0-100 fit score for each company
  - Concise explanation
```

### System Prompt Logic (Company → Candidates)
```
Role: Recruitment matching AI
Task: Analyze candidates against company requirements
Factors:
  - Skill overlap with company needs
  - Experience level (meets or exceeds minimum)
  - Work preference & type match
  - Domain expertise
  - Location compatibility
  - Fit with company culture notes
Output:
  - 0-100 compatibility for each candidate
  - Concise explanation
```

### Bidirectional Flow Sketch

#### **Path A: Candidate Finding Companies**
```
Candidate on Dashboard → "Companies" tab
         ↓
Clicks "Find Best Fit" button
         ↓
Client sends: matchCompaniesForCandidate(companies, candidateProfile)
         ↓
Edge function loads all companies
         ↓
Sends candidate profile + company list → Gemini
         ↓
Gemini scores each company (0-100)
         ↓
Results returned sorted by score
         ↓
Dashboard shows company cards with match scores
         ↓
Candidate can explore "AI Analysis" for each match
```

#### **Path B: Recruiter Finding Candidates for a Specific Company**
```
Recruiter on Dashboard → "Companies" tab
         ↓
Selects a company from dropdown
         ↓
Clicks "AI Match Candidates" button
         ↓
Client sends: matchCandidatesForCompany(selectedCompany, allCandidates)
         ↓
Edge function loads all candidates
         ↓
Sends company requirements + candidate list → Gemini
         ↓
Gemini scores each candidate (0-100)
         ↓
Results returned sorted by score
         ↓
Dashboard shows candidate cards with match scores
         ↓
Recruiter can review "AI Analysis" explanations
```

---

## Fallback Scoring (Local Algorithm)

When AI matching is **not triggered**, the app uses a deterministic local scoring engine (`src/lib/scoring.ts`) based on weighted fuzzy matching:

### Scoring Formula
```
Score = 
  0.35 × SkillOverlap +
  0.25 × ExperienceRatio +
  0.20 × WorkPreferenceMatch +
  0.20 × WorkTypeMatch
```

### Skill Overlap (35%)
- Fuzzy substring matching: `"React"` ≈ `"React.js"` ✓
- Case-insensitive
- Partial match tolerance

### Experience Ratio (25%)
- `candidate.experience / requirements.minExperience`
- Capped at 100 (no penalty for over-qualification)

### Work Preference Match (20%)
- Exact match → 100
- No match → 0
- "Any" in filters → automatic 100

### Work Type Match (20%)
- Same as Work Preference logic

---

## Error Handling

All three functions implement consistent error handling:

### Status Codes
| Status | Meaning | User Message |
|--------|---------|---|
| **429** | Rate limited | "Please wait a moment and try again" |
| **402** | No AI credits | "Add credits to your workspace" |
| **500** | Parsing/gateway error | "AI matching failed" |
| **400** | Invalid input | "Invalid request" |

### JSON Parsing Safety
```typescript
// Clean markdown fences (```json)
const cleaned = content
  .replace(/```json\n?/g, "")
  .replace(/```\n?/g, "")
  .trim();

// Try parse; fallback to empty array
let results;
try {
  results = JSON.parse(cleaned);
} catch {
  console.error("Failed to parse AI response:", content);
  results = [];
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  ┌───────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │  Landing Page     │  │   Auth Page    │  │  Dashboard    │  │
│  └───────────────────┘  └────────────────┘  └───────────────┘  │
│           ↓                     ↓                    ↓            │
│    ┌──────────────────────────────────────────────────────┐    │
│    │           Candidate Profile Page                     │    │
│    │  - Upload CV → parse-cv function                    │    │
│    │  - Review & Edit → Manual validation                │    │
│    │  - Publish → Insert to DB                           │    │
│    └──────────────────────────────────────────────────────┘    │
│           ↓                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ HTTPS + CORS
            ↓
┌─────────────────────────────────────────────────────────────────┐
│         EDGE FUNCTIONS (Deno / Lovable Cloud)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  parse-cv    │  │   match-     │  │  match-companies     │  │
│  │              │  │   candidates │  │  (bidirectional)     │  │
│  │ - Validate   │  │              │  │                      │  │
│  │ - Call AI    │  │ - Format data│  │ - Format data        │  │
│  │ - Parse JSON │  │ - Call AI    │  │ - Route by direction │  │
│  │ - Return DTO │  │ - Sort by %  │  │ - Call AI            │  │
│  │              │  │ - Return DTO │  │ - Parse JSON         │  │
│  └──────────────┘  └──────────────┘  │ - Return DTO         │  │
│           ↓                ↓          └──────────────────────┘  │
└───────────┼────────────────┼─────────────────────────────────────┘
            │                │        HTTPS (Authorization header)
            ↓                ↓
        ┌────────────────────────────────────────┐
        │  Lovable AI Gateway                    │
        │  https://ai.gateway.lovable.dev/...    │
        │  - Receives messages (system + user)   │
        │  - Forwards to Google Gemini           │
        │  - Returns completion                  │
        └────────────────────────────────────────┘
                      ↓
        ┌────────────────────────────────────────┐
        │  Google Gemini 3 Flash Preview         │
        │  - Performs analysis                   │
        │  - Generates scores (0-100)            │
        │  - Produces explanations               │
        │  - Returns JSON                        │
        └────────────────────────────────────────┘
            ↑
            │ (LLM Response)
```

---

## Token Flow & Pricing

### Lovable AI Credits System
- **Free tier**: Limited monthly requests
- **Paid tier**: Purchase credits via workspace settings
- **Rate limiting**: 429 if you exceed limits per minute
- **Credit exhaustion**: 402 if you run out of funds

### Cost Estimate (per match operation)
- **CV Parse**: ~500 tokens (varies by CV length)
- **Candidate Match** (10 candidates): ~2,500 tokens
- **Company Match** (5 companies): ~1,500 tokens
- **Total**: ~4,500 tokens per full workflow

---

## Summary

| Agent | Purpose | Input | Output | Model |
|-------|---------|-------|--------|-------|
| **parse-cv** | Extract CV data | CV text + filename | Structured profile | Gemini 3 Flash |
| **match-candidates** | Rank candidates vs. recruiter requirements | Candidates + requirements | Sorted scores + explanations | Gemini 3 Flash |
| **match-companies** | Bidirectional matching | Companies + candidate OR candidate + companies | Sorted scores + explanations | Gemini 3 Flash |

All agents:
- Use **Lovable AI Gateway** for security & cost control
- Return **0-100 scores** with AI-generated summaries
- Handle **429/402 errors** gracefully
- Provide **fallback** local scoring if AI is unavailable
- Validate input and sanitize JSON output
