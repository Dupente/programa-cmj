import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import { NotificationType } from './ToastNotification';

interface VacationManagementProps {
  employees: Employee[];
  onNotification?: (message: string, type: NotificationType) => void;
}

type VacationStatus = 'VENCIDA' | 'ADQUIRIDA' | 'EM GOZO' | 'AGENDADA' | 'CONCLUÍDA';

type ScheduledLeave = {
  id: string;
  start: string;
  end: string;
  days: number;
};

type VacationCycle = {
  id: string;
  employee: Employee;
  start: string;
  end: string;
  admission: string;
  status: VacationStatus;
  isOverdueDouble: boolean;
  scheduledLeaves: ScheduledLeave[];
  remainingDays: number;
};

const VacationManagement: React.FC<VacationManagementProps> = ({ employees, onNotification }) => {
  const [activeTab, setActiveTab] = useState<VacationStatus | 'Todos'>('ADQUIRIDA');
  const [searchTerm, setSearchTerm] = useState('');

  const [customSchedules, setCustomSchedules] = useState<Record<string, ScheduledLeave[]>>(() => {
    const saved = localStorage.getItem('rh_vacation_schedules_v2');
    if (saved) return JSON.parse(saved);

    const legacy = localStorage.getItem('rh_vacation_schedules');
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      const migrated: Record<string, ScheduledLeave[]> = {};
      Object.keys(parsedLegacy).forEach(key => {
        const leave = parsedLegacy[key];
        migrated[key] = [{
          id: Math.random().toString(36).substr(2, 9),
          start: leave.start,
          end: leave.end,
          days: 30
        }];
      });
      return migrated;
    }
    return {};
  });

  /* New Sorting State */
  type SortKey = 'name' | 'balance' | 'period' | 'status';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  /* Existing State */
  const [schedulingCycle, setSchedulingCycle] = useState<VacationCycle | null>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [cycleToDelete, setCycleToDelete] = useState<VacationCycle | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<{ cycleId: string, leaveId: string } | null>(null);
  const [newSchedule, setNewSchedule] = useState({ start: '', end: '' });

  useEffect(() => {
    localStorage.setItem('rh_vacation_schedules_v2', JSON.stringify(customSchedules));
  }, [customSchedules]);

  // Add Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSchedulingCycle(null);
        setLeaveToDelete(null);
        setCycleToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDate = useMemo(() => new Date(2025, 0, 1), []);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const toIso = (ptDate: string) => ptDate.split('/').reverse().join('-');

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const allCycles = useMemo(() => {
    const results: VacationCycle[] = [];

    employees.forEach((emp) => {
      if (emp.status !== 'Ativo' || emp.regime === 'Vereador') return;

      const admissionDate = parseDate(emp.admissionDate);
      let cycleIndex = 0;

      while (true) {
        const cycleStart = new Date(admissionDate);
        cycleStart.setFullYear(cycleStart.getFullYear() + cycleIndex);

        const cycleEnd = new Date(cycleStart);
        cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);
        cycleEnd.setDate(cycleEnd.getDate() - 1);

        if (cycleEnd > today) break;

        if (cycleStart >= minDate) {
          const cycleId = `${emp.id}-${cycleStart.getFullYear()}`;
          const concessiveLimit = new Date(cycleEnd);
          concessiveLimit.setFullYear(concessiveLimit.getFullYear() + 1);

          const scheduledLeaves = customSchedules[cycleId] || [];
          const usedDays = scheduledLeaves.reduce((acc, curr) => acc + curr.days, 0);
          const remainingDays = 30 - usedDays;

          let status: VacationStatus = 'ADQUIRIDA';
          let isOverdueDouble = false;

          const isCurrentlyInGozo = scheduledLeaves.some(leave => {
            const leaveStart = parseDate(leave.start);
            const leaveEnd = parseDate(leave.end);
            return today >= leaveStart && today <= leaveEnd;
          });

          const hasFutureLeaves = scheduledLeaves.some(leave => {
            const leaveStart = parseDate(leave.start);
            return today < leaveStart;
          });

          const allLeavesPassed = scheduledLeaves.length > 0 && scheduledLeaves.every(leave => {
            const leaveEnd = parseDate(leave.end);
            return today > leaveEnd;
          });

          if (isCurrentlyInGozo) {
            status = 'EM GOZO';
          } else if (hasFutureLeaves) {
            status = 'AGENDADA';
          } else if (allLeavesPassed && remainingDays <= 0) {
            status = 'CONCLUÍDA';
          } else if (today > concessiveLimit && remainingDays > 0) {
            status = 'VENCIDA';
            isOverdueDouble = true;
          } else {
            status = 'ADQUIRIDA';
          }

          if (status !== 'CONCLUÍDA') {
            results.push({
              id: cycleId,
              employee: emp,
              admission: emp.admissionDate,
              start: formatDate(cycleStart),
              end: formatDate(cycleEnd),
              status,
              isOverdueDouble,
              scheduledLeaves,
              remainingDays
            });
          }
        }

        cycleIndex++;
        if (cycleIndex > 50) break;
      }
    });

    return results;
  }, [employees, today, minDate, customSchedules]);

  const stats = {
    total: allCycles.length,
    vencidas: allCycles.filter(c => c.status === 'VENCIDA').length,
    adquiridas: allCycles.filter(c => c.remainingDays > 0).length,
    emGozo: allCycles.filter(c => c.status === 'EM GOZO').length,
    agendadas: allCycles.filter(c => c.status === 'AGENDADA').length,
  };

  const filtered = useMemo(() => {
    return allCycles.filter(c => {
      let matchesTab = activeTab === 'Todos' || c.status === activeTab;

      if (activeTab === 'ADQUIRIDA') {
        matchesTab = c.remainingDays > 0;
      }

      const search = searchTerm.toLowerCase();
      const matchesSearch = c.employee.name.toLowerCase().includes(search) ||
        c.employee.id.toLowerCase().includes(search);
      return matchesTab && matchesSearch;
    });
  }, [allCycles, activeTab, searchTerm]);

  /* Sorting Logic */
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedCycles = useMemo(() => {
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      let comparison = 0;

      switch (key) {
        case 'name':
          comparison = a.employee.name.localeCompare(b.employee.name);
          break;
        case 'balance':
          comparison = a.remainingDays - b.remainingDays;
          break;
        case 'period':
          comparison = parseDate(a.start).getTime() - parseDate(b.start).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filtered, sortConfig]);

  const currentNewLeaveDays = useMemo(() => {
    return calculateDays(newSchedule.start, newSchedule.end);
  }, [newSchedule]);

  const isOverlap = useMemo(() => {
    if (!schedulingCycle || !newSchedule.start || !newSchedule.end) return false;
    const start = new Date(newSchedule.start);
    const end = new Date(newSchedule.end);

    const allEmployeeSchedules = allCycles
      .filter(c => c.employee.id === schedulingCycle.employee.id)
      .flatMap(c => c.scheduledLeaves)
      .filter(s => s.id !== editingLeaveId);

    return allEmployeeSchedules.some(s => {
      const sStart = parseDate(s.start);
      const sEnd = parseDate(s.end);
      return start <= sEnd && end >= sStart;
    });
  }, [newSchedule, schedulingCycle, allCycles, editingLeaveId]);

  const isExceedingBalance = useMemo(() => {
    if (!schedulingCycle) return false;
    let availableBalance = schedulingCycle.remainingDays;
    if (editingLeaveId) {
      const oldLeave = schedulingCycle.scheduledLeaves.find(l => l.id === editingLeaveId);
      if (oldLeave) availableBalance += oldLeave.days;
    }
    return currentNewLeaveDays > availableBalance;
  }, [currentNewLeaveDays, schedulingCycle, editingLeaveId]);

  const handleOpenSchedule = (cycle: VacationCycle, leaveToEdit?: ScheduledLeave) => {
    setSchedulingCycle(cycle);
    if (leaveToEdit) {
      setEditingLeaveId(leaveToEdit.id);
      setNewSchedule({
        start: toIso(leaveToEdit.start),
        end: toIso(leaveToEdit.end)
      });
    } else {
      setEditingLeaveId(null);
      setNewSchedule({ start: '', end: '' });
    }
  };

  const handleConfirmSchedule = () => {
    if (isOverlap || isExceedingBalance || !newSchedule.start || !newSchedule.end) return;
    const formatDateFromIso = (iso: string) => iso.split('-').reverse().join('/');

    if (onNotification) onNotification('Gravando agendamento...', 'loading');

    setTimeout(() => {
      setCustomSchedules(prev => {
        const cycleId = schedulingCycle!.id;
        const currentList = prev[cycleId] || [];

        if (editingLeaveId) {
          return {
            ...prev,
            [cycleId]: currentList.map(l => l.id === editingLeaveId ? {
              ...l,
              start: formatDateFromIso(newSchedule.start),
              end: formatDateFromIso(newSchedule.end),
              days: currentNewLeaveDays
            } : l)
          };
        } else {
          const newLeave: ScheduledLeave = {
            id: Math.random().toString(36).substr(2, 9),
            start: formatDateFromIso(newSchedule.start),
            end: formatDateFromIso(newSchedule.end),
            days: currentNewLeaveDays
          };
          return {
            ...prev,
            [cycleId]: [...currentList, newLeave]
          };
        }
      });

      setSchedulingCycle(null);
      setEditingLeaveId(null);
      if (onNotification) onNotification('Férias agendadas com sucesso!', 'success');
    }, 600); // Fake delay para sensação de gravação
  };

  const handleDeleteLeave = (cycleId: string, leaveId: string) => {
    if (onNotification) onNotification('Removendo agendamento...', 'loading');

    setTimeout(() => {
      setCustomSchedules(prev => ({
        ...prev,
        [cycleId]: (prev[cycleId] || []).filter(l => l.id !== leaveId)
      }));
      setLeaveToDelete(null);
      if (onNotification) onNotification('Agendamento removido.', 'success');
    }, 500);
  };

  const confirmDeleteWholeCycle = () => {
    if (cycleToDelete) {
      if (onNotification) onNotification('Limpando histórico...', 'loading');
      setTimeout(() => {
        setCustomSchedules(prev => {
          const next = { ...prev };
          delete next[cycleToDelete.id];
          return next;
        });
        setCycleToDelete(null);
        if (onNotification) onNotification('Histórico limpo com sucesso.', 'success');
      }, 500);
    }
  };

  return (
    <div className="px-8 pb-8 pt-0 space-y-8 animate-in fade-in duration-700">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => setActiveTab('VENCIDA')}
          className={`flex flex-col text-left bg-white p-6 rounded-[20px] transition-all hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(112,144,176,0.2)] group ${activeTab === 'VENCIDA' ? 'shadow-[0px_3px_20px_rgba(112,144,176,0.15)] ring-2 ring-red-500' : 'shadow-[0px_3px_20px_rgba(112,144,176,0.08)]'
            }`}
        >
          <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Vencidas</p>
          <h2 className="text-4xl font-bold text-[#1B2559] mt-1">{stats.vencidas.toString().padStart(2, '0')}</h2>
          <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-tighter flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] filled">warning</span>
            Alerta de Multa
          </p>
        </button>

        <button
          onClick={() => setActiveTab('ADQUIRIDA')}
          className={`flex flex-col text-left bg-white p-6 rounded-[20px] transition-all hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(112,144,176,0.2)] group ${activeTab === 'ADQUIRIDA' ? 'shadow-[0px_3px_20px_rgba(112,144,176,0.15)] ring-2 ring-[#283575]' : 'shadow-[0px_3px_20px_rgba(112,144,176,0.08)]'
            }`}
        >
          <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Adquiridas</p>
          <h2 className="text-4xl font-bold text-[#1B2559] mt-1">{stats.adquiridas.toString().padStart(2, '0')}</h2>
          <p className="text-green-500 text-[10px] font-bold mt-2 uppercase tracking-tighter flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] filled">task_alt</span>
            Com Saldo Disponível
          </p>
        </button>

        <button
          onClick={() => setActiveTab('EM GOZO')}
          className={`flex flex-col text-left bg-white p-6 rounded-[20px] transition-all hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(112,144,176,0.2)] group ${activeTab === 'EM GOZO' ? 'shadow-[0px_3px_20px_rgba(112,144,176,0.15)] ring-2 ring-amber-500' : 'shadow-[0px_3px_20px_rgba(112,144,176,0.08)]'
            }`}
        >
          <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Em Gozo</p>
          <h2 className="text-4xl font-bold text-[#1B2559] mt-1">{stats.emGozo.toString().padStart(2, '0')}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-amber-500 text-[10px] font-bold uppercase tracking-tighter">Ausente Hoje</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('AGENDADA')}
          className={`flex flex-col text-left bg-white p-6 rounded-[20px] transition-all hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(112,144,176,0.2)] group ${activeTab === 'AGENDADA' ? 'shadow-[0px_3px_20px_rgba(112,144,176,0.15)] ring-2 ring-sky-500' : 'shadow-[0px_3px_20px_rgba(112,144,176,0.08)]'
            }`}
        >
          <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Agendadas</p>
          <h2 className="text-4xl font-bold text-[#1B2559] mt-1">{stats.agendadas.toString().padStart(2, '0')}</h2>
          <p className="text-sky-500 text-[10px] font-bold mt-2 uppercase tracking-tighter flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] filled">event</span>
            Reserva Futura
          </p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="relative group w-full lg:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#283575] transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar por colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-[20px] pl-12 pr-6 py-4 text-sm font-bold text-[#1B2559] shadow-[0px_3px_20px_rgba(112,144,176,0.08)] outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all placeholder:text-[#A3AED0]/70"
          />
        </div>

        <button
          onClick={() => setActiveTab('Todos')}
          className={`px-6 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'Todos' ? 'bg-[#1B2559] text-white shadow-lg' : 'bg-white text-[#A3AED0] shadow-[0px_3px_20px_rgba(112,144,176,0.08)] hover:text-[#1B2559]'
            }`}
        >
          Ver Todos os Registros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[20px] overflow-hidden shadow-[0px_3px_20px_rgba(112,144,176,0.08)] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th onClick={() => handleSort('name')} className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none group">
                  <div className="flex items-center gap-1">
                    Funcionário
                    <span className={`material-symbols-outlined text-[14px] ${sortConfig.key === 'name' ? 'text-[#283575]' : 'text-gray-300'}`}>
                      {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('balance')} className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none group">
                  <div className="flex items-center gap-1">
                    Saldo Disponível
                    <span className={`material-symbols-outlined text-[14px] ${sortConfig.key === 'balance' ? 'text-[#283575]' : 'text-gray-300'}`}>
                      {sortConfig.key === 'balance' ? (sortConfig.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('period')} className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] cursor-pointer hover:text-[#283575] transition-colors select-none group">
                  <div className="flex items-center gap-1">
                    Período Aquisitivo
                    <span className={`material-symbols-outlined text-[14px] ${sortConfig.key === 'period' ? 'text-[#283575]' : 'text-gray-300'}`}>
                      {sortConfig.key === 'period' ? (sortConfig.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-center cursor-pointer hover:text-[#283575] transition-colors select-none group">
                  <div className="flex items-center justify-center gap-1">
                    Status Atual
                    <span className={`material-symbols-outlined text-[14px] ${sortConfig.key === 'status' ? 'text-[#283575]' : 'text-gray-300'}`}>
                      {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedCycles.map((cycle) => (
                <tr key={cycle.id} className="group hover:bg-[#F4F7FE] transition-all">

                  {/* Avatar & Nome */}
                  <td className="px-6 py-6 text-left">
                    <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full bg-[#E9EDF7] flex items-center justify-center text-[#283575] font-bold text-xs border border-white shadow-sm overflow-hidden shrink-0">
                        <span className="uppercase">{cycle.employee.avatar}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[#1B2559] font-bold text-sm tracking-tight">{cycle.employee.name}</span>
                        <span className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-tight">{cycle.employee.role}</span>
                      </div>
                    </div>
                  </td>

                  {/* Saldo / Barra de Progresso */}
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1.5 max-w-[140px]">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#283575] font-bold text-sm">
                          {cycle.remainingDays} DIAS
                        </span>
                        <span className="text-[#A3AED0] text-[10px] font-bold uppercase">RESTANTES</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F4F7FE] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 bg-[#283575]`}
                          style={{ width: `${(cycle.remainingDays / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Período Aquisitivo */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[#1B2559] font-bold text-sm">{cycle.start}</span>
                      <span className="material-symbols-outlined text-[#A3AED0] text-sm">arrow_right_alt</span>
                      <span className="text-[#1B2559] font-bold text-sm">{cycle.end}</span>
                    </div>
                    {/* Exibe indicador se houver agendamentos, mas mantém visual clean */}
                    {cycle.scheduledLeaves.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {cycle.scheduledLeaves.map(l => (
                          <div key={l.id} className="size-1.5 rounded-full bg-[#283575]" title={`Agendado: ${l.start} a ${l.end}`}></div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center min-w-[100px] ${cycle.status === 'VENCIDA' ? 'bg-red-50 text-red-500' :
                      cycle.status === 'EM GOZO' ? 'bg-amber-50 text-amber-500' :
                        'bg-[#E9EDF7] text-[#283575]'
                      }`}>
                      {cycle.status === 'EM GOZO' && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse mr-2"></span>}
                      {cycle.status}
                    </span>
                  </td>

                  {/* Botão de Ação */}
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {cycle.remainingDays > 0 || cycle.scheduledLeaves.length > 0 ? (
                        <button onClick={() => handleOpenSchedule(cycle)} className="bg-[#E9EDF7] hover:bg-[#283575] text-[#283575] hover:text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
                          <span className="material-symbols-outlined text-base">add_circle</span>
                          {cycle.remainingDays > 0 ? 'Agendar' : 'Gerenciar'}
                        </button>
                      ) : (
                        <button onClick={() => setCycleToDelete(cycle)} className="bg-gray-50 hover:bg-gray-100 text-[#A3AED0] px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors">
                          Limpar Ciclo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedCycles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center opacity-30">
                    <span className="material-symbols-outlined text-6xl text-[#A3AED0]">event_busy</span>
                    <p className="text-xs font-bold text-[#A3AED0] uppercase tracking-widest mt-4">Nenhum registro para este filtro</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE AGENDAMENTO / EDIÇÃO FRACIONADA */}
      {schedulingCycle && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[30px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="space-y-1 text-left">
                <h3 className="text-[#1B2559] text-xl font-bold tracking-tight">
                  {editingLeaveId ? 'Alterar Período de Gozo' : 'Novo Período de Gozo'}
                </h3>
                <p className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">{schedulingCycle.employee.name}</p>
              </div>
              <button onClick={() => setSchedulingCycle(null)} className="text-[#A3AED0] hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Coluna de Configuração */}
              <div className="flex-1 p-8 space-y-8 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F4F7FE] p-4 rounded-2xl">
                    <p className="text-[#A3AED0] text-[9px] font-bold uppercase tracking-widest mb-1">Ciclo Aquisitivo</p>
                    <p className="text-[#1B2559] font-bold text-[11px]">{schedulingCycle.start} - {schedulingCycle.end}</p>
                  </div>
                  <div className="bg-[#E9EDF7] p-4 rounded-2xl">
                    <p className="text-[#283575] text-[9px] font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
                    <p className="text-[#283575] font-bold text-lg">{schedulingCycle.remainingDays} Dias</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Início das Férias</label>
                    <input
                      type="date"
                      value={newSchedule.start}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-[#F4F7FE] border-none rounded-xl px-4 py-4 text-sm font-bold text-[#1B2559] outline-none focus:ring-2 focus:ring-[#283575]/40 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Fim das Férias</label>
                    <input
                      type="date"
                      value={newSchedule.end}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-[#F4F7FE] border-none rounded-xl px-4 py-4 text-sm font-bold text-[#1B2559] outline-none focus:ring-2 focus:ring-[#283575]/40 transition-all"
                    />
                  </div>
                </div>

                {currentNewLeaveDays > 0 && (
                  <div className={`p-4 rounded-2xl flex items-center justify-between ${isExceedingBalance ? 'bg-red-50 text-red-500' : 'bg-[#E9EDF7] text-[#283575]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl">{isExceedingBalance ? 'error' : 'task_alt'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Duração Calculada</span>
                    </div>
                    <span className="text-lg font-bold">{currentNewLeaveDays} Dias</span>
                  </div>
                )}
              </div>

              {/* Coluna de Histórico do Ciclo */}
              <div className="w-full md:w-72 bg-gray-50 p-8 space-y-6 text-left">
                <h4 className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Histórico do Ciclo
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {schedulingCycle.scheduledLeaves.length > 0 ? schedulingCycle.scheduledLeaves.map(leave => (
                    <div key={leave.id} className={`bg-white p-3 rounded-xl space-y-1 transition-all shadow-sm ${editingLeaveId === leave.id ? 'ring-2 ring-[#283575]' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[#1B2559] text-xs font-bold">{leave.days} Dias</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${parseDate(leave.end) < today ? 'bg-gray-100 text-[#A3AED0]' : 'bg-[#E9EDF7] text-[#283575]'}`}>
                          {parseDate(leave.end) < today ? 'CONCLUÍDO' : 'AGENDADO'}
                        </span>
                      </div>
                      <p className="text-[#A3AED0] text-[10px] font-medium tracking-tighter">{leave.start} a {leave.end}</p>

                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50">
                        <button onClick={() => handleOpenSchedule(schedulingCycle, leave)} className="text-[#283575] text-[10px] font-bold uppercase hover:underline">Editar</button>
                        <button onClick={() => setLeaveToDelete({ cycleId: schedulingCycle.id, leaveId: leave.id })} className="text-red-400 text-[10px] font-bold uppercase hover:underline">Remover</button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center opacity-40 flex flex-col items-center">
                      <span className="material-symbols-outlined text-3xl text-[#A3AED0]">event_busy</span>
                      <p className="text-[9px] font-bold text-[#A3AED0] uppercase mt-2 tracking-widest">Nenhum período</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isOverlap && (
              <div className="mx-8 mb-8 bg-red-50 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 text-left">
                <span className="material-symbols-outlined text-red-500 text-2xl filled">error</span>
                <div className="flex flex-col">
                  <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest">Conflito Detectado</span>
                  <p className="text-red-400 text-xs font-medium">Este período coincide com outro gozo já agendado.</p>
                </div>
              </div>
            )}

            <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setSchedulingCycle(null)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#1B2559] hover:bg-gray-50 transition-colors uppercase tracking-wider">Cancelar</button>
              <button
                onClick={handleConfirmSchedule}
                disabled={isOverlap || isExceedingBalance || !newSchedule.start || !newSchedule.end}
                className={`px-6 py-3 rounded-xl bg-[#283575] hover:bg-[#111C44] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#283575]/20 transition-all active:scale-95 flex items-center gap-2 ${isOverlap || isExceedingBalance || !newSchedule.start || !newSchedule.end ? 'bg-gray-100 text-[#A3AED0] cursor-not-allowed' : 'bg-[#283575] text-white shadow-lg shadow-[#283575]/20 hover:scale-105 active:scale-95'}`}
              >
                {editingLeaveId ? 'Atualizar Período' : 'Confirmar Período'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS DE CONFIRMAÇÃO (REMOÇÃO) */}
      {leaveToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[30px] p-8 text-center space-y-6 shadow-2xl">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-[#1B2559] text-xl font-bold uppercase tracking-tight">Remover Período?</h3>
              <p className="text-[#A3AED0] text-sm">Deseja remover este fracionamento? Os dias retornarão ao saldo disponível do ciclo.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setLeaveToDelete(null)} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-[#A3AED0] font-bold text-[10px] uppercase tracking-widest rounded-full">Voltar</button>
              <button onClick={() => handleDeleteLeave(leaveToDelete.cycleId, leaveToDelete.leaveId)} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20">Remover</button>
            </div>
          </div>
        </div>
      )}

      {cycleToDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[30px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <span className="material-symbols-outlined text-red-500 text-4xl filled">delete_forever</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[#1B2559] text-xl font-bold uppercase tracking-tight">Limpar Agendamentos?</h3>
                <p className="text-[#A3AED0] text-sm leading-relaxed">
                  Deseja remover <b>todos</b> os agendamentos fracionados de <b>{cycleToDelete.employee.name}</b>?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setCycleToDelete(null)} className="py-4 bg-gray-100 hover:bg-gray-200 text-[#A3AED0] font-bold text-[10px] uppercase tracking-widest rounded-full">Cancelar</button>
                <button onClick={confirmDeleteWholeCycle} className="py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20">Sim, Limpar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationManagement;