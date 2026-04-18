CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_analysis_links (
  case_id uuid NOT NULL REFERENCES public.cases (id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.analyses (id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, analysis_id)
);

CREATE INDEX IF NOT EXISTS idx_cases_workspace ON public.cases (workspace_id);
CREATE INDEX IF NOT EXISTS idx_cases_user ON public.cases (user_id);
CREATE INDEX IF NOT EXISTS idx_case_analysis_links_case ON public.case_analysis_links (case_id);
CREATE INDEX IF NOT EXISTS idx_case_analysis_links_analysis ON public.case_analysis_links (analysis_id);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_analysis_links ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cases IS 'Investigation cases grouped by workspace';
COMMENT ON TABLE public.case_analysis_links IS 'Many-to-many links between cases and analyses';
