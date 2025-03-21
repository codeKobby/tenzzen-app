import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div 
      role="status"
      className={cn("animate-spin", sizeClasses[size], className)} 
      {...props}
    >
      <Icons.spinner className="h-full w-full text-muted-foreground" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}