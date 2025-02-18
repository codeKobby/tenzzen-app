import { Card, CardContent } from "@/components/ui/card"
import { ResetPasswordForm } from "./reset-password-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm px-3">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {/* Back Button */}
          <Link href="/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>

            {/* Logo and Title */}
            <div className="text-center mb-6">
              <div className="w-10 h-10 mx-auto mb-3 relative">
                <Image
                  src="/logo.png"
                  alt="Tenzzen Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <ResetPasswordForm />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </CardContent>
      </Card>
    </div>
  )
}
