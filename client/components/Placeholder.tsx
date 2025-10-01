import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <Layout>
      <SEO title={`${title} — Bugchemy`} description={description || "Bugchemy page"} />
      <section className="container py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{description}</p>
        ) : null}
        <div className="mt-8">
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
