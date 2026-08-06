import * as React from "react"
import { cn } from "@/lib/utils"

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

const AppHeader = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}
        {...props}
      >
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-sm text-foreground-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )
  }
)
AppHeader.displayName = "AppHeader"

export { AppHeader }
