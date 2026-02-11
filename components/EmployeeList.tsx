import React, { useState, useMemo, useRef } from 'react';
import { Employee } from '../types';
import EditEmployeeModal from './EditEmployeeModal';
import DismissEmployeeModal from './DismissEmployeeModal';
import ImportSpreadsheetModal from './ImportSpreadsheetModal';
import SecurityModal from './SecurityModal';
import * as XLSX from 'xlsx';

interface EmployeeListProps {
  employees: Employee[];
  onAdd: (emp: Employee) => Promise<void>;
  onUpdate: (emp: Employee) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (emps: Employee[]) => Promise<void>;
}

type SortField = 'name' | 'role' | 'regime' | 'salary' | 'status' | 'id';
type SortDirection = 'asc' | 'desc';

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onAdd, onUpdate, onDelete, onImport }) => {
  const [search, setSearch] = useState('');
  const [filterRegime, setFilterRegime] = useState('Todos');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  
  // For Edit/Dismiss/Delete
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<string | null>(null);
  const [isNewEmployee, setIsNewEmployee] = useState(false);
  
  // For Import
  const [importData, setImportData] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRegimeChange = (regime: string) => {
    setFilterRegime(regime);
    // Reset to alphabetical order when changing filter as requested
    setSortField('name');
    setSortDirection('asc');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>;
    }
    return (
      <span className="material-symbols-outlined text-[14px] text-[#283575]">
        {sortDirection === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down'}
      </span>
    );
  };

  const filteredEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      // Basic Search
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchLower) ||
        (emp.role || '').toLowerCase().includes(searchLower) ||
        (emp.cpf || '').includes(searchLower);

      // Filter by Regime
      const matchesRegime = filterRegime === 'Todos' || emp.regime === filterRegime;

      return matchesSearch && matchesRegime;
    });

    // Sorting
    if (sortField) {
        result.sort((a, b) => {
            let valA: any = a[sortField] || '';
            let valB: any = b[sortField] || '';

            // Handle numeric comparisons
            if (sortField === 'salary') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [employees, search, filterRegime, sortField, sortDirection]);

  const handleOpenNew = () => {
    setSelectedEmployee({
      id: '',
      name: '',
      avatar: 'NC',
      cpf: '',
      role: '',
      regime: 'Efetivo',
      admissionDate: '',
      birthDate: '',
      department: '',
      salary: 0,
      status: 'Ativo',
      vtEntitled: false,
      vtDailyValue: 0
    });
    setIsNewEmployee(true);
    setIsEditModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsNewEmployee(false);
    setIsEditModalOpen(true);
  };

  const handleDismiss = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDismissModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setEmployeeToDeleteId(id);
    setIsSecurityModalOpen(true);
  };

  const handleSecurityConfirm = async () => {
    if (employeeToDeleteId) {
      await onDelete(employeeToDeleteId);
      setEmployeeToDeleteId(null);
      setIsSecurityModalOpen(false);
    }
  };

  const handleSaveEmployee = async (emp: Employee) => {
    if (isNewEmployee) {
      await onAdd(emp);
    } else {
      await onUpdate(emp);
    }
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleConfirmDismiss = async (data: { date: string; reason: string; notes: string }) => {
    if (selectedEmployee) {
      const updatedEmp: Employee = {
        ...selectedEmployee,
        status: 'Desligado',
        dismissalDate: data.date,
        dismissalReason: data.reason,
        internalNotes: data.notes
      };
      await onUpdate(updatedEmp);
      setIsDismissModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportData(data);
        setIsImportModalOpen(true);
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Erro ao ler arquivo. Certifique-se que é um arquivo Excel válido.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = async (mappedEmployees: Employee[]) => {
    await onImport(mappedEmployees);
    setIsImportModalOpen(false);
    setImportData([]);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        
        {/* Left Side: Search */}
        <div className="relative group w-full xl:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#283575] transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nome, cargo ou CPF..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-[20px] pl-12 pr-4 py-3 text-sm font-bold text-[#1B2559] shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-[#283575]/20 transition-all"
            />
        </div>

        {/* Right Side: Filters & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 md:pb-0">
            
            {/* Filter Tabs (Regime) */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto">
                {['Todos', 'Efetivo', 'Comissionado', 'Contratado', 'Vereador'].map(r => (
                  <button key={r} onClick={() => handleRegimeChange(r)} className={`px-5 py-2.5 rounded-[20px] text-xs font-bold transition-all whitespace-nowrap border ${filterRegime === r ? 'bg-gradient-to-b from-[#111C44] to-[#283575] text-white shadow-md border-transparent' : 'bg-white text-[#A3AED0] border-gray-100 hover:border-[#111C44] hover:text-[#1B2559]'}`}>
                    {r}
                  </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-all"
                title="Importar Planilha"
              >
                <span className="material-symbols-outlined">upload_file</span>
              </button>
              
              <button 
                onClick={handleOpenNew}
                className="px-6 py-3 bg-[#283575] text-white rounded-xl shadow-lg shadow-[#283575]/20 hover:bg-[#111C44] transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Novo
              </button>
            </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[20px] overflow-hidden shadow-card border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F4F7FE]/50">
                <th 
                  className="pl-8 pr-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#E9EDF7]/50 transition-colors select-none group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Colaborador
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#E9EDF7]/50 transition-colors select-none group"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Cargo / CPF
                    {renderSortIcon('role')}
                  </div>
                </th>
                <th 
                  className="px-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#E9EDF7]/50 transition-colors select-none group"
                  onClick={() => handleSort('regime')}
                >
                  <div className="flex items-center gap-1">
                    Regime
                    {renderSortIcon('regime')}
                  </div>
                </th>
                <th 
                  className="px-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer hover:bg-[#E9EDF7]/50 transition-colors select-none group"
                  onClick={() => handleSort('salary')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Salário Base
                    {renderSortIcon('salary')}
                  </div>
                </th>
                <th 
                  className="px-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer hover:bg-[#E9EDF7]/50 transition-colors select-none group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-right pr-8">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F4F7FE] transition-colors group">
                  <td className="pl-8 pr-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-full bg-white border border-gray-100 flex items-center justify-center font-bold text-xs shadow-sm ${emp.status === 'Desligado' ? 'text-gray-400 grayscale opacity-70' : 'text-[#283575]'}`}>
                        {emp.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${emp.status === 'Desligado' ? 'text-gray-400' : 'text-[#1B2559]'}`}>{emp.name}</span>
                        <span className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-wider">{emp.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                        <span className="text-[#1B2559] font-bold text-xs">{emp.role}</span>
                        <span className="text-[10px] text-[#A3AED0] font-medium">{emp.cpf}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        emp.regime === 'Efetivo' ? 'bg-teal-50 text-teal-600' :
                        emp.regime === 'Comissionado' ? 'bg-indigo-50 text-indigo-600' :
                        emp.regime === 'Vereador' ? 'bg-amber-50 text-amber-600' :
                        'bg-pink-50 text-pink-600'
                    }`}>
                        {emp.regime}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[#1B2559] font-bold text-sm">{formatCurrency(emp.salary)}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        emp.status === 'Ativo' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                        <span className={`size-1.5 rounded-full ${emp.status === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right pr-8">
                     <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(emp)} className="p-2 text-[#A3AED0] hover:text-[#283575] rounded-lg hover:bg-white transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        
                        {emp.status === 'Ativo' && (
                            <button onClick={() => handleDismiss(emp)} className="p-2 text-[#A3AED0] hover:text-amber-500 rounded-lg hover:bg-white transition-colors" title="Desligar Colaborador">
                                <span className="material-symbols-outlined text-lg">person_remove</span>
                            </button>
                        )}
                        
                        {/* Botão Excluir Seguro (Senha Master) */}
                        <button onClick={() => handleDeleteRequest(emp.id)} className="p-2 text-[#A3AED0] hover:text-red-500 rounded-lg hover:bg-white transition-colors" title="Excluir Registro (Permanente)">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                     </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="py-20 text-center opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-2 text-[#A3AED0]">group_off</span>
                        <p className="text-sm font-bold text-[#A3AED0] uppercase tracking-widest">Nenhum colaborador encontrado</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditEmployeeModal 
            employee={selectedEmployee || {
                id: '',
                name: '',
                avatar: 'NO',
                cpf: '',
                role: '',
                regime: 'Efetivo',
                admissionDate: '',
                birthDate: '',
                department: '',
                salary: 0,
                status: 'Ativo',
                vtEntitled: false,
                vtDailyValue: 0
            }}
            isNew={isNewEmployee}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEmployee}
        />
      )}

      {isDismissModalOpen && selectedEmployee && (
        <DismissEmployeeModal 
            employee={selectedEmployee}
            onClose={() => setIsDismissModalOpen(false)}
            onConfirm={handleConfirmDismiss}
        />
      )}

      {isImportModalOpen && (
        <ImportSpreadsheetModal 
            data={importData}
            onClose={() => setIsImportModalOpen(false)}
            onConfirm={handleImportConfirm}
        />
      )}
      
      <SecurityModal 
          isOpen={isSecurityModalOpen}
          onClose={() => {
            setIsSecurityModalOpen(false);
            setEmployeeToDeleteId(null);
          }}
          onConfirm={handleSecurityConfirm}
      />
    </div>
  );
};

export default EmployeeList;