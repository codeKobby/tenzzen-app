import { Loader2 } from "lucide-react"

export default function VerifyEmailLoading() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Loading...
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we process your request
          </p>
        </div>
      </div>
    </div>
  )
}
