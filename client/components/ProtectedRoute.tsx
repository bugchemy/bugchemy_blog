"use client";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LogoLoader } from "@/components/LogoLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // optional prop to indicate admin-only route
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is not logged in
      if (!user) {
        if (adminOnly) {
          navigate("/", { replace: true }); // redirect non-authenticated users away from admin
          return;
        }
        setChecking(false);
        return;
      }

      // Fetch profile info
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("profile_complete, is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        if (adminOnly) navigate("/", { replace: true });
        setChecking(false);
        return;
      }

      // If profile incomplete → redirect to complete-profile page
      if (!profile?.profile_complete && location.pathname !== "/complete-profile") {
        navigate("/complete-profile", { replace: true });
        return;
      }

      // If this is an admin-only page and user is not admin → redirect
      if (adminOnly && !profile?.is_admin) {
        navigate("/", { replace: true });
        return;
      }

      setChecking(false);
    };

    checkUserProfile();
  }, [navigate, location.pathname, adminOnly]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        <LogoLoader />
      </div>
    );
  }

  return <>{children}</>;
}
