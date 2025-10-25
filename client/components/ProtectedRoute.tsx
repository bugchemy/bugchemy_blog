"use client";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { LogoLoader } from "@/components/LogoLoader";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1️⃣ If user not logged in → allow everything
      if (!user) {
        setChecking(false);
        return;
      }

      // 2️⃣ Fetch profile info for logged-in user
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("profile_complete")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile check error:", error);
        setChecking(false);
        return;
      }

      // 3️⃣ If logged-in user has incomplete profile, redirect
      if (!profile?.profile_complete && location.pathname !== "/complete-profile") {
        navigate("/complete-profile", { replace: true });
        return;
      }

      setChecking(false);
    };

    checkUserProfile();
  }, [navigate, location.pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        <LogoLoader />
      </div>
    );
  }

  return <>{children}</>;
}
