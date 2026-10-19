import React from 'react';
import type { ApplicationStage } from '../types';

interface StageBadgeProps {
  stage: ApplicationStage | string;
  className?: string;
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  APPLIED: {
    label: 'Applied',
    bg: 'bg-[#e0f2fe]',
    text: 'text-[#0369a1]',
    border: 'border-[#bae6fd]'
  },
  SCREENING: {
    label: 'Screening',
    bg: 'bg-[#ede9fe]',
    text: 'text-[#6d28d9]',
    border: 'border-[#ddd6fe]'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    bg: 'bg-[#dcfce7]',
    text: 'text-[#15803d]',
    border: 'border-[#bbf7d0]'
  },
  INTERVIEW: {
    label: 'Interview',
    bg: 'bg-[#fef9c3]',
    text: 'text-[#a16207]',
    border: 'border-[#fef08a]'
  },
  OFFER: {
    label: 'Offer',
    bg: 'bg-[#fae8ff]',
    text: 'text-[#86198f]',
    border: 'border-[#f5d0fe]'
  },
  HIRED: {
    label: 'Hired',
    bg: 'bg-[#ccfbf1]',
    text: 'text-[#0f766e]',
    border: 'border-[#99f6e4]'
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-[#ffe4e6]',
    text: 'text-[#be123c]',
    border: 'border-[#fecdd3]'
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    bg: 'bg-[#f1f5f9]',
    text: 'text-[#475569]',
    border: 'border-[#e2e8f0]'
  }
};

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, className = '' }) => {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    bg: 'bg-[#f1f5f9]',
    text: 'text-neutral-600',
    border: 'border-[#e2e8f0]'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.04)] ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {config.label}
    </span>
  );
};
