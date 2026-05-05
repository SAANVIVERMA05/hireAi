
-- Enums
CREATE TYPE public.app_role AS ENUM ('recruiter', 'candidate');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'selected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[],
  experience_years INT,
  resume_url TEXT,
  resume_text TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table per security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  experience_required INT NOT NULL DEFAULT 0,
  location TEXT,
  employment_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'applied',
  match_score INT,
  match_breakdown JSONB,
  cover_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Resume analyses (ATS)
CREATE TABLE public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ats_score INT,
  extracted_skills TEXT[],
  missing_skills TEXT[],
  suggestions TEXT[],
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_score INT,
  feedback TEXT,
  tab_switches INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  question TEXT NOT NULL,
  expected_keywords TEXT[],
  answer TEXT,
  score INT,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- assign role from metadata (default candidate)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'candidate'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- Recruiters can view candidate profiles that applied to their jobs
CREATE POLICY "recruiter view applicant profiles" ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
  WHERE a.candidate_id = profiles.id AND j.recruiter_id = auth.uid()
));

-- user_roles: read own
CREATE POLICY "roles select own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- jobs
CREATE POLICY "jobs view active" ON public.jobs FOR SELECT TO authenticated USING (is_active = true OR recruiter_id = auth.uid());
CREATE POLICY "jobs recruiter insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (recruiter_id = auth.uid() AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "jobs recruiter update" ON public.jobs FOR UPDATE TO authenticated USING (recruiter_id = auth.uid());
CREATE POLICY "jobs recruiter delete" ON public.jobs FOR DELETE TO authenticated USING (recruiter_id = auth.uid());

-- applications
CREATE POLICY "apps candidate select own" ON public.applications FOR SELECT TO authenticated USING (candidate_id = auth.uid());
CREATE POLICY "apps recruiter select own jobs" ON public.applications FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.recruiter_id = auth.uid()));
CREATE POLICY "apps candidate insert" ON public.applications FOR INSERT TO authenticated
WITH CHECK (candidate_id = auth.uid() AND public.has_role(auth.uid(), 'candidate'));
CREATE POLICY "apps recruiter update status" ON public.applications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.recruiter_id = auth.uid()));

-- resume_analyses
CREATE POLICY "analyses own" ON public.resume_analyses FOR ALL TO authenticated USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

-- interview_sessions
CREATE POLICY "sessions own" ON public.interview_sessions FOR ALL TO authenticated USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

-- interview_questions: own session
CREATE POLICY "questions own" ON public.interview_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = interview_questions.session_id AND s.candidate_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = interview_questions.session_id AND s.candidate_id = auth.uid()));

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies: candidates manage their own files (path = userId/...)
CREATE POLICY "resumes upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Recruiters can read resumes from candidates who applied to their jobs
CREATE POLICY "resumes recruiter read applicants" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND EXISTS (
    SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE j.recruiter_id = auth.uid()
      AND a.candidate_id::text = (storage.foldername(name))[1]
  )
);
