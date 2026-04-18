import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "../lib/siteUrl";

/**
 * SPA: keep canonical and og:url aligned with the current path (hash excluded).
 */
export function DocumentMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    const absolute = `${SITE_URL}${path === "/" ? "" : path}`;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = absolute;

    let ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = absolute;
  }, [location.pathname, location.search]);

  return null;
}
