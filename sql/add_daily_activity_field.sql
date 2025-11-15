-- Add daily_activity field to user_stats table if it doesn't exist
DO $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_stats' AND column_name = 'daily_activity'
  ) THEN
    -- Add the column
    ALTER TABLE user_stats ADD COLUMN daily_activity JSONB;
    
    -- Add comment explaining the field
    COMMENT ON COLUMN user_stats.daily_activity IS 'Stores daily activity tracking data in format {date: string, minutes: number}';
  END IF;
END $$;
