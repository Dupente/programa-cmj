import React from 'react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onClearData?: () => void;
  onSync?: () => void;
  onBackup?: () => void;
  onImportBackup?: () => void;
  isOnline?: boolean;
  onInstall?: () => void;
  canInstall?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  onClearData,
  onSync,
  onBackup,
  onImportBackup,
  isOnline = false,
  onInstall,
  canInstall = false,
  isOpen = false,
  onClose
}) => {
  const navItems = [
    { id: Page.Dashboard, label: 'Dashboard', icon: 'dashboard' },
    { id: Page.Employees, label: 'Colaboradores', icon: 'group' },
    { id: Page.Vacation, label: 'Gestão de Férias', icon: 'beach_access' },
    { id: Page.Transportation, label: 'Vale Transporte', icon: 'commute' },
    { id: Page.Adjustments, label: 'Reajustes', icon: 'trending_up' },
    { id: Page.BaseSalaryCalculator, label: 'Simulador Salarial', icon: 'calculate' },
    { id: Page.Anniversaries, label: 'Aniversariantes', icon: 'cake' },
    { id: Page.Inventory, label: 'Impressoras', icon: 'inventory_2' },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`print:hidden fixed lg:relative top-0 left-0 w-[280px] h-full flex flex-col bg-gradient-to-b from-[#111C44] to-[#283575] text-white transition-all duration-300 ease-in-out shrink-0 lg:translate-x-0 rounded-r-[30px] lg:rounded-r-[30px] z-50 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Logo Area */}
        <div className="h-32 flex items-center justify-center px-8 border-b border-white/5">
          <div className="flex flex-col items-center">
            <div className="h-16 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-white">account_balance</span>
            </div>
            <div className="flex flex-col items-center text-center mt-2">
              <h1 className="text-base font-black tracking-tight text-white leading-tight uppercase">Câmara Municipal</h1>
              <p className="text-[11px] font-bold text-white/70 tracking-widest uppercase">de Juatuba</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-200 group ${isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/30'
                  : 'text-[#A3AED0] hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className={`material-symbols-outlined text-2xl transition-transform duration-200 ${isActive ? 'filled scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className={`text-sm font-bold tracking-wide ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>

                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-glow animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Database Tools - Footer */}
        <div className="p-6">
          <div className="bg-white/5 rounded-[24px] p-5 relative overflow-hidden backdrop-blur-sm border border-white/5">
            {/* Decorative circle */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand rounded-full opacity-20 blur-xl"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Sistema</span>
              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400'}`}></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <button onClick={onSync} title="Sincronizar" className="h-10 rounded-xl bg-white/5 hover:bg-brand hover:text-white text-white/70 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-lg">sync</span>
              </button>
              <button onClick={onBackup} title="Backup" className="h-10 rounded-xl bg-white/5 hover:bg-brand hover:text-white text-white/70 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-lg">cloud_download</span>
              </button>
              <button onClick={onImportBackup} title="Restaurar" className="h-10 rounded-xl bg-white/5 hover:bg-brand hover:text-white text-white/70 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
              </button>
              <button onClick={onClearData} title="Resetar" className="h-10 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-white/70 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-lg">delete_forever</span>
              </button>
            </div>

            {canInstall && (
              <button
                onClick={onInstall}
                className="mt-4 w-full h-10 rounded-xl bg-white text-primary font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Instalar App
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;