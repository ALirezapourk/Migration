# Elvish Talents — AI-Powered Recruitment Matching Platform
## Project Report

---

## 1. Executive Summary

**Elvish Talents** is a full-stack, AI-powered recruitment platform built with React, TypeScript, and Lovable Cloud. The platform connects job-seeking candidates with hiring recruiters through intelligent profile matching. Its distinguishing feature is a dual AI agent system: one that **parses CVs into structured candidate profiles**, and another that **evaluates and ranks candidates against recruiter requirements** — both powered by Google Gemini via the Lovable AI Gateway.

The application is designed around two user roles — **Candidate** (employee/job seeker) and **Recruiter** (employer/hiring manager) — each with dedicated interfaces, workflows, and capabilities.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| UI Components | shadcn/ui (Radix UI primitives) |
| Backend & Database | Lovable Cloud (Supabase) — PostgreSQL with Row-Level Security |
| Authentication | Email/password with role-based access control |
| AI Engine | Google Gemini 3 Flash Preview via Lovable AI Gateway |
| Backend Functions | Deno Edge Functions (serverless) |
| File Storage | Lovable Cloud Storage (CV uploads) |

---

## 3. The AI Agent — Core Intelligence

The AI agent is the central innovation of the platform. It operates through **two serverless Edge Functions**, each serving a distinct purpose in the recruitment pipeline.

### 3.1 CV Parsing Agent (`parse-cv`)

**Purpose:** Automatically extract structured professional data from raw CV/resume text.

**How it works:**
1. The candidate (or recruiter) uploads a CV file (PDF, DOC, DOCX, or TXT).
2. The frontend reads the file content and sends the raw text to the `parse-cv` Edge Function.
3. The Edge Function forwards the text to **Google Gemini 3 Flash Preview** with a carefully engineered system prompt that instructs the model to extract specific fields.
4. The AI returns a structured JSON object containing:
   - **Full name** and **job title**
   - **Skills** (as an array of technical and professional competencies)
   - **Years of experience** (integer)
   - **Location** (city/country)
   - **Work preference** (Remote / Onsite / Hybrid)
   - **Availability** (Immediately / 2 weeks / 1 month / 3 months)
   - **Work type** (Full-time / Contract / Freelance)
   - **Professional domain** (e.g., FinTech, HealthTech)
   - **Summary** (2–3 sentence professional overview)
5. The extracted data is presented to the user for review and manual editing before being saved to the database.

**Key design decisions:**
- The AI extracts data but **never saves it directly** — the user always has the opportunity to review and correct before publishing.
- The prompt is engineered to handle ambiguity gracefully, applying sensible defaults (e.g., defaulting to "Remote" if work preference is unclear).
- File content is truncated to 15,000 characters to stay within model context limits.
- Errors from the AI gateway (rate limiting, credit exhaustion) are caught and surfaced as user-friendly messages.

### 3.2 Candidate Matching Agent (`match-candidates`)

**Purpose:** Intelligently evaluate and rank all candidates against a recruiter's specific requirements.

**How it works:**
1. A recruiter defines their hiring requirements: required skills, minimum experience, work preference, work type, and free-text additional notes.
2. The frontend sends the full list of candidates and the recruiter's requirements to the `match-candidates` Edge Function.
3. The Edge Function constructs a detailed prompt containing:
   - A formatted summary of all candidates (ID, name, title, skills, experience, location, preferences, domain, and summary)
   - The recruiter's complete requirement specification
4. **Google Gemini 3 Flash Preview** analyzes every candidate holistically and returns a JSON array containing:
   - **Candidate ID** — for linking results back to profiles
   - **Compatibility score** (0–100) — a nuanced assessment of fit
   - **AI-generated summary** — a 2–3 sentence explanation of *why* the candidate matches or doesn't match
5. The results replace the local scoring on the dashboard, and candidates are re-sorted by AI score.

**What makes the AI matching superior to the local fallback:**
- The local scoring algorithm uses a rigid weighted formula (35% skill overlap, 25% experience, 20% work preference, 20% work type) with simple substring matching.
- The AI agent considers **context, nuance, and the recruiter's free-text notes**. For example, a recruiter might write "We need someone who can lead a team and has startup experience" — the AI understands this and factors it into scoring, while the local algorithm cannot.
- The AI generates **human-readable explanations** for each match, helping recruiters understand the reasoning behind every score.

