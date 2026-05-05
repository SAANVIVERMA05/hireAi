import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, MapPin, Sparkles, Loader2 } from "lucide-react";
import { callFn } from "@/lib/aiClient";

export const Route = createFileRoute("/jobs/$id")({ component: JobDetail });

function JobDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [coverNote, setCoverNote] = useState("");
  const [existing, setExisting] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: j } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      setJob(j);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      if (role === "candidate") {
        const { data: a } = await supabase.from("applications").select("*").eq("job_id", id).eq("candidate_id", user.id).maybeSingle();
        setExisting(a);
      }
      if (role === "recruiter" && j?.recruiter_id === user.id) {
        const { data: list } = await supabase.from("applications")
          .select("*, profiles!applications_candidate_id_fkey(*)")
          .eq("job_id", id).order("match_score", { ascending: false, nullsFirst: false });
        setApps(list ?? []);
      }
    })();
  }, [id, user, role]);

  const apply = async () => {
    if (!user || !job) return;
    if (!profile?.resume_text) {
      toast.error("Upload a resume in your profile first.");
      navigate({ to: "/profile" });
      return;
    }
    setApplying(true);
    try {
      // Get AI match score
      const match = await callFn<{ score: number; matched: string[]; missing: string[]; rationale: string }>("ai-match-resume", {
        resumeText: profile.resume_text,
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.required_skills,
      });
      const { error } = await supabase.from("applications").insert({
        job_id: job.id, candidate_id: user.id, cover_note: coverNote,
        match_score: match.score, match_breakdown: match,
      });
      if (error) throw error;
      toast.success(`Applied! Match score: ${match.score}/100`);
      const { data: a } = await supabase.from("applications").select("*").eq("job_id", id).eq("candidate_id", user.id).maybeSingle();
      setExisting(a);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const setStatus = async (appId: string, status: any) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
    toast.success(`Marked ${status}`);
  };

  if (!job) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  const isRecruiterOwner = role === "recruiter" && job.recruiter_id === user?.id;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Card className="p-8 shadow-soft">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Open role</p>
        <h1 className="mt-1 font-display text-4xl font-bold">{job.title}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.experience_required}+ yrs · {job.employment_type}</span>
          {job.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>}
        </div>
        <p className="mt-6 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(job.required_skills ?? []).map((s: string) => (
              <span key={s} className="rounded-full bg-secondary px-3 py-1 text-sm">{s}</span>
            ))}
          </div>
        </div>
      </Card>

      {role === "candidate" && (
        <Card className="mt-6 p-8">
          {existing ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">You've applied</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(existing.status)}`}>{existing.status}</span>
              </div>
              {existing.match_score != null && (
                <div className="mt-4 rounded-xl bg-muted p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">AI Match Score</div>
                  <div className="mt-1 font-display text-4xl font-bold">{existing.match_score}<span className="text-lg text-muted-foreground">/100</span></div>
                  {existing.match_breakdown?.rationale && <p className="mt-2 text-sm text-muted-foreground">{existing.match_breakdown.rationale}</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-semibold">Apply to this role</h3>
              <p className="mt-1 text-sm text-muted-foreground">We'll compute your AI match score based on your uploaded resume.</p>
              <Textarea className="mt-4" rows={4} placeholder="Optional cover note…" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} />
              <Button onClick={apply} disabled={applying} className="mt-4 bg-foreground text-background hover:bg-foreground/90">
                {applying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scoring…</> : <><Sparkles className="mr-2 h-4 w-4" />Apply with AI match</>}
              </Button>
            </>
          )}
        </Card>
      )}

      {isRecruiterOwner && (
        <div className="mt-8">
          <h2 className="font-display text-2xl font-bold">Applicants ({apps.length})</h2>
          <div className="mt-4 space-y-3">
            {apps.length === 0 && <Card className="p-8 text-center text-muted-foreground">No applications yet.</Card>}
            {apps.map((a) => (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg font-semibold">{a.profiles?.full_name || "Candidate"}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(a.status)}`}>{a.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.profiles?.headline}</p>
                    {a.profiles?.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.profiles.skills.slice(0, 6).map((s: string) => (
                          <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                    {a.match_breakdown?.rationale && <p className="mt-3 text-sm">{a.match_breakdown.rationale}</p>}
                    {a.cover_note && <p className="mt-2 text-sm italic text-muted-foreground">"{a.cover_note}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {a.match_score != null && (
                      <div className="text-right">
                        <div className="font-display text-3xl font-bold">{a.match_score}</div>
                        <div className="text-xs text-muted-foreground">match</div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "shortlisted")}>Shortlist</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "selected")}>Select</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function statusColor(s: string) {
  return {
    applied: "bg-secondary text-secondary-foreground",
    shortlisted: "bg-warning/20 text-warning-foreground",
    selected: "bg-success/20 text-success",
    rejected: "bg-destructive/15 text-destructive",
  }[s] || "bg-secondary";
}
