import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Auth() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bugchemy:user", JSON.stringify({ email }));
    window.location.href = "/admin";
  };

  return (
    <Layout>
      <SEO title="Login / Sign up" description="Access your Bugchemy admin" />
      <section className="container py-16 grid place-items-center">
        <Card className="w-full max-w-md p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <img
              src="/web-app-manifest-192x192.png"
              alt="Bugchemy"
              className="h-14 w-auto"
              loading="eager"
            />
            <h1 className="mt-3 text-xl font-semibold">Welcome to Bugchemy</h1>
            <p className="mt-1 text-xs text-muted-foreground">Login or create an account to manage your content.</p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form onSubmit={onSubmit} className="grid gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Login</Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">By continuing you agree to our Terms and Privacy.</p>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSubmit} className="grid gap-4">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Create account</Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">No spam. Cancel anytime.</p>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-4 text-xs text-muted-foreground">In production, connect real auth (e.g., Supabase) via [Open MCP popover].</p>
        </Card>
      </section>
    </Layout>
  );
}
