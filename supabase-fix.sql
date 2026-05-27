-- ============================================================
-- Brainhance OS – Full Database Fix (Safe Re-run)
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ══════════════════════════════════════════════
-- PART 1: Fix planner_logs table
-- ══════════════════════════════════════════════

ALTER TABLE planner_logs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

DELETE FROM planner_logs a
USING planner_logs b
WHERE a.created_at < b.created_at
  AND a.user_id = b.user_id
  AND a.log_type = b.log_type
  AND a.date = b.date;

ALTER TABLE planner_logs
  DROP CONSTRAINT IF EXISTS planner_logs_user_type_date_unique;

ALTER TABLE planner_logs
  ADD CONSTRAINT planner_logs_user_type_date_unique
  UNIQUE (user_id, log_type, date);

DROP POLICY IF EXISTS "Users can manage own planner logs" ON planner_logs;
DROP POLICY IF EXISTS "Users can select own planner logs" ON planner_logs;
DROP POLICY IF EXISTS "Users can insert own planner logs" ON planner_logs;
DROP POLICY IF EXISTS "Users can update own planner logs" ON planner_logs;
DROP POLICY IF EXISTS "Users can delete own planner logs" ON planner_logs;

CREATE POLICY "Users can select own planner logs"
  ON planner_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planner logs"
  ON planner_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planner logs"
  ON planner_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own planner logs"
  ON planner_logs FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════
