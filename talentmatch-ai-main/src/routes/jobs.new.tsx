import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/new")({ component: NewJob });

function NewJob() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [exp, setExp] = useState(0);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");
  const [loading, setLoading] = useState(false);

  if (role && role !== "recruiter") {
    return <div className="p-12 text-center text-muted-foreground">Only recruiters can post jobs.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("jobs").insert({
      recruiter_id: user.id, title, description,
      required_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience_required: exp, location, employment_type: type,
    }).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Job posted!");
    navigate({ to: "/jobs/$id", params: { id: data.id } });
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">New job</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Post a role</h1>

      <Card className="mt-8 p-8">
        <form onSubmit={submit} className="space-y-5">
          <div><Label htmlFor="t">Job title</Label><Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior React Engineer" /></div>
          <div><Label htmlFor="d">Description</Label><Textarea id="d" required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Role responsibilities, what you'll build, team context…" /></div>
          <div><Label htmlFor="s">Required skills (comma-separated)</Label><Input id="s" required value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, GraphQL, Testing" /></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label htmlFor="e">Years of experience</Label><Input id="e" type="number" min={0} value={exp} onChange={(e) => setExp(parseInt(e.target.value) || 0)} /></div>
            <div><Label htmlFor="l">Location</Label><Input id="l" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote · Bengaluru" /></div>
            <div><Label htmlFor="ty">Type</Label><Input id="ty" value={type} onChange={(e) => setType(e.target.value)} /></div>
          </div>
          <Button type="submit" disabled={loading} className="bg-foreground text-background hover:bg-foreground/90">{loading ? "Posting…" : "Publish job"}</Button>
        </form>
      </Card>
    </main>
  );
}
