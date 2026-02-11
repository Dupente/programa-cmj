import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import SecurityModal from './SecurityModal';
import { supabase } from '../lib/supabaseClient';

interface TransportationVoucherProps {
  employees: Employee[];
  onUpdateEmployee: (emp: Employee) => Promise<void>;
  onNotification?: (msg: string, type: 'success' | 'error' | 'loading' | 'info') => void;
}

type SortKey = 'name' | 'role' | 'regime' | 'daily' | 'monthly';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TransportationVoucher: React.FC<TransportationVoucherProps> = ({ employees, onUpdateEmployee, onNotification }) => {
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIndex]);
  const [daysInMonth, setDaysInMonth] = useState<string>('22');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Database Lock State
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [isLoadingLock, setIsLoadingLock] = useState(false);

  const currentYear = new Date().getFullYear();
  const monthKey = `${selectedMonth}-${currentYear}`;

  useEffect(() => {
    let isMounted = true;
    const fetchLockStatus = async () => {
      setIsLoadingLock(true);
      try {
        const { data, error } = await supabase
          .from('transport_locks')
          .select('is_locked')
          .eq('month_key', monthKey)
          .maybeSingle(); 

        if (error) {
          console.error('Error fetching lock status:', error);
        }

        if (isMounted) {
          setIsMonthLocked(data?.is_locked || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoadingLock(false);
      }
    };

    fetchLockStatus();
    return () => { isMounted = false; };
  }, [selectedMonth, monthKey]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // State for actions
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit_single' | 'unlock_month' | null>(null);
  
  // Edit Single State
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isEditValueModalOpen, setIsEditValueModalOpen] = useState(false);
  const [tempDailyValue, setTempDailyValue] = useState<string>('');

  // Helper function to calculate business days (Mon-Fri) for the selected month in current year
  const calculateBusinessDays = (monthName: string) => {
    const monthIndex = MONTHS.indexOf(monthName);
    const year = new Date().getFullYear();
    const daysInM = new Date(year, monthIndex + 1, 0).getDate();
    let businessDays = 0;
    
    for (let i = 1; i <= daysInM; i++) {
      const dayOfWeek = new Date(year, monthIndex, i).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        businessDays++;
      }
    }
    return businessDays;
  };

  // Update days when month changes
  useEffect(() => {
    const days = calculateBusinessDays(selectedMonth);
    setDaysInMonth(String(days));
  }, [selectedMonth]);

  const handleDaysChange = (val: string) => {
    setDaysInMonth(val);
  };

  const eligibleEmployees = useMemo(() => {
    return employees.filter(emp => emp.vtEntitled && emp.status === 'Ativo');
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return eligibleEmployees.filter(emp => {
      const nameMatch = emp.name.toLowerCase().includes(searchLower);
      const roleMatch = (emp.role || '').toLowerCase().includes(searchLower);
      return nameMatch || roleMatch;
    });
  }, [eligibleEmployees, searchTerm]);

  // Sorting Logic
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    const globalDays = parseInt(daysInMonth) || 0;

    return sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.key) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '');
          break;
        case 'regime':
          // Primary sort by Regime
          const regimeDiff = a.regime.localeCompare(b.regime);
          if (regimeDiff !== 0) {
             return sortConfig.direction === 'asc' ? regimeDiff : -regimeDiff;
          }
          // Secondary sort by Name (Always A-Z)
          return a.name.localeCompare(b.name);
          
        case 'daily':
          comparison = (a.vtDailyValue || 0) - (b.vtDailyValue || 0);
          break;
        case 'monthly':
          const daysA = a.vtDays ?? globalDays;
          const daysB = b.vtDays ?? globalDays;
          const totalA = (a.vtDailyValue || 0) * daysA;
          const totalB = (b.vtDailyValue || 0) * daysB;
          comparison = totalA - totalB;
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredEmployees, sortConfig, daysInMonth]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const totalCost = useMemo(() => {
    const globalDays = parseInt(daysInMonth) || 0;
    return eligibleEmployees.reduce((acc, curr) => {
      const empDays = curr.vtDays ?? globalDays;
      return acc + ((curr.vtDailyValue || 0) * empDays);
    }, 0);
  }, [eligibleEmployees, daysInMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const initiateEdit = (emp: Employee) => {
    if (isMonthLocked) return;
    setEmployeeToEdit(emp);
    setTempDailyValue(String(emp.vtDailyValue || 0));
    setPendingAction('edit_single');
    setIsSecurityModalOpen(true);
  };

  const handleToggleLock = async () => {
    if (isMonthLocked) {
      // Need password to unlock
      setPendingAction('unlock_month');
      setIsSecurityModalOpen(true);
    } else {
      // Lock immediately
      if(onNotification) onNotification(`Bloqueando mês de ${selectedMonth}...`, 'loading');
      try {
        const { error } = await supabase
          .from('transport_locks')
          .upsert(
            { month_key: monthKey, is_locked: true, updated_at: new Date().toISOString() },
            { onConflict: 'month_key' }
          );

        if (error) throw error;
        setIsMonthLocked(true);
        if(onNotification) onNotification(`Mês de ${selectedMonth} bloqueado com sucesso.`, 'success');
      } catch(err: any) {
        console.error("Erro ao bloquear:", err);
        if(onNotification) onNotification(`Erro ao bloquear mês: ${err.message || 'Erro desconhecido'}`, 'error');
      }
    }
  };

  const handleSecuritySuccess = async () => {
    setIsSecurityModalOpen(false);
    
    if (pendingAction === 'edit_single') {
      setIsEditValueModalOpen(true);
    } else if (pendingAction === 'unlock_month') {
        if(onNotification) onNotification(`Desbloqueando mês de ${selectedMonth}...`, 'loading');
        try {
            const { error } = await supabase
            .from('transport_locks')
            .upsert(
              { month_key: monthKey, is_locked: false, updated_at: new Date().toISOString() },
              { onConflict: 'month_key' }
            );

            if (error) throw error;
            setIsMonthLocked(false);
            if(onNotification) onNotification(`Mês de ${selectedMonth} desbloqueado.`, 'success');
        } catch(err: any) {
            console.error("Erro ao desbloquear:", err);
            if(onNotification) onNotification(`Erro ao desbloquear mês: ${err.message || 'Erro desconhecido'}`, 'error');
        }
    }
    
    setPendingAction(null);
  };

  const saveNewValue = async () => {
    if (employeeToEdit) {
      const newVal = parseFloat(tempDailyValue.replace(',', '.'));
      if (isNaN(newVal)) return;

      if(onNotification) onNotification('Atualizando valor...', 'loading');
      
      const updatedEmp = { ...employeeToEdit, vtDailyValue: newVal };
      await onUpdateEmployee(updatedEmp);
      
      setIsEditValueModalOpen(false);
      setEmployeeToEdit(null);
      if(onNotification) onNotification('Valor diário atualizado!', 'success');
    }
  };

  const handleUpdateEmployeeDays = async (emp: Employee, value: string) => {
    if (isMonthLocked) return;
    const newDays = parseInt(value);
    const globalDays = parseInt(daysInMonth) || 0;
    
    if (!isNaN(newDays)) {
        if (emp.vtDays !== newDays) {
            await onUpdateEmployee({ ...emp, vtDays: newDays });
        }
    } else if (value === '') {
        await onUpdateEmployee({ ...emp, vtDays: undefined });
    }
  };

  const handleRemoveVoucher = async (emp: Employee) => {
    if (isMonthLocked) return;
    if (window.confirm(`Deseja remover o Vale Transporte de ${emp.name}?`)) {
      if(onNotification) onNotification('Removendo benefício...', 'loading');
      await onUpdateEmployee({ ...emp, vtEntitled: false });
      if(onNotification) onNotification('Benefício removido.', 'success');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    const active = sortConfig.key === key;
    return (
      <span className={`material-symbols-outlined text-[14px] ml-1 transition-colors ${active ? 'text-[#283575]' : 'text-gray-300'}`}>
        {active ? (sortConfig.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up') : 'unfold_more'}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="transportation-voucher-root" className="p-8 space-y-8 animate-in fade-in duration-500 print:p-0 print:m-0 print:space-y-0 print:animate-none">
      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: landscape;
              margin: 5mm;
            }
            
            /* RESET GLOBAL LAYOUT FOR PRINT */
            html, body {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
            }

            #root {
              height: auto !important;
              overflow: visible !important;
            }

            /* Unset Flex/Grid Constraints on App Wrappers */
            body > div, 
            #root > div,
            div[class*="flex h-screen"], 
            div[class*="overflow-hidden"] {
              height: auto !important;
              overflow: visible !important;
              display: block !important;
              position: static !important;
            }

            /* Hide Sidebar, Header, Navigation */
            aside, nav, header, .print\\:hidden {
              display: none !important;
            }

            /* Force Main Content to Full Width */
            main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              flex: none !important;
              overflow: visible !important;
            }

            /* Disable Animations */
            * {
              animation: none !important;
              transition: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Table Specifics */
            .overflow-x-auto {
              overflow: visible !important;
              display: block !important;
            }
            
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 9px !important;
            }
            
            th, td {
              padding: 4px !important;
              border-bottom: 1px solid #eee !important;
            }
            
            thead th {
              background-color: #f8fafc !important;
              color: #000 !important;
            }

            /* Ensure rows don't split awkwardly */
            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      
      {/* Security Modal */}
      <SecurityModal 
        isOpen={isSecurityModalOpen}
        onClose={() => { 
          setIsSecurityModalOpen(false); 
          setEmployeeToEdit(null); 
          setPendingAction(null);
        }}
        onConfirm={handleSecuritySuccess}
      />

      {/* Value Edit Modal */}
      {isEditValueModalOpen && employeeToEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in zoom-in-95 print:hidden">
          <div className="bg-white rounded-[30px] p-8 shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#E9EDF7] p-3 rounded-full text-[#283575]">
                <span className="material-symbols-outlined filled">edit</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">Editar Valor Diário</h3>
                <p className="text-xs text-[#A3AED0] font-bold uppercase">{employeeToEdit.name}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] ml-1">Valor do Passe Diário (R$)</label>
              <input 
                autoFocus
                type="number" 
                step="0.05"
                value={tempDailyValue}
                onChange={e => setTempDailyValue(e.target.value)}
                className="w-full bg-[#F4F7FE] text-[#1B2559] font-bold text-2xl px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#283575]/20"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditValueModalOpen(false)}
                className="flex-1 py-3 text-[#A3AED0] font-bold uppercase text-[10px] hover:bg-gray-50 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                onClick={saveNewValue}
                className="flex-1 py-3 bg-[#283575] text-white font-bold uppercase text-[10px] rounded-xl shadow-lg shadow-[#283575]/20 hover:bg-[#111C44]"
              >
                Salvar Valor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER EXCLUSIVO DE IMPRESSÃO */}
      <div className="hidden print:flex flex-col border-b-2 border-black pb-2 mb-2 w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-black uppercase tracking-tight">Relatório de Vale Transporte</h1>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Câmara Municipal de Juatuba - Gestão RH</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-500 uppercase">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div>
            <p className="text-[9px] font-bold text-gray-500 uppercase">Mês de Referência</p>
            <p className="text-base font-black text-black">{selectedMonth}/{new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-6">
             <div>
               <p className="text-[9px] font-bold text-gray-500 uppercase">Dias Úteis</p>
               <p className="text-sm font-bold text-black">{daysInMonth}</p>
             </div>
             <div>
               <p className="text-[9px] font-bold text-gray-500 uppercase">Beneficiários</p>
               <p className="text-sm font-bold text-black">{eligibleEmployees.length}</p>
             </div>
             <div className="text-right">
               <p className="text-[9px] font-bold text-gray-500 uppercase">Custo Total</p>
               <p className="text-base font-black text-black">{formatCurrency(totalCost)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Month Selector Tabs (Ocultar na Impressão) */}
      <div className="print:hidden">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-3">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${selectedMonth === month
                  ? 'btn-navy shadow-lg transform scale-105 z-10'
                  : 'bg-white text-[#A3AED0] hover:text-[#1B2559] hover:bg-white shadow-card hover:shadow-md'
                }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Header Stats (Ocultar na Impressão - Substituído pelo header de impressão) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-[20px] shadow-card flex flex-col justify-between h-32 relative overflow-hidden">
          <div>
            <p className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Custo Mensal Total</p>
            <h2 className="text-[#1B2559] text-3xl font-bold mt-1">{formatCurrency(totalCost)}</h2>
          </div>
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/0 to-transparent"></div>
          <div className="absolute right-4 top-4 text-[#283575]/10">
            <span className="material-symbols-outlined text-6xl">payments</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-card flex flex-col justify-center h-32 relative">
          <p className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest mb-2">Dias Úteis Padrão</p>
          <div className="flex items-center gap-3">
            <div className="relative group flex-1">
              <input 
                type="number" 
                value={daysInMonth}
                disabled={isMonthLocked || isLoadingLock}
                onChange={(e) => handleDaysChange(e.target.value)}
                className={`w-full bg-[#F4F7FE] text-[#1B2559] font-bold text-2xl px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all ${isMonthLocked ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
              />
            </div>
            <span className="text-[#A3AED0] text-xs font-bold uppercase">Dias</span>
          </div>
          {isMonthLocked && (
            <div className="absolute top-4 right-4 text-red-400" title="Mês Bloqueado">
              <span className="material-symbols-outlined filled text-lg">lock</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-card flex items-center justify-between h-32">
           <div>
             <p className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Beneficiários</p>
             <h2 className="text-[#1B2559] text-3xl font-bold mt-1">{eligibleEmployees.length}</h2>
             <p className="text-[#05CD99] text-[10px] font-bold mt-1 flex items-center gap-1">
               <span className="material-symbols-outlined text-sm filled">check_circle</span>
               Ativos
             </p>
           </div>
           <div className="size-12 rounded-full bg-[#E9EDF7] flex items-center justify-center text-[#283575]">
             <span className="material-symbols-outlined text-2xl filled">directions_bus</span>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[20px] shadow-card p-6 min-h-[500px] print:shadow-none print:p-0 print:min-h-0 print:bg-transparent">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
          <div>
             <h3 className="text-xl font-bold text-[#1B2559]">Gestão de Vale Transporte</h3>
             <p className="text-[#A3AED0] text-xs font-medium mt-1">Colaboradores com benefício ativo.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#283575] transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Buscar beneficiário..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#F4F7FE] rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-[#1B2559] outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all placeholder:text-[#A3AED0]/50"
              />
            </div>
            
            <button 
              onClick={handleToggleLock}
              disabled={isLoadingLock}
              className={`px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap ${isMonthLocked 
                ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                : 'bg-white border-gray-100 text-[#283575] hover:bg-gray-50'
              }`}
              title={isMonthLocked ? "Desbloquear Mês (Senha Necessária)" : "Bloquear Mês"}
            >
              {isLoadingLock ? (
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-base filled">{isMonthLocked ? 'lock' : 'lock_open'}</span>
              )}
              {isMonthLocked ? 'Bloqueado' : 'Aberto'}
            </button>

            <button 
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[#1B2559] hover:bg-gray-50 font-bold text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Imprimir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:w-full">
            <thead>
              <tr className="border-b border-gray-100 print:border-gray-300">
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none print:text-black"
                >
                  <div className="flex items-center">
                    Colaborador
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('role')}
                  className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none print:text-black"
                >
                  <div className="flex items-center">
                    Cargo
                    {renderSortIcon('role')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('regime')}
                  className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none print:text-black"
                >
                  <div className="flex items-center">
                    Regime
                    {renderSortIcon('regime')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('daily')}
                  className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-right cursor-pointer hover:text-[#283575] transition-colors select-none print:text-black"
                >
                  <div className="flex items-center justify-end">
                    Valor Diário
                    {renderSortIcon('daily')}
                  </div>
                </th>
                <th className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-center w-24 print:text-black">
                  Dias
                </th>
                <th 
                  onClick={() => handleSort('monthly')}
                  className="px-6 py-4 print:py-1 print:px-1 text-[10px] font-bold uppercase tracking-widest text-[#05CD99] text-right cursor-pointer hover:text-[#04b082] transition-colors select-none print:text-black"
                >
                  <div className="flex items-center justify-end">
                    Total Mensal
                    {renderSortIcon('monthly')}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 print:divide-gray-200">
              {sortedEmployees.length > 0 ? sortedEmployees.map(emp => {
                 const daily = emp.vtDailyValue || 0;
                 const globalDays = parseInt(daysInMonth) || 0;
                 const effectiveDays = emp.vtDays ?? globalDays;
                 const monthly = daily * effectiveDays;

                 return (
                   <tr key={emp.id} className="group hover:bg-[#F4F7FE] transition-colors print:break-inside-avoid">
                     <td className="px-6 py-4 print:py-1 print:px-1">
                       <div className="flex items-center gap-3">
                         <div className="size-9 rounded-full bg-[#E9EDF7] flex items-center justify-center text-[#283575] font-bold text-[10px] border border-white shadow-sm print:hidden">
                           {emp.avatar}
                         </div>
                         <span className="text-[#1B2559] font-bold text-sm print:text-[9px] print:text-black">{emp.name}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 print:py-1 print:px-1">
                       <span className="text-[#A3AED0] font-bold text-xs print:text-[8px] print:text-black">{emp.role}</span>
                     </td>
                     <td className="px-6 py-4 print:py-1 print:px-1">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider print:bg-transparent print:p-0 print:text-black print:text-[8px] ${
                         emp.regime === 'Efetivo' ? 'bg-emerald-50 text-emerald-600' :
                         emp.regime === 'Comissionado' ? 'bg-indigo-50 text-indigo-600' :
                         'bg-pink-50 text-pink-600'
                       }`}>
                         {emp.regime}
                       </span>
                     </td>
                     <td className="px-6 py-4 print:py-1 print:px-1 text-right">
                       <span className="text-[#1B2559] font-bold text-sm print:text-[9px] print:text-black">{formatCurrency(daily)}</span>
                     </td>
                     <td className="px-6 py-4 print:py-1 print:px-1 text-center">
                       <input 
                         type="number" 
                         defaultValue={effectiveDays}
                         disabled={isMonthLocked}
                         onBlur={(e) => handleUpdateEmployeeDays(emp, e.target.value)}
                         onKeyDown={(e) => {
                           if(e.key === 'Enter') {
                             handleUpdateEmployeeDays(emp, e.currentTarget.value);
                             e.currentTarget.blur();
                           }
                         }}
                         className={`w-16 text-center text-xs font-bold rounded-lg py-1 outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none print:border-none print:bg-transparent print:w-auto print:text-black print:text-[9px] ${
                           emp.vtDays !== undefined && emp.vtDays !== globalDays 
                             ? 'bg-[#E9EDF7] text-[#283575] border border-[#283575]/20 print:font-black' 
                             : 'bg-white border border-gray-200 text-[#A3AED0] focus:text-[#1B2559]'
                         } ${isMonthLocked ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                       />
                     </td>
                     <td className="px-6 py-4 print:py-1 print:px-1 text-right">
                       <span className="text-[#05CD99] font-bold text-sm print:text-black print:text-[9px]">{formatCurrency(monthly)}</span>
                     </td>
                     <td className="px-6 py-4 text-center print:hidden">
                       <div className={`flex items-center justify-center gap-2 ${isMonthLocked ? 'opacity-30 pointer-events-none' : ''}`}>
                         <button 
                           onClick={() => initiateEdit(emp)}
                           className="p-2 text-[#A3AED0] hover:text-[#283575] hover:bg-white rounded-lg transition-all"
                           title="Editar Valor"
                           disabled={isMonthLocked}
                         >
                           <span className="material-symbols-outlined">edit</span>
                         </button>
                         <button 
                           onClick={() => handleRemoveVoucher(emp)}
                           className="p-2 text-[#A3AED0] hover:text-red-500 hover:bg-white rounded-lg transition-all"
                           title="Remover Benefício"
                           disabled={isMonthLocked}
                         >
                           <span className="material-symbols-outlined">delete</span>
                         </button>
                       </div>
                     </td>
                   </tr>
                 );
              }) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center opacity-40">
                    <span className="material-symbols-outlined text-4xl mb-2">commute</span>
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum beneficiário encontrado</p>
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

export default TransportationVoucher;