### 3.3 Error Handling & Rate Limiting

Both AI agents implement robust error handling:
- **HTTP 429 (Rate Limited):** The user is informed to wait and try again.
- **HTTP 402 (Credits Exhausted):** The user is prompted to add credits to their workspace.
- **Malformed AI responses:** The system attempts to clean markdown-wrapped JSON and falls back gracefully if parsing fails.
- **Network/server errors:** Generic error messages are displayed without exposing technical details.

---

## 4. Page-by-Page Functionality

### 4.1 Landing Page (`/`)
**Audience:** All visitors (unauthenticated)

**What users can do:**
- Read about the platform's value proposition and capabilities
- Understand the step-by-step process for both candidates and recruiters
- View feature highlights: Smart Profiles, AI-Powered Matching, and Enterprise Security
- Navigate to the authentication page to sign up or sign in
- Scroll through sections: About, Features, How It Works, and Why Choose Elvish Talents

**Design:** Full-page marketing site with decorative SVG ornaments, animated transitions, and a clear call-to-action flow.

---

### 4.2 Authentication Page (`/auth`)
**Audience:** New and returning users

**What users can do:**

| Action | Details |
|---|---|
| **Sign In** | Enter email and password to access their role-specific dashboard |
| **Sign Up** | Create a new account with full name, email, password, and role selection |
| **Choose Role** | Select either **Candidate** (looking for opportunities) or **Recruiter** (hiring talent) |

**Technical notes:**
- Email confirmation is required before first sign-in.
- Upon registration, a database trigger automatically creates a user profile and assigns the selected role.
- After sign-in, users are redirected to `/dashboard`.

---

### 4.3 Recruiter Dashboard (`/dashboard` — Recruiter role)
**Audience:** Authenticated recruiters (employers)

**What recruiters can do:**

| Feature | Description |
|---|---|
| **Browse candidates** | View all published candidate profiles in a 2-column card grid |
| **Filter by skills** | Add multiple skill tags; candidates are scored by skill overlap |
| **Set minimum experience** | Use a slider (0–15 years) to set experience requirements |
| **Filter by work preference** | Select Remote, Onsite, Hybrid, or Any |
| **Filter by work type** | Select Full-time, Contract, Freelance, or Any |
| **Add notes** | Write free-text requirements for the AI to consider |
| **Run AI Matching** | Trigger the AI agent to evaluate and rank all candidates with detailed explanations |
| **View match scores** | Color-coded scores: green (≥80), amber (≥60), red (<60) |
| **Read AI summaries** | Each candidate card shows a personalized AI analysis when matching has been run |
| **Clear filters** | Reset all filters and AI results with one click |
| **Sign out** | End the session and return to the landing page |

**Workflow:**
1. The dashboard loads all published (non-draft) candidate profiles from the database.
2. Local scoring provides an initial ranking based on the weighted algorithm.
3. When the recruiter clicks "AI Match," the AI agent re-evaluates all candidates and provides superior, context-aware rankings with written explanations.

---

### 4.4 Candidate Dashboard (`/dashboard` — Candidate role)
**Audience:** Authenticated candidates (employees/job seekers)

**What candidates can do:**

| Feature | Description |
|---|---|
| **View profile status** | See whether their profile is live and visible to recruiters |
| **Create profile** | Navigate to the profile editor to build their professional profile |
| **Update profile** | Return to the profile editor to modify existing details |

**Design:** A focused, single-action view that guides the candidate toward completing their profile.

---

### 4.5 Candidate Profile Editor (`/profile/new`)
**Audience:** Authenticated candidates

**What candidates can do:**

| Feature | Description |
|---|---|
| **Upload CV** | Select a PDF, DOC, DOCX, or TXT file (max 10MB) |
| **AI extraction** | Click "Extract with AI" to have the AI parse the CV and auto-fill all profile fields |
| **Edit all fields** | Manually adjust any extracted or entered data: name, title, skills, experience, location, work preference, work type, availability, domain, and professional summary |
| **Manage skills** | Add skills as individual tags; remove them with a click |
| **Set experience** | Use a slider (0–30 years) for precise control |
| **Choose preferences** | Select work preference (Remote/Onsite/Hybrid), work type (Full-time/Contract/Freelance), and availability timeline |
| **Write summary** | Compose or edit a professional summary |
| **Publish profile** | Save all data to the database and make the profile visible to recruiters |

