import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md p-6 space-y-4 text-center">
        <h2 className="text-2xl font-bold">Content Not Found</h2>
        <p className="text-muted-foreground">
          The video you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/">
              Go Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}