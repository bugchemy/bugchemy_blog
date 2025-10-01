import { useMemo } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";

export default function ComingSoon() {
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Bugchemy",
      url: "/",
      description:
        "Bugchemy is a developer‑centric learning blog exploring tools, frameworks, debugging, and real‑world tech insights.",
      inLanguage: "en-US",
    }),
    [],
  );

  return (
    <Layout>
      <SEO
        title="Bugchemy — Experiment. Learn. Evolve."
        description="A modern, developer‑centric learning blog exploring tools, frameworks, debugging, and real‑world tech insights."
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="container grid gap-8 md:grid-cols-12 items-center">
          {/* Text */}
          <div className="md:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <img src="/favicon-96x96.png" alt="Bugchemy" className="h-10 w-10" />
              <Badge className="bg-primary/15 text-primary" variant="secondary">
                Experiment. Learn. Evolve.
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Debug better. Build faster. Learn continuously.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-prose">
              Bugchemy blends curiosity with hands‑on experimentation—covering tools, frameworks, debugging methods, and real‑world insights for developers and support engineers.
            </p>

            <p className="mt-5 text-lg text-muted-foreground max-w-prose font-bold">
              <br></br>
            </p>
            <p className="mt-5 text-lg text-muted-foreground max-w-prose font-bold">
              We are launching soon ...
            </p>
          </div>

          {/* Logo */}
          <div className="md:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden">
              <div className="absolute inset-0 grid place-items-center p-6">
                <img
                  src="/web-app-manifest-192x192.png"
                  alt="Bugchemy logo"
                  className="max-h-full max-w-full object-contain opacity-90 animate-float"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Tailwind Custom CSS */}
      <style>
        {`
          /* Floating logo animation */
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          /* Neon text effect */
          .neon-text {
            color: #0ff;
            text-shadow:
              0 0 5px #0ff,
              0 0 10px #0ff,
              0 0 20px #0ff,
              0 0 40px #0ff,
              0 0 80px #0ff;
            animation: glow 1.5s ease-in-out infinite alternate;
          }

          @keyframes glow {
            0% { text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff, 0 0 80px #0ff; }
            100% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff, 0 0 60px #0ff, 0 0 120px #0ff; }
          }

          /* Blinking cursor effect */
          .neon-cursor {
            display: inline-block;
            width: 2px;
            height: 1.1em;
            background-color: #0ff;
            margin-left: 2px;
            animation: blink 1s infinite;
            vertical-align: bottom;
          }

          @keyframes blink {
            0%, 50%, 100% { opacity: 1; }
            25%, 75% { opacity: 0; }
          }
        `}
      </style>
    </Layout>
  );
}