-- PART 2: Create five_whys table
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS five_whys (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal            TEXT NOT NULL DEFAULT '',
  answers         JSONB DEFAULT '[]',
  internal_belief TEXT DEFAULT '',
  analysis        TEXT DEFAULT '',
  insight         TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE five_whys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own five_whys" ON five_whys;
DROP POLICY IF EXISTS "Users can insert own five_whys" ON five_whys;
DROP POLICY IF EXISTS "Users can delete own five_whys" ON five_whys;

CREATE POLICY "Users can select own five_whys"
  ON five_whys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own five_whys"
  ON five_whys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own five_whys"
  ON five_whys FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_five_whys_user
  ON five_whys(user_id, created_at DESC);

-- ══════════════════════════════════════════════
-- PART 3: Create problem_solver table (IDEA / حل المشكلات)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS problem_solver (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  identity    TEXT DEFAULT '',
  develop     JSONB DEFAULT '[]',
  execute     JSONB DEFAULT '[]',
  assessment  TEXT DEFAULT '',
  tags        JSONB DEFAULT '[]',
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'solved')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE problem_solver ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own problem_solver" ON problem_solver;
DROP POLICY IF EXISTS "Users can insert own problem_solver" ON problem_solver;
DROP POLICY IF EXISTS "Users can update own problem_solver" ON problem_solver;
DROP POLICY IF EXISTS "Users can delete own problem_solver" ON problem_solver;

CREATE POLICY "Users can select own problem_solver"
  ON problem_solver FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own problem_solver"
  ON problem_solver FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own problem_solver"
  ON problem_solver FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own problem_solver"
  ON problem_solver FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_problem_solver_user
  ON problem_solver(user_id, created_at DESC);

-- ══════════════════════════════════════════════
-- PART 4: Create content_studio table
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_studio (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  stage          TEXT DEFAULT 'idea',
  platform       TEXT DEFAULT '',
  scheduled_date DATE,
  niche          TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_studio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own content_studio" ON content_studio;
DROP POLICY IF EXISTS "Users can insert own content_studio" ON content_studio;
DROP POLICY IF EXISTS "Users can update own content_studio" ON content_studio;
DROP POLICY IF EXISTS "Users can delete own content_studio" ON content_studio;

CREATE POLICY "Users can select own content_studio"
  ON content_studio FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content_studio"
  ON content_studio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content_studio"
  ON content_studio FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_studio"
  ON content_studio FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_content_studio_user
  ON content_studio(user_id, created_at DESC);

-- ══════════════════════════════════════════════
-- PART 5: Create platform_links table
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform_links (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform   TEXT NOT NULL DEFAULT '',
  url        TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own platform_links" ON platform_links;
DROP POLICY IF EXISTS "Users can insert own platform_links" ON platform_links;
DROP POLICY IF EXISTS "Users can delete own platform_links" ON platform_links;

CREATE POLICY "Users can select own platform_links"
  ON platform_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own platform_links"
  ON platform_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own platform_links"
  ON platform_links FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════
-- PART 6: Create content_scripts table (NEW - Scripts tab)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_scripts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  hook       TEXT DEFAULT '',
  body       TEXT DEFAULT '',
  cta        TEXT DEFAULT '',
  platform   TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own content_scripts" ON content_scripts;
DROP POLICY IF EXISTS "Users can insert own content_scripts" ON content_scripts;
DROP POLICY IF EXISTS "Users can delete own content_scripts" ON content_scripts;

CREATE POLICY "Users can select own content_scripts"
  ON content_scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content_scripts"
  ON content_scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_scripts"
  ON content_scripts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_content_scripts_user
  ON content_scripts(user_id, created_at DESC);

-- ══════════════════════════════════════════════
-- PART 7: Create twelve_week_plans & twelve_week_tasks tables
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS twelve_week_plans (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goals_json  JSONB DEFAULT '[]',
  strategy    TEXT DEFAULT 'parallel',
  status      TEXT DEFAULT 'active',
  start_date  DATE,
  month_mapping JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE twelve_week_plans ADD COLUMN IF NOT EXISTS month_mapping JSONB DEFAULT '{}';


ALTER TABLE twelve_week_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own twelve_week_plans" ON twelve_week_plans;
DROP POLICY IF EXISTS "Users can insert own twelve_week_plans" ON twelve_week_plans;
DROP POLICY IF EXISTS "Users can update own twelve_week_plans" ON twelve_week_plans;
DROP POLICY IF EXISTS "Users can delete own twelve_week_plans" ON twelve_week_plans;

CREATE POLICY "Users can select own twelve_week_plans"
  ON twelve_week_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own twelve_week_plans"
  ON twelve_week_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own twelve_week_plans"
  ON twelve_week_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own twelve_week_plans"
  ON twelve_week_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS twelve_week_tasks (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id              UUID REFERENCES twelve_week_plans(id) ON DELETE CASCADE NOT NULL,
  week_number          INTEGER NOT NULL,
  tasks_json           JSONB DEFAULT '[]',
  milestone            TEXT DEFAULT '',
  daily_tasks_json     JSONB DEFAULT '[]',
  strategic_block_done BOOLEAN DEFAULT false,
  buffer_block_done    BOOLEAN DEFAULT false,
  breakout_block_done  BOOLEAN DEFAULT false,
  week_completed       BOOLEAN DEFAULT false,
  review_notes         TEXT DEFAULT '',
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, week_number)
);

ALTER TABLE twelve_week_tasks ADD COLUMN IF NOT EXISTS milestone TEXT DEFAULT '';
ALTER TABLE twelve_week_tasks ADD COLUMN IF NOT EXISTS daily_tasks_json JSONB DEFAULT '[]';

ALTER TABLE twelve_week_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own twelve_week_tasks" ON twelve_week_tasks;
DROP POLICY IF EXISTS "Users can insert own twelve_week_tasks" ON twelve_week_tasks;
DROP POLICY IF EXISTS "Users can update own twelve_week_tasks" ON twelve_week_tasks;
DROP POLICY IF EXISTS "Users can delete own twelve_week_tasks" ON twelve_week_tasks;

CREATE POLICY "Users can select own twelve_week_tasks"
  ON twelve_week_tasks FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM twelve_week_plans WHERE id = plan_id)
  );
CREATE POLICY "Users can insert own twelve_week_tasks"
  ON twelve_week_tasks FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM twelve_week_plans WHERE id = plan_id)
  );
CREATE POLICY "Users can update own twelve_week_tasks"
  ON twelve_week_tasks FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM twelve_week_plans WHERE id = plan_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM twelve_week_plans WHERE id = plan_id)
  );
CREATE POLICY "Users can delete own twelve_week_tasks"
  ON twelve_week_tasks FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM twelve_week_plans WHERE id = plan_id)
  );

-- ══════════════════════════════════════════════
-- VERIFY — should return all 8 tables
-- ══════════════════════════════════════════════
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'planner_logs', 'five_whys', 'problem_solver',
    'content_studio', 'platform_links', 'content_scripts',
    'twelve_week_plans', 'twelve_week_tasks'
  )
ORDER BY table_name;
