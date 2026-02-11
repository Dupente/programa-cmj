
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';

interface AnniversaryCalendarProps {
  employees: Employee[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const AnniversaryCalendar: React.FC<AnniversaryCalendarProps> = ({ employees }) => {
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIndex]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos os Departamentos');

  const departments = useMemo(() => {
    const depts = employees.map(e => e.department).filter(Boolean);
    return ['Todos os Departamentos', ...Array.from(new Set(depts))];
  }, [employees]);

  const filteredAnniversaries = useMemo(() => {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    
    return employees
      .filter((item) => {
        if (item.status !== 'Ativo') return false;
        
        const birthParts = item.birthDate.split('/');
        const birthMonthIndex = parseInt(birthParts[1], 10) - 1;
        
        const matchesMonth = birthMonthIndex === monthIndex;
        const matchesSearch = search === '' || 
          item.name.toLowerCase().includes(search.toLowerCase()) || 
          item.role.toLowerCase().includes(search.toLowerCase());
          
        const matchesDept = selectedDept === 'Todos os Departamentos' || item.department === selectedDept;
          
        return matchesMonth && matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        const dayA = parseInt(a.birthDate.split('/')[0], 10);
        const dayB = parseInt(b.birthDate.split('/')[0], 10);
        return dayA - dayB;
      });
  }, [selectedMonth, search, selectedDept, employees]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Calendário de Aniversariantes</h2>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <p className="text-slate-400 text-sm font-semibold">
              {filteredAnniversaries.length} colaboradores celebram aniversário este mês
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/10 transition-all">
            <span className="material-symbols-outlined text-xl">download</span>
            Exportar PDF
          </button>
          <button className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all">
            <span className="material-symbols-outlined text-xl">print</span>
          </button>
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar-hide no-scrollbar scroll-smooth">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all duration-500 border ${
                selectedMonth === month
                  ? 'bg-primary border-primary text-white shadow-[0_10px_30px_rgba(236,19,19,0.35)] scale-105 z-10'
                  : 'bg-[#1a0f0f] border-white/5 text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
        {/* Visual Line Under Months */}
        <div className="w-full h-px bg-white/5 mt-2 rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-700" 
                style={{ 
                    width: `${100 / 12}%`, 
                    marginLeft: `${(MONTHS.indexOf(selectedMonth) * 100) / 12}%` 
                }}
            />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar por nome ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-600 font-bold"
          />
        </div>
        
        <div className="relative min-w-[280px]">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">filter_alt</span>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-[#161616] border border-white/5 rounded-2xl pl-14 pr-10 py-4 text-white font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-600">Dia</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-600">Colaborador</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-600">Cargo / Departamento</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredAnniversaries.length > 0 ? (
                filteredAnniversaries.map((item) => (
                  <tr key={item.id} className="group hover:bg-white/[0.02] transition-all duration-300">
                    <td className="px-10 py-8">
                      <div className="w-14 h-14 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-primary/10 shadow-lg">
                        <span className="text-primary text-2xl font-black">{item.birthDate.split('/')[0]}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="size-12 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-primary font-black text-sm group-hover:border-primary/30 transition-colors">
                          {item.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-black text-lg tracking-tight leading-tight group-hover:text-primary transition-colors">{item.name}</span>
                          <span className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Unidade: {item.unit || 'Sede'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-bold text-base leading-tight">{item.role}</span>
                        <span className="text-slate-500 text-xs font-bold mt-1 tracking-wide">{item.department}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button className="p-3.5 text-slate-500 hover:text-primary bg-white/5 hover:bg-primary/10 rounded-2xl transition-all group/btn border border-transparent hover:border-primary/20">
                        <span className="material-symbols-outlined text-2xl group-hover/btn:rotate-[-45deg] transition-transform">send</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <span className="material-symbols-outlined text-8xl">cake</span>
                      <p className="text-xl font-black uppercase tracking-[0.3em]">Nenhum Aniversariante</p>
                      <p className="text-sm font-medium">Não encontramos aniversários para os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnniversaryCalendar;
