import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, X, Sparkles, Loader2, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CandidateCard } from "@/components/CandidateCard";
import { CompanyCard } from "@/components/CompanyCard";
import { ElvishHeader } from "@/components/ElvishHeader";
import { ElvishDivider } from "@/components/ElvishDivider";
import { scoreCandidates } from "@/lib/scoring";
import { matchCandidatesAI, matchCompaniesForCandidate, matchCandidatesForCompany } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  Candidate,
  Company,
  RecruiterRequirements,
  ScoredCandidate,
  ScoredCompany,
  AIMatchResult,
} from "@/lib/types";

const Index = () => {
  const { toast } = useToast();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [dbCandidates, setDbCandidates] = useState<Candidate[]>([]);
  const [dbCompanies, setDbCompanies] = useState<Company[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [workPreference, setWorkPreference] = useState<string>("Any");
  const [workType, setWorkType] = useState<string>("Any");
  const [notes, setNotes] = useState("");
  const [aiResults, setAiResults] = useState<AIMatchResult[] | null>(null);
  const [companyAiResults, setCompanyAiResults] = useState<AIMatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("candidates");

  // For recruiter: selected company to match candidates against
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setDbLoading(true);

      const [candidatesRes, companiesRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("is_draft", false),
        supabase.from("companies").select("*"),
      ]);

      if (candidatesRes.error) console.error("Failed to load candidates:", candidatesRes.error);
      if (companiesRes.error) console.error("Failed to load companies:", companiesRes.error);

      if (candidatesRes.data) {
        const mapped: Candidate[] = candidatesRes.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          title: row.title,
          skills: row.skills || [],
          experience: row.experience,
          location: row.location,
          workPreference: row.work_preference,
          availability: row.availability,
          workType: row.work_type,
          domain: row.domain,
          summary: row.summary,
        }));
        setDbCandidates(mapped);
      }

      if (companiesRes.data) {
        const mapped: Company[] = companiesRes.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          industry: row.industry,
          description: row.description,
          location: row.location,
          size: row.size,
          requiredSkills: row.required_skills || [],
          minExperience: row.min_experience,
          workPreference: row.work_preference,
          workType: row.work_type,
          domain: row.domain,
          budgetRange: row.budget_range,
          openPositions: row.open_positions,
          notes: row.notes,
        }));
        setDbCompanies(mapped);
      }

      setDbLoading(false);
    };
    fetchData();
  }, []);

  const requirements: RecruiterRequirements = useMemo(
    () => ({
      skills,
      minExperience,
      workPreference: workPreference as RecruiterRequirements["workPreference"],
      workType: workType as RecruiterRequirements["workType"],
      notes,
    }),
    [skills, minExperience, workPreference, workType, notes]
  );

  const scoredCandidates: ScoredCandidate[] = useMemo(() => {
    const scored = scoreCandidates(dbCandidates, requirements);
    if (aiResults) {
      return scored
        .map((c) => {
          const ai = aiResults.find((r) => r.id === c.id);
          if (ai) return { ...c, score: ai.score, aiSummary: ai.summary };
          return c;
        })
        .sort((a, b) => b.score - a.score);
    }
    return scored;
  }, [dbCandidates, requirements, aiResults]);

  const scoredCompanies: ScoredCompany[] = useMemo(() => {
    const base: ScoredCompany[] = dbCompanies.map((c) => ({ ...c, score: 0 }));
    if (companyAiResults) {
      return base
        .map((c) => {
          const ai = companyAiResults.find((r) => r.id === c.id);
          if (ai) return { ...c, score: ai.score, aiSummary: ai.summary };
          return c;
        })
        .sort((a, b) => b.score - a.score);
    }
    return base;
  }, [dbCompanies, companyAiResults]);

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  }, [skillInput, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); addSkill(); }
    },
    [addSkill]
  );

  const runAIMatching = useCallback(async () => {
    setLoading(true);
    const res = await matchCandidatesAI(dbCandidates, requirements);
    setLoading(false);
    if (!res.success) {
      toast({ title: "AI Matching Failed", description: res.error, variant: "destructive" });
      return;
    }
    setAiResults(res.data.results);
    toast({ title: "AI Matching Complete", description: `Evaluated ${res.data.results.length} candidates.` });
  }, [dbCandidates, requirements, toast]);

  // Candidate: find best companies for me
  const runCompanyMatching = useCallback(async () => {
    // Use the first candidate matching the user (or first available)
    const myProfile = dbCandidates[0];
    if (!myProfile) {
      toast({ title: "No Profile", description: "Create your profile first to find matching companies.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await matchCompaniesForCandidate(dbCompanies, myProfile);
    setLoading(false);
    if (!res.success) {
      toast({ title: "Matching Failed", description: res.error, variant: "destructive" });
      return;
    }
    setCompanyAiResults(res.data.results);
    toast({ title: "Company Matching Complete", description: `Evaluated ${res.data.results.length} companies.` });
  }, [dbCandidates, dbCompanies, toast]);

  // Recruiter: match candidates for a specific company
  const runCompanyCandidateMatch = useCallback(async () => {
    const company = dbCompanies.find((c) => c.id === selectedCompanyId);
    if (!company) {
      toast({ title: "Select a Company", description: "Choose a company to find matching candidates.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await matchCandidatesForCompany(company, dbCandidates);
    setLoading(false);
    if (!res.success) {
      toast({ title: "Matching Failed", description: res.error, variant: "destructive" });
      return;
    }
    setAiResults(res.data.results);
    toast({ title: "AI Matching Complete", description: `Found best candidates for ${company.name}.` });
  }, [dbCompanies, dbCandidates, selectedCompanyId, toast]);

  const clearFilters = useCallback(() => {
    setSkills([]);
    setSkillInput("");
    setMinExperience(0);
    setWorkPreference("Any");
    setWorkType("Any");
    setNotes("");
    setAiResults(null);
    setCompanyAiResults(null);
    setSelectedCompanyId("all");
  }, []);

  const activeFilterCount =
    skills.length +
    (minExperience > 0 ? 1 : 0) +
    (workPreference !== "Any" ? 1 : 0) +
    (workType !== "Any" ? 1 : 0);

  // Candidate role view
  if (role === "candidate") {
    return (
      <div className="min-h-screen dark elvish-gradient-deep text-foreground parchment-texture">
        <ElvishHeader />
        <div className="p-6 max-w-5xl mx-auto">
          <div className="text-center space-y-5 mb-8 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto elvish-glow">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Welcome to Your Dashboard</h1>
            <p className="text-muted-foreground font-body">
              {dbCandidates.length > 0
                ? "Your profile is live. Explore matching companies or update your profile."
                : "Complete your professional profile to start getting discovered."}
            </p>
            <ElvishDivider />
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/profile/new")} className="gap-2 font-display tracking-wide">
                <Plus className="h-4 w-4" />
                {dbCandidates.length > 0 ? "Update Profile" : "Create Profile"}
              </Button>
            </div>
          </div>

          {/* Companies for candidate */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold tracking-wide">
                  {dbLoading ? "Loading..." : `${scoredCompanies.length} Available Companies`}
                </h2>
                {companyAiResults && (
                  <Badge variant="default" className="gap-1 text-xs font-display">
                    <Sparkles className="h-3 w-3" /> AI Matched
                  </Badge>
                )}
              </div>
              <Button
                onClick={runCompanyMatching}
                disabled={loading || dbCompanies.length === 0 || dbCandidates.length === 0}
                className="gap-2 font-display tracking-wide"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analyzing..." : "Find My Best Fit"}
              </Button>
            </div>

            {dbLoading ? (
              <div className="text-center py-20">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary/40" />
                <p className="mt-3 text-sm text-muted-foreground font-body">Loading companies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scoredCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
                {scoredCompanies.length === 0 && (
                  <div className="col-span-2 text-center py-20 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-display">No companies available yet</p>
                    <p className="text-sm font-body mt-1">Check back soon for new opportunities.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Recruiter view
  return (
    <div className="min-h-screen dark elvish-gradient-deep text-foreground parchment-texture">
      <ElvishHeader />
      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r bg-card/50 p-5 space-y-5 overflow-y-auto">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold tracking-wide">Search & Match</h2>
          </div>

          <ElvishDivider />

          {/* Company-specific matching */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Match for Company</label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="h-9 font-body"><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Manual Filters</SelectItem>
                {dbCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ElvishDivider />

          {/* Skills input */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Required Skills</label>
            <div className="flex gap-1.5">
              <Input
                placeholder="e.g. React"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 font-body"
              />
              <Button size="sm" onClick={addSkill} className="h-9 px-3 shrink-0 font-display text-xs">Add</Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <Badge key={s} variant="default" className="gap-1 text-xs font-body">
                    {s}
                    <button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Min Experience */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Min Experience: {minExperience}+ years</label>
            <Slider value={[minExperience]} onValueChange={([v]) => setMinExperience(v)} max={15} step={1} />
          </div>

          {/* Work Preference */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Work Preference</label>
            <Select value={workPreference} onValueChange={setWorkPreference}>
              <SelectTrigger className="h-9 font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Type */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Work Type</label>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger className="h-9 font-body"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-display tracking-wide">Additional Notes</label>
            <Textarea placeholder="Describe your ideal candidate..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="font-body" />
          </div>

          <ElvishDivider />

          {/* Actions */}
          <div className="space-y-2">
            {selectedCompanyId !== "all" ? (
              <Button onClick={runCompanyCandidateMatch} disabled={loading || dbCandidates.length === 0} className="w-full gap-2 font-display tracking-wide">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                {loading ? "Matching..." : "AI Match for Company"}
              </Button>
            ) : (
              <Button onClick={runAIMatching} disabled={loading || dbCandidates.length === 0} className="w-full gap-2 font-display tracking-wide">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analyzing..." : "AI Match"}
              </Button>
            )}
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="w-full text-sm font-body">
                Clear Filters ({activeFilterCount})
              </Button>
            )}
          </div>
        </aside>

        {/* Main content with tabs */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="font-display">
                <TabsTrigger value="candidates" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Candidates
                </TabsTrigger>
                <TabsTrigger value="companies" className="gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Companies
                </TabsTrigger>
              </TabsList>
              {aiResults && activeTab === "candidates" && (
                <Badge variant="default" className="gap-1 text-xs font-display">
                  <Sparkles className="h-3 w-3" /> AI Matched
                </Badge>
              )}
            </div>

            <TabsContent value="candidates" className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-wide">
                  {dbLoading ? "Loading..." : `${scoredCandidates.length} Candidates`}
                </h2>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-muted-foreground font-body">
                    {activeFilterCount} filter{activeFilterCount !== 1 && "s"} active
                  </p>
                )}
              </header>

              {dbLoading ? (
                <div className="text-center py-20">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary/40" />
                  <p className="mt-3 text-sm text-muted-foreground font-body">Loading candidates...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scoredCandidates.map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                  {scoredCandidates.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-display">No candidates found</p>
                      <p className="text-sm font-body mt-1">Adjust your filters or check back later.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-wide">
                  {dbLoading ? "Loading..." : `${dbCompanies.length} Companies`}
                </h2>
              </header>

              {dbLoading ? (
                <div className="text-center py-20">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary/40" />
                  <p className="mt-3 text-sm text-muted-foreground font-body">Loading companies...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {dbCompanies.map((company) => (
                      <CompanyCard key={company.id} company={{ ...company, score: 0 }} />
                    ))}
                  </div>
                  {dbCompanies.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-display">No companies listed</p>
                      <p className="text-sm font-body mt-1">Companies will appear here once added.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
