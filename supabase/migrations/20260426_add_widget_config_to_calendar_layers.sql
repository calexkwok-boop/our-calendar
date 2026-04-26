-- Add widget_config column to calendar_layers so the layer owner's
-- widget setup is visible to all members by default.
ALTER TABLE public.calendar_layers
  ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT NULL;
