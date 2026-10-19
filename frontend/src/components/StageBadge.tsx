import React from 'react';
import type { ApplicationStage } from '../types';

interface StageBadgeProps {
  stage: ApplicationStage | string;
  className?: string;
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  APPLIED: {
    label: 'Applied',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30'
  },
  SCREENING: {
    label: 'Screening',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30'
  },
  INTERVIEW: {
    label: 'Interview',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30'
  },
  OFFER: {
    label: 'Offer',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30'
  },
  HIRED: {
    label: 'Hired',
    bg: 'bg-green-500/15 dark:bg-green-500/25',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/40'
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30'
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30'
  }
};

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, className = '' }) => {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
};
