
-- Create a stored procedure for logging user activity
-- This helps avoid TypeScript errors with direct table access
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_activity (
    user_id,
    activity_type,
    details
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_details
  );
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
