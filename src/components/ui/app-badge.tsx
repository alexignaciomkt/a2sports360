import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline"
}

const AppBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-surface-high text-foreground-muted",
      primary: "bg-primary text-primary-foreground",
      success: "bg-success/20 text-success border border-success/30",
      warning: "bg-warning/20 text-warning border border-warning/30",
      danger: "bg-danger-muted/20 text-danger border border-danger/30",
      outline: "border border-border text-foreground-muted",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors uppercase tracking-wider",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
AppBadge.displayName = "AppBadge"

export { AppBadge }
