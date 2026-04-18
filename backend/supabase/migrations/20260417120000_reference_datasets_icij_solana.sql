-- Reference datasets: ICIJ Offshore Leaks node CSVs + relationships, and Solana program catalog.
-- Intended for service-role / backend access only (RLS enabled, no policies = no anon/auth direct reads).

CREATE TABLE public.icij_import_meta (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL DEFAULT 'ICIJ Offshore Leaks'::text,
  generated_on text,
  raw_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.icij_import_meta IS 'Provenance row(s) for ICIJ bulk import (e.g. GENERATED_ON file)';

CREATE TABLE public.icij_nodes_entities (
  node_id bigint PRIMARY KEY,
  name text,
  original_name text,
  former_name text,
  jurisdiction text,
  jurisdiction_description text,
  company_type text,
  address text,
  internal_id text,
  incorporation_date text,
  inactivation_date text,
  struck_off_date text,
  dorm_date text,
  status text,
  service_provider text,
  ibc_ruc text,
  country_codes text,
  countries text,
  source_id text,
  valid_until text,
  note text
);

CREATE TABLE public.icij_nodes_addresses (
  node_id bigint PRIMARY KEY,
  address text,
  name text,
  countries text,
  country_codes text,
  source_id text,
  valid_until text,
  note text
);

CREATE TABLE public.icij_nodes_officers (
  node_id bigint PRIMARY KEY,
  name text,
  countries text,
  country_codes text,
  source_id text,
  valid_until text,
  note text
);

CREATE TABLE public.icij_nodes_intermediaries (
  node_id bigint PRIMARY KEY,
  name text,
  status text,
  internal_id text,
  address text,
  countries text,
  country_codes text,
  source_id text,
  valid_until text,
  note text
);

CREATE TABLE public.icij_nodes_others (
  node_id bigint PRIMARY KEY,
  name text,
  type text,
  incorporation_date text,
  struck_off_date text,
  closed_date text,
  jurisdiction text,
  jurisdiction_description text,
  countries text,
  country_codes text,
  source_id text,
  valid_until text,
  note text
);

CREATE TABLE public.icij_relationships (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id_start bigint NOT NULL,
  node_id_end bigint NOT NULL,
  rel_type text,
  link text,
  status text,
  start_date text,
  end_date text,
  source_id text
);

CREATE INDEX icij_relationships_start_idx ON public.icij_relationships (node_id_start);
CREATE INDEX icij_relationships_end_idx ON public.icij_relationships (node_id_end);
CREATE INDEX icij_relationships_type_idx ON public.icij_relationships (rel_type);

CREATE TABLE public.solana_programs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL UNIQUE,
  category text NOT NULL
);

CREATE INDEX solana_programs_category_idx ON public.solana_programs (category);

ALTER TABLE public.icij_import_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_nodes_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_nodes_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_nodes_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_nodes_intermediaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_nodes_others ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icij_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_programs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.icij_nodes_entities IS 'ICIJ nodes-entities.csv';
COMMENT ON TABLE public.icij_nodes_addresses IS 'ICIJ nodes-addresses.csv';
COMMENT ON TABLE public.icij_nodes_officers IS 'ICIJ nodes-officers.csv';
COMMENT ON TABLE public.icij_nodes_intermediaries IS 'ICIJ nodes-intermediaries.csv';
COMMENT ON TABLE public.icij_nodes_others IS 'ICIJ nodes-others.csv';
COMMENT ON TABLE public.icij_relationships IS 'ICIJ relationships.csv';
COMMENT ON TABLE public.solana_programs IS 'backend/dataset/solana-programs.json';
