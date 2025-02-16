import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Mail } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            {/* Logo */}
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <Image
                src="/logo.png"
                alt="Tenzzen Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent you a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>

            <div className="space-y-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/signin">Return to Sign In</Link>
              </Button>

              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{" "}
                <Button variant="link" className="p-0 h-auto font-normal" asChild>
                  <Link href="/signup">
                    Try another email address
                  </Link>
                </Button>
              </p>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
              <p>The verification link will expire in 24 hours.</p>
              <p className="mt-1">
                If you need help, please{" "}
                <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                  contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}