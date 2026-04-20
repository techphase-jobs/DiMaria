import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatsCard({ label, value, icon: Icon, trend, trendUp, className }: StatsCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl p-5 shadow-sm border border-gray-100', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <p className={`text-xs mt-1.5 font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  )
}
