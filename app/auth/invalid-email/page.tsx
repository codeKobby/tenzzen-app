import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function InvalidEmailPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Invalid Email Error</CardTitle>
          <CardDescription>
            There was a problem with your Google sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This could happen if:
            <ul className="list-disc pl-5 mt-2">
              <li>The email address from your Google account is invalid</li>
              <li>There was a problem verifying your email</li>
              <li>You previously signed up using a different method</li>
            </ul>
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/signin">Try Again</Link>
            </Button>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
