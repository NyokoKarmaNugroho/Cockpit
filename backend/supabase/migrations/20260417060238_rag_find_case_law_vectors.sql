-- RAG storage for Find Case Law OpenAPI documentation (vectors + similarity search).
-- Applied to project qdjwpjvezzxfrzlvufti; kept in repo for parity with remote.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.rag_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'find_case_law_openapi'::text,
  source_uri text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rag_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.rag_sources (id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding vector (1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (source_id, chunk_index)
);

CREATE INDEX rag_chunks_source_idx ON public.rag_chunks (source_id);
CREATE INDEX rag_chunks_embedding_hnsw ON public.rag_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.rag_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rag_sources IS 'RAG corpus sources (e.g. Find Case Law OpenAPI spec)';
COMMENT ON TABLE public.rag_chunks IS 'Chunked text + embedding for similarity search';

CREATE OR REPLACE FUNCTION public.match_rag_chunks (
  query_embedding vector,
  match_count integer DEFAULT 8,
  filter_source_id uuid DEFAULT NULL
) RETURNS TABLE (
  chunk_id uuid,
  source_id uuid,
  chunk_index integer,
  content text,
  similarity double precision
) LANGUAGE sql STABLE AS $$
  SELECT
    c.id AS chunk_id,
    c.source_id,
    c.chunk_index,
    c.content,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM public.rag_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_source_id IS NULL OR c.source_id = filter_source_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
