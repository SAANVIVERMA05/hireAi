import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { callFn } from "@/lib/aiClient";

export const Route = createFileRoute("/interview/$id")({ component: InterviewSession });

const TIME_PER_Q = 120; // seconds

function InterviewSession() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [tabSwitches, setTabSwitches] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("interview_sessions").select("*").eq("id", id).maybeSingle();
      setSession(s);
      setTabSwitches(s?.tab_switches ?? 0);
      const { data: qs } = await supabase.from("interview_questions").select("*").eq("session_id", id).order("question_index");
      setQuestions(qs ?? []);
      // resume to first unanswered question
      const firstUn = (qs ?? []).findIndex((q) => !q.answer);
      setIdx(firstUn === -1 ? (qs?.length ?? 1) - 1 : firstUn);
      if (s?.status === "completed") setIdx(qs?.length ?? 0);
    })();
  }, [id, user]);

  // Tab switch tracking
  useEffect(() => {
    if (session?.status === "completed") return;
    const onVis = async () => {
      if (document.hidden) {
        setTabSwitches((n) => {
          const next = n + 1;
          supabase.from("interview_sessions").update({ tab_switches: next }).eq("id", id);
          toast.warning("Tab switch detected — this is being recorded.");
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [id, session?.status]);

  // Per-question timer
  useEffect(() => {
    if (session?.status === "completed") return;
    setTimeLeft(TIME_PER_Q);
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); submit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, session?.status]);

  const current = questions[idx];

  const submit = async (auto = false) => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      const evalRes = await callFn<{ score: number; feedback: string }>("ai-evaluate-answer", {
        question: current.question,
        expectedKeywords: current.expected_keywords,
        answer: answer || (auto ? "(no answer)" : answer),
        domain: session.domain,
      });
      await supabase.from("interview_questions").update({
        answer: answer || "", score: evalRes.score, feedback: evalRes.feedback,
      }).eq("id", current.id);
      const updated = [...questions];
      updated[idx] = { ...current, answer, score: evalRes.score, feedback: evalRes.feedback };
      setQuestions(updated);
      setAnswer("");

      if (idx + 1 >= questions.length) {
        // finalize
        const total = Math.round(updated.reduce((s, q) => s + (q.score ?? 0), 0) / updated.length);
        const summary = await callFn<{ feedback: string }>("ai-summarize-interview", {
          domain: session.domain,
          questions: updated.map((q) => ({ q: q.question, a: q.answer, score: q.score, fb: q.feedback })),
          tabSwitches,
        });
        await supabase.from("interview_sessions").update({
          status: "completed", total_score: total, feedback: summary.feedback,
          duration_seconds: Math.round((Date.now() - startedAt.current) / 1000), completed_at: new Date().toISOString(),
        }).eq("id", id);
        const { data: s } = await supabase.from("interview_sessions").select("*").eq("id", id).maybeSingle();
        setSession(s);
        setIdx(questions.length);
      } else {
        setIdx(idx + 1);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to evaluate");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  // RESULTS view
  if (session.status === "completed") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Interview report</p>
        <h1 className="mt-1 font-display text-4xl font-bold">{session.domain}</h1>
        <Card className="mt-6 bg-foreground p-8 text-background">
          <div className="text-xs uppercase tracking-widest opacity-60">Final Score</div>
          <div className="mt-2 font-display text-7xl font-bold">{session.total_score}<span className="text-2xl opacity-60">/100</span></div>
          <p className="mt-4 opacity-90 whitespace-pre-wrap">{session.feedback}</p>
          {tabSwitches > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4" />{tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""} detected during session.</p>}
        </Card>
        <div className="mt-6 space-y-3">
          {questions.map((q, i) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">Q{i + 1}. {q.question}</h3>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold">{q.score ?? 0}/10</span>
              </div>
              <p className="mt-2 text-sm italic text-muted-foreground">"{q.answer || "(no answer)"}"</p>
              <p className="mt-2 text-sm">{q.feedback}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate({ to: "/interview" })} className="bg-foreground text-background hover:bg-foreground/90">New session</Button>
        </div>
      </main>
    );
  }

  // ACTIVE question view
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Question {idx + 1} of {questions.length}</span>
        <div className="flex items-center gap-4">
          {tabSwitches > 0 && <span className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{tabSwitches} switch{tabSwitches > 1 ? "es" : ""}</span>}
          <span className="flex items-center gap-1 font-mono"><Clock className="h-4 w-4" />{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
        </div>
      </div>
      <Progress value={(idx / questions.length) * 100} className="mt-2" />

      {current && (
        <Card className="mt-6 p-8 shadow-soft">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{session.domain} · {session.difficulty}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-snug">{current.question}</h2>
          <Textarea autoFocus rows={8} className="mt-6" placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => submit(false)} disabled={submitting} className="bg-foreground text-background hover:bg-foreground/90">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Evaluating…</> : (idx + 1 >= questions.length ? "Submit & finish" : "Next question")}
            </Button>
          </div>
        </Card>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">⚠️ Stay on this tab — switches are recorded.</p>
    </main>
  );
}
