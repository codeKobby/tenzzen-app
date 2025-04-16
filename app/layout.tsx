import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { RootLayoutClient } from "./root-layout-client"
import NextTopLoader from "nextjs-toploader"
import { Providers } from "@/components/providers"
import { ToastContainer } from '@/components/custom-toast'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tenzzen",
  description: "Transform YouTube videos into structured learning experiences",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <NextTopLoader
            color="#FF0000"
            height={2}
            showSpinner={false}
            crawlSpeed={200}
            speed={200}
          />
          <RootLayoutClient>
            {children}
            <ToastContainer />
          </RootLayoutClient>
        </Providers>
      </body>
    </html>
  )
}
