import * as React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { ensureProfileAndDefaultRole } from "@/lib/authBootstrap";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const redirect = params.get("redirect") || "/";

  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirect, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        toast({
          title: "Check your email",
          description: "Confirm your email address to finish creating your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await ensureProfileAndDefaultRole({ displayName: displayName || null });

        toast({ title: "Signed in", description: "Welcome back." });
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: err?.message ?? "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
  };

  return (
    <div className="min-h-screen bg-investigation-grid">
      <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <Card className="surface-elevated">
          <CardContent className="p-6">
            <div className="space-y-1 text-left">
              <h1 className="text-lg font-semibold tracking-tight">Sign in to CyberTrace</h1>
              <p className="text-sm text-muted-foreground">
                Access is role-based. Analysts see their own cases; leads/admins can see more.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
                </Button>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    type="button"
                    variant="soft"
                    className="w-full sm:w-auto"
                    onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
                  >
                    {mode === "login" ? "Create account" : "Have an account?"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onSignOut}>
                    Sign out
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-4 text-left text-xs text-muted-foreground">
              Redirect after sign in: <span className="font-medium text-foreground">{redirect}</span>
              {location.pathname !== "/auth" ? null : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
