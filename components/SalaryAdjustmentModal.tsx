import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, AdjustmentEntry } from '../types';

interface SalaryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onConfirm: (data: any) => void;
  editingAdjustment?: AdjustmentEntry | null;
}

const SalaryAdjustmentModal: React.FC<SalaryAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employees,
  onConfirm,
  editingAdjustment
}) => {
  const [description, setDescription] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<number | string>(0);
  const [selectedRegimes, setSelectedRegimes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const hasInitialized = useRef(false);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      if (editingAdjustment) {
        setDescription(editingAdjustment.description);
        setAdjustmentType(editingAdjustment.type);
        setAdjustmentValue(editingAdjustment.value);
        setSelectedRegimes(editingAdjustment.regimes);
        setSelectedEmployees(employees
          .filter(e => editingAdjustment.regimes.includes(e.regime) && e.status === 'Ativo')
          .map(e => e.id)
        );
      } else {
        setDescription('');
        setAdjustmentType('percentage');
        setAdjustmentValue(0);
        setSelectedRegimes([]);
        setSelectedEmployees([]);
      }
      hasInitialized.current = true;

      setTimeout(() => {
        if (valueInputRef.current) {
          valueInputRef.current.focus();
          valueInputRef.current.select();
        }
      }, 100);

    } else if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, editingAdjustment, employees]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const regimesList = ['Efetivo', 'Comissionado', 'Contratado', 'Vereador'];

  const handleRegimeToggle = (regime: string) => {
    if (regime === 'Todos') {
      const allRegimesSelected = selectedRegimes.length === regimesList.length;
      if (!allRegimesSelected) {
        setSelectedRegimes([...regimesList]);
        const allActiveIds = employees
          .filter(e => e.status === 'Ativo')
          .map(e => e.id);
        setSelectedEmployees(allActiveIds);
      } else {
        setSelectedRegimes([]);
        setSelectedEmployees([]);
      }
      return;
    }

    const isSelecting = !selectedRegimes.includes(regime);
    const regimeEmployeeIds = employees
      .filter(e => e.regime === regime && e.status === 'Ativo')
      .map(e => e.id);

    if (isSelecting) {
      setSelectedRegimes(prev => [...prev, regime]);
      setSelectedEmployees(prev => Array.from(new Set([...prev, ...regimeEmployeeIds])));
    } else {
      setSelectedRegimes(prev => prev.filter(r => r !== regime));
      setSelectedEmployees(prev => prev.filter(id => !regimeEmployeeIds.includes(id)));
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (emp.status !== 'Ativo') return false;
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch = searchLower === '' ||
        emp.name.toLowerCase().includes(searchLower) ||
        emp.id.toLowerCase().includes(searchLower) ||
        emp.cpf.includes(searchLower);
      const matchesRegime = selectedRegimes.length === 0 || selectedRegimes.includes(emp.regime);
      return matchesSearch && matchesRegime;
    });
  }, [employees, selectedRegimes, searchQuery]);

  const previewData = useMemo(() => {
    const numericValue = Number(adjustmentValue) || 0;

    return filteredEmployees.map(emp => {
      let increase = 0;
      if (adjustmentType === 'percentage') {
        increase = emp.salary * (numericValue / 100);
      } else {
        increase = numericValue;
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
    const selectedList = employees.filter(e => selectedEmployees.includes(e.id));
    const numericValue = Number(adjustmentValue) || 0;

    const calculated = selectedList.map(emp => {
      let increase = 0;
      if (adjustmentType === 'percentage') {
        increase = emp.salary * (numericValue / 100);
      } else {
        increase = numericValue;
      }
      return { ...emp, increase };
    });

    const totalIncrease = calculated.reduce((sum, p) => sum + p.increase, 0);
    const selectedCurrentTotal = selectedList.reduce((sum, p) => sum + p.salary, 0);
    const selectedNewTotal = selectedCurrentTotal + totalIncrease;

    const currentMonthIndex = new Date().getMonth();
    const monthsRemaining = 12 - currentMonthIndex;
    const annualImpact = totalIncrease * monthsRemaining;

    const affectedRegimes = Array.from(new Set(selectedList.map(e => e.regime)));

    return {
      totalIncrease,
      annualImpact,
      monthsRemaining,
      selectedNewTotal,
      selectedCount: selectedList.length,
      affectedRegimes
    };
  }, [selectedEmployees, adjustmentType, adjustmentValue, employees]);

  const toggleSelectAllVisible = () => {
    const allVisibleSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.includes(emp.id));

    if (allVisibleSelected) {
      const visibleIds = filteredEmployees.map(e => e.id);
      setSelectedEmployees(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = filteredEmployees.map(e => e.id);
      setSelectedEmployees(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployees(prev => {
      const isAlreadySelected = prev.includes(id);
      if (isAlreadySelected) {
        return prev.filter(eid => eid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && stats.selectedCount > 0) {
          e.preventDefault();
          onConfirm({
            id: editingAdjustment?.id,
            description: description || `Reajuste (${new Date().toLocaleDateString()})`,
            type: adjustmentType,
            value: Number(adjustmentValue) || 0,
            affected: stats.selectedCount,
            impact: stats.totalIncrease,
            regimes: stats.affectedRegimes,
            selectedEmployeeIds: selectedEmployees
          });
        }
      }}
    >
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header Minimalista */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#1B2559] tracking-tight">
              {editingAdjustment ? 'Editar Reajuste' : 'Novo Reajuste'}
            </h1>
            <p className="text-gray-400 text-xs font-medium">Configure os parâmetros e selecione os colaboradores.</p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#1B2559] transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Corpo: Layout Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Coluna Esquerda: Configuração (Scrollável em mobile, fixa em desktop) */}
          <div className="w-full lg:w-[380px] bg-gray-50/50 border-r border-gray-100 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-8">

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Descrição</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Dissídio 2024"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#1B2559] outline-none focus:ring-2 focus:ring-[#283575]/20 focus:border-[#283575]/20 transition-all"
                />
              </div>

              {/* Valor Principal */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Valor do Aumento</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setAdjustmentType('percentage')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${adjustmentType === 'percentage' ? 'bg-white text-[#283575] shadow-sm' : 'text-gray-400'}`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setAdjustmentType('fixed')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${adjustmentType === 'fixed' ? 'bg-white text-[#283575] shadow-sm' : 'text-gray-400'}`}
                    >
                      R$
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center justify-center py-2">
                  <input
                    ref={valueInputRef}
                    type="number"
                    step="0.1"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    className="w-full text-center bg-transparent text-5xl font-bold text-[#283575] outline-none placeholder:text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-4 text-gray-300 font-medium text-xl pointer-events-none">
                    {adjustmentType === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              {/* Filtros de Regime */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Filtrar Regimes</label>
                  <button onClick={() => handleRegimeToggle('Todos')} className="text-[10px] font-bold text-[#283575] hover:underline">
                    {selectedRegimes.length === 4 ? 'Limpar' : 'Todos'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {regimesList.map(reg => (
                    <button
                      key={reg}
                      onClick={() => handleRegimeToggle(reg)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${selectedRegimes.includes(reg)
                        ? 'bg-[#111C44] border-[#111C44] text-white'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-[#111C44] hover:text-[#111C44]'
                        }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Busca */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-[#1B2559] outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all"
                />
              </div>

            </div>

            {/* Resumo Rápido Sidebar */}
            <div className="mt-auto p-6 bg-[#E9EDF7]/30 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#1B2559]">Total Selecionado</span>
                <span className="text-xs font-bold text-[#283575]">{stats.selectedCount}</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#283575] transition-all duration-500" style={{ width: `${(stats.selectedCount / employees.length) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Lista (Expansível) */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden relative">

            {/* Header Lista */}
            <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployees.includes(e.id))}
                  onChange={toggleSelectAllVisible}
                  className="size-4 rounded border-gray-300 text-[#283575] focus:ring-[#283575] cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selecionar Todos Visíveis</span>
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase">
                {filteredEmployees.length} Registros
              </span>
            </div>

            {/* Lista Scrollável */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {previewData.length > 0 ? previewData.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => handleToggleEmployee(emp.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${emp.isSelected
                    ? 'bg-[#E9EDF7] border-[#283575]/20'
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-5 rounded flex items-center justify-center border transition-colors ${emp.isSelected ? 'bg-[#283575] border-[#283575]' : 'bg-white border-gray-300'
                      }`}>
                      {emp.isSelected && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-none ${emp.isSelected ? 'text-[#111C44]' : 'text-gray-600'}`}>{emp.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">{emp.role} • <span className="uppercase">{emp.regime}</span></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-bold ${emp.isSelected ? 'text-[#111C44]' : 'text-gray-400'}`}>
                      {formatCurrency(emp.newSalary)}
                    </p>
                    <p className={`text-[10px] font-bold ${emp.isSelected ? 'text-[#283575]' : 'text-transparent'}`}>
                      +{formatCurrency(emp.increase)}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhum resultado</p>
                </div>
              )}
            </div>

            {/* Footer Fixo */}
            <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Impacto Mensal</span>
                <span className="textxl font-bold text-[#111C44]">{formatCurrency(stats.totalIncrease)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#111C44] hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => onConfirm({
                    id: editingAdjustment?.id,
                    description: description || `Reajuste (${new Date().toLocaleDateString()})`,
                    type: adjustmentType,
                    value: Number(adjustmentValue) || 0,
                    affected: stats.selectedCount,
                    impact: stats.totalIncrease,
                    regimes: stats.affectedRegimes,
                    selectedEmployeeIds: selectedEmployees
                  })}
                  disabled={stats.selectedCount === 0}
                  className="px-8 py-3 rounded-xl bg-[#283575] hover:bg-[#111C44] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#283575]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Confirmar
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryAdjustmentModal;