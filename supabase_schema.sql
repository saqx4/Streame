-- Run this in your Supabase SQL Editor

-- Create the streaming_servers table
CREATE TABLE IF NOT EXISTS public.streaming_servers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  movie_url_pattern text,
  tv_url_pattern text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.streaming_servers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active servers
DROP POLICY IF EXISTS "Allow public read access to active streaming_servers" ON public.streaming_servers;
CREATE POLICY "Allow public read access to active streaming_servers" ON public.streaming_servers
  FOR SELECT USING (is_active = true);

-- Create user_roles table to manage admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user'
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role
DROP POLICY IF EXISTS "Allow users to read their own role" ON public.user_roles;
CREATE POLICY "Allow users to read their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove recursive read all roles policy
DROP POLICY IF EXISTS "Allow admins to read all roles" ON public.user_roles;

DROP POLICY IF EXISTS "Allow admins to insert servers" ON public.streaming_servers;
CREATE POLICY "Allow admins to insert servers" ON public.streaming_servers
  FOR INSERT WITH CHECK ( public.is_admin() );

DROP POLICY IF EXISTS "Allow admins to update servers" ON public.streaming_servers;
CREATE POLICY "Allow admins to update servers" ON public.streaming_servers
  FOR UPDATE USING ( public.is_admin() );

DROP POLICY IF EXISTS "Allow admins to delete servers" ON public.streaming_servers;
CREATE POLICY "Allow admins to delete servers" ON public.streaming_servers
  FOR DELETE USING ( public.is_admin() );

DROP POLICY IF EXISTS "Allow admins to see inactive servers" ON public.streaming_servers;
CREATE POLICY "Allow admins to see inactive servers" ON public.streaming_servers
  FOR SELECT USING ( public.is_admin() );

-- Create the admin user (Wait for any existing script, this ensures proper fields for Supabase Auth)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@streame.app',
  crypt('Moustafa@123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@streame.app'
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@streame.app'
ON CONFLICT (user_id) DO NOTHING;