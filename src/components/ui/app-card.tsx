import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  interactive?: boolean
}

const AppCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border/20 bg-surface-elevated shadow-md",
          elevated && "bg-surface-high shadow-xl border-border/30",
          interactive && "hover:bg-surface-high transition-colors cursor-pointer active:scale-[0.99]",
          className
        )}
        {...props}
      />
    )
  }
)
AppCard.displayName = "AppCard"

export { AppCard }
