import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { NotificationType } from './ToastNotification';

interface TransportationVoucherProps {
  employees: Employee[];
  onUpdateEmployee: (emp: Employee) => Promise<void>;
  onNotification: (message: string, type: NotificationType) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TransportationVoucher: React.FC<TransportationVoucherProps> = ({ employees, onUpdateEmployee, onNotification }) => {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate default business days for the selected month/year
  const defaultBusinessDays = useMemo(() => {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let businessDays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const dayOfWeek = new Date(year, monthIndex, i).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
    }
    return businessDays;
  }, [selectedMonth, year]);

  const [globalDaysOverride, setGlobalDaysOverride] = useState<number | null>(null);
  
  const currentBusinessDays = globalDaysOverride ?? defaultBusinessDays;

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && emp.status === 'Ativo';
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm]);

  const handleUpdate = async (emp: Employee, field: keyof Employee, value: any) => {
    const updatedEmp = { ...emp, [field]: value };
    await onUpdateEmployee(updatedEmp);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalCost = filteredEmployees.reduce((acc, emp) => {
    if (!emp.vtEntitled) return acc;
    const days = emp.vtDays ?? currentBusinessDays;
    const value = emp.vtDailyValue ?? 0;
    return acc + (days * value);
  }, 0);

  const beneficiaries = filteredEmployees.filter(e => e.vtEntitled).length;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
        {/* Header content similar to other pages */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
                <h2 className="text-2xl font-bold text-[#1B2559]">Vale Transporte</h2>
                <p className="text-sm text-[#A3AED0] font-medium">Gestão de benefícios de transporte e dias úteis.</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-gray-100 flex items-center gap-2">
                 <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-gray-50 rounded-lg"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                 <span className="font-bold text-[#1B2559] px-2">{year}</span>
                 <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-gray-50 rounded-lg"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
        </div>

        {/* Month Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${selectedMonth === month
                  ? 'bg-[#283575] text-white shadow-lg ring-2 ring-[#283575] ring-offset-2 scale-105 z-10'
                  : 'bg-white text-[#A3AED0] hover:text-[#111C44] hover:bg-white shadow-card'
                }`}
            >
              {month}
            </button>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[20px] shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase text-[#A3AED0] tracking-widest">Dias Úteis ({selectedMonth})</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-3xl font-bold text-[#1B2559]">{currentBusinessDays}</span>
                        <input 
                            type="number" 
                            className="w-12 text-center border-b border-gray-200 text-xs focus:outline-none focus:border-[#283575]"
                            placeholder="Alt"
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setGlobalDaysOverride(isNaN(val) ? null : val);
                            }}
                        />
                    </div>
                </div>
                <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">calendar_month</span>
                </div>
            </div>

             <div className="bg-white p-6 rounded-[20px] shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase text-[#A3AED0] tracking-widest">Beneficiários</p>
                    <h3 className="text-3xl font-bold text-[#1B2559] mt-1">{beneficiaries} <span className="text-sm text-gray-400 font-medium">/ {employees.length}</span></h3>
                </div>
                <div className="size-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">group</span>
                </div>
            </div>

             <div className="bg-white p-6 rounded-[20px] shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase text-[#A3AED0] tracking-widest">Custo Mensal Estimado</p>
                    <h3 className="text-3xl font-bold text-[#05CD99] mt-1">{formatCurrency(totalCost)}</h3>
                </div>
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">payments</span>
                </div>
            </div>
        </div>

        {/* Filter */}
        <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0]">search</span>
            <input 
                type="text" 
                placeholder="Buscar colaborador..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-12 pr-4 py-4 rounded-[20px] shadow-sm text-sm font-bold text-[#1B2559] outline-none"
            />
        </div>

        {/* Table */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Colaborador</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest text-center">Direito ao Benefício</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest text-right">Valor Diário</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest text-center">Dias Úteis</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest text-right">Total Mensal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map(emp => {
                        const days = emp.vtDays ?? currentBusinessDays;
                        const daily = emp.vtDailyValue ?? 0;
                        const total = days * daily;
                        
                        return (
                            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-[#E9EDF7] text-[#283575] flex items-center justify-center text-xs font-bold">
                                            {emp.avatar}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1B2559]">{emp.name}</p>
                                            <p className="text-[10px] text-[#A3AED0] font-bold uppercase">{emp.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={emp.vtEntitled || false} 
                                            onChange={(e) => handleUpdate(emp, 'vtEntitled', e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#283575]"></div>
                                    </label>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`inline-flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-200 focus-within:border-[#283575] transition-colors ${!emp.vtEntitled ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <span className="text-xs text-gray-500 mr-1">R$</span>
                                        <input 
                                            type="number" 
                                            step="0.10"
                                            className="w-16 bg-transparent text-right text-sm font-bold text-[#1B2559] outline-none"
                                            value={daily}
                                            onChange={(e) => handleUpdate(emp, 'vtDailyValue', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                     <input 
                                        type="number"
                                        className={`w-12 text-center text-sm font-bold border-b border-dashed border-gray-300 focus:border-solid focus:border-[#283575] outline-none ${!emp.vtEntitled ? 'opacity-50 pointer-events-none text-gray-400' : 'text-[#1B2559]'}`}
                                        value={days}
                                        onChange={(e) => handleUpdate(emp, 'vtDays', parseInt(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-sm font-bold ${emp.vtEntitled ? 'text-[#05CD99]' : 'text-gray-300'}`}>
                                        {formatCurrency(emp.vtEntitled ? total : 0)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default TransportationVoucher;