-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create users table (replacing auth.users for Render PostgreSQL)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert admin user (password: admin123, hashed with crypt)
INSERT INTO public.users (id, email, password_hash)
VALUES (
    gen_random_uuid(),
    'admin@company.com',
    crypt('admin123', gen_salt('bf'))
) RETURNING id;

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Insert admin role for the admin user (use admin@company.com to look up id)
-- replaced the manual placeholder with a safe insert that looks up the admin user by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.users
WHERE email = 'admin@company.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- New: RPC to authenticate by email+password and return roles + is_admin flag
CREATE OR REPLACE FUNCTION public.authenticate_user(_email TEXT, _password TEXT)
RETURNS TABLE(user_id UUID, email TEXT, is_admin BOOLEAN, roles app_role[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'
    ) AS is_admin,
    ARRAY(
      SELECT ur2.role FROM public.user_roles ur2 WHERE ur2.user_id = u.id
    ) AS roles
  FROM public.users u
  WHERE u.email = _email
    AND u.password_hash = crypt(_password, u.password_hash);
END;
$$;

-- Grant RPC execute to anon so frontend can call authenticate_user
GRANT EXECUTE ON FUNCTION public.authenticate_user(TEXT, TEXT) TO anon;

-- RLS policy for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies to existing tables
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all locations"
ON public.location_tracks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all sessions"
ON public.time_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all tasks"
ON public.tasks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all activity"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));