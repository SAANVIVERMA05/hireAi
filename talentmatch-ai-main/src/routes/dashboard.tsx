import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Sparkles, MessageSquareCode, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ jobs?: number; applications?: number; analyses?: number; interviews?: number }>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !role) return;
    (async () => {
      if (role === "recruiter") {
        const [{ count: jobs }, { count: applications }] = await Promise.all([
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("recruiter_id", user.id),
          supabase.from("applications").select("*, jobs!inner(recruiter_id)", { count: "exact", head: true }).eq("jobs.recruiter_id", user.id),
        ]);
        setStats({ jobs: jobs ?? 0, applications: applications ?? 0 });
      } else {
        const [{ count: applications }, { count: analyses }, { count: interviews }] = await Promise.all([
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("candidate_id", user.id),
          supabase.from("resume_analyses").select("*", { count: "exact", head: true }).eq("candidate_id", user.id),
          supabase.from("interview_sessions").select("*", { count: "exact", head: true }).eq("candidate_id", user.id),
        ]);
        setStats({ applications: applications ?? 0, analyses: analyses ?? 0, interviews: interviews ?? 0 });
      }
    })();
  }, [user, role]);

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
            Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}.
          </h1>
        </div>
        {role === "recruiter" ? (
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link to="/jobs/new"><Plus className="mr-1 h-4 w-4" />Post a job</Link>
          </Button>
        ) : (
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
        )}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {role === "recruiter" ? (
          <>
            <StatCard icon={Briefcase} label="Posted jobs" value={stats.jobs ?? "—"} to="/jobs" />
            <StatCard icon={Users} label="Total applications" value={stats.applications ?? "—"} to="/applications" />
            <ActionCard icon={Plus} title="Post new role" desc="Create a job listing" to="/jobs/new" />
            <ActionCard icon={FileText} title="Review applicants" desc="Match scores & status" to="/applications" />
          </>
        ) : (
          <>
            <StatCard icon={FileText} label="Applications" value={stats.applications ?? "—"} to="/applications" />
            <StatCard icon={Sparkles} label="Resume analyses" value={stats.analyses ?? "—"} to="/analyzer" />
            <StatCard icon={MessageSquareCode} label="Mock interviews" value={stats.interviews ?? "—"} to="/interview" />
            <ActionCard icon={Briefcase} title="Find a job" desc="Browse open roles" to="/jobs" />
          </>
        )}
      </div>

      {role === "candidate" && (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card className="bg-foreground p-6 text-background">
            <Sparkles className="h-6 w-6" />
            <h3 className="mt-4 font-display text-xl font-semibold">Get an instant ATS score</h3>
            <p className="mt-1 text-sm opacity-80">Upload your resume and get scored 0–100, with missing-skill suggestions.</p>
            <Button asChild variant="secondary" className="mt-4 w-fit"><Link to="/analyzer">Analyze resume</Link></Button>
          </Card>
          <Card className="bg-gradient-accent p-6 text-accent-foreground">
            <MessageSquareCode className="h-6 w-6" />
            <h3 className="mt-4 font-display text-xl font-semibold">Practice with AI mock interview</h3>
            <p className="mt-1 text-sm opacity-90">Pick a domain. Real questions. Real-time scoring.</p>
            <Button asChild variant="secondary" className="mt-4 w-fit"><Link to="/interview">Start practicing</Link></Button>
          </Card>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to}>
      <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-3 font-display text-4xl font-bold">{value}</div>
      </Card>
    </Link>
  );
}

function ActionCard({ icon: Icon, title, desc, to }: any) {
  return (
    <Link to={to}>
      <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
        <Icon className="h-5 w-5 text-accent" />
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </Card>
    </Link>
  );
}
