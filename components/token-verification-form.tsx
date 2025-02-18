"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/icons'

export function TokenVerificationForm({ email }: { email: string }) {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      toast({
        title: 'Success',
        description: 'Email verified successfully',
      })
      router.push('/auth/signin?message=email-verified')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Invalid or expired token',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium leading-none">Verification Code</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your email
        </p>
        <Input
          type="text"
          placeholder="Enter 6-digit code"
          value={token}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '')
            if (value.length <= 6) {
              setToken(value)
            }
          }}
          maxLength={6}
          className="text-center tracking-widest text-lg"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || token.length !== 6}>
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </Button>
    </form>
  )
}
