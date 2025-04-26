import { AuthenticatedLayoutClient } from "./authenticated-layout-client"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}
