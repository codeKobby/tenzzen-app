import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Migrates users from Clerk to Supabase
 * This is a utility function to ensure all Clerk users are properly synced to Supabase
 */
export async function migrateUsers() {
  console.log('Starting user migration from Clerk to Supabase...');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100,
    });
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    // Get all users from Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabase
      .from('users')
      .select('clerk_id');
      
    if (supabaseError) {
      throw new Error(`Error fetching Supabase users: ${supabaseError.message}`);
    }
    
    // Create a set of existing Clerk IDs in Supabase
    const existingClerkIds = new Set(supabaseUsers.map(user => user.clerk_id));
    
    console.log(`Found ${supabaseUsers.length} users in Supabase`);
    
    // Find users that need to be migrated
    const usersToMigrate = clerkUsers.filter(user => !existingClerkIds.has(user.id));
    
    console.log(`Found ${usersToMigrate.length} users to migrate`);
    
    // Migrate each user
    const migrationResults = await Promise.all(
      usersToMigrate.map(async (user) => {
        try {
          // Extract user data
          const email = user.emailAddresses[0]?.emailAddress;
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const imageUrl = user.imageUrl;
          
          // Insert user into Supabase
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({
              clerk_id: user.id,
              email: email,
              name: `${firstName} ${lastName}`.trim(),
              image_url: imageUrl,
              auth_provider: 'clerk',
              role: 'user',
              status: 'active',
              created_at: new Date(user.createdAt).toISOString(),
              updated_at: new Date().toISOString(),
              last_login: {
                time: new Date().toISOString()
              }
            })
            .select()
            .single();
            
          if (error) {
            console.error(`Error migrating user ${user.id}:`, error);
            return { 
              success: false, 
              userId: user.id, 
              error: error.message 
            };
          }
          
          // Initialize user profile and stats
          if (newUser) {
            await supabase.from('user_profiles').insert({
              user_id: newUser.id,
            });
            
            await supabase.from('user_stats').insert({
              user_id: newUser.id,
            });
          }
          
          return { 
            success: true, 
            userId: user.id, 
            supabaseId: newUser?.id 
          };
        } catch (error: any) {
          console.error(`Error migrating user ${user.id}:`, error);
          return { 
            success: false, 
            userId: user.id, 
            error: error.message 
          };
        }
      })
    );
    
    // Summarize results
    const successCount = migrationResults.filter(r => r.success).length;
    const failureCount = migrationResults.filter(r => !r.success).length;
    
    console.log(`Migration complete. Success: ${successCount}, Failures: ${failureCount}`);
    
    return {
      total: clerkUsers.length,
      existing: supabaseUsers.length,
      toMigrate: usersToMigrate.length,
      migrated: successCount,
      failed: failureCount,
      details: migrationResults
    };
    
  } catch (error: any) {
    console.error('Error during user migration:', error);
    throw new Error(`Migration failed: ${error.message}`);
  }
}
