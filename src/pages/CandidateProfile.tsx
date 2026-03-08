import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ElvishHeader } from "@/components/ElvishHeader";
import { ElvishDivider } from "@/components/ElvishDivider";

export default function CandidateProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState(0);
  const [location, setLocation] = useState("");
  const [workPreference, setWorkPreference] = useState("Remote");
  const [availability, setAvailability] = useState("2 weeks");
  const [workType, setWorkType] = useState("Full-time");
  const [domain, setDomain] = useState("");
  const [summary, setSummary] = useState("");
  const [extracted, setExtracted] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    if (f) setFile(f);
  }, [toast]);

  const parseCV = useCallback(async () => {
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cvText: text, fileName: file.name },
      });
      if (error) throw error;
      const ex = data.extracted;
      if (ex) {
        setName(ex.name || "");
        setTitle(ex.title || "");
        setSkills(Array.isArray(ex.skills) ? ex.skills : []);
        setExperience(typeof ex.experience === "number" ? ex.experience : 0);
        setLocation(ex.location || "");
        setWorkPreference(ex.workPreference || "Remote");
        setAvailability(ex.availability || "2 weeks");
        setWorkType(ex.workType || "Full-time");
        setDomain(ex.domain || "");
        setSummary(ex.summary || "");
        setExtracted(true);
        toast({ title: "CV Parsed Successfully", description: "Review your extracted details below." });
      }
    } catch (e) {
      toast({ title: "Reading failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }, [file, toast]);

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  }, [skillInput, skills]);

  const removeSkill = useCallback((s: string) => {
    setSkills((prev) => prev.filter((sk) => sk !== s));
  }, []);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      let cvPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("cv-uploads").upload(path, file);
        if (uploadError) throw uploadError;
        cvPath = path;
      }
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        name, title, skills, experience, location,
        work_preference: workPreference,
        availability, work_type: workType, domain, summary,
        cv_file_path: cvPath, is_draft: false,
      });
      if (error) throw error;
      toast({ title: "Profile Published!", description: "Your profile is now visible to recruiters." });
      navigate("/");
    } catch (e) {
      toast({ title: "Publishing failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, file, name, title, skills, experience, location, workPreference, availability, workType, domain, summary, navigate, toast]);

  return (
    <div className="min-h-screen dark elvish-gradient-deep text-foreground">
      <ElvishHeader />
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold tracking-wide">Create Your Profile</h1>
          <p className="text-muted-foreground font-body">
            Upload your CV and our AI will extract your details automatically. Review and publish when ready.
          </p>
        </div>

        <ElvishDivider />

        {/* CV Upload */}
        <Card className="border-primary/10 elvish-glow animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2 tracking-wide">
              <Upload className="h-5 w-5 text-primary" /> Upload Your CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="font-body" />
              </div>
              <Button onClick={parseCV} disabled={!file || parsing} className="gap-2 shrink-0 font-display text-sm tracking-wide">
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {parsing ? "Extracting..." : "Extract with AI"}
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                <FileText className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <button onClick={() => setFile(null)}><X className="h-3 w-3" /></button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border-primary/10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="font-display text-lg tracking-wide">
              {extracted ? "Review Your Details" : "Enter Your Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Legolas Greenleaf" className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Master Archer" className="font-body" />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="font-display text-xs tracking-wide">Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. Archery"
                  className="font-body"
                />
                <Button variant="outline" size="sm" onClick={addSkill} className="shrink-0 font-display text-xs">Add</Button>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Experience: {experience}+ years</Label>
                <Slider value={[experience]} onValueChange={([v]) => setExperience(v)} max={30} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rivendell" className="font-body" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Work Preference</Label>
                <Select value={workPreference} onValueChange={setWorkPreference}>
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Work Type</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-display text-xs tracking-wide">Availability</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediately">Immediately</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                    <SelectItem value="3 months">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-display text-xs tracking-wide">Domain</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g. Elvish Engineering" className="font-body" />
            </div>

            <div className="space-y-2">
              <Label className="font-display text-xs tracking-wide">Professional Summary</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Speak of your journey..." className="font-body" />
            </div>

            <ElvishDivider />

            <Button onClick={saveProfile} disabled={saving || !name} className="w-full gap-2 font-display tracking-wide">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Publishing..." : "Publish Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
