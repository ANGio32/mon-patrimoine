-- ═══════════════════════════════════════════════════════════════
-- Morphiq – Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles (extends auth.users) ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name            TEXT,
  sex             TEXT,
  age             INTEGER,
  weight_kg       REAL,
  height_cm       REAL,
  activity_level  TEXT,
  goal            TEXT,
  equipment       TEXT,
  gemini_api_key  TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily logs (one row per user per day) ─────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date      TEXT NOT NULL,
  meals     JSONB DEFAULT '[]',
  workouts  JSONB DEFAULT '[]',
  UNIQUE(user_id, date)
);

-- ── AI Programs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_programs (
  id         TEXT PRIMARY KEY,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name       TEXT,
  request    TEXT,
  sessions   JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Weekly Challenge (one active per user) ────────────────────
CREATE TABLE IF NOT EXISTS weekly_challenges (
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  id            TEXT NOT NULL,
  week_start    TEXT,
  title         TEXT,
  description   TEXT,
  target_days   INTEGER,
  completed_days JSONB DEFAULT '[]',
  emoji         TEXT,
  reward        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"    ON profiles          FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_logs"       ON daily_logs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_programs"   ON ai_programs       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_challenges" ON weekly_challenges FOR ALL USING (auth.uid() = user_id);

-- ── Auto-create profile row on signup ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
