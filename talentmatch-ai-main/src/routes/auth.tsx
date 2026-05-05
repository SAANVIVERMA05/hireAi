import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Briefcase, User } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState("signin");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created!");
    navigate({ to: "/dashboard" });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <Link to="/" className="mb-6 inline-block text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="font-display text-3xl font-bold">Welcome to HireAI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in or create your account.</p>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div><Label htmlFor="se">Email</Label><Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="sp">Password</Label><Input id="sp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div><Label>I am a...</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="mt-2 grid grid-cols-2 gap-2">
                  <Label htmlFor="rc" className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${role === "candidate" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem id="rc" value="candidate" /><User className="h-4 w-4" /> Candidate
                  </Label>
                  <Label htmlFor="rr" className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${role === "recruiter" ? "border-accent bg-accent/5" : "border-border"}`}>
                    <RadioGroupItem id="rr" value="recruiter" /><Briefcase className="h-4 w-4" /> Recruiter
                  </Label>
                </RadioGroup>
              </div>
              <div><Label htmlFor="fn">Full name</Label><Input id="fn" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><Label htmlFor="ue">Email</Label><Input id="ue" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="up">Password</Label><Input id="up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
