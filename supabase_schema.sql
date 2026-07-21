-- Run this SQL in your Supabase SQL Editor to create the necessary tables for KhataIndex

-- Create the 'releases' table
CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  changelog TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  download_count BIGINT DEFAULT 0,
  is_latest BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true
);

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the 'screenshots' table
CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  order_idx INTEGER DEFAULT 0
);

-- Optional: Enable Row Level Security (RLS) if needed. 
-- Since we are using the Anon Key/Publishable key, we must allow access. 
-- For a public app where the server syncs securely, you can allow all operations for now.

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on releases" ON releases FOR SELECT USING (true);
CREATE POLICY "Allow public all access on releases (temporary for sync)" ON releases FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public all access on users (temporary for sync)" ON users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on screenshots" ON screenshots FOR SELECT USING (true);
CREATE POLICY "Allow public all access on screenshots (temporary for sync)" ON screenshots FOR ALL USING (true) WITH CHECK (true);
