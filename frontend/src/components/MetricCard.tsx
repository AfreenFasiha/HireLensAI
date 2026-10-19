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
  pastelColor?: 'lavender' | 'mint' | 'sky' | 'peach' | 'rose' | 'butter' | 'sage';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  pastelColor = 'sky',
  className = ''
}) => {
  const pastelStyles = {
    sky: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
    mint: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    lavender: 'bg-[#ede9fe] text-[#6d28d9] border-[#ddd6fe]',
    peach: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]',
    rose: 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]',
    butter: 'bg-[#fef9c3] text-[#a16207] border-[#fef08a]',
    sage: 'bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]',
  }[pastelColor];

  return (
    <div
      className={`air-card flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-neutral-600 uppercase font-mono">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] ${pastelStyles}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold tracking-tight text-[#1b1b1b] font-mono">{value}</h3>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${
              trend.isPositive
                ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                : 'bg-[#ffe4e6] text-[#be123c] border-[#fecdd3]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-neutral-500 font-sans">{subtitle}</p>
      )}
    </div>
  );
};
