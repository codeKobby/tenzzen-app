import { SignInForm } from "./sign-in-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>

            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 relative">
                <Image
                  src="/logo.png"
                  alt="Tenzzen Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to your account to continue
              </p>
            </div>

            <SignInForm />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary underline-offset-4 hover:underline"
              >
                Create one here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
