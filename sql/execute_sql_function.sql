-- This SQL file creates a stored procedure that allows executing SQL queries from the client
-- You need to run this SQL in your Supabase SQL editor

-- Create the execute_sql function
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
SET search_path = public
AS $$
DECLARE
  result JSONB;
  is_select BOOLEAN;
BEGIN
  -- Check if the query is a SELECT statement
  is_select := position('SELECT' in upper(sql_query)) = 1;

  IF is_select THEN
    -- For SELECT statements, capture the result as JSON
    BEGIN
      EXECUTE 'SELECT to_jsonb(result) FROM (' || sql_query || ') as result' INTO result;
      RETURN result;
    EXCEPTION
      WHEN OTHERS THEN
        -- Return error information as JSON
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE,
          'query', sql_query
        );
    END;
  ELSE
    -- For non-SELECT statements (DDL, DML), just execute without capturing result
    BEGIN
      EXECUTE sql_query;
      RETURN jsonb_build_object(
        'success', true,
        'message', 'SQL executed successfully',
        'query_type', 'non-select'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Return error information as JSON
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE,
          'query', sql_query
        );
    END;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information as JSON for any other errors
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'query', sql_query
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION execute_sql IS 'Executes a SQL query and returns the result as JSONB. Handles both SELECT queries and DDL/DML statements. This function should be used with caution as it allows executing arbitrary SQL.';

-- Create a Row Level Security policy for the function
-- This is just an example - you might want to customize this based on your needs
CREATE POLICY "Allow authenticated users to execute SQL"
ON execute_sql
FOR ALL
TO authenticated
USING (true);
