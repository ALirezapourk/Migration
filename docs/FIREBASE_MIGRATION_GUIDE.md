# 🔥 Firebase Migration Guide — Elvish Talents

## Complete Step-by-Step Tutorial: From Lovable Cloud to Firebase

**Estimated total time: 6–10 hours**

---

## Table of Contents

1. [Overview & Architecture Comparison](#1-overview--architecture-comparison)
2. [Prerequisites & Setup](#2-prerequisites--setup)
3. [Create Firebase Project](#3-create-firebase-project)
4. [Clone & Restructure the Git Repo](#4-clone--restructure-the-git-repo)
5. [Install Firebase Dependencies](#5-install-firebase-dependencies)
6. [Firebase Configuration](#6-firebase-configuration)
7. [Migrate Authentication](#7-migrate-authentication)
8. [Migrate Database (Firestore)](#8-migrate-database-firestore)
9. [Migrate File Storage](#9-migrate-file-storage)
10. [Migrate AI Cloud Functions](#10-migrate-ai-cloud-functions)
11. [Migrate the Frontend API Layer](#11-migrate-the-frontend-api-layer)
12. [Migrate Auth Hook](#12-migrate-auth-hook)
13. [Migrate Pages](#13-migrate-pages)
14. [Security Rules](#14-security-rules)
15. [Environment Variables & Secrets](#15-environment-variables--secrets)
16. [Build & Deploy](#16-build--deploy)
17. [Testing](#17-testing)
18. [Troubleshooting](#18-troubleshooting)
19. [Checklist](#19-checklist)

---

## 1. Overview & Architecture Comparison

### What's changing

| Component | Current (Lovable Cloud / Supabase) | Target (Firebase) |
|---|---|---|
| **Database** | PostgreSQL with RLS | Firestore (NoSQL) |
| **Auth** | `supabase.auth` (email + password) | `firebase/auth` (email + password) |
| **Storage** | Supabase Storage (`cv-uploads` bucket) | Firebase Storage (`gs://your-bucket`) |
| **Backend Functions** | Deno Edge Functions (`supabase/functions/`) | Node.js Cloud Functions v2 (`functions/`) |
| **AI Gateway** | Lovable AI Gateway (`ai.gateway.lovable.dev`) | Direct Gemini API (`@google/generative-ai` SDK) |
| **Security** | Row-Level Security (SQL policies) | Firestore Security Rules + Custom Claims |
| **Hosting** | Lovable preview | Firebase Hosting |

### What stays the same

- **All React/TypeScript/Tailwind frontend code** — components, pages, styling
- **TypeScript interfaces** (`src/lib/types.ts`) — no changes
- **Scoring logic** (`src/lib/scoring.ts`) — pure TypeScript, no backend dependency
- **UI components** (`src/components/`) — all shadcn/ui components
- **AI agent architecture** — 3 separate functions (parse-cv, match-candidates, match-companies)

---

## 2. Prerequisites & Setup

### Install required tools

```bash
# 1. Node.js (v18+ required for Cloud Functions v2)
node --version  # should be 18.x or 20.x

# 2. Firebase CLI
npm install -g firebase-tools

# 3. Verify installation
firebase --version  # should be 13.x+

# 4. Login to Firebase
firebase login
```

### Get a Gemini API Key

Since you won't have the Lovable AI Gateway in Firebase, you'll call Google Gemini directly.

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key — you'll need it in Step 10
4. Or use **Vertex AI** if your company has a GCP project (recommended for production)

---

## 3. Create Firebase Project

### In Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it: `elvish-talents` (or your preferred name)
4. Enable/disable Google Analytics (your choice)
5. Click **Create project**

### Enable required services

In the Firebase Console, enable these:

1. **Authentication** → Sign-in method → Enable **Email/Password**
2. **Cloud Firestore** → Create database → Start in **production mode**
3. **Storage** → Get started → Start in **production mode**
4. **Functions** → (requires Blaze billing plan — pay-as-you-go)

> ⚠️ **Cloud Functions require the Blaze (pay-as-you-go) plan.** You won't be charged unless you exceed the free tier (2M invocations/month).

---

## 4. Clone & Restructure the Git Repo

### Clone your Lovable project

```bash
# From GitHub (your Lovable project syncs to GitHub)
git clone https://github.com/YOUR_USERNAME/elvish-talents.git
cd elvish-talents
```

### Initialize Firebase in the project

```bash
firebase init
```

Select these options:
- ✅ **Firestore** (database rules and indexes)
- ✅ **Functions** (Cloud Functions)
- ✅ **Hosting** (web app hosting)
- ✅ **Storage** (file storage rules)

When prompted:
- **Firestore Rules file**: `firestore.rules`
- **Firestore Indexes file**: `firestore.indexes.json`
- **Functions language**: **TypeScript**
- **ESLint**: Yes
- **Install dependencies**: Yes
- **Hosting public directory**: `dist` (Vite builds to `dist/`)
- **Single-page app**: **Yes**
- **Storage rules file**: `storage.rules`

### New folder structure after init

```
elvish-talents/
├── functions/              ← NEW: Cloud Functions (replaces supabase/functions/)
│   ├── src/
│   │   ├── index.ts        ← Main entry point for all functions
│   │   ├── parse-cv.ts     ← AI Agent 1
│   │   ├── match-candidates.ts  ← AI Agent 2
│   │   └── match-companies.ts   ← AI Agent 3
│   ├── package.json
│   └── tsconfig.json
├── src/                    ← EXISTING: React frontend (mostly unchanged)
├── firestore.rules         ← NEW: replaces RLS policies
├── firestore.indexes.json  ← NEW
├── storage.rules           ← NEW
├── firebase.json           ← NEW: Firebase config
├── .firebaserc             ← NEW: project alias
└── ... (existing files)
```

### Remove Supabase-specific files

```bash
# Remove Supabase edge functions (you'll recreate as Cloud Functions)
rm -rf supabase/

# Remove Supabase client integration
rm -rf src/integrations/supabase/

# Remove the .env file (Firebase uses different config)
rm .env
```

---

## 5. Install Firebase Dependencies

### Frontend dependencies

```bash
# Remove Supabase SDK
npm uninstall @supabase/supabase-js

# Install Firebase SDK
npm install firebase
```

### Cloud Functions dependencies

```bash
cd functions

# These are auto-installed by firebase init, but verify:
npm install firebase-admin firebase-functions

# Install Gemini AI SDK for the AI agents
npm install @google/generative-ai

# Install cors helper
npm install cors
npm install --save-dev @types/cors

cd ..
```

---

## 6. Firebase Configuration

### Create `src/lib/firebase.ts`

This replaces `src/integrations/supabase/client.ts`:

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Uncomment for local development with emulators:
// connectFunctionsEmulator(functions, "127.0.0.1", 5001);
```

### Create `.env` file

Get these values from Firebase Console → Project Settings → General → Your apps → Web app:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **Note:** Firebase API keys are **public/publishable** — they're safe in client-side code. Security is enforced by Firestore/Storage rules.

---

## 7. Migrate Authentication

### Create `src/hooks/useAuth.tsx` (Firebase version)

Replace the existing Supabase-based `useAuth.tsx`:

```typescript
// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserRole = "candidate" | "recruiter" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: "candidate" | "recruiter"
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string) => {
    const roleDoc = await getDoc(doc(db, "user_roles", uid));
    if (roleDoc.exists()) {
      setRole(roleDoc.data().role as UserRole);
    } else {
      setRole(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchRole(firebaseUser.uid);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "candidate" | "recruiter"
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    // Create profile document
    await setDoc(doc(db, "profiles", cred.user.uid), {
      user_id: cred.user.uid,
      display_name: displayName,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create role document
    await setDoc(doc(db, "user_roles", cred.user.uid), {
      user_id: cred.user.uid,
      role: role,
    });

    setRole(role);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle fetching the role
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Update `src/pages/Auth.tsx`

The key changes:
- Replace `supabase.auth.signUp()` → `signUp()` from `useAuth()`
- Replace `supabase.auth.signInWithPassword()` → `signIn()` from `useAuth()`

```typescript
// In Auth.tsx, change the imports:
// REMOVE:
// import { supabase } from "@/integrations/supabase/client";

// The handlers now use the useAuth hook directly:
const { signUp, signIn } = useAuth();

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signUp(signupEmail, signupPassword, signupName, signupRole);
    toast({ title: "Account created!", description: "Welcome to Elvish Talents." });
    navigate("/dashboard");
  } catch (error: any) {
    toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await signIn(loginEmail, loginPassword);
    toast({ title: "Welcome back!" });
    navigate("/dashboard");
  } catch (error: any) {
    toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

### Update `src/App.tsx` ProtectedRoute

```typescript
// The ProtectedRoute stays almost the same, just uses Firebase user:
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

---

## 8. Migrate Database (Firestore)

### Data model mapping

Your current PostgreSQL tables map to Firestore collections like this:

#### Collection: `candidates`
```
/candidates/{candidateId}
{
  name: "Erik Lindqvist",
  title: "Senior Frontend Developer",
  skills: ["React", "TypeScript", "Next.js"],
  experience: 7,
  location: "Stockholm",
  work_preference: "Remote",
  availability: "2 weeks",
  work_type: "Full-time",
  domain: "FinTech",
  summary: "Seasoned frontend architect...",
  is_draft: false,
  cv_file_path: "cv-uploads/user123/resume.pdf",
  user_id: "firebase-uid-here",
  uploaded_by: "firebase-uid-here",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Collection: `companies`
```
/companies/{companyId}
{
  name: "TechCorp AB",
  industry: "Technology",
  description: "Leading tech company...",
  location: "Stockholm",
  size: "Medium",
  required_skills: ["React", "Node.js"],
  min_experience: 3,
  work_preference: "Remote",
  work_type: "Full-time",
  domain: "SaaS",
  budget_range: "$80K-$120K",
  open_positions: 2,
  notes: "Looking for senior devs",
  user_id: "firebase-uid-here",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Collection: `profiles`
```
/profiles/{userId}
{
  user_id: "firebase-uid-here",
  display_name: "Erik Lindqvist",
  email: "erik@example.com",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Collection: `user_roles`
```
/user_roles/{userId}
{
  user_id: "firebase-uid-here",
  role: "candidate"  // or "recruiter"
}
```

### Firestore helper functions

Create `src/lib/firestore.ts`:

```typescript
// src/lib/firestore.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Candidate, Company } from "./types";

// ── Candidates ──

export async function fetchCandidates(onlyPublished = true): Promise<Candidate[]> {
  let q = query(collection(db, "candidates"));
  if (onlyPublished) {
    q = query(collection(db, "candidates"), where("is_draft", "==", false));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      title: d.title,
      skills: d.skills || [],
      experience: d.experience || 0,
      location: d.location || "",
      workPreference: d.work_preference || "Remote",
      availability: d.availability || "2 weeks",
      workType: d.work_type || "Full-time",
      domain: d.domain || "",
      summary: d.summary || "",
    } as Candidate;
  });
}

export async function fetchCandidatesByUser(userId: string): Promise<Candidate[]> {
  const q = query(collection(db, "candidates"), where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      title: d.title,
      skills: d.skills || [],
      experience: d.experience || 0,
      location: d.location || "",
      workPreference: d.work_preference || "Remote",
      availability: d.availability || "2 weeks",
      workType: d.work_type || "Full-time",
      domain: d.domain || "",
      summary: d.summary || "",
    } as Candidate;
  });
}

export async function insertCandidate(data: Record<string, any>): Promise<string> {
  const docRef = await addDoc(collection(db, "candidates"), {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });
  return docRef.id;
}

// ── Companies ──

export async function fetchCompanies(): Promise<Company[]> {
  const snapshot = await getDocs(collection(db, "companies"));
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      industry: d.industry || "",
      description: d.description || "",
      location: d.location || "",
      size: d.size || "Small",
      requiredSkills: d.required_skills || [],
      minExperience: d.min_experience || 0,
      workPreference: d.work_preference || "Remote",
      workType: d.work_type || "Full-time",
      domain: d.domain || "",
      budgetRange: d.budget_range || "",
      openPositions: d.open_positions || 1,
      notes: d.notes || "",
    } as Company;
  });
}
```

---

## 9. Migrate File Storage

### Upload CV to Firebase Storage

Replace Supabase Storage calls with Firebase Storage:

```typescript
// In CandidateProfile.tsx, replace the upload logic:

// REMOVE:
// import { supabase } from "@/integrations/supabase/client";

// ADD:
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// In saveProfile():
const storageRef = ref(storage, `cv-uploads/${user.uid}/${Date.now()}_${file.name}`);
const snapshot = await uploadBytes(storageRef, file);
const downloadUrl = await getDownloadURL(snapshot.ref);

// Then use downloadUrl or snapshot.ref.fullPath as cv_file_path
await insertCandidate({
  name,
  title,
  skills,
  experience,
  location,
  work_preference: workPreference,
  availability,
  work_type: workType,
  domain,
  summary,
  is_draft: false,
  cv_file_path: snapshot.ref.fullPath,
  user_id: user.uid,
  uploaded_by: user.uid,
});
```

---

## 10. Migrate AI Cloud Functions

This is the most important section. Each Supabase Edge Function becomes a Firebase Cloud Function v2.

### Set the Gemini API key as a secret

```bash
# Set the secret (you'll be prompted to enter the value)
firebase functions:secrets:set GEMINI_API_KEY
# Paste your API key from Google AI Studio
```

### AI Agent 1: `parse-cv`

Create `functions/src/parse-cv.ts`:

```typescript
// functions/src/parse-cv.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const parseCv = onRequest(
  { cors: true, secrets: [geminiApiKey] },
  async (req, res) => {
    try {
      const { cvText, fileName } = req.body;

      if (!cvText || typeof cvText !== "string") {
        res.status(400).json({ error: "cvText is required" });
        return;
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

      const result = await model.generateContent([
        systemPrompt,
        `Parse this CV (file: ${fileName}):\n\n${cvText.slice(0, 15000)}`,
      ]);

      const content = result.response.text();
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
```

### AI Agent 2: `match-candidates`

Create `functions/src/match-candidates.ts`:

```typescript
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
```

### AI Agent 3: `match-companies`

Create `functions/src/match-companies.ts`:

```typescript
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
```

### Export all functions in `functions/src/index.ts`

```typescript
// functions/src/index.ts
export { parseCv } from "./parse-cv";
export { matchCandidates } from "./match-candidates";
export { matchCompanies } from "./match-companies";
```

### Update `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

---

## 11. Migrate the Frontend API Layer

### Replace `src/lib/api.ts`

```typescript
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
  // For Cloud Functions v2, the URL pattern is:
  // https://{function-name}-{project-id}.{region}.run.app
  // OR you can use the Firebase Functions SDK:
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const region = "us-central1"; // or your chosen region

  const url = `https://${name}-${projectId}.${region}.run.app`;

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
    const data = await callFunction("matchcandidates", {
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
    const data = await callFunction("matchcompanies", {
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
    const data = await callFunction("matchcompanies", {
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
```

---

## 12. Migrate Auth Hook

Already covered in [Step 7](#7-migrate-authentication). The key differences:

| Supabase | Firebase |
|---|---|
| `supabase.auth.onAuthStateChange()` | `onAuthStateChanged(auth, ...)` |
| `supabase.auth.signUp()` | `createUserWithEmailAndPassword()` |
| `supabase.auth.signInWithPassword()` | `signInWithEmailAndPassword()` |
| `supabase.auth.signOut()` | `signOut(auth)` |
| `session?.user` | `user` (directly from `onAuthStateChanged`) |
| `session?.user?.id` | `user.uid` |

---

## 13. Migrate Pages

### Files that need changes

| File | What to change |
|---|---|
| `src/pages/Auth.tsx` | Replace Supabase auth calls → `useAuth()` hook (see Step 7) |
| `src/pages/Index.tsx` | Replace `supabase.from("candidates").select()` → `fetchCandidates()` from `firestore.ts` |
| `src/pages/CandidateProfile.tsx` | Replace Supabase Storage + DB calls → Firebase Storage + Firestore |
| `src/components/ElvishHeader.tsx` | Replace `useAuth()` — already compatible if you kept the same interface |

### Index.tsx changes

In the `useEffect` where you load data, replace:

```typescript
// BEFORE (Supabase):
const { data: candidateRows } = await supabase
  .from("candidates")
  .select("*")
  .eq("is_draft", false);

// AFTER (Firebase):
import { fetchCandidates, fetchCompanies } from "@/lib/firestore";

const candidateList = await fetchCandidates(true);
const companyList = await fetchCompanies();
```

### CandidateProfile.tsx changes

```typescript
// BEFORE (Supabase):
// supabase.functions.invoke("parse-cv", { body: { cvText, fileName } })

// AFTER (Firebase):
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const res = await fetch(
  `https://parsecv-${projectId}.us-central1.run.app`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cvText, fileName }),
  }
);
const data = await res.json();
```

---

## 14. Security Rules

### Firestore Rules (`firestore.rules`)

These replace your PostgreSQL RLS policies:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check user role
    function hasRole(role) {
      return get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == role;
    }

    // Profiles
    match /profiles/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId || hasRole('recruiter')
      );
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // User Roles
    match /user_roles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      // No update/delete allowed
    }

    // Candidates
    match /candidates/{candidateId} {
      // Candidates can CRUD their own data
      allow read: if request.auth != null && (
        resource.data.user_id == request.auth.uid || hasRole('recruiter')
      );
      allow create: if request.auth != null && (
        request.resource.data.user_id == request.auth.uid || hasRole('recruiter')
      );
      allow update: if request.auth != null &&
        resource.data.user_id == request.auth.uid;
      allow delete: if request.auth != null &&
        resource.data.user_id == request.auth.uid;
    }

    // Companies
    match /companies/{companyId} {
      allow read: if request.auth != null && (
        hasRole('recruiter') || hasRole('candidate')
      );
      allow create, update, delete: if request.auth != null && hasRole('recruiter');
    }
  }
}
```

### Storage Rules (`storage.rules`)

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // CV uploads: users can only upload to their own folder
    match /cv-uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
  }
}
```

---

## 15. Environment Variables & Secrets

### Frontend (`.env`)

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=elvish-talents.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=elvish-talents
VITE_FIREBASE_STORAGE_BUCKET=elvish-talents.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Cloud Functions secrets

```bash
# Set the Gemini API key (already done in Step 10)
firebase functions:secrets:set GEMINI_API_KEY
```

### `.gitignore` additions

```gitignore
# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Environment
.env
.env.local
```

---

## 16. Build & Deploy

### Local development

```bash
# Terminal 1: Start Firebase emulators (for Functions, Firestore, Auth, Storage)
firebase emulators:start

# Terminal 2: Start Vite dev server
npm run dev
```

> **Tip:** Uncomment the emulator connection in `src/lib/firebase.ts` during local dev:
> ```typescript
> connectFunctionsEmulator(functions, "127.0.0.1", 5001);
> ```

### Build for production

```bash
# Build the Vite frontend
npm run build

# Deploy everything to Firebase
firebase deploy
```

### Deploy specific components

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage
```

### Verify deployment

After `firebase deploy`, you'll get URLs like:

```
✔ Function URL (parseCv): https://parsecv-elvish-talents.us-central1.run.app
✔ Function URL (matchCandidates): https://matchcandidates-elvish-talents.us-central1.run.app
✔ Function URL (matchCompanies): https://matchcompanies-elvish-talents.us-central1.run.app
✔ Hosting URL: https://elvish-talents.web.app
```

---

## 17. Testing

### Test plan

#### 17.1 Authentication Tests

```
✅ Sign up as a Candidate
   1. Go to /auth
   2. Fill in name, email, password
   3. Select "Candidate" role
   4. Click Sign Up
   5. Verify redirect to /dashboard
   6. Verify role badge shows "candidate"

✅ Sign up as a Recruiter
   (same steps, select "Recruiter")

✅ Sign in with existing account
   1. Use login tab
   2. Enter credentials
   3. Verify redirect to /dashboard

✅ Sign out
   1. Click logout button
   2. Verify redirect to /auth

✅ Protected routes
   1. Try to access /dashboard without login → should redirect to /auth
```

#### 17.2 Candidate Flow Tests

```
✅ Upload CV
   1. Log in as Candidate
   2. Navigate to /profile/new
   3. Upload a PDF/DOC file (< 10MB)
   4. Click "Extract with AI"
   5. Verify AI fills in the form fields

✅ Edit & Publish Profile
   1. Modify extracted fields
   2. Add/remove skills
   3. Click "Publish Profile"
   4. Verify toast success message
   5. Verify redirect to dashboard

✅ Find Best Fit Companies
   1. On candidate dashboard, click "Find My Best Fit"
   2. Verify company cards appear with AI scores and summaries
```

#### 17.3 Recruiter Flow Tests

```
✅ View all candidates
   1. Log in as Recruiter
   2. Verify candidate cards display on dashboard

✅ Filter candidates
   1. Add skill filters
   2. Change experience slider
   3. Select work preference
   4. Verify list updates

✅ AI Match candidates
   1. Set requirements
   2. Click "AI Match"
   3. Verify candidates get AI scores and summaries

✅ Company-to-candidate matching
   1. Select a company from the dropdown
   2. Click match
   3. Verify AI results
```

#### 17.4 Cloud Functions Tests

```bash
# Test parse-cv locally with emulator
curl -X POST http://127.0.0.1:5001/elvish-talents/us-central1/parseCv \
  -H "Content-Type: application/json" \
  -d '{"cvText": "John Doe, Senior Developer, 5 years React experience in Stockholm", "fileName": "test.txt"}'

# Test match-candidates
curl -X POST http://127.0.0.1:5001/elvish-talents/us-central1/matchCandidates \
  -H "Content-Type: application/json" \
  -d '{"candidates": [{"id":"1","name":"Test","title":"Dev","skills":["React"],"experience":5,"location":"Stockholm","workPreference":"Remote","workType":"Full-time","domain":"Tech","summary":"Test dev"}], "requirements": {"skills":["React"],"minExperience":3,"workPreference":"Any","workType":"Any","notes":""}}'
```

#### 17.5 Security Rules Tests

```bash
# Use Firebase emulator to test rules
firebase emulators:start

# In emulator UI (http://localhost:4000):
# - Try reading candidates without auth → should fail
# - Try reading candidates as a candidate → should only see own
# - Try reading candidates as a recruiter → should see all
# - Try uploading to another user's storage path → should fail
```

---

## 18. Troubleshooting

### Common issues

| Issue | Solution |
|---|---|
| **"GEMINI_API_KEY is not set"** | Run `firebase functions:secrets:set GEMINI_API_KEY` |
| **CORS errors** | Cloud Functions v2 with `cors: true` handles this. If issues, check your `callFunction` URL |
| **"Permission denied" on Firestore** | Check your security rules match the collection paths. Run `firebase deploy --only firestore:rules` |
| **Functions cold start slow** | Normal for first call. Consider `minInstances: 1` in function options for production |
| **Storage upload fails** | Verify storage rules allow the user's UID path. Check file size < 10MB |
| **Auth state not persisting** | Firebase Auth uses IndexedDB by default. Check if browser settings block it |
| **Function URL not found** | After deploying, function URLs follow pattern: `https://{functionName}-{projectId}.{region}.run.app` |

### Useful commands

```bash
# View function logs
firebase functions:log

# View function logs for specific function
firebase functions:log --only parseCv

# Run emulators
firebase emulators:start

# Deploy a single function
firebase deploy --only functions:parseCv

# List all deployed functions
firebase functions:list
```

---

## 19. Checklist

Use this checklist to track your migration progress:

```
Phase 1: Setup
[ ] Firebase CLI installed
[ ] Firebase project created
[ ] Auth (Email/Password) enabled
[ ] Firestore database created
[ ] Storage enabled
[ ] Blaze plan enabled (for Functions)
[ ] Gemini API key obtained

Phase 2: Code Migration
[ ] Firebase SDK installed, Supabase SDK removed
[ ] src/lib/firebase.ts created
[ ] .env updated with Firebase config
[ ] src/hooks/useAuth.tsx rewritten for Firebase
[ ] src/lib/firestore.ts created
[ ] src/lib/api.ts rewritten for Firebase
[ ] src/pages/Auth.tsx updated
[ ] src/pages/Index.tsx updated (data loading)
[ ] src/pages/CandidateProfile.tsx updated (storage + DB + AI)
[ ] supabase/ folder removed
[ ] src/integrations/supabase/ removed

Phase 3: Cloud Functions
[ ] functions/ initialized with TypeScript
[ ] @google/generative-ai installed
[ ] GEMINI_API_KEY secret set
[ ] parse-cv function created
[ ] match-candidates function created
[ ] match-companies function created
[ ] functions/src/index.ts exports all

Phase 4: Security
[ ] firestore.rules written
[ ] storage.rules written
[ ] Rules deployed

Phase 5: Testing
[ ] Auth flow (sign up, sign in, sign out)
[ ] Candidate profile creation
[ ] CV upload & AI parsing
[ ] Recruiter dashboard & filtering
[ ] AI matching (all 3 agents)
[ ] Security rules (unauthorized access blocked)
[ ] Emulator tests pass

Phase 6: Deployment
[ ] npm run build succeeds
[ ] firebase deploy succeeds
[ ] Live URL works
[ ] All functions accessible
[ ] Production test pass
```

---

## 🎉 Done!

Once you've completed all steps, your Elvish Talents app will be fully running on Firebase with:
- **Firebase Auth** for authentication
- **Firestore** for database
- **Firebase Storage** for CV files
- **Cloud Functions v2** for AI agents (calling Gemini directly)
- **Firebase Hosting** for the React frontend

The AI agent architecture remains modular with 3 separate functions, matching your current design. The frontend React code stays largely the same — only the backend integration layer changes.

**Questions?** Refer to:
- [Firebase Docs](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Cloud Functions v2 Docs](https://firebase.google.com/docs/functions)
