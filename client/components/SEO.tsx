import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any>;
  googleVerify?: string; // optional Google site verification tag
}

export default function SEO({
  title,
  description,
  image = "/bugchemy-og.svg",
  url,
  jsonLd,
  googleVerify,
}: SEOProps) {
  const siteName = "Bugchemy";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonicalUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    document.title = fullTitle;

    const set = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const nameAttr = selector.match(/\[name=\"(.+?)\"\]/)?.[1];
        const propertyAttr = selector.match(/\[property=\"(.+?)\"\]/)?.[1];
        if (nameAttr) el.name = nameAttr;
        if (propertyAttr) el.setAttribute("property", propertyAttr);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) set('meta[name="description"]', description);
    set('meta[property="og:title"]', fullTitle);
    if (description) set('meta[property="og:description"]', description);
    if (image) set('meta[property="og:image"]', image);
    set('meta[property="og:url"]', canonicalUrl);
    set('meta[property="og:site_name"]', siteName);
    set('meta[property="og:type"]', "article");

    set('meta[name="twitter:card"]', "summary_large_image");
    set('meta[name="twitter:title"]', fullTitle);
    if (description) set('meta[name="twitter:description"]', description);
    if (image) set('meta[name="twitter:image"]', image);

    // Google verification
    if (googleVerify) {
      const id = "google-site-verification";
      let verifyMeta = document.getElementById(id) as HTMLMetaElement | null;
      if (!verifyMeta) {
        verifyMeta = document.createElement("meta");
        verifyMeta.name = "google-site-verification";
        verifyMeta.id = id;
        document.head.appendChild(verifyMeta);
      }
      verifyMeta.content = googleVerify;
    }

    // JSON-LD schema
    if (jsonLd) {
      const id = "seo-jsonld";
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    }
  }, [fullTitle, description, image, canonicalUrl, jsonLd, googleVerify]);

  // Canonical link
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }, [canonicalUrl]);

  return null;
}
