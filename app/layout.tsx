import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen - Transform Videos into Structured Courses",
  description: "Use AI to turn YouTube videos into interactive learning experiences",
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthenticatedLayout>
            {children}
            <ThemeToggle />
          </AuthenticatedLayout>
        </Providers>
      </body>
    </html>
  )
}
