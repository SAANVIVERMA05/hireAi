import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { callFn } from "@/lib/aiClient";

export const Route = createFileRoute("/analyzer")({ component: Analyzer });

function Analyzer() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [jd, setJd] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const analyze = async () => {
    if (!profile?.resume_text) {
      toast.error("Upload a resume in your profile first.");
      return;
    }
    setRunning(true);
    try {
      const res = await callFn<any>("ai-analyze-resume", {
        resumeText: profile.resume_text,
        jobDescription: jd || null,
      });
      setResult(res);
      await supabase.from("resume_analyses").insert({
        candidate_id: user!.id,
        ats_score: res.ats_score,
        extracted_skills: res.extracted_skills,
        missing_skills: res.missing_skills,
        suggestions: res.suggestions,
        summary: res.summary,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Analysis failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Resume AI</p>
      <h1 className="mt-1 font-display text-4xl font-bold">ATS Resume Analyzer</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Get an instant score, skill gaps, and concrete suggestions. Optionally paste a job description for targeted feedback.</p>

      <Card className="mt-8 p-6">
        {!profile?.resume_text ? (
          <div className="text-center text-muted-foreground">
            No resume found. <a className="font-semibold text-accent underline" href="/profile">Upload one</a> first.
          </div>
        ) : (
          <>
            <Label>Job description (optional)</Label>
            <Textarea rows={6} placeholder="Paste a job description for targeted analysis…" value={jd} onChange={(e) => setJd(e.target.value)} />
            <Button onClick={analyze} disabled={running} className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</> : <><Sparkles className="mr-2 h-4 w-4" />Analyze my resume</>}
            </Button>
          </>
        )}
      </Card>

      {result && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="bg-foreground p-6 text-background md:col-span-2">
            <div className="text-xs uppercase tracking-widest opacity-60">ATS Score</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-7xl font-bold">{result.ats_score}</span>
              <span className="text-xl opacity-60">/ 100</span>
            </div>
            <Progress value={result.ats_score} className="mt-4 bg-background/20" />
            <p className="mt-4 opacity-90">{result.summary}</p>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><CheckCircle2 className="h-5 w-5 text-success" />Detected skills</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.extracted_skills?.map((s: string) => (
                <span key={s} className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">{s}</span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-warning" />Missing / weak</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.missing_skills?.length ? result.missing_skills.map((s: string) => (
                <span key={s} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{s}</span>
              )) : <span className="text-sm text-muted-foreground">Nothing critical missing.</span>}
            </div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <h3 className="font-display text-lg font-semibold">Suggestions</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {result.suggestions?.map((s: string, i: number) => (
                <li key={i} className="flex gap-2"><span className="text-accent">→</span>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </main>
  );
}
