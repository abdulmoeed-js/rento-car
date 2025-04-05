
-- First, add columns to the profiles table for KYC info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'not_submitted';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create the KYC review logs table
CREATE TABLE IF NOT EXISTS public.kyc_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) policies for kyc_review_logs
ALTER TABLE public.kyc_review_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can select the logs
CREATE POLICY "Admins can view all KYC logs" 
  ON public.kyc_review_logs 
  FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Only admins can insert logs
CREATE POLICY "Admins can insert KYC logs" 
  ON public.kyc_review_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Create user roles type and table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN 
    NULL;
END$$;

-- Create user roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admin can query user roles
CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Create a function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create a function to create an admin user
CREATE OR REPLACE FUNCTION public.make_admin(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Find the user ID from the email
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  -- Insert the admin role if the user exists
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
