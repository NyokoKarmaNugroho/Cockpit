/** Production origin — override with `VITE_SITE_URL` for previews/staging (no trailing slash). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://cockpitintel.com").replace(/\/$/, "");
