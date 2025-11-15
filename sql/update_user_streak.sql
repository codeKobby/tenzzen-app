-- SQL function to update user streak based on login dates
-- This function handles the streak logic for consecutive daily logins

-- Create the update_user_streak function
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_current_time TIMESTAMPTZ DEFAULT NOW())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  v_last_login_date DATE;
  v_current_date DATE := p_current_time::DATE;
  v_days_diff INTEGER;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_result JSONB;
BEGIN
  -- Get the last login date from the users table
  SELECT (last_login->>'time')::TIMESTAMPTZ::DATE INTO v_last_login_date
  FROM users
  WHERE id = p_user_id;
  
  -- Get current streak and longest streak
  SELECT streak_days, longest_streak INTO v_current_streak, v_longest_streak
  FROM user_stats
  WHERE user_id = p_user_id;
  
  -- Default values if not found
  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);
  
  -- If last login is null, this is the first login
  IF v_last_login_date IS NULL THEN
    v_current_streak := 1;
  ELSE
    -- Calculate days difference
    v_days_diff := v_current_date - v_last_login_date;
    
    -- Update streak based on difference
    IF v_days_diff = 0 THEN
      -- Same day, no change to streak
      NULL; -- No operation
    ELSIF v_days_diff = 1 THEN
      -- Consecutive day, increment streak
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Gap in days, reset streak
      v_current_streak := 1;
    END IF;
  END IF;
  
  -- Update longest streak if current streak is higher
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Update user_stats table
  UPDATE user_stats
  SET 
    streak_days = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_at = p_current_time,
    updated_at = p_current_time
  WHERE user_id = p_user_id;
  
  -- Update last_login in users table
  UPDATE users
  SET last_login = jsonb_build_object('time', p_current_time)
  WHERE id = p_user_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'last_login_date', v_last_login_date,
    'current_date', v_current_date,
    'days_diff', v_days_diff
  );
  
  RETURN v_result;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION update_user_streak IS 'Updates user streak based on consecutive daily logins';
