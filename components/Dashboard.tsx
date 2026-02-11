import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Page } from '../types';

interface DashboardProps {
  employees: Employee[];
  onPageChange: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, onPageChange }) => {

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Stats Logic
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Ativo').length;
    
    // Calculate total payroll
    const payroll = employees.reduce((acc, curr) => acc + (curr.status === 'Ativo' ? curr.salary : 0), 0);

    // Calculate counts and payroll per regime
    const regimeCounts = {
      Efetivo: 0,
      Comissionado: 0,
      Contratado: 0,
      Vereador: 0,
    };

    const regimePayroll = {
      Efetivo: 0,
      Comissionado: 0,
      Contratado: 0,
      Vereador: 0,
    };

    employees.forEach(e => {
      if (e.regime in regimeCounts) {
        regimeCounts[e.regime as keyof typeof regimeCounts]++;
        if (e.status === 'Ativo') {
          regimePayroll[e.regime as keyof typeof regimePayroll] += e.salary;
        }
      }
    });

    return { total, active, payroll, regimeCounts, regimePayroll };
  }, [employees]);

  // Chart Logic
  const regimePercentages = useMemo(() => {
    if (stats.total === 0) return { Efetivo: 0, Comissionado: 0, Contratado: 0, Vereador: 0 };
    return {
      Efetivo: (stats.regimeCounts.Efetivo / stats.total) * 100,
      Comissionado: (stats.regimeCounts.Comissionado / stats.total) * 100,
      Contratado: (stats.regimeCounts.Contratado / stats.total) * 100,
      Vereador: (stats.regimeCounts.Vereador / stats.total) * 100,
    };
  }, [stats]);

  const conicGradient = useMemo(() => {
    const p1 = regimePercentages.Efetivo;
    const p2 = p1 + regimePercentages.Comissionado;
    const p3 = p2 + regimePercentages.Contratado;

    // Colors: Teal, Purple, Pink, Yellow (Horizon Palette)
    return `conic-gradient(
      #05CD99 0% ${p1}%,
      #7C4DFF ${p1}% ${p2}%,
      #FF4081 ${p2}% ${p3}%,
      #FFD740 ${p3}% 100%
    )`;
  }, [regimePercentages]);

  // Role Filter Logic
  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(employees.map(e => e.role).filter(Boolean)));
    return roles.sort();
  }, [employees]);

  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    // Set default selection to first role if available and nothing selected
    if (uniqueRoles.length > 0 && !selectedRole) {
      setSelectedRole(uniqueRoles[0]);
    }
  }, [uniqueRoles]);

  const employeesByRole = useMemo(() => {
    if (!selectedRole) return [];
    return employees.filter(e => e.role === selectedRole);
  }, [employees, selectedRole]);

  // Logic for "Birthdays" (Current month)
  const birthdayData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentMonthName = today.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    const list = employees.filter(emp => {
      if (emp.status !== 'Ativo') return false;
      const parts = emp.birthDate.split('/');
      if (parts.length < 2) return false;
      const month = parseInt(parts[1]);
      return month === currentMonth;
    }).sort((a, b) => {
      const dayA = parseInt(a.birthDate.split('/')[0]);
      const dayB = parseInt(b.birthDate.split('/')[0]);
      return dayA - dayB;
    }).slice(0, 3); // Top 3 only

    return { list, monthName: capitalizedMonth, count: list.length };
  }, [employees]);

  return (
    <div className="px-4 md:px-8 pb-8 pt-2 space-y-6 animate-in fade-in duration-500 font-sans">

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Card 1: Total Employees (Income Style) */}
        <div className="bg-white rounded-[20px] p-6 shadow-card flex flex-col justify-between relative overflow-hidden h-auto min-h-[160px] group transition-all hover:shadow-hover">
          <div className="flex justify-between items-start z-10">
            <div className="bg-background-light p-3 rounded-full text-brand">
              <span className="material-symbols-outlined filled">bar_chart</span>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">Ativos</p>
              <h3 className="text-text-main text-2xl font-bold">{stats.active}</h3>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 z-10">
            <div className="flex items-center text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="ml-1">+2.5%</span>
            </div>
            <p className="text-text-secondary text-xs">desde o mês passado</p>
          </div>

          {/* Decorative Wave */}
          <svg className="absolute bottom-0 left-0 w-full h-16 text-brand/5" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* Card 2: Payroll (Spend Style) */}
        <div className="bg-white rounded-[20px] p-6 shadow-card flex flex-col h-auto min-h-[160px] group transition-all hover:shadow-hover">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-background-light p-3 rounded-full text-brand">
              <span className="material-symbols-outlined filled">attach_money</span>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">Folha Mensal</p>
              <h3 className="text-text-main text-2xl font-bold">{formatCurrency(stats.payroll)}</h3>
            </div>
          </div>
          
          <div className="mt-auto space-y-1 pt-2 border-t border-gray-50">
             <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                   <span className="size-1.5 rounded-full bg-[#05CD99]"></span>
                   <span className="text-text-secondary font-medium">Efetivos</span>
                </div>
                <span className="font-bold text-text-main">{formatCurrency(stats.regimePayroll.Efetivo)}</span>
             </div>
             <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                   <span className="size-1.5 rounded-full bg-[#7C4DFF]"></span>
                   <span className="text-text-secondary font-medium">Comissionados</span>
                </div>
                <span className="font-bold text-text-main">{formatCurrency(stats.regimePayroll.Comissionado)}</span>
             </div>
             <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                   <span className="size-1.5 rounded-full bg-[#FF4081]"></span>
                   <span className="text-text-secondary font-medium">Contratados</span>
                </div>
                <span className="font-bold text-text-main">{formatCurrency(stats.regimePayroll.Contratado)}</span>
             </div>
             <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                   <span className="size-1.5 rounded-full bg-[#FFD740]"></span>
                   <span className="text-text-secondary font-medium">Vereadores</span>
                </div>
                <span className="font-bold text-text-main">{formatCurrency(stats.regimePayroll.Vereador)}</span>
             </div>
          </div>
        </div>

        {/* Card 3: Distribution (Remodeled) */}
        <div className="bg-white rounded-[20px] p-5 shadow-card flex flex-col h-auto min-h-[160px] group transition-all hover:shadow-hover relative overflow-hidden">
          <h4 className="text-text-main font-bold text-lg mb-2 leading-none">Distribuição</h4>

          <div className="flex items-center gap-4 h-full">
            {/* Chart Section */}
            <div className="relative size-20 shrink-0">
              <div className="size-full rounded-full" style={{ background: conicGradient }}></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                <span className="text-xl font-bold text-text-main leading-none">{stats.total}</span>
                <span className="text-[8px] font-bold text-text-secondary uppercase">Total</span>
              </div>
            </div>

            {/* Legend Section - Vertical List for clarity */}
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
              {/* Efetivo */}
              <div className="flex items-center justify-between w-full border-b border-gray-50 pb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-[#05CD99] shrink-0"></span>
                  <span className="text-[11px] font-medium text-text-secondary truncate">Efetivos</span>
                </div>
                <span className="text-[11px] font-bold text-text-main">{stats.regimeCounts.Efetivo}</span>
              </div>

              {/* Comissionado */}
              <div className="flex items-center justify-between w-full border-b border-gray-50 pb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-[#7C4DFF] shrink-0"></span>
                  <span className="text-[11px] font-medium text-text-secondary truncate">Comissionados</span>
                </div>
                <span className="text-[11px] font-bold text-text-main">{stats.regimeCounts.Comissionado}</span>
              </div>

              {/* Contratado */}
              <div className="flex items-center justify-between w-full border-b border-gray-50 pb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-[#FF4081] shrink-0"></span>
                  <span className="text-[11px] font-medium text-text-secondary truncate">Contratados</span>
                </div>
                <span className="text-[11px] font-bold text-text-main">{stats.regimeCounts.Contratado}</span>
              </div>

              {/* Vereador */}
              <div className="flex items-center justify-between w-full pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-[#FFD740] shrink-0"></span>
                  <span className="text-[11px] font-medium text-text-secondary truncate">Vereadores</span>
                </div>
                <span className="text-[11px] font-bold text-text-main">{stats.regimeCounts.Vereador}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Table Section (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-card flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-text-main tracking-tight">Funcionários por Cargo</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-text-secondary font-medium">Exibindo</span>
                <span className="text-2xl font-bold text-[#1B2559]">{employeesByRole.length}</span>
                <span className="text-xs text-text-secondary font-medium">resultados</span>
              </div>
            </div>

            {/* Filter */}
            <div className="relative group w-full sm:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="appearance-none bg-background-light pl-4 pr-10 py-2.5 rounded-xl text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer w-full sm:min-w-[200px]"
              >
                <option value="" disabled>Selecione um cargo...</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-lg">expand_more</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-wider pl-2">Colaborador</th>
                  <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-wider">CPF</th>
                  <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Regime</th>
                  <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right pr-2">Salário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employeesByRole.length > 0 ? employeesByRole.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-background-light/50 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-background-light flex items-center justify-center text-brand font-bold text-sm border border-white shadow-sm">
                          {emp.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-main">{emp.name}</span>
                          <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">{emp.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-bold text-text-main">{emp.cpf}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${emp.regime === 'Efetivo' ? 'bg-emerald-50 text-emerald-600' :
                          emp.regime === 'Comissionado' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-pink-50 text-pink-600'
                        }`}>
                        {emp.regime}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2 text-sm font-bold text-text-main">
                      {formatCurrency(emp.salary)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center opacity-50">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-text-secondary">search_off</span>
                        <p className="text-sm font-bold text-text-secondary">Nenhum funcionário encontrado neste cargo.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel (Span 1) */}
        <div className="bg-white rounded-[20px] p-6 shadow-card flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-text-main tracking-tight">Ações Rápidas</h3>
            <span className="size-10 rounded-full bg-background-light flex items-center justify-center text-brand">
              <span className="material-symbols-outlined filled">bolt</span>
            </span>
          </div>

          {/* Birthday / Highlights Card */}
          <div className="bg-gradient-to-br from-brand to-brand/80 rounded-[20px] p-6 text-white shadow-lg shadow-brand/20 relative overflow-hidden flex flex-col justify-between h-auto min-h-[220px]">
            <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-xl"></div>

            <div className="z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm filled text-white/70">cake</span>
                <p className="text-sm font-medium text-white/80">Referência: {birthdayData.monthName}</p>
              </div>
              <h4 className="text-xl font-bold">Aniversariantes</h4>
            </div>

            <div className="flex flex-col gap-3 my-4 z-10 flex-1">
              {birthdayData.list.length > 0 ? (
                birthdayData.list.map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/5">
                    <div className="size-8 rounded-full bg-white text-brand flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">{emp.avatar}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-white/70">celebration</span>
                        <p className="text-[10px] text-white/70">Aniversário: {emp.birthDate.substring(0, 5)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-4 opacity-60">
                  <span className="material-symbols-outlined text-3xl mb-1">sentiment_satisfied</span>
                  <p className="text-xs">Nenhum aniversariante este mês.</p>
                </div>
              )}
            </div>

            <button onClick={() => onPageChange(Page.Anniversaries)} className="bg-white text-brand px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-105 transition-transform w-full z-10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Acessar Painel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;