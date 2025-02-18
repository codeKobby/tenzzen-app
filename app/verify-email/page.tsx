"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail } from "lucide-react"
import { TokenVerificationForm } from "@/components/token-verification-form"
import { useSearchParams } from "next/navigation"
import { AUTH_MESSAGES } from "@/lib/validations/auth"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  const [isResending, setIsResending] = useState(false)

  const handleResend = async () => {
    if (!email || isResending) return

    setIsResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your inbox."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend verification email",
        variant: "destructive"
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md px-3">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Verify your email
          </h1>

          {error ? (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>
                {error === 'verification-failed' 
                  ? 'The verification link has expired or is invalid. Please try verifying with the code below or request a new link.'
                  : 'There was a problem verifying your email. Please try again.'}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="mt-4 text-left mb-6">
              <AlertDescription>
                <p>We&apos;ve sent you an email with:</p>
                <ul className="list-disc pl-4 mt-2">
                  <li>A verification link you can click</li>
                  <li>A 6-digit verification code you can enter below</li>
                </ul>
                <p className="mt-2">
                  Please check your spam folder if you don&apos;t see the email.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {email ? (
            <div className="mt-6">
              <TokenVerificationForm email={email} />
              <p className="text-sm text-muted-foreground mt-4">
                Didn&apos;t receive the code?{" "}
                <button 
                  className="text-primary underline-offset-4 hover:underline font-medium disabled:opacity-50 disabled:hover:no-underline"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Icons.spinner className="inline mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    "Click to resend"
                  )}
                </button>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              If you closed your email, please check your inbox or sign up again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
