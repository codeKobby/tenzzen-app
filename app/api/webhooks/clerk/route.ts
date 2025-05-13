import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Get the event type
  const eventType = evt.type;
  console.log(`Webhook received: ${eventType}`);

  // Create a Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle the event
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data, supabase);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data, supabase);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function handleUserCreated(data: any, supabase: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', id)
    .single();

  if (existingUser) {
    console.log(`User ${id} already exists in Supabase`);
    return;
  }

  // Create the user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      image_url: image_url,
      auth_provider: 'clerk',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: {
        time: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user in Supabase:', error);
    throw error;
  }

  console.log(`User ${id} created in Supabase`);

  // Initialize user profile and stats
  if (newUser) {
    await supabase.from('user_profiles').insert({
      user_id: newUser.id,
    });

    await supabase.from('user_stats').insert({
      user_id: newUser.id,
    });

    console.log(`User profile and stats initialized for user ${id}`);
  }
}

async function handleUserUpdated(data: any, supabase: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  // Update the user
  const { error } = await supabase
    .from('users')
    .update({
      email: email_addresses[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      image_url: image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', id);

  if (error) {
    console.error('Error updating user in Supabase:', error);
    throw error;
  }

  console.log(`User ${id} updated in Supabase`);
}

async function handleUserDeleted(data: any, supabase: any) {
  const { id } = data;

  // Delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('clerk_id', id);

  if (error) {
    console.error('Error deleting user in Supabase:', error);
    throw error;
  }

  console.log(`User ${id} deleted from Supabase`);
}
