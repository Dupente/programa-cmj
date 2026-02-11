import React from 'react';
import { AdjustmentEntry } from '../types';

interface AdjustmentHistoryProps {
  adjustments: AdjustmentEntry[];
  onNewAdjustment: () => void;
  onDelete: (id: string) => void;
  onEdit: (adj: AdjustmentEntry) => void;
}

const AdjustmentHistory: React.FC<AdjustmentHistoryProps> = ({ adjustments, onNewAdjustment, onDelete, onEdit }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }).format(val);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[#1B2559] text-3xl font-bold tracking-tight">Histórico de Reajustes</h2>
          <p className="text-[#A3AED0] text-sm font-medium">Visualize e gerencie todos os reajustes salariais aplicados cronologicamente.</p>
        </div>
        <button 
          onClick={onNewAdjustment}
          className="px-6 py-3 rounded-xl bg-[#283575] hover:bg-[#111C44] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#283575]/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Incluir Novo Reajuste</span>
        </button>
      </div>

      <div className="bg-white rounded-[20px] overflow-hidden shadow-[0px_3px_20px_rgba(112,144,176,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F7FE]/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Data</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Tipo / Valor</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest">Abrangência</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-right">Impacto Total</th>
                <th className="px-6 py-5 text-[#A3AED0] text-[10px] font-bold uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adjustments.length > 0 ? adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-[#F4F7FE] transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-[#1B2559] font-bold text-sm">{adj.date}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[#1B2559] font-bold text-sm tracking-tight">{adj.description}</span>
                      <div className="flex gap-1 mt-1">
                        {adj.regimes.map(r => (
                          <span key={r} className="text-[9px] font-bold uppercase tracking-tighter text-[#283575] bg-[#E9EDF7] px-1.5 py-0.5 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${adj.type === 'percentage' ? 'bg-[#05CD99]' : 'bg-[#111C44]'}`}></span>
                      <span className="text-[#1B2559] font-bold text-sm">
                        {adj.type === 'percentage' ? `${adj.value}%` : formatCurrency(adj.value)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[#1B2559] font-bold text-sm">{adj.affectedCount} funcionários</span>
                      <span className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-widest">Selecionados</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[#05CD99] font-bold text-base">{formatCurrency(adj.totalImpact)}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(adj)}
                        className="p-2 text-[#A3AED0] hover:text-[#283575] transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">edit_square</span>
                      </button>
                      <button 
                        onClick={() => onDelete(adj.id)}
                        className="p-2 text-[#A3AED0] hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center opacity-30">
                    <span className="material-symbols-outlined text-6xl mb-4 text-[#A3AED0]">history</span>
                    <p className="text-lg font-bold uppercase tracking-widest text-[#A3AED0]">Sem histórico de reajustes</p>
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

export default AdjustmentHistory;