import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, FileSearch, MessageSquareCode, ShieldCheck, Briefcase, BarChart3, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-[0.04]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              AI-powered hiring, end to end
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance lg:text-7xl">
              Hire smarter.<br />
              <span className="bg-gradient-accent bg-clip-text text-transparent">Interview better.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Recruiters post roles and let AI rank candidates by resume fit. Applicants get an instant ATS score, missing-skill suggestions, and a proctored mock interview that actually feels real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                <Link to="/auth"><Briefcase className="mr-2 h-4 w-4" />Start hiring</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I'm a candidate <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> Proctored interviews</div>
              <div className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-accent" /> Gemini-powered matching</div>
              <div className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-foreground" /> ATS scoring 0–100</div>
            </div>
          </div>

          {/* Visual card */}
          <div className="relative lg:col-span-5">
            <Card className="overflow-hidden border-border/60 shadow-elegant">
              <div className="bg-foreground p-5 text-background">
                <div className="text-xs uppercase tracking-widest opacity-60">Match Result</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-6xl font-bold">87</span>
                  <span className="text-xl opacity-60">/ 100</span>
                </div>
                <div className="mt-1 text-sm opacity-80">Senior React Engineer · Anya Patel</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matched Skills</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "GraphQL", "Testing"].map((s) => (
                    <span key={s} className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">{s}</span>
                  ))}
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missing</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Kubernetes", "Go"].map((s) => (
                    <span key={s} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{s}</span>
                  ))}
                </div>
              </div>
            </Card>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-card p-4 shadow-soft lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><MessageSquareCode className="h-5 w-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Mock interview</div>
                  <div className="text-sm font-semibold">Score: 8.4 / 10</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold tracking-tight">Everything for both sides of the table.</h2>
            <p className="mt-3 text-muted-foreground">From posting a role to nailing the interview — built around what actually moves hires.</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Briefcase, title: "Post & manage jobs", desc: "Recruiters publish openings, track every application, and update candidate status with one click." },
              { icon: FileSearch, title: "AI Resume Matching", desc: "Each application gets a 0–100 fit score with matched and missing skills explained." },
              { icon: Sparkles, title: "ATS Resume Analyzer", desc: "Candidates see their ATS score, gaps, and concrete improvements — instantly." },
              { icon: MessageSquareCode, title: "AI Mock Interview", desc: "Pick a domain. Get curated questions. Receive scored feedback per answer." },
              { icon: ShieldCheck, title: "Light proctoring", desc: "Tab-switch tracking + countdown per question to simulate real conditions." },
              { icon: BarChart3, title: "Live status tracking", desc: "Applied → Shortlisted → Selected. Both sides always know where things stand." },
            ].map((f) => (
              <Card key={f.title} className="group border-border/60 p-6 transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-foreground text-background transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">Ready when you are.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">No setup. No credit card. Pick your role and start in under a minute.</p>
          <Button asChild size="lg" className="mt-8 bg-foreground text-background hover:bg-foreground/90">
            <Link to="/auth">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        Built with Lovable · AI by Gemini
      </footer>
    </main>
  );
}
