import React, { useEffect } from 'react';
import { Employee } from '../types';

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
  isNew?: boolean;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, onClose, onSave, isNew = false }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Ensure fields are initialized to avoid uncontrolled input issues
  const [formData, setFormData] = React.useState<Employee>({ 
    ...employee,
    vtEntitled: employee.vtEntitled ?? false,
    vtDailyValue: employee.vtDailyValue ?? 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSave(formData);
        }
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white">
          <div>
            <h2 className="text-2xl font-bold text-[#1B2559] tracking-tight">
              {isNew ? 'Novo Colaborador' : 'Editar Dados do Funcionário'}
            </h2>
            <p className="text-[#A3AED0] text-sm mt-1 font-medium">
              {isNew ? 'Preencha os dados para cadastro.' : 'Atualize as informações do cadastro institucional.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#A3AED0] hover:text-[#1B2559]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">

          {/* Section: Info Pessoal */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#111C44] rounded-full"></div>
              <h3 className="text-[#1B2559] font-bold text-lg">Info Pessoal</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Nome Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Data de Nascimento</label>
                <div className="relative group">
                  <input
                    type="text"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                    placeholder="DD/MM/AAAA"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#111C44] transition-colors">calendar_month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Info Profissional */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#111C44] rounded-full"></div>
              <h3 className="text-[#1B2559] font-bold text-lg">Info Profissional</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Matrícula</label>
                <input
                  type="text"
                  name="id"
                  disabled={!isNew}
                  value={formData.id}
                  onChange={handleChange}
                  className={`w-full border-none rounded-2xl px-5 py-4 font-bold outline-none transition-all ${!isNew ? 'bg-gray-100 text-[#A3AED0] cursor-not-allowed' : 'bg-[#F4F7FE] text-[#1B2559] focus:ring-2 focus:ring-[#111C44]/20'}`}
                  placeholder={isNew ? "Gerado ou Manual" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Cargo</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                  placeholder="Ex: Analista Administrativo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Data de Admissão</label>
                <div className="relative group">
                  <input
                    type="text"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                    placeholder="DD/MM/AAAA"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-[#111C44] transition-colors">calendar_month</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Regime</label>
                <div className="relative group">
                  <select
                    name="regime"
                    value={formData.regime}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="Efetivo">Efetivo</option>
                    <option value="Comissionado">Comissionado</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Vereador">Vereador</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#A3AED0] pointer-events-none group-focus-within:text-[#111C44] transition-colors">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#A3AED0] tracking-widest pl-1">Departamento / Setor</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-[#1B2559] font-bold focus:ring-2 focus:ring-[#111C44]/20 transition-all outline-none placeholder:text-[#A3AED0]/50"
                placeholder="Ex: Tecnologia da Informação"
              />
            </div>
          </div>

          {/* Section: Benefícios */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#111C44] rounded-full"></div>
              <h3 className="text-[#1B2559] font-bold text-lg">Benefícios</h3>
            </div>
            
            <div className="bg-[#F4F7FE] p-4 rounded-2xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-xl text-[#283575] shadow-sm">
                   <span className="material-symbols-outlined filled">commute</span>
                 </div>
                 <div>
                   <p className="text-[#1B2559] font-bold text-sm">Vale Transporte</p>
                   <p className="text-[#A3AED0] text-[10px] font-bold uppercase">Direito ao benefício</p>
                 </div>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input 
                   type="checkbox" 
                   name="vtEntitled"
                   checked={formData.vtEntitled || false}
                   onChange={handleCheckboxChange}
                   className="sr-only peer" 
                 />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#283575]"></div>
               </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#111C44] hover:bg-gray-50 transition-colors uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-3 rounded-xl bg-[#283575] hover:bg-[#111C44] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#283575]/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isNew ? 'Criar Registro' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;