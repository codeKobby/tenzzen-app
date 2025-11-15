-- This SQL file creates a stored procedure for syncing users between Clerk and Supabase
-- You need to run this SQL in your Supabase SQL editor

-- Create the sync_user function
CREATE OR REPLACE FUNCTION sync_user(
  p_clerk_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_image_url TEXT,
  p_auth_provider TEXT,
  p_role TEXT,
  p_status TEXT,
  p_last_login JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user JSONB;
  v_action TEXT;
  v_profile_created BOOLEAN := false;
  v_stats_created BOOLEAN := false;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id
  FROM users
  WHERE clerk_id = p_clerk_id;

  IF v_user_id IS NOT NULL THEN
    -- User exists, update their information
    UPDATE users
    SET
      email = p_email,
      name = p_name,
      image_url = p_image_url,
      auth_provider = p_auth_provider,
      role = p_role,
      status = p_status,
      last_login = p_last_login,
      updated_at = NOW()
    WHERE id = v_user_id;

    v_action := 'updated';
  ELSE
    -- User doesn't exist, create a new user
    INSERT INTO users (
      clerk_id,
      email,
      name,
      image_url,
      auth_provider,
      role,
      status,
      last_login,
      created_at,
      updated_at
    )
    VALUES (
      p_clerk_id,
      p_email,
      p_name,
      p_image_url,
      p_auth_provider,
      p_role,
      p_status,
      p_last_login,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_user_id;

    v_action := 'created';

    -- Create user_profile record
    BEGIN
      INSERT INTO user_profiles (user_id)
      VALUES (v_user_id);
      v_profile_created := true;
    EXCEPTION
      WHEN OTHERS THEN
        v_profile_created := false;
    END;

    -- Create user_stats record
    BEGIN
      INSERT INTO user_stats (user_id)
      VALUES (v_user_id);
      v_stats_created := true;
    EXCEPTION
      WHEN OTHERS THEN
        v_stats_created := false;
    END;
  END IF;

  -- Get the user data
  SELECT to_jsonb(u) INTO v_user
  FROM users u
  WHERE id = v_user_id;

  -- Return the result
  RETURN jsonb_build_object(
    'user', v_user,
    'action', v_action,
    'profile_created', v_profile_created,
    'stats_created', v_stats_created
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information as JSON
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_user TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION sync_user IS 'Synchronizes a user between Clerk and Supabase. Creates or updates a user record and associated profile and stats records.';
