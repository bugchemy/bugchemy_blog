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
      <section className="container flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="relative w-[180px] sm:w-[150px] mx-auto">
          <img
            src="/404.png"
            alt="Bugchemy 404 logo"
            className="w-full h-auto object-contain opacity-95 drop-shadow-lg transition-transform duration-500 hover:scale-105"
            loading="eager"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
            Oops!
          </h1>
          <p className="text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
            404! Page not found
          </p>
        </div>

        <Link to="/">
          <Button className="mt-4 px-6 py-3 text-base rounded-xl shadow-md hover:shadow-lg transition-all">
            Return to Home
          </Button>
        </Link>
      </section>
    </Layout>
  );
};

export default NotFound;
