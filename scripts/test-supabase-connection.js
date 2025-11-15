// This script tests the connection to Supabase and attempts to insert a test record
// Run with: node scripts/test-supabase-connection.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // Log environment variables (without showing actual values)
  console.log('NEXT_PUBLIC_SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Supabase environment variables are not set');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Test query to check connection
    console.log('Testing connection with a simple query...');
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error connecting to Supabase:', testError);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Found', testData.length, 'courses in the database');
    
    // Try to insert a test record
    console.log('\nTesting insert operation...');
    const testCourse = {
      title: 'Test Course ' + new Date().toISOString(),
      description: 'This is a test course created by the test script',
      video_id: 'test-' + Math.random().toString(36).substring(2, 10),
      youtube_url: 'https://www.youtube.com/watch?v=test',
      is_public: true,
      status: 'test',
      difficulty_level: 'beginner',
      metadata: {
        overview: 'Test overview',
        prerequisites: ['None'],
        objectives: ['Test the database connection'],
        resources: [],
        courseItems: []
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
      
      // Try with direct SQL
      console.log('\nTrying direct SQL insert...');
      const { data: sqlData, error: sqlError } = await supabase.query(`
        INSERT INTO courses (
          title, description, video_id, youtube_url, 
          is_public, status, difficulty_level, metadata
        ) VALUES (
          'SQL Test Course ${new Date().toISOString()}',
          'This is a test course created by SQL',
          'sql-test-${Math.random().toString(36).substring(2, 10)}',
          'https://www.youtube.com/watch?v=sqltest',
          true,
          'test',
          'beginner',
          '{"overview":"SQL Test overview","prerequisites":["None"],"objectives":["Test the database connection"],"resources":[],"courseItems":[]}'::jsonb
        ) RETURNING id
      `);
      
      if (sqlError) {
        console.error('Error with direct SQL insert:', sqlError);
      } else {
        console.log('SQL insert successful!', sqlData);
      }
      
      return;
    }
    
    console.log('Insert successful!', insertData);
    
    // Clean up the test record
    console.log('\nCleaning up test record...');
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    } else {
      console.log('Test record deleted successfully');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseConnection().catch(console.error);
