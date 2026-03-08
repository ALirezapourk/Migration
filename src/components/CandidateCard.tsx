import { ScoredCandidate } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase, Monitor, Sparkles } from "lucide-react";

interface CandidateCardProps {
  candidate: ScoredCandidate;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-accent text-accent-foreground border-primary/30";
  if (score >= 60) return "bg-muted text-muted-foreground border-border";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

function availabilityColor(availability: string): string {
  if (availability === "Immediately") return "text-accent-foreground font-semibold";
  if (availability === "2 weeks") return "text-muted-foreground";
  return "text-muted-foreground";
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="hover:elvish-glow transition-shadow duration-300 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-base truncate">{candidate.name}</h3>
            <p className="text-sm text-muted-foreground font-body truncate">{candidate.title}</p>
          </div>
          <div
            className={`shrink-0 px-2.5 py-1 rounded-md text-sm font-bold border font-display ${scoreColor(candidate.score)}`}
          >
            {candidate.score}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {candidate.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs font-body">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-y-1.5 text-sm font-body">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{candidate.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{candidate.experience}yr · {candidate.domain}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Monitor className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{candidate.workPreference} · {candidate.workType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={`truncate text-sm ${availabilityColor(candidate.availability)}`}>
              {candidate.availability}
            </span>
          </div>
        </div>

        {/* AI Analysis or Summary */}
        {candidate.aiSummary ? (
          <div className="rounded-md bg-accent/50 border border-primary/15 p-3">
            <div className="flex items-center gap-1.5 text-xs font-display font-medium text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Elvish Insight
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-body italic">
              {candidate.aiSummary}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed font-body">
            {candidate.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
