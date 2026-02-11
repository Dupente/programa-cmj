
import React, { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'loading' | 'info';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show && type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'loading': return 'database'; // Animado via CSS
      default: return 'info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'border-emerald-500/50 bg-[#0a1a10] text-emerald-500';
      case 'error': return 'border-red-500/50 bg-[#1a0a0a] text-red-500';
      case 'loading': return 'border-primary/50 bg-[#1a0a0a] text-primary';
      default: return 'border-blue-500/50 bg-[#0a0a1a] text-blue-500';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-10 fade-in duration-300">
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${getColors()} min-w-[320px]`}>
        <div className={`flex items-center justify-center size-10 rounded-full bg-white/5 border border-white/5 shrink-0`}>
          <span className={`material-symbols-outlined text-2xl ${type === 'loading' ? 'animate-spin' : ''} filled`}>
            {getIcon()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
            {type === 'loading' ? 'Sincronizando...' : type === 'success' ? 'Sucesso' : 'Atenção'}
          </span>
          <span className="text-sm font-bold text-white leading-tight">
            {message}
          </span>
        </div>
        {type !== 'loading' && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ToastNotification;
