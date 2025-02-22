'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

type VerificationStatus = 'pending' | 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const { user, session } = useAuth()
  const [status, setStatus] = useState<VerificationStatus>('pending')
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const error = searchParams.get('error')

  useEffect(() => {
    // Show error toast if verification failed
    if (error === 'verification_failed') {
      toast({
        title: "Verification Failed",
        description: "We couldn't verify your email. The link may be invalid or expired.",
        variant: "destructive"
      })
    }

    // Check verification status
    if (user?.email_confirmed_at) {
      setStatus('success')
      toast({
        title: "Email Verified ✓",
        description: "Your email has been verified successfully.",
      })
    } else if (!user && !session && !email) {
      setStatus('error')
    }
  }, [user, session, email, error])

  if (status === 'pending') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
              <Mail className="h-12 w-12 text-primary relative" />
            </div>
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to{' '}
                <span className="font-medium text-primary">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the link in the email to verify your account. If you don't see the email, check your spam folder.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/signin">Back to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-sm" />
              <CheckCircle2 className="h-12 w-12 text-emerald-500 relative" />
            </div>
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-emerald-500">
                Email verified successfully
              </h1>
              <p className="text-sm text-muted-foreground">
                Your email has been verified. You can now proceed to sign in.
              </p>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
            >
              <Link href="/signin">Continue to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-destructive/20 blur-sm" />
            <XCircle className="h-12 w-12 text-destructive relative" />
          </div>
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-destructive">
              Verification failed
            </h1>
            <p className="text-sm text-muted-foreground">
              The verification link is invalid or has expired.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/signin">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
