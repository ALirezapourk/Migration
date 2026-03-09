
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