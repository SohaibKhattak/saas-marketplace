-- 13_auth_trigger.sql

-- Drop triggers first to remove dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Remove legacy single-purpose trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_sync() CASCADE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_user_sync() 
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
  metadata_role TEXT;
  parsed_role public."UserRole";
BEGIN
  IF TG_OP = 'INSERT' THEN
    provider := CASE
      WHEN COALESCE(NEW.raw_app_meta_data->>'provider', '') = 'google' THEN 'GOOGLE'
      ELSE 'PASSWORD'
    END;
    metadata_role := NEW.raw_user_meta_data->>'role';
    parsed_role := CASE
      WHEN metadata_role IN ('CUSTOMER', 'DEVELOPER', 'ADMIN') THEN metadata_role::public."UserRole"
      WHEN provider = 'GOOGLE' THEN NULL
      ELSE 'CUSTOMER'::public."UserRole"
    END;

    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      auth_provider,
      avatar_url,
      email_verified,
      is_suspended,
      profile_complete,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      parsed_role,
      provider,
      NEW.raw_user_meta_data->>'avatar_url',
      CASE WHEN provider = 'GOOGLE' THEN true ELSE NEW.email_confirmed_at IS NOT NULL END,
      false,
      parsed_role IS NOT NULL,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      email_verified = EXCLUDED.email_verified,
      auth_provider = COALESCE(public.users.auth_provider, EXCLUDED.auth_provider),
      role = COALESCE(public.users.role, EXCLUDED.role),
      profile_complete = COALESCE(public.users.profile_complete, false) OR EXCLUDED.profile_complete,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    provider := CASE
      WHEN COALESCE(NEW.raw_app_meta_data->>'provider', '') = 'google' THEN 'GOOGLE'
      ELSE 'PASSWORD'
    END;
    metadata_role := NEW.raw_user_meta_data->>'role';

    UPDATE public.users SET
      email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.users.full_name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', public.users.avatar_url),
      email_verified = CASE WHEN provider = 'GOOGLE' THEN true ELSE NEW.email_confirmed_at IS NOT NULL END,
      auth_provider = COALESCE(public.users.auth_provider, provider),
      profile_complete = COALESCE(public.users.profile_complete, false) OR (metadata_role IS NOT NULL AND metadata_role IN ('CUSTOMER', 'DEVELOPER', 'ADMIN')),
      role = CASE
        WHEN public.users.role IS NOT NULL THEN public.users.role
        WHEN metadata_role IN ('CUSTOMER', 'DEVELOPER', 'ADMIN') THEN metadata_role::public."UserRole"
        WHEN provider = 'PASSWORD' THEN 'CUSTOMER'::public."UserRole"
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.users WHERE id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

