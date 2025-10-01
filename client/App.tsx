import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route , Navigate} from "react-router-dom";
import { useEffect } from "react";
import { Content } from "@/lib/content";
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
import Blog from "./pages/Blog";
import Article from "./pages/Article";
import About from "./pages/About";
import Newsletter from "./pages/Newsletter";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Init() {
  useEffect(() => {
    Content.ensureSeed();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Init />
        <Routes>
          <Route path="/cs" element={<ComingSoon />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Navigate to="/cs" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
