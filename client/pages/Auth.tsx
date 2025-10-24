import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session || !data.user) {
        alert("Login failed: no session returned.");
        return;
      }

      // Fetch or create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_admin, profile_complete")
        .eq("id", data.user.id)
        .single();

      let userProfile = profile;

      if (profileError) {
        // Profile doesn't exist yet → create it (RLS allows user to insert their own)
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            display_name: email.split("@")[0],
            avatar_url: null,
            is_admin: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        userProfile = newProfile;
      }

// Save session info locally
      localStorage.setItem("bugchemy:user", JSON.stringify(userProfile));

      // Redirect first-time users to complete profile
      if (!userProfile.profile_complete) {
        window.location.href = "/complete-profile";
        return;
      }

      // Redirect admins to admin panel; regular users back to homepage
      if (userProfile?.is_admin) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP
  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      alert("Signup successful! Please check your email to confirm before logging in.");
      setTab("login");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO title="Login / Sign up" description="Access your Bugchemy account" />
      <section className="container py-16 grid place-items-center">
        <Card className="w-full max-w-md p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <img src="/web-app-manifest-192x192.png" alt="Bugchemy" className="h-14 w-auto" />
            <h1 className="mt-3 text-xl font-semibold">Welcome to Bugchemy</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Login or create an account to comment and engage with articles.
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={onLogin} className="grid gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  By continuing you agree to our Terms and Privacy.
                </p>
              </form>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignup} className="grid gap-4">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing up..." : "Create account"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  No spam. Cancel anytime.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </section>
    </Layout>
  );
}
