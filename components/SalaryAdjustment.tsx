import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';

interface SalaryAdjustmentProps {
  employees: Employee[];
}

const SalaryAdjustment: React.FC<SalaryAdjustmentProps> = ({ employees }) => {
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(5.5);
  const [selectedRegimes, setSelectedRegimes] = useState<string[]>(['Efetivo', 'Comissionado']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Initialize selection
  useEffect(() => {
    setSelectedEmployees(employees.map(e => e.id));
  }, [employees]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const regimes = ['Todos', 'Efetivo', 'Comissionado', 'Contratado', 'Vereador'];

  const handleRegimeToggle = (regime: string) => {
    if (regime === 'Todos') {
      setSelectedRegimes(selectedRegimes.length === 4 ? [] : ['Efetivo', 'Comissionado', 'Contratado', 'Vereador']);
      return;
    }
    const regimeKey = regime;
    setSelectedRegimes(prev => 
      prev.includes(regimeKey) ? prev.filter(r => r !== regimeKey) : [...prev, regimeKey]
    );
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesRegime = selectedRegimes.length === 0 || selectedRegimes.includes(emp.regime);
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRegime && matchesSearch;
    });
  }, [employees, selectedRegimes, searchQuery]);

  const previewData = useMemo(() => {
    return filteredEmployees.map(emp => {
      let increase = 0;
      if (adjustmentType === 'percentage') {
        increase = emp.salary * (adjustmentValue / 100);
      } else {
        increase = adjustmentValue;
      }
      return {
        ...emp,
        increase,
        newSalary: emp.salary + increase,
        isSelected: selectedEmployees.includes(emp.id)
      };
    });
  }, [adjustmentType, adjustmentValue, selectedEmployees, filteredEmployees]);

  const stats = useMemo(() => {
    const selected = previewData.filter(p => p.isSelected);
    const totalIncrease = selected.reduce((sum, p) => sum + p.increase, 0);
    const currentPayroll = employees.reduce((sum, p) => sum + p.salary, 0);
    const newPayroll = currentPayroll + totalIncrease;
    const avgIncrease = selected.length > 0 ? totalIncrease / selected.length : 0;

    return {
      totalIncrease,
      newPayroll,
      avgIncrease,
      selectedCount: selected.length
    };
  }, [previewData, employees]);

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  return (
    <div className="px-8 pb-32 pt-0 space-y-6 animate-in fade-in duration-500 font-sans text-[#1B2559]">
      
      {/* Header Section Compacto */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2559]">Reajuste com Seleção Múltipla</h1>
        <p className="text-[#A3AED0] text-sm font-medium">Selecione regimes e funcionários específicos para aplicar o reajuste salarial.</p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Configuração */}
        <div className="bg-white rounded-[20px] p-8 space-y-6 shadow-[0px_3px_20px_rgba(112,144,176,0.08)]">
          <div className="flex items-center gap-3 text-[#1B2559]">
            <span className="material-symbols-outlined text-2xl">tune</span>
            <h3 className="text-lg font-bold">1. Configuração do Reajuste</h3>
          </div>

          <div className="flex bg-[#F4F7FE] rounded-xl p-1.5">
            <button 
              onClick={() => setAdjustmentType('percentage')}
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${adjustmentType === 'percentage' ? 'bg-white text-[#1B2559] shadow-md' : 'text-[#A3AED0] hover:text-[#1B2559]'}`}
            >
              Porcentagem (%)
            </button>
            <button 
              onClick={() => setAdjustmentType('fixed')}
              className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${adjustmentType === 'fixed' ? 'bg-white text-[#1B2559] shadow-md' : 'text-[#A3AED0] hover:text-[#1B2559]'}`}
            >
              Valor Fixo (R$)
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] ml-1">Valor do Reajuste</label>
            <div className="relative group">
              <input 
                type="number" 
                value={adjustmentValue} 
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                className="w-full bg-[#F4F7FE] rounded-[16px] px-6 py-4 text-2xl font-bold text-[#1B2559] focus:ring-2 focus:ring-[#283575]/20 outline-none transition-all"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#283575] font-bold text-xl">
                {adjustmentType === 'percentage' ? '%' : 'R$'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Regimes e Filtros */}
        <div className="bg-white rounded-[20px] p-8 space-y-6 shadow-[0px_3px_20px_rgba(112,144,176,0.08)]">
          <div className="flex items-center gap-3 text-[#1B2559]">
            <span className="material-symbols-outlined text-2xl">filter_list</span>
            <h3 className="text-lg font-bold">2. Regimes Selecionados</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {regimes.map(reg => (
              <button 
                key={reg} 
                onClick={() => handleRegimeToggle(reg)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  (reg === 'Todos' ? selectedRegimes.length === 4 : selectedRegimes.includes(reg))
                    ? 'bg-[#111C44] border-[#111C44] text-white shadow-md' 
                    : 'bg-[#F4F7FE] border-transparent text-[#A3AED0] hover:bg-[#E9EDF7]'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="relative group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#283575] transition-colors text-xl">search</span>
            <input 
              type="text" 
              placeholder="Buscar funcionário específico..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F7FE] rounded-[16px] pl-12 pr-6 py-4 text-sm font-bold text-[#1B2559] focus:ring-2 focus:ring-[#283575]/20 outline-none transition-all placeholder:text-[#A3AED0]/70"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0px_3px_20px_rgba(112,144,176,0.08)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#1B2559]">3. Prévia de Alterações</h3>
          <div className="flex gap-3">
            <div className="px-4 py-1.5 bg-[#F4F7FE] rounded-full">
              <span className="text-[#283575] text-[10px] font-bold uppercase tracking-widest">{stats.selectedCount} Selecionados</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-8 py-4 w-20">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={toggleSelectAll}
                      className="size-5 rounded border-gray-300 text-[#283575] focus:ring-[#283575] cursor-pointer"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Funcionário</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Cargo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Salário Atual</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#05CD99]">Vlr. Aumento</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-right">Novo Salário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {previewData.map((emp) => (
                <tr key={emp.id} className={`group transition-all duration-300 ${!emp.isSelected ? 'opacity-40' : 'hover:bg-[#F4F7FE]'}`}>
                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={emp.isSelected}
                        onChange={() => handleToggleEmployee(emp.id)}
                        className="size-5 rounded border-gray-300 text-[#283575] focus:ring-[#283575] cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#283575] font-bold text-xs border border-white shadow-sm">
                        {emp.avatar}
                      </div>
                      <span className="text-[#1B2559] font-bold text-sm">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#A3AED0] font-bold text-xs">{emp.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#1B2559] font-bold text-sm">{formatCurrency(emp.salary)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#05CD99] font-bold text-sm">+ {formatCurrency(emp.increase)}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[#1B2559] font-bold text-base">{formatCurrency(emp.newSalary)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer Bar - Float */}
      <div className="fixed bottom-6 left-[calc(50%+4rem)] translate-x-[-50%] w-[90%] max-w-5xl bg-white/90 backdrop-blur-md border border-white rounded-[20px] shadow-[0px_20px_40px_rgba(112,144,176,0.2)] flex items-center justify-between px-8 py-4 z-[60]">
        
        <div className="flex items-center gap-8">
          {/* Impacto Mensal */}
          <div className="flex flex-col">
            <p className="text-[9px] font-bold uppercase text-[#A3AED0] tracking-widest">Impacto Mensal</p>
            <div className="flex items-center gap-2">
              <h4 className="text-[#05CD99] text-2xl font-bold tracking-tight">
                +{formatCurrency(stats.totalIncrease)}
              </h4>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          {/* Nova Folha */}
          <div className="flex flex-col">
            <p className="text-[9px] font-bold uppercase text-[#A3AED0] tracking-widest">Nova Folha</p>
            <h4 className="text-[#1B2559] text-2xl font-bold tracking-tight">
              {formatCurrency(stats.newPayroll)}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedEmployees([])}
            className="px-6 py-3 text-[#A3AED0] hover:text-[#1B2559] font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            Limpar
          </button>
          <button className="px-8 py-3 btn-navy font-bold text-[11px] uppercase tracking-widest rounded-[16px] flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95">
            <span className="material-symbols-outlined filled text-lg">lock</span>
            Aplicar em {stats.selectedCount}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SalaryAdjustment;