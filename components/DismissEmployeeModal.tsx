import React, { useState, useEffect } from 'react';
import { Employee } from '../types';

interface DismissEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onConfirm: (data: { date: string; reason: string; notes: string }) => void;
}

const DismissEmployeeModal: React.FC<DismissEmployeeModalProps> = ({ employee, onClose, onConfirm }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Get today's date in YYYY-MM-DD format for the input
  const today = new Date().toISOString().split('T')[0];

  const [lastDay, setLastDay] = useState(today);
  const [reason, setReason] = useState('Término de Contrato');
  const [notes, setNotes] = useState('');

  // Calculate "Time at house" for visual fidelity
  const calculateTenure = () => {
    try {
      const [day, month, year] = employee.admissionDate.split('/').map(Number);
      const start = new Date(year, month - 1, day);
      const end = new Date();
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();

      if (days < 0) {
        months--;
        days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      return `${years} anos, ${months} meses e ${days} dias`;
    } catch {
      return '3 anos, 2 meses e 14 dias';
    }
  };

  const handleConfirm = () => {
    if (!lastDay || !reason) {
      alert("Por favor, preencha a data e o motivo do desligamento.");
      return;
    }
    onConfirm({ date: lastDay, reason, notes });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <div className="w-full max-w-[850px] bg-white rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-red-50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-xl filled">person_remove</span>
            </div>
            <h2 className="text-xl font-bold text-[#1B2559] tracking-tight">Desligamento de Colaborador</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#A3AED0] hover:text-[#1B2559]"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row min-h-[480px]">
          {/* Left Column: Profile Card */}
          <div className="flex-1 p-10 flex flex-col items-center border-r border-gray-100 bg-[#F4F7FE]">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#1B2559] rounded-full blur-xl opacity-10 translate-y-2"></div>
              <div className="size-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center text-4xl font-bold text-[#1B2559] relative z-10 overflow-hidden">
                {employee.avatar ? employee.avatar : <span className="material-symbols-outlined text-5xl text-[#A3AED0]">person</span>}
              </div>
            </div>

            <div className="text-center space-y-2 mb-10">
              <h3 className="text-2xl font-bold text-[#1B2559] tracking-tight">{employee.name}</h3>
              <div className="inline-flex px-3 py-1 bg-white border border-red-100 rounded-full shadow-sm">
                <p className="text-red-500 text-[10px] font-bold tracking-widest uppercase">ID: {employee.id}</p>
              </div>
            </div>

            <div className="w-full space-y-6 pt-6 border-t border-gray-200/50">
              <div>
                <p className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest mb-1">Cargo</p>
                <p className="text-[#1B2559] font-bold text-base">{employee.role}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest mb-1">Departamento</p>
                <p className="text-[#1B2559] font-bold text-base">{employee.department}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest mb-1">Tempo de Casa</p>
                <p className="text-[#1B2559] font-bold text-base">{calculateTenure()}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="flex-1 p-10 space-y-8 bg-white">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#A3AED0] tracking-widest uppercase ml-1">Data do Último Dia</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A3AED0] group-focus-within:text-red-500 transition-colors">calendar_month</span>
                <input
                  type="date"
                  value={lastDay}
                  onChange={(e) => setLastDay(e.target.value)}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl pl-12 pr-4 py-4 text-sm text-[#1B2559] font-bold focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#A3AED0] tracking-widest uppercase ml-1">Motivo do Desligamento</label>
              <div className="relative group">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-sm text-[#1B2559] font-bold focus:ring-2 focus:ring-red-500/20 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="Pedido de Demissão">Pedido de Demissão</option>
                  <option value="Demissão sem Justa Causa">Demissão sem Justa Causa</option>
                  <option value="Demissão por Justa Causa">Demissão por Justa Causa</option>
                  <option value="Término de Contrato">Término de Contrato</option>
                  <option value="Acordo">Acordo</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#A3AED0] pointer-events-none text-xl group-focus-within:text-red-500 transition-colors">unfold_more</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#A3AED0] tracking-widest uppercase ml-1">Observações Internas</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas ou justificativas adicionais para o registro interno..."
                className="w-full bg-[#F4F7FE] border-none rounded-2xl px-5 py-4 text-sm text-[#1B2559] font-bold focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-[#A3AED0]/50 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-white border-t border-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#1B2559] hover:bg-gray-50 transition-colors uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined filled text-lg">check_circle</span>
            Confirmar Desligamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default DismissEmployeeModal;