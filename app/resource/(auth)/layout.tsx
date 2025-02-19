export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 bg-gradient-to-b from-background via-background/80 to-muted/30">
      {children}
    </div>
  )
}
