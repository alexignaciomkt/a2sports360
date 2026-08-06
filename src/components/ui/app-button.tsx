import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

const AppButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_0_15px_rgba(159,251,0,0.2)] active:scale-[0.98]",
      secondary: "bg-surface-high text-foreground hover:bg-surface-elevated border border-border/20",
      outline: "border-2 border-primary text-primary hover:bg-primary/10",
      danger: "bg-danger-muted/20 border border-danger text-danger hover:bg-danger-muted/30",
      ghost: "text-foreground-muted hover:text-primary hover:bg-surface-high",
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-11 px-6 text-sm font-semibold",
      lg: "h-14 px-8 text-base font-bold uppercase tracking-widest",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
AppButton.displayName = "AppButton"

export { AppButton }
