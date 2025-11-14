<<<<<<< HEAD
import { AuthenticatedLayoutClient } from "./authenticated-layout-client"
=======
import { AuthenticatedLayoutClient } from "@/components/authenticated-layout-client"
>>>>>>> master

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}
