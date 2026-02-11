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

  const calculateDetailedAge = (birthDateStr: string) => {
    if (!birthDateStr) return '-';
    
    const parts = birthDateStr.split('/');
    if (parts.length !== 3) return '-';

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return '-';

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Ajuste para dias negativos (pegou emprestado do mês anterior)
    if (days < 0) {
      months--;
      // Pega o último dia do mês anterior
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    // Ajuste para meses negativos (pegou emprestado do ano anterior)
    if (months < 0) {
      years--;
      months += 12;
    }

    return (
      <div className="flex flex-col items-end leading-tight">
        <span className="font-bold text-[#1B2559]">{years} anos</span>
        <span className="text-[10px] text-[#A3AED0] font-medium">{months} meses, {days} dias</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-text-main tracking-tight">Calendário de Aniversariantes</h2>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#111C44] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#111C44]"></span>
            </span>
            <p className="text-text-secondary text-sm font-medium">
              <span className="font-bold text-text-main">{filteredAnniversaries.length}</span> colaboradores celebram aniversário este mês
            </p>
          </div>
        </div>

      </div>

      {/* Month Selector Tabs (Grid Layout) */}
      <div className="relative group">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${selectedMonth === month
                  ? 'bg-[#283575] text-white shadow-lg ring-2 ring-[#283575] ring-offset-2 transform scale-105 z-10'
                  : 'bg-white text-text-secondary hover:text-[#111C44] hover:bg-white shadow-card hover:shadow-md'
                }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-[#111C44] transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar por nome ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-2xl pl-14 pr-6 py-4 text-text-main placeholder:text-text-secondary font-medium shadow-card focus:shadow-soft outline-none transition-all"
          />
        </div>

        <div className="relative min-w-[280px] group">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-[#111C44] transition-colors">filter_alt</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-white rounded-2xl pl-14 pr-10 py-4 text-text-main font-bold text-sm appearance-none outline-none shadow-card focus:shadow-soft transition-all cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">expand_more</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] overflow-hidden shadow-card border border-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F4F7FE]/30">
                <th className="px-8 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-center w-24">Dia</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Cargo</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-right">Idade Exata (Hoje)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAnniversaries.length > 0 ? (
                filteredAnniversaries.map((emp) => {
                  const day = emp.birthDate.split('/')[0];
                  
                  return (
                    <tr key={emp.id} className="hover:bg-[#F4F7FE] transition-colors group">
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center justify-center bg-[#E9EDF7] rounded-xl w-12 h-12">
                          <span className="text-[#111C44] font-bold text-lg leading-none">{day}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-full bg-white border-2 border-[#F4F7FE] shadow-sm flex items-center justify-center text-[#111C44] font-bold text-xs">
                            {emp.avatar}
                          </div>
                          <div>
                            <p className="text-[#1B2559] font-bold text-sm">{emp.name}</p>
                            <p className="text-[#A3AED0] text-[10px] font-bold tracking-wide">{emp.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[#1B2559] font-medium text-sm">{emp.role}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {calculateDetailedAge(emp.birthDate)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
                      <p className="text-sm font-bold uppercase tracking-widest">Nenhum aniversariante encontrado</p>
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