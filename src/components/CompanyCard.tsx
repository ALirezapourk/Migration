import { ScoredCompany } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Users, Monitor, Sparkles, DollarSign } from "lucide-react";

interface CompanyCardProps {
  company: ScoredCompany;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-accent text-accent-foreground border-primary/30";
  if (score >= 60) return "bg-muted text-muted-foreground border-border";
  return "bg-destructive/10 text-destructive border-destructive/30";
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Card className="hover:elvish-glow transition-shadow duration-300 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-base truncate">{company.name}</h3>
            <p className="text-sm text-muted-foreground font-body truncate">{company.industry} · {company.size}</p>
          </div>
          {company.score > 0 && (
            <div className={`shrink-0 px-2.5 py-1 rounded-md text-sm font-bold border font-display ${scoreColor(company.score)}`}>
              {company.score}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Required Skills */}
        <div className="flex flex-wrap gap-1">
          {company.requiredSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs font-body">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-y-1.5 text-sm font-body">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{company.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{company.minExperience}yr+ · {company.domain}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Monitor className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{company.workPreference} · {company.workType}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{company.budgetRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{company.openPositions} open position{company.openPositions !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* AI Summary or Description */}
        {company.aiSummary ? (
          <div className="rounded-md bg-accent/50 border border-primary/15 p-3">
            <div className="flex items-center gap-1.5 text-xs font-display font-medium text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI Insight
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-body italic">
              {company.aiSummary}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed font-body">
            {company.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
