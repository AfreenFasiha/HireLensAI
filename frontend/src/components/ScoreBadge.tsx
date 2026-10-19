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

  // Clean, monochrome with selective Signal Blue emphasis for top matches
  let colorClasses = 'bg-black/5 text-[#1b1b1b] border-black/10';
  if (rounded >= 85) {
    colorClasses = 'bg-[#2b7fff]/10 text-[#2b7fff] border-[#2b7fff]/30';
  } else if (rounded >= 70) {
    colorClasses = 'bg-[#426188]/10 text-[#426188] border-[#426188]/30';
  } else {
    colorClasses = 'bg-black/5 text-neutral-600 border-black/10';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-sm px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-base px-3 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-tight ${colorClasses} ${sizeClasses} ${className}`}
      title={`AI Match Score: ${score}%`}
    >
      {showIcon && <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span>{rounded}%</span>
    </span>
  );
};
