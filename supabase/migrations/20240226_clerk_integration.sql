-- Create function to parse Clerk user ID from JWT token
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;

-- Example usage for creating a table with user_id:
-- CREATE TABLE IF NOT EXISTS your_table (
--   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
--   user_id text DEFAULT requesting_user_id(),
--   -- other columns
-- );

-- Example RLS policy:
-- ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view own data" ON your_table
--   FOR SELECT USING (
--     requesting_user_id() = user_id
--   );
-- 
-- CREATE POLICY "Users can insert own data" ON your_table
--   FOR INSERT WITH CHECK (
--     requesting_user_id() = user_id
--   );