import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types';

interface ImportSpreadsheetModalProps {
  data: any[];
  onClose: () => void;
  onConfirm: (employees: Employee[]) => void;
}

const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({ data, onClose, onConfirm }) => {
  const columns = Object.keys(data[0] || {});
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'preview' | 'mapping'>('preview');

  // Campos reordenados de acordo com a sequência do sistema
  const employeeFields = [
    { key: 'id', label: 'Matrícula / ID' },
    { key: 'name', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'role', label: 'Cargo' },
    { key: 'department', label: 'Departamento / Setor' },
    { key: 'regime', label: 'Regime de Contratação' },
    { key: 'admissionDate', label: 'Data de Admissão' },
    { key: 'birthDate', label: 'Data de Nascimento' },
    { key: 'salary', label: 'Salário Atual' },
  ];

  const formatText = (text: string) => {
    if (!text) return '';
    return String(text).toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const formatDateValue = (val: any) => {
    if (!val) return '';
    let dateObj: Date | null = null;
    if (val instanceof Date) dateObj = val;
    else if (typeof val === 'number') dateObj = new Date((val - 25569) * 86400 * 1000);
    else if (typeof val === 'string') {
      const cleanVal = val.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(cleanVal)) {
        const [y, m, d] = cleanVal.split('T')[0].split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleanVal)) {
        const parts = cleanVal.split('/');
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      const parsed = new Date(cleanVal);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return String(val);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    columns.forEach(col => {
      const lowerCol = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (lowerCol === 'nome' || lowerCol.includes('nome completo') || lowerCol === 'colaborador' || lowerCol === 'funcionario')
        initialMapping[col] = 'name';
      else if (lowerCol === 'cpf' || lowerCol.includes('documento'))
        initialMapping[col] = 'cpf';
      else if (lowerCol === 'cargo' || lowerCol === 'funcao' || lowerCol === 'ocupacao')
        initialMapping[col] = 'role';
      else if (lowerCol === 'depto' || lowerCol === 'departamento' || lowerCol === 'setor' || lowerCol === 'unidade')
        initialMapping[col] = 'department';
      else if (lowerCol === 'regime' || lowerCol === 'tipo' || lowerCol === 'contratacao' || lowerCol === 'vinculo')
        initialMapping[col] = 'regime';
      else if (lowerCol === 'salario' || lowerCol === 'remuneracao' || lowerCol === 'vencimento' || lowerCol.includes('valor'))
        initialMapping[col] = 'salary';
      else if (lowerCol.includes('matricula'))
        initialMapping[col] = 'id';
      else if (lowerCol.includes('admissao') || lowerCol.includes('data adm') || lowerCol.includes('ingresso'))
        initialMapping[col] = 'admissionDate';
      else if (lowerCol.includes('nascimento') || lowerCol.includes('data nasc'))
        initialMapping[col] = 'birthDate';
    });
    setMapping(initialMapping);
  }, [columns]);

  const processedData = useMemo(() => {
    const mappingEntries = Object.entries(mapping) as [string, string][];
    const nameCol = mappingEntries.find(([, field]) => field === 'name')?.[0];
    const idCol = mappingEntries.find(([, field]) => field === 'id')?.[0];

    return data.map((row: any, index: number) => {
      const rowObj = row as Record<string, any>;
      const rawName = nameCol ? String(rowObj[nameCol] || 'Sem Nome') : 'Sem Nome';

      const emp: any = {
        id: idCol ? String(rowObj[idCol]) : `000${index + 100}`,
        status: 'Ativo',
        admissionDate: new Date().toLocaleDateString('pt-BR'),
        birthDate: '01/01/1990',
        avatar: rawName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        department: 'NÃO DEFINIDO',
        regime: 'Efetivo',
        salary: 0
      };

      mappingEntries.forEach(([col, field]) => {
        if (field) {
          let value = rowObj[col];
          if (field === 'salary') {
            if (typeof value === 'string') value = parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.'));
            if (isNaN(value)) value = 0;
          }
          if (field === 'name' || field === 'role') value = formatText(String(value || ''));
          if (field === 'department') value = String(value || 'NÃO DEFINIDO').toUpperCase();
          if (field === 'admissionDate' || field === 'birthDate') value = formatDateValue(value);
          if (field === 'regime') {
            const v = String(value || '').toLowerCase();
            if (v.includes('efetivo') || v === 'clt') value = 'Efetivo';
            else if (v.includes('comiss')) value = 'Comissionado';
            else if (v.includes('contrat')) value = 'Contratado';
            else if (v.includes('vereador')) value = 'Vereador';
            else value = 'Efetivo';
          }
          emp[field] = value;
        }
      });
      return emp as Employee;
    });
  }, [data, mapping]);

  const totalImpact = processedData.reduce((acc, curr) => acc + curr.salary, 0);
  const mappingProgress = Math.round((Object.keys(mapping).filter(k => !!mapping[k]).length / employeeFields.length) * 100);

  const getAvatarColor = (initials: string) => {
    const colors = [
      'bg-teal-100 text-teal-600',
      'bg-blue-100 text-blue-600',
      'bg-indigo-100 text-indigo-600',
      'bg-purple-100 text-purple-600'
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleConfirm = () => {
    onConfirm(processedData);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <div className="w-full max-w-[95vw] lg:max-w-7xl h-[90vh] bg-[#F4F7FE] rounded-[30px] shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center bg-white shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-5">
            <div className="size-12 rounded-2xl bg-[#E9EDF7] flex items-center justify-center text-[#111C44] border border-[#111C44]/20">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1B2559]">Análise de Dados</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Importação de Planilha</span>
                <span className="size-1.5 rounded-full bg-[#111C44]"></span>
                <span className="text-[#111C44] text-[10px] font-bold uppercase tracking-widest">{data.length} Registros Detectados</span>
              </div>
            </div>
          </div>

          <div className="flex bg-[#F4F7FE] p-1.5 rounded-full">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${viewMode === 'preview' ? 'btn-navy shadow-lg' : 'text-[#A3AED0] hover:text-[#1B2559]'
                }`}
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
              Pré-visualização
            </button>
            <button
              onClick={() => setViewMode('mapping')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${viewMode === 'mapping' ? 'btn-navy shadow-lg' : 'text-[#A3AED0] hover:text-[#1B2559]'
                }`}
            >
              <span className="material-symbols-outlined text-lg">alt_route</span>
              Mapeamento
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 relative">

          {viewMode === 'mapping' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar h-full pr-2 pb-2">
              {columns.map(col => (
                <div key={col} className={`relative bg-white p-4 rounded-2xl space-y-3 transition-all shadow-sm hover:shadow-md ${mapping[col] ? 'ring-2 ring-[#111C44]' : 'border border-gray-100 opacity-80'}`}>
                  {mapping[col] && <div className="absolute top-3 right-3 text-[#111C44]"><span className="material-symbols-outlined text-lg filled">check_circle</span></div>}
                  <div className="space-y-1 pr-6">
                    <p className="text-[#1B2559] font-bold text-sm truncate" title={col.toLowerCase()}>{col.toLowerCase()}</p>
                    <p className="text-[#A3AED0] text-[9px] font-bold uppercase tracking-widest">Coluna Detectada</p>
                  </div>
                  <select value={mapping[col] || ""} onChange={(e) => setMapping(prev => ({ ...prev, [col]: e.target.value }))} className="w-full bg-[#F4F7FE] border-none rounded-xl px-3 py-2.5 text-xs text-[#1B2559] font-bold appearance-none outline-none focus:ring-2 focus:ring-[#111C44]/20 cursor-pointer">
                    <option value="">Ignorar Coluna</option>
                    {employeeFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full bg-white rounded-[20px] overflow-hidden flex flex-col shadow-sm">
              <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm">
                    <tr>
                      <th className="pl-8 pr-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Matrícula</th>
                      <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Funcionário / CPF</th>
                      <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Cargo & Setor</th>
                      <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Regime</th>
                      <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Admissão</th>
                      <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Nascimento</th>
                      <th className="pl-4 pr-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-right">Salário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {processedData.map((emp, idx) => (
                      <tr key={idx} className="hover:bg-[#F4F7FE] transition-colors group">
                        <td className="pl-8 pr-4 py-3">
                          <div className="bg-[#F4F7FE] text-[#1B2559] font-bold text-[11px] px-3 py-1.5 rounded-md inline-block min-w-[60px] text-center">
                            {emp.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`size-9 rounded-full flex items-center justify-center font-bold text-[10px] ${getAvatarColor(emp.avatar)}`}>
                              {emp.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#1B2559] font-bold text-sm leading-tight">{emp.name}</span>
                              <span className="text-[10px] text-[#A3AED0] font-bold uppercase mt-0.5">{emp.cpf || '000.000.000-00'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[#1B2559] font-bold text-xs leading-tight">{emp.role}</span>
                            <span className="text-[#A3AED0] text-[9px] font-bold uppercase mt-0.5">{emp.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md ${emp.regime === 'Efetivo' ? 'text-[#00BFA5] bg-[#E0F7FA]' :
                            emp.regime === 'Comissionado' ? 'text-[#7C4DFF] bg-[#EDE7F6]' :
                              'text-[#FF4081] bg-[#FCE4EC]'
                            }`}>
                            {emp.regime}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#1B2559] font-bold text-[11px]">{emp.admissionDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#A3AED0] text-[11px] font-medium">{emp.birthDate}</span>
                        </td>
                        <td className="pl-4 pr-8 py-3 text-right">
                          <span className="text-[#05CD99] font-bold text-sm tracking-tight">
                            {formatCurrency(emp.salary)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white shrink-0 flex items-center justify-between border-t border-gray-50 z-20">
          <div className="flex items-center gap-12">
            <div className="space-y-0.5">
              <span className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Impacto Salarial Total</span>
              <h4 className="text-[#111C44] text-3xl font-bold tracking-tighter leading-none">
                {formatCurrency(totalImpact)}
              </h4>
            </div>
            <div className="space-y-0.5">
              <span className="text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Mapeamento Concluído</span>
              <h4 className="text-[#1B2559] text-3xl font-bold leading-none">
                {mappingProgress}%
              </h4>
            </div>
          </div>

          <div className="flex gap-8 items-center">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#111C44] hover:bg-gray-50 transition-colors uppercase tracking-wider"
            >
              Cancelar Operação
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-xl bg-[#283575] hover:bg-[#111C44] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#283575]/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Confirmar Importação de {data.length} Registros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportSpreadsheetModal;