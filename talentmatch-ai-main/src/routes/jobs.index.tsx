import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Briefcase, Search } from "lucide-react";

export const Route = createFileRoute("/jobs/")({ component: JobsList });

function JobsList() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (role === "recruiter") query = query.eq("recruiter_id", user.id);
      else query = query.eq("is_active", true);
      const { data } = await query;
      setJobs(data ?? []);
    })();
  }, [user, role]);

  const filtered = jobs.filter((j) =>
    !q || j.title.toLowerCase().includes(q.toLowerCase()) ||
    j.required_skills?.some((s: string) => s.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Jobs</p>
          <h1 className="mt-1 font-display text-4xl font-bold">{role === "recruiter" ? "Your job posts" : "Open roles"}</h1>
        </div>
        {role === "recruiter" && (
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link to="/jobs/new"><Plus className="mr-1 h-4 w-4" />Post a job</Link>
          </Button>
        )}
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by title or skill…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground">
            {role === "recruiter" ? "No jobs yet — post your first role." : "No matching jobs right now."}
          </Card>
        )}
        {filtered.map((j) => (
          <Link key={j.id} to="/jobs/$id" params={{ id: j.id }}>
            <Card className="group h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold group-hover:text-accent">{j.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{j.experience_required}+ yrs</span>
                    {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                  </div>
                </div>
                {!j.is_active && <span className="rounded-full bg-muted px-2 py-1 text-xs">Inactive</span>}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(j.required_skills ?? []).slice(0, 5).map((s: string) => (
                  <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{s}</span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
