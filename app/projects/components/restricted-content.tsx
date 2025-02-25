import Link from "next/link"
import { LockIcon, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function RestrictedContent() {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full border border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/80 mx-auto mb-4">
            <LockIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-center text-xl">Premium Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The Projects section is exclusively available for paid users, providing access to:
          </p>
          <div className="space-y-2 py-2">
            <div className="flex items-start gap-2">
              <div className="rounded-full w-5 h-5 bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <p className="text-sm text-left">
                Hands-on assignments and practical projects based on your courses
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="rounded-full w-5 h-5 bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <p className="text-sm text-left">
                Detailed feedback and personalized recommendations
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="rounded-full w-5 h-5 bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <p className="text-sm text-left">
                Dynamic project difficulty adjustments based on your progress
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="rounded-full w-5 h-5 bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-primary text-xs">✓</span>
              </div>
              <p className="text-sm text-left">
                Portfolio-building opportunities with real-world applications
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            Upgrade to access projects and accelerate your learning journey
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full gap-2" asChild>
            <Link href="/billing">
              <CreditCard className="h-4 w-4" />
              <span>Upgrade Now</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}