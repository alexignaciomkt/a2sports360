import * as React from "react"
import { cn } from "@/lib/utils"
import { FolderOpen } from "lucide-react"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon = <FolderOpen size={48} />, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-surface-elevated/50 p-8 text-center animate-in fade-in duration-500",
          className
        )}
        {...props}
      >
        <div className="mb-4 text-foreground-muted/50">{icon}</div>
        <h3 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h3>
        {description && <p className="mb-6 max-w-sm text-sm text-foreground-muted">{description}</p>}
        {action && <div>{action}</div>}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
