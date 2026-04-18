-- Workspace external key (matches frontend workspace string, e.g. cockpit-default-workspace)
-- and analysis title for dashboard lists.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS external_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_external_key_unique
  ON public.workspaces (external_key)
  WHERE external_key IS NOT NULL;

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS title text;
