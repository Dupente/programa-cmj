
import React, { useState, useEffect, useRef } from 'react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const SECURITY_PIN = '975218523';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === SECURITY_PIN) {
      onConfirm();
    } else {
      setError('Senha Inválida');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-[420px] bg-[#0c0c0c] border border-white/5 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 relative">

        {/* Red Glow Effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)]"></div>

        <div className="p-10 flex flex-col items-center text-center">

          {/* Lock Icon */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative size-20 bg-[#160b0b] rounded-full flex items-center justify-center border border-red-500/10 shadow-inner">
              <span className="material-symbols-outlined text-[#ff3333] text-[32px] filled">lock</span>
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-3 mb-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tight font-sans">AUTORIZAÇÃO REQUERIDA</h3>
            <p className="text-[#525252] text-xs font-bold">Esta ação é critica e exige senha administrativa.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="password"
                placeholder="Digite a senha de segurança..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className={`
                  w-full bg-transparent 
                  border-2 ${error ? 'border-red-900 text-red-500 placeholder:text-red-900/50' : 'border-[#1f1f1f] text-white focus:border-[#3b82f6] focus:shadow-[0_0_20px_rgba(59,130,246,0.3)]'} 
                  rounded-2xl px-4 py-4 text-center text-sm font-bold tracking-widest 
                  outline-none transition-all placeholder:text-[#333] placeholder:font-bold
                `}
              />
              <div className={`h-4 transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                className="py-4 bg-[#141414] hover:bg-[#1a1a1a] text-[#444] hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-[#333]"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="py-4 bg-[#e61e1e] hover:bg-[#ff3333] text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl shadow-[0_4px_20px_rgba(230,30,30,0.3)] transition-all active:scale-95"
              >
                CONFIRMAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecurityModal;
