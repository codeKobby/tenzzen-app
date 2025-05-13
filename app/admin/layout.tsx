import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin - TenzZen',
  description: 'TenzZen Admin Dashboard',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated and has admin role
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // In a real app, you would check if the user has admin privileges
  // For now, we'll just allow any authenticated user to access the admin section
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  );
}
