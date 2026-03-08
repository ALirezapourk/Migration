import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, ScrollText, Users, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ElvishHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:elvish-glow transition-shadow">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide text-foreground leading-none">
              Elvish Talents
            </h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">
              Fellowship of Recruitment
            </p>
          </div>
        </button>

        {user && (
          <div className="flex items-center gap-3">
            {role === "candidate" && location.pathname !== "/profile/new" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile/new")}
                className="gap-2 font-body"
              >
                <ScrollText className="h-4 w-4" />
                My Profile
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 font-body"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            {role === "recruiter" && location.pathname !== "/dashboard" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2 font-body"
              >
                <Users className="h-4 w-4" />
                Dashboard
              </Button>
            )}
            <span className="text-xs text-muted-foreground font-body capitalize border border-border rounded-full px-3 py-1">
              {role || "—"}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
