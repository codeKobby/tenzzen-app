import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// TODO: Implement Convex user sync
// When a user is created/updated/deleted in Clerk, sync to Convex users table
// For now, this is a no-op since Clerk auth works directly with Convex via JWT

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

  // TODO: Sync to Convex instead of Supabase
  // For now, just log the event - Clerk JWT integration handles auth
  try {
    switch (eventType) {
      case 'user.created':
        console.log('User created:', evt.data.id);
        // TODO: Create user record in Convex if needed for user profiles
        break;
      case 'user.updated':
        console.log('User updated:', evt.data.id);
        // TODO: Update user record in Convex
        break;
      case 'user.deleted':
        console.log('User deleted:', evt.data.id);
        // TODO: Delete or mark user as deleted in Convex
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