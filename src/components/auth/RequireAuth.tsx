import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { stripLovableTokenFromUrl } from "@/lib/lovableToken";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(Boolean(session));
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setAuthed(Boolean(data.session));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthed(false);
        setLoading(false);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!authed) {
    const raw = location.pathname + location.search + location.hash;
    const sanitized = stripLovableTokenFromUrl(raw);
    const redirect = encodeURIComponent(sanitized);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}

