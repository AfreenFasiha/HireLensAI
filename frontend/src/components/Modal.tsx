import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog container: Glossy glass surface with specular highlight */}
      <div
        className={`relative w-full ${widthClasses} overflow-hidden rounded-[16px] bg-gradient-to-b from-white via-[#fafaf9] to-[#f4f4f5] text-[#1b1b1b] p-6 border-t border-t-white border-x border-b border-black/10 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.95),0_24px_60px_-12px_rgba(0,0,0,0.6)] transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-black/10">
          <div>
            <h3 className="text-lg font-semibold text-[#1b1b1b] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-600 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-500 hover:bg-black/5 hover:text-[#1b1b1b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
