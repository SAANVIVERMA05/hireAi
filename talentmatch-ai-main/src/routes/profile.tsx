import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2, FileText } from "lucide-react";
import { callFn } from "@/lib/aiClient";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data ?? {}));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, headline: profile.headline, bio: profile.bio,
      skills: typeof profile.skills === "string" ? profile.skills.split(",").map((s:string)=>s.trim()).filter(Boolean) : profile.skills,
      experience_years: profile.experience_years, company_name: profile.company_name,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const uploadResume = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      // Read text (PDFs are binary; we send to AI extractor with base64)
      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const parsed = await callFn<{ text: string; skills: string[]; experience_years?: number; headline?: string }>("ai-parse-resume", {
        filename: file.name,
        base64,
        mimeType: file.type,
      });

      const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60 * 24 * 365);
      await supabase.from("profiles").update({
        resume_url: path,
        resume_text: parsed.text,
        skills: parsed.skills,
        experience_years: parsed.experience_years ?? profile.experience_years,
        headline: parsed.headline ?? profile.headline,
      }).eq("id", user.id);

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
      toast.success("Resume parsed and saved!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Your profile</h1>

      {role === "candidate" && (
        <Card className="mt-8 p-6">
          <h3 className="font-display text-lg font-semibold">Resume</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your resume to enable AI matching, ATS analysis, and applications.</p>
          {profile.resume_url ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
              <FileText className="h-5 w-5 text-accent" />
              <span className="flex-1 truncate">{profile.resume_url.split("/").pop()}</span>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Replace</Button>
            </div>
          ) : (
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-4 bg-foreground text-background hover:bg-foreground/90">
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing…</> : <><Upload className="mr-2 h-4 w-4" />Upload resume</>}
            </Button>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])} />
        </Card>
      )}

      <Card className="mt-6 space-y-4 p-6">
        <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
        <div><Label>Headline</Label><Input value={profile.headline ?? ""} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Senior React Developer · 5y" /></div>
        <div><Label>Bio</Label><Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
        {role === "candidate" ? (
          <>
            <div><Label>Skills (comma-separated)</Label><Input value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills ?? ""} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} /></div>
            <div><Label>Years of experience</Label><Input type="number" value={profile.experience_years ?? 0} onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })} /></div>
          </>
        ) : (
          <div><Label>Company</Label><Input value={profile.company_name ?? ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} /></div>
        )}
        <Button onClick={save} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">{saving ? "Saving…" : "Save profile"}</Button>
      </Card>
    </main>
  );
}
