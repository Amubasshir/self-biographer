-- ============================================
-- SelfBiographer.com - Complete Supabase Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'pro', 'agency', 'admin');

-- Subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'agency');

-- Profile types enum
CREATE TYPE public.profile_type AS ENUM ('person', 'organization', 'brand');

-- Bio types enum
CREATE TYPE public.bio_type AS ENUM ('short', 'medium', 'long', 'linkedin', 'speaker', 'press', 'x_bio', 'facebook_bio');

-- Bio tones enum
CREATE TYPE public.bio_tone AS ENUM ('professional', 'friendly', 'formal', 'casual', 'academic', 'storytelling');

-- Schema types enum
CREATE TYPE public.schema_type AS ENUM ('Person', 'Organization', 'Product', 'Article', 'WebPage');

-- ============================================
-- TABLES
-- ============================================

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_name TEXT,
    avatar_url TEXT,
    subscription_plan subscription_plan DEFAULT 'free',
    profile_limit INTEGER DEFAULT 1,
    profile_count INTEGER DEFAULT 0,
    paypal_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Profiles (biography profiles, not user profiles)
CREATE TABLE public.bio_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type profile_type DEFAULT 'person',
    name TEXT NOT NULL,
    job_title TEXT,
    website TEXT,
    bio_notes TEXT,
    social_links JSONB DEFAULT '[]'::jsonb,
    slug TEXT UNIQUE,
    main_image TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biographies
CREATE TABLE public.biographies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE CASCADE NOT NULL,
    bio_type bio_type NOT NULL,
    content TEXT,
    tone bio_tone DEFAULT 'professional',
    is_locked BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema snippets (JSON-LD)
CREATE TABLE public.schema_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE CASCADE NOT NULL,
    schema_type schema_type DEFAULT 'Person',
    schema_text TEXT,
    validated BOOLEAN DEFAULT FALSE,
    validation_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Press kits
CREATE TABLE public.press_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE CASCADE NOT NULL,
    slug TEXT UNIQUE,
    include_short_bio BOOLEAN DEFAULT TRUE,
    include_long_bio BOOLEAN DEFAULT TRUE,
    include_images BOOLEAN DEFAULT TRUE,
    include_contacts BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type TEXT NOT NULL, -- 'bio', 'schema', 'press_kit'
    name TEXT NOT NULL,
    content TEXT,
    tone bio_tone,
    premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Request logs
CREATE TABLE public.ai_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    raw_prompt TEXT,
    response_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing history
CREATE TABLE public.billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    description TEXT,
    paypal_transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics (profile views)
CREATE TABLE public.profile_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE CASCADE NOT NULL,
    view_date DATE DEFAULT CURRENT_DATE,
    views_count INTEGER DEFAULT 1,
    unique_visitors INTEGER DEFAULT 1,
    UNIQUE(profile_id, view_date)
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check user role (security definer to avoid RLS recursion)
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

-- Function to get user's current role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces with hyphens
    base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Add random suffix for uniqueness
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
    
    RETURN final_slug;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bio_profiles_updated_at
    BEFORE UPDATE ON public.bio_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_biographies_updated_at
    BEFORE UPDATE ON public.biographies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_schema_snippets_updated_at
    BEFORE UPDATE ON public.schema_snippets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_press_kits_updated_at
    BEFORE UPDATE ON public.press_kits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to check profile limit before insert
CREATE OR REPLACE FUNCTION public.check_profile_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_profile_count INTEGER;
    user_profile_limit INTEGER;
BEGIN
    SELECT profile_count, profile_limit 
    INTO user_profile_count, user_profile_limit
    FROM public.profiles 
    WHERE id = NEW.owner_id;
    
    IF user_profile_count >= user_profile_limit THEN
        RAISE EXCEPTION 'Profile limit reached. Please upgrade your plan.';
    END IF;
    
    -- Update profile count
    UPDATE public.profiles 
    SET profile_count = profile_count + 1 
    WHERE id = NEW.owner_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_profile_limit_trigger
    BEFORE INSERT ON public.bio_profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_limit();

-- Function to decrement profile count on delete
CREATE OR REPLACE FUNCTION public.decrement_profile_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.profiles 
    SET profile_count = GREATEST(profile_count - 1, 0)
    WHERE id = OLD.owner_id;
    
    RETURN OLD;
END;
$$;

