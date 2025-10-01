import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <section className="container py-24 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">Oops! Page not found.</p>
        <div className="mt-8">
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
