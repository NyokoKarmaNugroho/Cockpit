-- OSINT data model aligned with marketplace → vendor → product investigation graph (lawful OSINT / case work).
-- Server access via service role; RLS enabled for consistency with other Cockpit tables.

CREATE TABLE public.osint_dark_marketplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases (id) ON DELETE CASCADE,
  label text,
  onion_url text,
  favicon_hash text,
  http_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_code_notes text,
  admin_email text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.osint_dark_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid NOT NULL REFERENCES public.osint_dark_marketplaces (id) ON DELETE CASCADE,
  username text,
  join_date date,
  location text,
  forum_posts integer,
  pgp_key_id text,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  crypto_wallets jsonb NOT NULL DEFAULT '[]'::jsonb,
  sales_count integer,
  reviews_text text,
  shipping_info text,
  store_description text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.osint_dark_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.osint_dark_vendors (id) ON DELETE CASCADE,
  title text,
  description text,
  photo_urls text[] NOT NULL DEFAULT ARRAY[]::text[],
  photo_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviews_text text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_osint_dark_marketplaces_case ON public.osint_dark_marketplaces (case_id);
CREATE INDEX idx_osint_dark_vendors_marketplace ON public.osint_dark_vendors (marketplace_id);
CREATE INDEX idx_osint_dark_products_vendor ON public.osint_dark_products (vendor_id);

ALTER TABLE public.osint_dark_marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osint_dark_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osint_dark_products ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.osint_dark_marketplaces IS 'Dark-web marketplace indicators scoped to an investigation case';
COMMENT ON TABLE public.osint_dark_vendors IS 'Vendor profile / wallet / reputation fields linked to a marketplace row';
COMMENT ON TABLE public.osint_dark_products IS 'Listing-level attributes (media, reviews) linked to a vendor row';
