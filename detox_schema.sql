CREATE TABLE public.detox_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  habits jsonb DEFAULT '{}'::jsonb,
  work_time_hrs numeric DEFAULT 0,
  screen_time_hrs numeric DEFAULT 0,
  sleep_category text,
  mood text,
  total_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.detox_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detox logs"
  ON public.detox_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detox logs"
  ON public.detox_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detox logs"
  ON public.detox_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detox logs"
  ON public.detox_logs FOR DELETE
  USING (auth.uid() = user_id);
