
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Employee } from '../types';
import EditEmployeeModal from './EditEmployeeModal';
import DismissEmployeeModal from './DismissEmployeeModal';
import ImportSpreadsheetModal from './ImportSpreadsheetModal';
import SecurityModal from './SecurityModal';

interface EmployeeListProps {
  employees: Employee[];
  onUpdate: (emp: Employee) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (emp: Employee) => Promise<void>;
}

const NEW_EMPLOYEE_TEMPLATE: Employee = {
  id: '',
  name: '',
  avatar: '',
  cpf: '',
  role: '',
  regime: 'Efetivo',
  admissionDate: new Date().toLocaleDateString('pt-BR'),
  birthDate: '',
  department: '',
  salary: 0,
  status: 'Ativo'
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onUpdate, onDelete, onAdd }) => {
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State - Inicializado com ordenação por Nome Ascendente
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' } | null>({ 
    key: 'name', 
    direction: 'asc' 
  });
  
  // Modais States
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [dismissingEmployee, setDismissingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [importData, setImportData] = useState<any[] | null>(null);

  // Security State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingSecurityAction, setPendingSecurityAction] = useState<(() => void) | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const formatText = (text: string) => {
    if (!text) return '';
    return text.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(val);
  };

  const requestSecurityCheck = (action: () => void) => {
    setPendingSecurityAction(() => action);
    setIsSecurityModalOpen(true);
  };

  const handleSecurityConfirm = () => {
    setIsSecurityModalOpen(false);
    if (pendingSecurityAction) {
      pendingSecurityAction();
      setPendingSecurityAction(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportData(data);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSorted = useMemo(() => {
    // 1. Filtragem
    let result = employees.filter(e => {
      const matchesRegime = filter === 'Todos' || e.regime === filter;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        e.name.toLowerCase().includes(searchLower) ||
        e.cpf.toLowerCase().includes(searchLower) ||
        e.id.toLowerCase().includes(searchLower);
        
      return matchesRegime && matchesSearch;
    });

    // 2. Ordenação
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Tratamento específico para datas (dd/mm/aaaa)
        if (sortConfig.key === 'admissionDate' || sortConfig.key === 'birthDate' || sortConfig.key === 'dismissalDate') {
           // Se a data não existir (opcional), trata como string vazia ou valor baixo
           const dateA = aValue ? aValue.split('/').reverse().join('-') : '';
           const dateB = bValue ? bValue.split('/').reverse().join('-') : '';
           return sortConfig.direction === 'asc' 
             ? dateA.localeCompare(dateB) 
             : dateB.localeCompare(dateA);
        }

        // Tratamento para strings (localeCompare)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }

        // Tratamento para números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
           return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return result;
  }, [employees, filter, searchTerm, sortConfig]);

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const executeDelete = async () => {
    if (deletingEmployee) {
      await onDelete(deletingEmployee.id);
      setDeletingEmployee(null);
    }
  };

  const executeDismiss = async (data: { date: string; reason: string; notes: string }) => {
    if (dismissingEmployee) {
      const formattedDate = data.date.split('-').reverse().join('/');
      const updated = { 
        ...dismissingEmployee, 
        status: 'Desligado' as const, 
        dismissalDate: formattedDate, 
        dismissalReason: data.reason, 
        internalNotes: data.notes 
      };
      await onUpdate(updated);
      setDismissingEmployee(null);
    }
  };

  const handleUndoDismissal = async (emp: Employee) => {
    const updated = { ...emp, status: 'Ativo' as const, dismissalDate: undefined, dismissalReason: undefined, internalNotes: undefined };
    await onUpdate(updated);
  };

  const handleSaveNew = async (emp: Employee) => {
    if (!emp.id || !emp.name) {
      alert("Por favor, preencha pelo menos a Matrícula e o Nome.");
      return;
    }
    const generatedAvatar = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const newEmp = { ...emp, avatar: generatedAvatar };
    
    await onAdd(newEmp);
    setIsAdding(false);
  };

  const executeImport = async (newEmployees: Employee[]) => {
    for (const emp of newEmployees) {
      await onAdd(emp);
    }
    setImportData(null);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-900/40', 'bg-blue-900/40', 'bg-emerald-900/40', 'bg-amber-900/40', 'bg-purple-900/40'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderSortIcon = (key: keyof Employee) => {
    if (sortConfig?.key !== key) {
      return (
        <span className="material-symbols-outlined text-[14px] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">unfold_more</span>
      );
    }
    return (
      <span className="material-symbols-outlined text-[14px] text-primary">
        {sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}
      </span>
    );
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: keyof Employee, align?: string }) => (
    <th 
      className={`px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors group select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {renderSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />

      <SecurityModal 
        isOpen={isSecurityModalOpen}
        onClose={() => {
          setIsSecurityModalOpen(false);
          setPendingSecurityAction(null);
        }}
        onConfirm={handleSecurityConfirm}
      />

      {importData && (
        <ImportSpreadsheetModal 
          data={importData} 
          onClose={() => setImportData(null)} 
          // INTERCEPTADO PELA SEGURANÇA
          onConfirm={(newEmployees) => requestSecurityCheck(() => executeImport(newEmployees))} 
        />
      )}

      {deletingEmployee && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-card-dark rounded-2xl p-8 space-y-6 border border-border-dark shadow-2xl">
            <h3 className="text-xl font-bold text-white text-center">Excluir Funcionário?</h3>
            <p className="text-muted-text text-sm text-center">Deseja realmente remover <b>{deletingEmployee.name}</b> permanentemente do Supabase?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingEmployee(null)} className="flex-1 py-3 text-slate-400 font-bold hover:bg-white/5 rounded-xl">Cancelar</button>
              {/* INTERCEPTADO PELA SEGURANÇA */}
              <button onClick={() => requestSecurityCheck(executeDelete)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {editingEmployee && (
        <EditEmployeeModal 
          employee={editingEmployee} 
          onClose={() => setEditingEmployee(null)} 
          onSave={async (updated) => {
            await onUpdate(updated);
            setEditingEmployee(null);
          }} 
        />
      )}
      
      {isAdding && (
        <EditEmployeeModal 
          employee={NEW_EMPLOYEE_TEMPLATE} 
          onClose={() => setIsAdding(false)} 
          onSave={handleSaveNew}
          isNew={true}
        />
      )}

      {dismissingEmployee && (
        <DismissEmployeeModal 
          employee={dismissingEmployee} 
          onClose={() => setDismissingEmployee(null)} 
          // INTERCEPTADO PELA SEGURANÇA
          onConfirm={(data) => requestSecurityCheck(() => executeDismiss(data))} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-white text-4xl font-black tracking-tight">Gestão de Colaboradores</h2>
          <p className="text-muted-text text-sm font-medium">Controle total de pessoal com sincronização Supabase Cloud.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl h-14 px-8 bg-[#1e1a1a] border border-border-dark hover:bg-white/5 text-white text-sm font-black uppercase tracking-widest transition-all">
            <span className="material-symbols-outlined text-2xl">upload_file</span>
            <span>Importar</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 rounded-xl h-14 px-8 bg-primary hover:bg-primary/90 text-white text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/30"
          >
            <span className="material-symbols-outlined text-2xl">person_add</span>
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative group w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input type="text" placeholder="Buscar por nome, CPF ou matrícula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1e1a1a] border border-border-dark rounded-xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all text-white placeholder:text-slate-600" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'Efetivo', 'Comissionado', 'Contratado', 'Vereador'].map((r) => (
              <button key={r} onClick={() => setFilter(r)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === r ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-[#1e1a1a] border-border-dark text-slate-500 hover:text-white'}`}>{r.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-border-dark rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white rounded-[20px] overflow-hidden shadow-card border border-gray-100">
                <SortableHeader label="Matrícula" sortKey="id" />
                <SortableHeader label="Nome / CPF" sortKey="name" />
                <SortableHeader label="Cargo" sortKey="role" />
                <SortableHeader label="Regime" sortKey="regime" />
                <SortableHeader label="Admissão" sortKey="admissionDate" />
                <SortableHeader label="Salário" sortKey="salary" />
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredAndSorted.map((emp) => (
                <tr key={emp.id} className="group hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-6"><span className="text-slate-500 font-bold text-sm">{emp.id}</span></td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <a href={`https://picsum.photos/seed/${emp.id}/1200/1200`} target="_blank" rel="noopener noreferrer" className={`size-9 rounded-full overflow-hidden flex items-center justify-center border border-border-dark group-hover:border-primary/50 transition-all shrink-0 ${getAvatarColor(emp.name)}`}>
                        <span className="text-white font-black text-xs uppercase">{emp.avatar}</span>
                      </a>
                      <div className="flex flex-col">
                        <span className="text-white font-black text-sm tracking-tight leading-none">{formatText(emp.name)}</span>
                        <span className="text-slate-500 font-bold text-[10px] mt-1.5">{emp.cpf}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6"><span className="text-slate-400 font-medium text-sm">{emp.role}</span></td>
                  <td className="px-6 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${emp.regime === 'Efetivo' ? 'text-emerald-500 bg-emerald-500/10' : emp.regime === 'Comissionado' ? 'text-blue-500 bg-blue-500/10' : emp.regime === 'Contratado' ? 'text-purple-500 bg-purple-500/10' : 'text-amber-500 bg-amber-500/10'}`}>{emp.regime}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold text-sm">{emp.admissionDate}</span>
                      {emp.status === 'Desligado' && emp.dismissalDate && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1">
                          Demissão: {emp.dismissalDate}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-emerald-500 font-bold text-sm">{formatCurrency(emp.salary)}</span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => emp.status !== 'Desligado' && handleEditClick(emp)} 
                        disabled={emp.status === 'Desligado'}
                        className={`p-1 transition-colors ${emp.status === 'Desligado' ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-white'}`}
                        title={emp.status === 'Desligado' ? 'Funcionário desligado (bloqueado)' : 'Editar'}
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      
                      <button 
                        onClick={() => emp.status !== 'Desligado' && setDeletingEmployee(emp)} 
                        disabled={emp.status === 'Desligado'}
                        className={`p-1 transition-colors ${emp.status === 'Desligado' ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-primary'}`}
                        title={emp.status === 'Desligado' ? 'Funcionário desligado (bloqueado)' : 'Excluir'}
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                      
                      <button 
                        onClick={() => emp.status === 'Ativo' ? setDismissingEmployee(emp) : handleUndoDismissal(emp)} 
                        className={`p-1 transition-colors ${emp.status === 'Desligado' ? 'text-emerald-500 hover:text-emerald-400' : 'text-slate-500 hover:text-primary'}`}
                        title={emp.status === 'Ativo' ? 'Desligar Funcionário' : 'Reativar Funcionário'}
                      >
                        <span className="material-symbols-outlined text-xl">{emp.status === 'Ativo' ? 'block' : 'person_check'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
