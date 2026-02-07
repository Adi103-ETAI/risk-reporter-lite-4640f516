import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { ensureProfileAndDefaultRole } from "@/lib/authBootstrap";
import {
  consumeLovableToken,
  consumeTokenFromCurrentLocationOnce,
  stripLovableTokenFromUrl,
} from "@/lib/lovableToken";

function sanitizeRedirect(rawRedirect: string | null): string {
  const value = (rawRedirect ?? "/").trim() || "/";
  // Ensure we always remove __lovable_token even when redirect is encoded like /?__lovable_token=...
  const stripped = stripLovableTokenFromUrl(value);
  return stripped.startsWith("/") ? stripped : "/";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const redirect = sanitizeRedirect(params.get("redirect"));

  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // 1) Consume token if it exists in the *current* URL, then remove it from the address bar.
    const consumed = consumeTokenFromCurrentLocationOnce();
    if (consumed.didConsume && consumed.strippedUrl) {
      navigate(consumed.strippedUrl, { replace: true });
      return;
    }

    // 2) If token is embedded inside redirect (e.g. /auth?redirect=/%3F__lovable_token=...), consume it and rewrite redirect.
    try {
      const decoded = decodeURIComponent(params.get("redirect") ?? "");
      const u = new URL(decoded.startsWith("/") ? window.location.origin + decoded : decoded);
      const token = u.searchParams.get("__lovable_token");
      if (token) {
        consumeLovableToken(token);
        u.searchParams.delete("__lovable_token");
        const cleanedRedirect = u.pathname + u.search + u.hash;
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("redirect", cleanedRedirect || "/");
          return next;
        }, { replace: true } as any);
      }
    } catch {
      // ignore
    }

    // 3) If already authed, go straight to dashboard (sanitized).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(redirect, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Missing credentials",
        description: "Please enter both email and password.",
      });
      return;
    }

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
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="bg-background"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="bg-background"
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

