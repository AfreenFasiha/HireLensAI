import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = ''
}) => {
  return (
    <div
      className={`air-card flex flex-col justify-between transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-neutral-600 uppercase font-mono">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.06] text-[#1b1b1b]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold tracking-tight text-[#1b1b1b] font-mono">{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? 'text-neutral-700' : 'text-neutral-500'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
      )}
    </div>
  );
};
