-- Cockpit core schema (PRD §9). Applied via Supabase MCP to project ref qdjwpjvezzxfrzlvufti.

CREATE TYPE public.analysis_status AS ENUM (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  prompt text NOT NULL,
  status public.analysis_status NOT NULL DEFAULT 'queued',
  result_summary text,
  result_report text,
  error_message text,
  client_request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.analysis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses (id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses (id) ON DELETE CASCADE,
  kind text NOT NULL,
  url_or_path text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspaces_owner ON public.workspaces (owner_user_id);
CREATE INDEX idx_analyses_workspace ON public.analyses (workspace_id);
CREATE INDEX idx_analyses_user ON public.analyses (user_id);
CREATE INDEX idx_analyses_client_request ON public.analyses (workspace_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
CREATE INDEX idx_analysis_events_analysis ON public.analysis_events (analysis_id);
CREATE INDEX idx_artifacts_analysis ON public.artifacts (analysis_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.users IS 'Wallet-backed users (PRD)';
COMMENT ON TABLE public.workspaces IS 'Workspaces owned by a user';
COMMENT ON TABLE public.analyses IS 'Analysis runs; backend should use service role';
COMMENT ON TABLE public.analysis_events IS 'Optional event log / audit trail';
COMMENT ON TABLE public.artifacts IS 'Stored artifact references';
