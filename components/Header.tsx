import React from 'react';

interface HeaderProps {
  title: string;
  onOpenSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onOpenSidebar }) => {
  return (
    <header className="print:hidden flex items-center justify-between px-4 md:px-8 py-4 md:py-5 sticky top-0 z-30 transition-all bg-background-light/80 backdrop-blur-md">
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        {/* Burger Menu for Mobile */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-text-secondary hover:text-brand transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="flex flex-col justify-center overflow-hidden">
          <p className="text-[10px] md:text-xs font-medium text-text-secondary mb-0.5 truncate">Páginas / {title}</p>
          <h2 className="text-xl md:text-[34px] font-bold tracking-tight text-text-main leading-tight truncate">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 bg-white p-1.5 md:p-2.5 pl-2 md:pl-4 rounded-[30px] shadow-card">
        {/* Search Bar - Hidden on very small screens */}
        <div className="hidden sm:flex items-center bg-background-light rounded-[20px] px-3 md:px-4 py-2 md:py-2.5 w-32 md:w-64 focus-within:w-40 md:focus-within:w-72 transition-all duration-300">
          <span className="material-symbols-outlined text-text-secondary text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none text-sm text-text-main placeholder:text-text-secondary font-medium w-full focus:ring-0 ml-2"
          />
        </div>

        {/* Icons */}
        <button className="p-2 text-text-secondary hover:text-brand transition-colors relative">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2 text-text-secondary hover:text-brand transition-colors">
          <span className="material-symbols-outlined text-[20px]">dark_mode</span>
        </button>

        <button className="p-2 text-text-secondary hover:text-brand transition-colors mr-2">
          <span className="material-symbols-outlined text-[20px]">info</span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 md:gap-3 pr-1 md:pr-2">
          <div className="hidden xs:flex flex-col items-end">
            <p className="text-xs md:text-sm font-bold text-text-main leading-tight">Ricardo</p>
            <p className="text-[8px] md:text-[10px] font-bold text-text-secondary uppercase tracking-wider">Administrador</p>
          </div>
          <div className="size-8 md:size-10 rounded-full bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shadow-indigo-500/20">
            R
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;