**Workflow:**
1. Upload a CV file.
2. Click "Extract with AI" — the AI agent reads the CV and populates all form fields.
3. Review the extracted data and make corrections.
4. Click "Publish Profile" — the CV file is uploaded to secure storage, and the structured profile is saved to the database.

---

### 4.6 Not Found Page (`/404`)
**Audience:** Anyone who navigates to an invalid URL

**What users see:** A friendly error message with a button to return to the homepage.

---

## 5. Authentication & Security

### 5.1 Role-Based Access Control

The platform implements a complete RBAC system:

- **Roles:** `candidate` and `recruiter` (stored in the `user_roles` table)
- **Role assignment:** Automatic via a database trigger on user registration
- **Role enforcement:** The `useAuth` hook fetches the user's role on login and provides it to all components via React Context
- **UI adaptation:** The dashboard renders completely different interfaces based on the user's role

### 5.2 Row-Level Security (RLS)

All database tables are protected with RLS policies:
- Candidates can only modify their own profiles
- Recruiters can view all published (non-draft) profiles
- User roles and profiles are scoped to the authenticated user

### 5.3 Secure File Storage

CV files are uploaded to a dedicated storage bucket (`cv-uploads`) with access policies that restrict file access to the uploading user and authorized recruiters.

---

## 6. Database Schema

| Table | Purpose |
|---|---|
| `candidates` | Stores all candidate profiles: name, title, skills, experience, location, preferences, summary, CV file path, draft status, and user association |
| `profiles` | Stores additional user information: display name and email |
| `user_roles` | Maps users to their roles (candidate or recruiter) |

---

## 7. Local Scoring Algorithm (Fallback)

When the AI agent has not been invoked, candidates are ranked using a deterministic weighted algorithm:

| Factor | Weight | Method |
|---|---|---|
| Skill overlap | 35% | Case-insensitive substring matching between required and candidate skills |
| Experience | 25% | Ratio of candidate experience to minimum requirement (capped at 100%) |
| Work preference | 20% | Binary match (100% if match or "Any," 0% otherwise) |
| Work type | 20% | Binary match (same logic as work preference) |

This ensures candidates are always meaningfully sorted, even before AI matching is used.

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         React + TypeScript + Tailwind            │
│                                                  │
│  Landing ──→ Auth ──→ Dashboard / Profile Editor │
│                         │              │         │
│                         │              │         │
│              ┌──────────┘              │         │
│              ▼                         ▼         │
│     Recruiter View             Candidate View    │
│   (Browse + AI Match)      (Upload + AI Parse)   │
└──────────┬──────────────────────┬────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐   ┌──────────────────┐
│  match-candidates│   │    parse-cv      │
│  Edge Function   │   │  Edge Function   │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│       Lovable AI Gateway                │
│   (Google Gemini 3 Flash Preview)       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       Lovable Cloud Database            │
│   (PostgreSQL + RLS + Storage)          │
└─────────────────────────────────────────┘
```

---

## 9. Future Roadmap

The architecture is designed to support the following enhancements:

- **Vector embeddings** (pgvector) for semantic candidate search
- **3-stage search pipeline:** SQL filter → vector similarity → AI re-ranking
- **.NET backend integration** — the API contracts are already documented in `SCHEMA.md`
- **CV file parsing** for PDF/DOC formats (currently supports text-based files)
- **Real-time notifications** when new candidates match recruiter criteria
- **Candidate messaging** for direct recruiter–candidate communication

---

## 10. Conclusion

Elvish Talents demonstrates a modern approach to recruitment technology: combining a visually distinctive frontend with practical AI capabilities. The two AI agents — CV parsing and candidate matching — transform what would otherwise be a manual, time-intensive process into an intelligent, automated workflow. The platform is production-ready with proper authentication, authorization, data security, and error handling, while maintaining a clear path for future scaling and integration.

---

*Report generated for the Elvish Talents project — February 2026*
