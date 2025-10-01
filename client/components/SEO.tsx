import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any>;
}

export default function SEO({ title, description, image = "/bugchemy-og.svg", url = "/", jsonLd }: SEOProps) {
  useEffect(() => {
    if (title) document.title = title;
    const set = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        const nameAttr = selector.match(/\[name=\"(.+?)\"\]/)?.[1];
        const propertyAttr = selector.match(/\[property=\"(.+?)\"\]/)?.[1];
        if (nameAttr) el.name = nameAttr;
        if (propertyAttr) el.setAttribute('property', propertyAttr);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) set('meta[name="description"]', description);
    if (title) {
      set('meta[property="og:title"]', title);
      set('meta[name="twitter:title"]', title);
    }
    if (description) {
      set('meta[property="og:description"]', description);
      set('meta[name="twitter:description"]', description);
    }
    if (image) {
      set('meta[property="og:image"]', image);
      set('meta[name="twitter:image"]', image);
    }
    if (url) set('meta[property="og:url"]', url);

    if (jsonLd) {
      const id = 'seo-jsonld';
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    }
  }, [title, description, image, url, jsonLd]);

  return null;
}
