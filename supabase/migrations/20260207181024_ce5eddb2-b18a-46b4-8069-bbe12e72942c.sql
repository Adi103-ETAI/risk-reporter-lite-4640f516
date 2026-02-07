-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('analyst', 'lead_analyst', 'admin', 'auditor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE public.case_status AS ENUM ('active', 'pending', 'flagged', 'closed');
  END IF;
END $$;

-- Utility: updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Cases
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  target TEXT,
  summary TEXT,
  status public.case_status NOT NULL DEFAULT 'active',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cases_owner_id ON public.cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cases_updated_at'
  ) THEN
    CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Case events (audit trail)
CREATE TABLE IF NOT EXISTS public.case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  actor_id UUID,
  event_type TEXT NOT NULL,
  from_status public.case_status,
  to_status public.case_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_case_events_case_id_created_at ON public.case_events(case_id, created_at DESC);

-- RLS: profiles
DROP POLICY IF EXISTS "Profiles: select own" ON public.profiles;
CREATE POLICY "Profiles: select own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profiles: insert own" ON public.profiles;
CREATE POLICY "Profiles: insert own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS: user_roles
DROP POLICY IF EXISTS "User roles: select own or admins" ON public.user_roles;
CREATE POLICY "User roles: select own or admins"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "User roles: self-assign analyst" ON public.user_roles;
CREATE POLICY "User roles: self-assign analyst"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'analyst');

DROP POLICY IF EXISTS "User roles: admins manage" ON public.user_roles;
CREATE POLICY "User roles: admins manage"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: cases
DROP POLICY IF EXISTS "Cases: select allowed" ON public.cases;
CREATE POLICY "Cases: select allowed"
ON public.cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'lead_analyst')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'auditor')
);

DROP POLICY IF EXISTS "Cases: insert own" ON public.cases;
CREATE POLICY "Cases: insert own"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Cases: update open" ON public.cases;
CREATE POLICY "Cases: update open"
ON public.cases
FOR UPDATE
TO authenticated
USING (
  status <> 'closed'
  AND (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'lead_analyst')
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  -- once closed, it becomes read-only
  status <> 'closed'
  AND (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'lead_analyst')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Cases: admin delete only" ON public.cases;
CREATE POLICY "Cases: admin delete only"
ON public.cases
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND status <> 'closed');

-- RLS: case_events (read-only history once closed)
DROP POLICY IF EXISTS "Case events: select if can see case" ON public.case_events;
CREATE POLICY "Case events: select if can see case"
ON public.case_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.cases c
    WHERE c.id = case_events.case_id
      AND (
        auth.uid() = c.owner_id
        OR public.has_role(auth.uid(), 'lead_analyst')
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'auditor')
      )
  )
);

DROP POLICY IF EXISTS "Case events: insert while case open" ON public.case_events;
CREATE POLICY "Case events: insert while case open"
ON public.case_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.cases c
    WHERE c.id = case_events.case_id
      AND c.status <> 'closed'
      AND (
        auth.uid() = c.owner_id
        OR public.has_role(auth.uid(), 'lead_analyst')
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);
