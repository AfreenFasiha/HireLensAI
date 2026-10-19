import React from 'react';
import { Sparkles } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const rounded = Math.round(score);

  let colorClasses = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
  if (rounded >= 85) {
    colorClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  } else if (rounded >= 70) {
    colorClasses = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
  } else if (rounded >= 55) {
    colorClasses = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  } else {
    colorClasses = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-sm px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-base px-3 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-mono tracking-tight transition-all ${colorClasses} ${sizeClasses} ${className}`}
      title={`AI Match Score: ${score}%`}
    >
      {showIcon && <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span>{rounded}%</span>
    </span>
  );
};
