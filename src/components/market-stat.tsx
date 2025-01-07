import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface MarketStatProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  subtitle?: string
}

export function MarketStat({ title, value, change, icon: Icon, subtitle }: MarketStatProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
      <CardContent className="p-4 bg-white/60 backdrop-blur-sm dark:bg-neutral-950/60">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 m-auto">{title}</div>
          <Icon className="h-5 w-5 text-blue-500" />
        </div>
        <div className="text-2xl font-bold m-auto">{value}</div>
        {change && <div className="mt-1 text-sm text-green-500">{change}</div>}
        {subtitle && (
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
