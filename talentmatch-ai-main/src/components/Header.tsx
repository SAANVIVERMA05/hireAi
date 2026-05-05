import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Briefcase, Sparkles, LogOut } from "lucide-react";

export function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent text-accent-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          HireAI
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user && (
            <>
              <Link to="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Dashboard</Link>
              <Link to="/jobs" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Jobs</Link>
              <Link to="/applications" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Applications</Link>
              {role === "candidate" && (
                <>
                  <Link to="/analyzer" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Resume AI</Link>
                  <Link to="/interview" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Mock Interview</Link>
                  <Link to="/profile" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary text-foreground" }}>Profile</Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {role ? <span className="rounded-full bg-secondary px-2 py-1 font-medium uppercase tracking-wider">{role}</span> : null}
              </span>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Link to="/auth"><Briefcase className="mr-1 h-4 w-4" />Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
