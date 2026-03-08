import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, Sparkles, ArrowLeft } from "lucide-react";
import { ElvishDivider } from "@/components/ElvishDivider";
import { ElvishArch } from "@/components/ElvishArch";
import { ElvishCornerOrnament } from "@/components/ElvishCornerOrnament";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<string>("candidate");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { display_name: signupName, role: signupRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen dark elvish-gradient-deep text-foreground flex items-center justify-center relative overflow-hidden">
      {/* Corner ornaments */}
      <ElvishCornerOrnament position="top-left" className="absolute top-0 left-0" />
      <ElvishCornerOrnament position="top-right" className="absolute top-0 right-0" />
      <ElvishCornerOrnament position="bottom-left" className="absolute bottom-0 left-0" />
      <ElvishCornerOrnament position="bottom-right" className="absolute bottom-0 right-0" />

      <div className="absolute inset-0 elvish-ornament-bg pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-display tracking-wide"
      >
        <ArrowLeft className="h-4 w-4" />
        Return
      </button>

      <div className="relative z-10 w-full max-w-md px-4 space-y-6 animate-fade-in-up">
        {/* Header with arch */}
        <div className="text-center space-y-2">
          <ElvishArch className="w-32 h-auto mx-auto opacity-40" />
          <h1 className="font-display text-3xl font-bold tracking-wider elvish-text-glow -mt-16 relative z-10">
            Welcome Back
          </h1>
          <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground font-body">
            Sign in to your account or create a new one
          </p>
          <ElvishDivider className="pt-2" />
        </div>

        <Card className="border-primary/15 elvish-glow bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl tracking-wide">Your Account</CardTitle>
            <CardDescription className="font-body">Access the Elvish Talents platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger value="signin" className="font-display text-sm tracking-wide">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-display text-sm tracking-wide">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-body">Email</Label>
                    <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="elf@rivendell.me" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="font-body">Password</Label>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full font-display tracking-widest elvish-glow" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="font-body">Full Name</Label>
                    <Input id="signup-name" required value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Legolas Greenleaf" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="font-body">Email</Label>
                    <Input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="elf@rivendell.me" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="font-body">Password</Label>
                    <Input id="signup-password" type="password" required minLength={6} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">I am a...</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidate">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Candidate (looking for opportunities)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="recruiter">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Recruiter (hiring talent)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full font-display tracking-widest elvish-glow" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-body">
          By signing up, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
