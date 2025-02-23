'use client'

import Link from "next/link"
import { Facebook, Twitter, Instagram, Github, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function Footer() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  const handleSignOut = async () => {
    await signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <footer className="relative w-full bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 border-t overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--primary-rgb),0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--primary-rgb),0.02)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <div className="relative w-[90%] mx-auto py-12">
        <div className="mb-16 relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent rounded-3xl blur-2xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
              <p className="text-muted-foreground">Join thousands of satisfied users today.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:bg-gradient-primary-hover text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                    asChild
                  >
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-primary hover:bg-gradient-primary-hover text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                  >
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          <div className="absolute inset-x-0 -top-8 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          {/* Brand Section */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-primary">
                Tenzzen
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Empowering your digital journey with innovative solutions and seamless experiences.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
                  Explore
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative mt-16 pt-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 Tenzzen. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
