import { useNavigate } from "react-router-dom";
import { Sparkles, ScrollText, Users, Shield, Leaf, Flame, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElvishArch } from "@/components/ElvishArch";
import { ElvishVineBorder } from "@/components/ElvishVineBorder";
import { ElvishCornerOrnament } from "@/components/ElvishCornerOrnament";
import { ElvishDivider } from "@/components/ElvishDivider";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen dark elvish-gradient-deep text-foreground overflow-hidden">
      {/* Corner ornaments */}
      <ElvishCornerOrnament position="top-left" className="fixed top-0 left-0 z-0" />
      <ElvishCornerOrnament position="top-right" className="fixed top-0 right-0 z-0" />
      <ElvishCornerOrnament position="bottom-left" className="fixed bottom-0 left-0 z-0" />
      <ElvishCornerOrnament position="bottom-right" className="fixed bottom-0 right-0 z-0" />

      <div className="fixed inset-0 elvish-ornament-bg pointer-events-none z-0" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-lg tracking-widest text-foreground">
            Elvish Talents
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-display tracking-[0.2em] uppercase">
          <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="text-muted-foreground hover:text-primary transition-colors">About</button>
          <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="text-muted-foreground hover:text-primary transition-colors">Features</button>
          <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-muted-foreground hover:text-primary transition-colors">How It Works</button>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="font-display tracking-widest border-primary/30 text-primary hover:bg-primary/10">
            Get Started
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="md:hidden font-display tracking-widest border-primary/30 text-primary">
          Get Started
        </Button>
      </nav>

      <ElvishVineBorder className="relative z-10 opacity-60" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">
        <ElvishArch className="w-56 md:w-72 h-auto mb-8 animate-fade-in-up" />
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-wider elvish-text-glow animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          Where Talent Meets Opportunity
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground font-body text-lg md:text-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          A recruitment platform powered by AI intelligence — connecting exceptional professionals with the organizations that need them most.
        </p>
        <div className="mt-8 flex gap-4 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
          <Button onClick={() => navigate("/auth")} className="font-display tracking-widest px-8 py-3 text-base elvish-glow-strong gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} className="font-display tracking-widest px-8 py-3 text-base border-primary/30 text-primary hover:bg-primary/10">
            Learn More
          </Button>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Leaf, title: "Smart Profiles", desc: "Create your professional profile once — our AI extracts and organizes your skills, experience, and strengths automatically." },
            { icon: Star, title: "AI-Powered Matching", desc: "Advanced intelligence analyzes every candidate against your requirements, ranking and summarizing the best fits instantly." },
            { icon: Flame, title: "Built for Scale", desc: "Enterprise-grade security and performance ensure your data is protected while delivering lightning-fast results." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="elvish-card p-6 text-center space-y-3 hover:elvish-glow transition-shadow duration-500">
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center mx-auto">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-base tracking-wide">{title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <ElvishVineBorder className="relative z-10 opacity-40" />

      {/* About Section */}
      <section id="about" className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="font-display text-2xl md:text-3xl tracking-wider">Recruitment, Reimagined</h2>
          <ElvishDivider />
          <p className="text-muted-foreground font-body text-lg leading-relaxed">
            <span className="text-primary font-semibold">Elvish Talents</span> bridges the gap between 
            talented professionals and forward-thinking organizations. Our platform combines elegant design 
            with powerful AI to make the hiring process faster, smarter, and more human.
          </p>
          <p className="text-muted-foreground font-body text-base leading-relaxed">
            Whether you're a developer, designer, engineer, or strategist — your experience deserves 
            to be seen by the right people. And if you're hiring, our intelligent matching ensures 
            you find exactly who you're looking for.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-display text-2xl md:text-3xl tracking-wider">How It Works</h2>
            <ElvishDivider />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Candidates path */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                  <ScrollText className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wide">For Candidates</h3>
              </div>
              <div className="space-y-4 pl-5 border-l border-primary/10">
                {[
                  { step: "01", text: "Create your free account and choose the Candidate role." },
                  { step: "02", text: "Upload your CV — our AI automatically extracts your key details." },
                  { step: "03", text: "Review, refine, and publish your professional profile." },
                  { step: "04", text: "Get discovered by recruiters using intelligent matching." },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-3">
                    <span className="font-display text-sm text-primary shrink-0 w-6">{step}</span>
                    <p className="text-sm text-muted-foreground font-body">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruiters path */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wide">For Recruiters</h3>
              </div>
              <div className="space-y-4 pl-5 border-l border-primary/10">
                {[
                  { step: "01", text: "Sign up as a Recruiter and access the talent dashboard." },
                  { step: "02", text: "Browse candidates with advanced filters for skills, experience, and more." },
                  { step: "03", text: "Use AI-powered matching to rank and evaluate candidates instantly." },
                  { step: "04", text: "Find your ideal hire with detailed summaries and match scores." },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-3">
                    <span className="font-display text-sm text-primary shrink-0 w-6">{step}</span>
                    <p className="text-sm text-muted-foreground font-body">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ElvishVineBorder className="relative z-10 opacity-40" />

      {/* Trust Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-wider">Why Choose Elvish Talents</h2>
          <ElvishDivider />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Enterprise Security", desc: "Your data is encrypted end-to-end with role-based access controls and secure authentication." },
              { icon: Sparkles, title: "Intelligent Parsing", desc: "Our AI reads and structures CVs in seconds, saving hours of manual data entry." },
              { icon: ScrollText, title: "One Profile, Full Reach", desc: "Create your profile once and be visible to every recruiter on the platform." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-3">
                <Icon className="h-6 w-6 text-primary mx-auto" />
                <h4 className="font-display text-sm tracking-wide">{title}</h4>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-2xl md:text-3xl tracking-wider elvish-text-glow">Ready to Get Started?</h2>
          <p className="text-muted-foreground font-body text-lg">
            Join a growing community of professionals and recruiters. Your next opportunity is just a few clicks away.
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="font-display tracking-widest px-10 py-4 text-base elvish-glow-strong gap-2">
            Create Your Account <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <ElvishVineBorder className="relative z-10 opacity-30" />

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <span className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Elvish Talents
          </span>
          <div className="w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center">
            <Star className="h-3 w-3 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()} Elvish Talents. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