CREATE TRIGGER decrement_profile_count_trigger
    AFTER DELETE ON public.bio_profiles
    FOR EACH ROW EXECUTE FUNCTION public.decrement_profile_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_profile_view(p_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profile_analytics (profile_id, view_date, views_count, unique_visitors)
    VALUES (p_profile_id, CURRENT_DATE, 1, 1)
    ON CONFLICT (profile_id, view_date)
    DO UPDATE SET views_count = profile_analytics.views_count + 1;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biographies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Bio profiles policies
CREATE POLICY "Users can view own bio profiles"
    ON public.bio_profiles FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create bio profiles"
    ON public.bio_profiles FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own bio profiles"
    ON public.bio_profiles FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own bio profiles"
    ON public.bio_profiles FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Public can view published profiles"
    ON public.bio_profiles FOR SELECT
    TO anon
    USING (published = TRUE);

CREATE POLICY "Admins can manage all bio profiles"
    ON public.bio_profiles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Biographies policies
CREATE POLICY "Users can view own biographies"
    ON public.biographies FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = biographies.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create biographies for own profiles"
    ON public.biographies FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own biographies"
    ON public.biographies FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = biographies.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own biographies"
    ON public.biographies FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = biographies.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can view biographies of published profiles"
    ON public.biographies FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = biographies.profile_id 
            AND bio_profiles.published = TRUE
        )
    );

-- Schema snippets policies (similar pattern)
CREATE POLICY "Users can manage own schema snippets"
    ON public.schema_snippets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = schema_snippets.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can view schemas of published profiles"
    ON public.schema_snippets FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = schema_snippets.profile_id 
            AND bio_profiles.published = TRUE
        )
    );

-- Press kits policies
CREATE POLICY "Users can manage own press kits"
    ON public.press_kits FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = press_kits.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Public can view published press kits"
    ON public.press_kits FOR SELECT
    TO anon
    USING (is_published = TRUE);

-- Templates policies
CREATE POLICY "Anyone can view non-premium templates"
    ON public.templates FOR SELECT
    TO authenticated
    USING (premium = FALSE);

CREATE POLICY "Pro users can view all templates"
    ON public.templates FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'pro') OR 
        public.has_role(auth.uid(), 'agency') OR 
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can manage templates"
    ON public.templates FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- AI request logs policies
CREATE POLICY "Users can view own AI logs"
    ON public.ai_request_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create AI logs"
    ON public.ai_request_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all AI logs"
    ON public.ai_request_logs FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Billing history policies
CREATE POLICY "Users can view own billing history"
    ON public.billing_history FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage billing"
    ON public.billing_history FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Profile analytics policies
CREATE POLICY "Users can view own profile analytics"
    ON public.profile_analytics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bio_profiles 
            WHERE bio_profiles.id = profile_analytics.profile_id 
            AND bio_profiles.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all analytics"
    ON public.profile_analytics FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SEED DATA - Default Templates
-- ============================================

INSERT INTO public.templates (template_type, name, content, tone, premium) VALUES
('bio', 'Short Professional Bio', 'Write a concise professional biography (max 120 words) that highlights key achievements and current role.', 'professional', false),
('bio', 'Long Form Biography', 'Write a comprehensive biography (500-700 words) suitable for an About page or press kit.', 'professional', false),
('bio', 'LinkedIn Summary', 'Write an engaging LinkedIn summary that showcases expertise and invites connections.', 'friendly', false),
('bio', 'Speaker Introduction', 'Write a compelling speaker introduction for conference events and presentations.', 'formal', true),
('bio', 'Press Release Bio', 'Write a media-ready biography suitable for press releases and news articles.', 'formal', true),
('bio', 'Storytelling Bio', 'Write a narrative-style biography that tells the person''s story in an engaging way.', 'storytelling', true),
('schema', 'Person Schema', 'Generate JSON-LD structured data for a Person with name, jobTitle, and social links.', 'professional', false),
('schema', 'Organization Schema', 'Generate JSON-LD structured data for an Organization.', 'professional', false),
('press_kit', 'Standard Press Kit', 'A professional press kit with bio, images, and contact information.', 'professional', false),
('press_kit', 'Media Kit Pro', 'An enhanced media kit with extended biography, achievements timeline, and downloadable assets.', 'professional', true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Storage policies
CREATE POLICY "Users can upload own avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload profile images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id IN ('avatars', 'profile-images') AND auth.uid()::text = (storage.foldername(name))[1]);
