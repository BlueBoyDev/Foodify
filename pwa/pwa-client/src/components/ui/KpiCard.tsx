import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  subtitle?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  className 
}) => {
  return (
    <div className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-foodify-orange-light rounded-xl">
          <Icon className="w-6 h-6 text-foodify-orange" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            trend.isUp ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
          )}>
            {trend.isUp ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-gray-400 text-sm font-semibold mb-1 uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-text-primary">
            {value}
          </span>
          {subtitle && (
            <span className="text-xs text-gray-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default KpiCard;
