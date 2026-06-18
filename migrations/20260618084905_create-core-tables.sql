-- FlowState core schema: KISS with 4 tables (no days, no separate notes)
-- All tables scoped to user via auth.uid()

-- ── SLOTS ──
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ritual_id UUID,
  title TEXT NOT NULL,
  duration_planned INTEGER,
  duration_real INTEGER,
  status TEXT NOT NULL DEFAULT 'plan'
    CHECK (status IN ('plan','now','paused','done','not_done','reprogrammed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  friction_reason TEXT
    CHECK (friction_reason IN (
      'priority_changed','low_energy','avoidance',
      'external_interruption','overestimated','no_longer_applies'
    )),
  friction_note TEXT,
  -- time-locked notes (inline, KISS)
  before_note TEXT NOT NULL DEFAULT '',
  during_note JSONB NOT NULL DEFAULT '{}',
  after_note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_access" ON public.slots
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slots TO authenticated;

CREATE INDEX idx_slots_user_date ON public.slots(user_id, date);
CREATE INDEX idx_slots_status ON public.slots(status);
CREATE INDEX idx_slots_ritual ON public.slots(ritual_id);

CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ── RITUALS ──
CREATE TABLE public.rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('commitment', 'aspiration')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_access" ON public.rituals
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rituals TO authenticated;

CREATE INDEX idx_rituals_user_active ON public.rituals(user_id, active);

CREATE TRIGGER rituals_updated_at
  BEFORE UPDATE ON public.rituals
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ── MIRRORS ──
CREATE TABLE public.mirrors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  data JSONB NOT NULL,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.mirrors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_access" ON public.mirrors
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirrors TO authenticated;

CREATE INDEX idx_mirrors_user_week ON public.mirrors(user_id, week_start);

-- ── FOREIGN KEY (on slots) ──
ALTER TABLE public.slots
  ADD CONSTRAINT fk_slots_ritual
  FOREIGN KEY (ritual_id) REFERENCES public.rituals(id)
  ON DELETE SET NULL;
