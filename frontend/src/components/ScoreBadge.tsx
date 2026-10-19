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

  // Glossy pastel badges with specular highlight
  let colorClasses = 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]';
  if (rounded >= 85) {
    colorClasses = 'bg-[#dcfce7] text-[#15803d] border-[#86efac]';
  } else if (rounded >= 70) {
    colorClasses = 'bg-[#e0f2fe] text-[#0369a1] border-[#7dd3fc]';
  } else if (rounded >= 55) {
    colorClasses = 'bg-[#ffedd5] text-[#c2410c] border-[#fdba74]';
  } else {
    colorClasses = 'bg-[#ffe4e6] text-[#be123c] border-[#fca5a5]';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-sm px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-base px-3 py-1.5 font-bold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-mono tracking-tight shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1px_3px_rgba(0,0,0,0.05)] ${colorClasses} ${sizeClasses} ${className}`}
      title={`AI Match Score: ${score}%`}
    >
      {showIcon && <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span>{rounded}%</span>
    </span>
  );
};
