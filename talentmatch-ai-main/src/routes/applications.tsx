import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/applications")({ component: Applications });

function Applications() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !role) return;
    (async () => {
      if (role === "candidate") {
        const { data } = await supabase.from("applications")
          .select("*, jobs(*)").eq("candidate_id", user.id).order("created_at", { ascending: false });
        setItems(data ?? []);
      } else {
        const { data } = await supabase.from("applications")
          .select("*, jobs!inner(*), profiles!applications_candidate_id_fkey(full_name, headline)")
          .eq("jobs.recruiter_id", user.id).order("created_at", { ascending: false });
        setItems(data ?? []);
      }
    })();
  }, [user, role]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Applications</p>
      <h1 className="mt-1 font-display text-4xl font-bold">{role === "recruiter" ? "All applicants" : "Your applications"}</h1>

      <div className="mt-8 space-y-3">
        {items.length === 0 && <Card className="p-12 text-center text-muted-foreground">Nothing here yet.</Card>}
        {items.map((a) => (
          <Link key={a.id} to="/jobs/$id" params={{ id: a.job_id }}>
            <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">{a.jobs?.title}</h3>
                  {role === "recruiter" && a.profiles && (
                    <p className="text-sm text-muted-foreground">{a.profiles.full_name} · {a.profiles.headline}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Applied {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score != null && <div className="text-center"><div className="font-display text-2xl font-bold">{a.match_score}</div><div className="text-xs text-muted-foreground">match</div></div>}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${({applied:"bg-secondary",shortlisted:"bg-warning/20 text-warning-foreground",selected:"bg-success/20 text-success",rejected:"bg-destructive/15 text-destructive"} as any)[a.status]}`}>{a.status}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
