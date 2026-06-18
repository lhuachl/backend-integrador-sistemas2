-- Add module column to rituals and slots for LifeOS organization
ALTER TABLE public.rituals
  ADD COLUMN module TEXT
    CHECK (module IN ('body', 'mind', 'work', 'relate', 'wealth', 'space'));

ALTER TABLE public.slots
  ADD COLUMN module TEXT
    CHECK (module IN ('body', 'mind', 'work', 'relate', 'wealth', 'space'));

CREATE INDEX idx_rituals_module ON public.rituals(user_id, module);
CREATE INDEX idx_slots_module ON public.slots(user_id, module);
