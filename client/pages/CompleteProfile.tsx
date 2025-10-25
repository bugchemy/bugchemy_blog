// pages/CompleteProfile.tsx
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoLoader } from "@/components/LogoLoader";

export default function CompleteProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Predefined Bugchemy avatars
const avatars = [
  "/avatars/avataaars1.png",
  "/avatars/avataaars2.png",
  "/avatars/avataaars3.png",
  "/avatars/avataaars4.png",
  "/avatars/avataaars5.png",
  "/avatars/avataaars6.png",
  "/avatars/avataaars7.png",
  "/avatars/avataaars8.png",
  "/avatars/avataaars9.png",
  "/avatars/avataaars10.png",
  "/avatars/avataaars11.png",
  "/avatars/avataaars12.png",
];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data);
        setDisplayName(data?.display_name || "");
        setAvatarUrl(data?.avatar_url || "");
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: profile.id,
        display_name: displayName,
        avatar_url: avatarUrl || null,
        profile_complete: true,
      });

      if (error) throw error;

      // Save updated profile locally
      localStorage.setItem(
        "bugchemy:user",
        JSON.stringify({
          ...profile,
          display_name: displayName,
          avatar_url: avatarUrl,
          profile_complete: true,
        })
      );

      window.location.href = "/";
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
  return <Layout>
    <div className="flex justify-center py-20">
            <LogoLoader />
          </div></Layout>;
    }

  return (
    <Layout>
      <div className="container py-16 max-w-md mx-auto">
        <h1 className="text-xl font-semibold mb-4">Complete Your Profile</h1>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Display Name */}
          <div>
            <label>Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* Avatar Selection */}
          <div>
            <label>Choose Your Avatar</label>
            <div className="flex gap-3 mt-2 flex-wrap justify-center">
              {avatars.map((avatar) => (
                <img
                  key={avatar}
                  src={avatar}
                  alt="avatar"
                  className={cn(
                    "h-20 w-20 rounded-full border-2 cursor-pointer object-cover",
                    avatarUrl === avatar ? "border-primary" : "border-transparent"
                  )}
                  onClick={() => setAvatarUrl(avatar)}
                />
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? <div className="flex justify-center py-20">
            <LogoLoader />
          </div> : "Save Profile"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
