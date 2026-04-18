-- 🔥 Auto-sync email on new profiles (future-proof)
-- Run after add-email-to-profiles.sql

-- Function to sync email on profile insert/update
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.id != OLD.id OR COALESCE(NEW.email, '') != COALESCE(OLD.email, ''))) THEN
    UPDATE public.profiles p 
    SET email = u.email 
    FROM auth.users u 
    WHERE p.id = NEW.id AND u.id = NEW.id AND p.email != u.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after profile changes
CREATE TRIGGER sync_profile_email 
  AFTER INSERT OR UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- Test: INSERT/UPDATE profile → check email syncs

