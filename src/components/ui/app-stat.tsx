import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: React.ReactNode
  icon?: React.ReactNode
  trend?: {
    value: string
    positive?: boolean
  }
}

const AppStat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, title, value, icon, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-surface/50 backdrop-blur-sm p-6 flex flex-col justify-between min-h-[140px] border border-border/10 shadow-sm group transition-all duration-300 hover:shadow-[0_10px_30px_-15px_rgba(159,251,0,0.15)] hover:border-primary/20 hover:-translate-y-0.5",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="absolute -bottom-4 -right-4 p-4 opacity-[0.03] transition-all duration-500 group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 text-foreground pointer-events-none">
            <div className="text-[100px] leading-none">{icon}</div>
          </div>
        )}
        
        <div className="relative z-10 flex-1 flex flex-col">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted group-hover:text-foreground transition-colors">
            {title}
          </p>
          
          <div className="mt-auto">
            <h3 className="font-display text-4xl font-bold tracking-tight text-primary transition-colors group-hover:drop-shadow-[0_0_8px_rgba(159,251,0,0.3)]">
              {value}
            </h3>
          </div>
        </div>
        
        {trend && (
          <div className={cn("mt-4 relative z-10 flex items-center gap-2 text-xs", trend.positive ? "text-primary" : "text-foreground-muted")}>
            <span className="font-medium bg-surface-high/30 px-2.5 py-0.5 rounded-md border border-border/10 shadow-sm">
              {trend.value}
            </span>
          </div>
        )}
      </div>
    )
  }
)
AppStat.displayName = "AppStat"

export { AppStat }
