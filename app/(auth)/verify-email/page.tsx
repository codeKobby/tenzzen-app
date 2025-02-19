'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

type VerificationStatus = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const { supabase } = useAuth()
  const [status, setStatus] = useState<VerificationStatus>('verifying')

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const handleVerification = async () => {
      try {
        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
            setStatus('success')
          }
        })

        unsubscribe = () => subscription.unsubscribe()

        // Check current auth state
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email_confirmed_at) {
          setStatus('success')
        } else if (!user) {
          setStatus('error')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
      }
    }

    handleVerification()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [supabase.auth])

  if (status === 'verifying') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
              <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifying your email
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </div>
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
