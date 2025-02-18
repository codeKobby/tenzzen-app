import { SignUpForm } from "./sign-up-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function SignUpPage() {
  return (
    <div className="w-full max-w-sm px-3">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
              <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your details to get started
              </p>
            </div>

            <SignUpForm />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
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
