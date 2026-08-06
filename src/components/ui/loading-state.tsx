import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, message = "Carregando...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex min-h-[200px] flex-col items-center justify-center p-8", className)}
        {...props}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && <p className="mt-4 text-sm font-medium text-foreground-muted">{message}</p>}
      </div>
    )
  }
)
LoadingState.displayName = "LoadingState"

export { LoadingState }
