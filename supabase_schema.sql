-- ==============================================================================
-- ONE TECH ASANSÖR (ELEVATOROPS) - SUPABASE SCHEMA MIGRATION
-- Project ID: qdjlqmtmpbhidloxaxea
-- ==============================================================================

-- 1. Technicians Table
CREATE TABLE IF NOT EXISTS public.technicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'Field Technician',
    assigned_count INTEGER DEFAULT 0,
    avatar_color TEXT DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Building Sites Table
CREATE TABLE IF NOT EXISTS public.sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    neighborhood TEXT DEFAULT '',
    category TEXT DEFAULT 'private' CHECK (category IN ('private', 'public')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    floors INTEGER DEFAULT 1,
    elevator_units INTEGER DEFAULT 1,
    elevator_brand TEXT DEFAULT 'Otis',
    elevator_numbers TEXT DEFAULT '',
    assigned_technician_email TEXT DEFAULT 'adam.osama60@gmail.com',
    manager_name TEXT DEFAULT '',
    manager_phone TEXT DEFAULT '',
    access_code TEXT DEFAULT '',
    google_maps_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'vip', 'fault_alert')),
    last_visit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Maintenance & Emergency Visits Table
CREATE TABLE IF NOT EXISTS public.visits (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES public.sites(id) ON DELETE CASCADE,
    site_name TEXT NOT NULL,
    address TEXT DEFAULT '',
    neighborhood TEXT DEFAULT '',
    date DATE NOT NULL,
    time TIME NOT NULL,
    month_year TEXT NOT NULL,
    visit_type TEXT DEFAULT 'monthly' CHECK (visit_type IN ('monthly', 'fault', 'emergency')),
    technician_email TEXT NOT NULL,
    technician_name TEXT NOT NULL,
    attending_technicians JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'passed' CHECK (status IN ('passed', 'attention_needed', 'critical')),
    checklist JSONB DEFAULT '{}'::jsonb,
    parts_replaced TEXT DEFAULT 'None',
    notes TEXT DEFAULT '',
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Read & Write (for web app operations via public anon key)
DROP POLICY IF EXISTS "Allow anon full access to technicians" ON public.technicians;
CREATE POLICY "Allow anon full access to technicians" ON public.technicians
    FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to sites" ON public.sites;
CREATE POLICY "Allow anon full access to sites" ON public.sites
    FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to visits" ON public.visits;
CREATE POLICY "Allow anon full access to visits" ON public.visits
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enable Realtime publication for live synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.technicians;
