import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MessageSquareCode } from "lucide-react";
import { callFn } from "@/lib/aiClient";

export const Route = createFileRoute("/interview/")({ component: InterviewLanding });

const DOMAINS = ["Python", "Java", "JavaScript / Web Dev", "React", "Node.js", "Data Science", "Machine Learning", "DevOps", "System Design", "SQL & Databases"];

function InterviewLanding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [domain, setDomain] = useState("React");
  const [difficulty, setDifficulty] = useState("medium");
  const [starting, setStarting] = useState(false);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("interview_sessions").select("*").eq("candidate_id", user.id).order("created_at", { ascending: false }).limit(10).then(({ data }) => setPast(data ?? []));
  }, [user]);

  const start = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const { data: session, error } = await supabase.from("interview_sessions").insert({
        candidate_id: user.id, domain, difficulty,
      }).select().single();
      if (error) throw error;

      const qs = await callFn<{ questions: { question: string; expected_keywords: string[] }[] }>("ai-generate-interview", {
        domain, difficulty, count: 5,
      });

      const rows = qs.questions.map((q, i) => ({
        session_id: session.id, question_index: i, question: q.question, expected_keywords: q.expected_keywords,
      }));
      await supabase.from("interview_questions").insert(rows);

      navigate({ to: "/interview/$id", params: { id: session.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Mock Interview</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Practice like it's the real thing.</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Pick a domain. Get 5 timed questions. Receive scored feedback and a final report.</p>

      <Card className="mt-8 grid gap-4 p-6 md:grid-cols-2">
        <div>
          <Label>Domain</Label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button onClick={start} disabled={starting} className="w-full bg-foreground text-background hover:bg-foreground/90">
            {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating questions…</> : <><MessageSquareCode className="mr-2 h-4 w-4" />Start interview</>}
          </Button>
        </div>
      </Card>

      <h2 className="mt-12 font-display text-2xl font-bold">Past sessions</h2>
      <div className="mt-4 space-y-2">
        {past.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        {past.map((s) => (
          <Link key={s.id} to="/interview/$id" params={{ id: s.id }}>
            <Card className="flex items-center justify-between p-4 hover:shadow-soft">
              <div>
                <div className="font-semibold">{s.domain} · <span className="font-normal text-muted-foreground">{s.difficulty}</span></div>
                <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                {s.total_score != null ? <div className="font-display text-2xl font-bold">{s.total_score}<span className="text-sm text-muted-foreground">/100</span></div> : <span className="rounded-full bg-warning/20 px-2 py-1 text-xs">{s.status}</span>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
