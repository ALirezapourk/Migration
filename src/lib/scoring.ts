import { Candidate, RecruiterRequirements, ScoredCandidate } from "./types";

function skillOverlapScore(candidateSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100;

  let matches = 0;
  for (const required of requiredSkills) {
    const reqLower = required.toLowerCase();
    const found = candidateSkills.some((skill) => {
      const skillLower = skill.toLowerCase();
      return skillLower.includes(reqLower) || reqLower.includes(skillLower);
    });
    if (found) matches++;
  }
  return (matches / requiredSkills.length) * 100;
}

function experienceScore(candidateExp: number, minExp: number): number {
  if (minExp <= 0) return 100;
  if (candidateExp >= minExp) return 100;
  return (candidateExp / minExp) * 100;
}

function preferenceScore(candidatePref: string, requiredPref: string): number {
  if (requiredPref === "Any") return 100;
  return candidatePref === requiredPref ? 100 : 0;
}

export function scoreCandidate(
  candidate: Candidate,
  requirements: RecruiterRequirements
): number {
  const skillScore = skillOverlapScore(candidate.skills, requirements.skills);
  const expScore = experienceScore(candidate.experience, requirements.minExperience);
  const prefScore = preferenceScore(candidate.workPreference, requirements.workPreference);
  const typeScore = preferenceScore(candidate.workType, requirements.workType);

  const total = skillScore * 0.35 + expScore * 0.25 + prefScore * 0.2 + typeScore * 0.2;
  return Math.round(total);
}

export function scoreCandidates(
  candidateList: Candidate[],
  requirements: RecruiterRequirements
): ScoredCandidate[] {
  return candidateList
    .map((c) => ({ ...c, score: scoreCandidate(c, requirements) }))
    .sort((a, b) => b.score - a.score);
}
