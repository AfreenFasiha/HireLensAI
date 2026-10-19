import React from 'react';
import type { ApplicationStage } from '../types';

interface StageBadgeProps {
  stage: ApplicationStage | string;
  className?: string;
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  APPLIED: {
    label: 'Applied',
    bg: 'bg-black/5',
    text: 'text-[#1b1b1b]',
    border: 'border-black/10'
  },
  SCREENING: {
    label: 'Screening',
    bg: 'bg-[#426188]/10',
    text: 'text-[#426188]',
    border: 'border-[#426188]/20'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    bg: 'bg-[#2b7fff]/10',
    text: 'text-[#2b7fff]',
    border: 'border-[#2b7fff]/25'
  },
  INTERVIEW: {
    label: 'Interview',
    bg: 'bg-neutral-800 text-white',
    text: 'text-neutral-100',
    border: 'border-neutral-700'
  },
  OFFER: {
    label: 'Offer',
    bg: 'bg-neutral-900',
    text: 'text-white',
    border: 'border-neutral-600'
  },
  HIRED: {
    label: 'Hired',
    bg: 'bg-[#1b1b1b]',
    text: 'text-white',
    border: 'border-black'
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-black/5',
    text: 'text-neutral-500',
    border: 'border-black/10'
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    bg: 'bg-black/5',
    text: 'text-neutral-400',
    border: 'border-black/10'
  }
};

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, className = '' }) => {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    bg: 'bg-black/5',
    text: 'text-neutral-600',
    border: 'border-black/10'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
};
