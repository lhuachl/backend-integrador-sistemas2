-- Add streak tracking to rituals
ALTER TABLE public.rituals
  ADD COLUMN streak_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_completed DATE;

-- Daily check-in log for rituals
CREATE TABLE public.ritual_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ritual_id, date)
);

ALTER TABLE public.ritual_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_access" ON public.ritual_logs
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritual_logs TO authenticated;

CREATE INDEX idx_ritual_logs_user_date ON public.ritual_logs(user_id, date);
CREATE INDEX idx_ritual_logs_ritual ON public.ritual_logs(ritual_id);

-- Reformulate mirrors as personal journal entries
ALTER TABLE public.mirrors
  ADD COLUMN title TEXT NOT NULL DEFAULT '',
  ADD COLUMN content TEXT NOT NULL DEFAULT '';
