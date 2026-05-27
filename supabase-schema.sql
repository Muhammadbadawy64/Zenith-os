-- ============================================
-- Brainhance OS - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. Assessments - Ikigai
CREATE TABLE IF NOT EXISTS assessments_ikigai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  love TEXT[] DEFAULT '{}',
  good_at TEXT[] DEFAULT '{}',
  world_needs TEXT[] DEFAULT '{}',
  paid_for TEXT[] DEFAULT '{}',
  ikigai_statement TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assessments_ikigai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ikigai" ON assessments_ikigai FOR ALL USING (auth.uid() = user_id);

-- 3. Assessments - Wheel of Life
CREATE TABLE IF NOT EXISTS assessments_wheel_of_life (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  career INT DEFAULT 5 CHECK (career BETWEEN 1 AND 10),
  relationships INT DEFAULT 5 CHECK (relationships BETWEEN 1 AND 10),
  health INT DEFAULT 5 CHECK (health BETWEEN 1 AND 10),
  finances INT DEFAULT 5 CHECK (finances BETWEEN 1 AND 10),
  personal_growth INT DEFAULT 5 CHECK (personal_growth BETWEEN 1 AND 10),
  fun INT DEFAULT 5 CHECK (fun BETWEEN 1 AND 10),
  physical_env INT DEFAULT 5 CHECK (physical_env BETWEEN 1 AND 10),
  spirituality INT DEFAULT 5 CHECK (spirituality BETWEEN 1 AND 10),
  scores_json JSONB DEFAULT '{}',
  assessment_date DATE DEFAULT CURRENT_DATE
);

ALTER TABLE assessments_wheel_of_life ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wheel" ON assessments_wheel_of_life FOR ALL USING (auth.uid() = user_id);

-- 4. Life Message
CREATE TABLE IF NOT EXISTS life_message (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  core_message TEXT DEFAULT '',
  how_people_perceive_me TEXT DEFAULT '',
  impact_i_want TEXT DEFAULT '',
  legacy_statement TEXT DEFAULT ''
);

ALTER TABLE life_message ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own life message" ON life_message FOR ALL USING (auth.uid() = user_id);

-- 5. Life Roles
CREATE TABLE IF NOT EXISTS life_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  category TEXT DEFAULT 'passion' CHECK (category IN ('self', 'passion', 'others')),
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#8B5CF6',
  weekly_hours_goal INT DEFAULT 5
);

ALTER TABLE life_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own roles" ON life_roles FOR ALL USING (auth.uid() = user_id);

-- 6. Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES life_roles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- 7. Planner Entries
CREATE TABLE IF NOT EXISTS planner_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT DEFAULT 'daily' CHECK (entry_type IN ('yearly', 'monthly', 'weekly', 'daily')),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL
);

ALTER TABLE planner_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own planner" ON planner_entries FOR ALL USING (auth.uid() = user_id);

-- 8. Daily Energy
CREATE TABLE IF NOT EXISTS daily_energy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  energy_level INT DEFAULT 5 CHECK (energy_level BETWEEN 1 AND 10),
  mood TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  UNIQUE(user_id, date)
);

ALTER TABLE daily_energy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own energy" ON daily_energy FOR ALL USING (auth.uid() = user_id);

-- 9. Focus Sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  task_name TEXT NOT NULL,
  role_id UUID REFERENCES life_roles(id) ON DELETE SET NULL,
  is_distracted BOOLEAN DEFAULT false,
  distraction_note TEXT
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own focus" ON focus_sessions FOR ALL USING (auth.uid() = user_id);

-- 10. Voice Journals
CREATE TABLE IF NOT EXISTS voice_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  transcription_text TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own journals" ON voice_journals FOR ALL USING (auth.uid() = user_id);

-- 11. AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  context_type TEXT DEFAULT 'coach' CHECK (context_type IN ('coach', 'alert', 'report')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_planner_entries_date ON planner_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_energy_date ON daily_energy(user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_time ON focus_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_time ON ai_conversations(user_id, created_at);

-- 12. Dynamic Planner Logs (For complex structured JSON data)
CREATE TABLE IF NOT EXISTS planner_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_type TEXT CHECK (log_type IN ('daily', 'weekly', 'monthly', 'vision')),
  date DATE DEFAULT CURRENT_DATE,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE planner_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own planner logs" ON planner_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_planner_logs_date ON planner_logs(user_id, log_type, date);

-- ============================================
-- Migration: Add UNIQUE constraint for upsert
-- ============================================
ALTER TABLE planner_logs
  ADD CONSTRAINT IF NOT EXISTS planner_logs_user_type_date_unique
  UNIQUE (user_id, log_type, date);

-- ============================================
-- Migration: Add status column if missing
-- ============================================
ALTER TABLE planner_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'archived'));

-- ============================================
-- 13. Twelve-Week Year Plans
-- ============================================
CREATE TABLE IF NOT EXISTS twelve_week_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goals_json JSONB DEFAULT '[]',
  strategy TEXT DEFAULT 'parallel' CHECK (strategy IN ('series', 'parallel')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE twelve_week_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own 12-week plans" ON twelve_week_plans FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 14. Twelve-Week Year Tasks
-- ============================================
CREATE TABLE IF NOT EXISTS twelve_week_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES twelve_week_plans(id) ON DELETE CASCADE NOT NULL,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 13),
  tasks_json JSONB DEFAULT '[]',
  strategic_block_done BOOLEAN DEFAULT false,
  buffer_block_done BOOLEAN DEFAULT false,
  breakout_block_done BOOLEAN DEFAULT false,
  week_completed BOOLEAN DEFAULT false,
  review_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, week_number)
);

ALTER TABLE twelve_week_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own 12-week tasks" ON twelve_week_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM twelve_week_plans WHERE id = twelve_week_tasks.plan_id AND user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_twelve_week_tasks_plan ON twelve_week_tasks(plan_id, week_number);

-- ============================================
-- Migration: Add month_mapping to plans
-- ============================================
ALTER TABLE twelve_week_plans ADD COLUMN IF NOT EXISTS month_mapping JSONB DEFAULT '{}';

-- ============================================
-- Migration: Add milestone + daily_tasks_json to tasks
-- ============================================
ALTER TABLE twelve_week_tasks ADD COLUMN IF NOT EXISTS milestone TEXT DEFAULT '';
ALTER TABLE twelve_week_tasks ADD COLUMN IF NOT EXISTS daily_tasks_json JSONB DEFAULT '[]';
