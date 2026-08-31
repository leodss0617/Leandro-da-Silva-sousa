import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  if (!message) return null;

  const borderColor =
    type === 'success'
      ? 'border-[#00E676]/40 text-[#00E676]'
      : type === 'error'
      ? 'border-[#FF2442]/40 text-[#FF2442]'
      : 'border-white/20 text-white';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4 max-w-[90%]">
      <div className={`bg-[#1C1C21]/95 backdrop-blur-md border ${borderColor} px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 text-center`}>
        <span>{message}</span>
      </div>
    </div>
  );
};
