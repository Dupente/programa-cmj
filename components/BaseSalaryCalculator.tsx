import React, { useState, useMemo, useEffect, useRef } from 'react';

const INITIAL_INCREASE_DATA = [
  { year: 2014, percentage: 3.18 },
  { year: 2015, percentage: 7.00 },
  { year: 2016, percentage: 10.00 },
  { year: 2017, percentage: 10.00 },
  { year: 2018, percentage: 4.00 },
  { year: 2019, percentage: 4.50 },
  { year: 2020, percentage: 8.19 },
  { year: 2021, percentage: 4.56 },
  { year: 2022, percentage: 10.59 },
  { year: 2023, percentage: 5.93 },
  { year: 2024, percentage: 6.97 },
  { year: 2025, percentage: 4.77 },
  { year: 2026, percentage: 5.00 }, // Added based on screenshot
];

const BaseSalaryCalculator: React.FC = () => {
  const currentYear = 2025;
  const [base2013Input, setBase2013Input] = useState<string>('');
  const [increaseData, setIncreaseData] = useState<{ year: number; percentage: number }[]>(() => {
    const saved = localStorage.getItem('rh_base_salary_increases');
    return saved ? JSON.parse(saved) : INITIAL_INCREASE_DATA;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newYear, setNewYear] = useState<string>('');
  const [newPercentage, setNewPercentage] = useState<string>('');
  
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('rh_base_salary_increases', JSON.stringify(increaseData));
  }, [increaseData]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const maxYear = useMemo(() => {
    if (increaseData.length === 0) return currentYear;
    return Math.max(...increaseData.map(d => d.year));
  }, [increaseData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }).format(val);
  };

  const handleAddYear = () => {
    const year = parseInt(newYear);
    const percentage = parseFloat(newPercentage);

    if (isNaN(year) || isNaN(percentage)) return;

    if (increaseData.some(item => item.year === year)) {
      alert("Ano já existente.");
      return;
    }

    const updatedData = [...increaseData, { year, percentage }].sort((a, b) => a.year - b.year);
    setIncreaseData(updatedData);
    setIsAdding(false);
    setNewYear('');
    setNewPercentage('');
  };

  const handleRemoveYear = (year: number) => {
    if (year <= currentYear) return; // Lock check
    if (confirm(`Remover ano ${year}?`)) {
      setIncreaseData(prev => prev.filter(item => item.year !== year));
    }
  };

  const handleStartEdit = (year: number, currentPercentage: number) => {
    if (year <= currentYear) return;
    setEditingYear(year);
    setEditValue(currentPercentage.toString());
  };

  const handleSaveEdit = () => {
    if (editingYear === null) return;
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      setIncreaseData(prev => prev.map(item => 
        item.year === editingYear ? { ...item, percentage: val } : item
      ));
    }
    setEditingYear(null);
  };

  const calculatedHistory = useMemo(() => {
    const baseValue = parseFloat(base2013Input) || 0;
    let currentSalary = baseValue;
    const history = [{ year: 2013, percentage: 0, salary: baseValue, increaseValue: 0 }];

    increaseData.forEach((item) => {
      const increaseValue = currentSalary * (item.percentage / 100);
      currentSalary += increaseValue;
      history.push({
        year: item.year,
        percentage: item.percentage,
        salary: currentSalary,
        increaseValue
      });
    });

    return history;
  }, [base2013Input, increaseData]);

  const base2013Numeric = parseFloat(base2013Input) || 0;
  const lastYearEntry = calculatedHistory[calculatedHistory.length - 1];
  const finalSalary = lastYearEntry.salary;
  const totalPercentageGain = base2013Numeric > 0 
    ? ((finalSalary - base2013Numeric) / base2013Numeric) * 100 
    : 0;

  return (
    <div className="px-8 pb-8 pt-0 animate-in fade-in duration-700">
      
      {/* Title Area (Hidden visually if Header covers it, but keeping structure) */}
      <div className="mb-4 hidden">
        <h2 className="text-3xl font-bold text-[#1B2559]">Cálculo Base</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Card: Input & Summary */}
        <div className="bg-white rounded-[20px] p-8 shadow-[0px_3px_20px_rgba(112,144,176,0.08)] flex flex-col h-fit">
          
          {/* Input Section */}
          <div className="mb-10">
            <label className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest mb-3 block">
              Salário Base Inicial (Janeiro/2013)
            </label>
            <div className="bg-[#F4F7FE] rounded-2xl px-5 py-4 flex items-center">
              <span className="text-[#283575] font-bold text-lg mr-3">R$</span>
              <input 
                ref={inputRef}
                type="number" 
                value={base2013Input} 
                onChange={(e) => setBase2013Input(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent border-none text-2xl font-bold text-[#1B2559] placeholder:text-[#A3AED0]/50 outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="space-y-5 mb-10 border-t border-gray-50 pt-8">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Salário em {lastYearEntry.year}</span>
              <span className="text-[#283575] font-bold text-xl">{formatCurrency(finalSalary)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Ganho Acumulado</span>
              <span className="text-[#283575] font-bold text-xl">+{totalPercentageGain.toFixed(2)}%</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[#E9EDF7] rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#283575] text-sm filled">info</span>
              <span className="text-[#283575] text-[10px] font-bold uppercase tracking-widest">Regra de Segurança</span>
            </div>
            <p className="text-[#A3AED0] text-[11px] font-medium leading-relaxed">
              Anos históricos (anteriores a {currentYear}) e anos consolidados estão bloqueados para edição direta.
            </p>
          </div>

          {/* Reset Action */}
          <button 
            onClick={() => {
               if(confirm("Restaurar histórico padrão?")) setIncreaseData(INITIAL_INCREASE_DATA);
            }}
            className="w-full text-center text-[#A3AED0] hover:text-[#283575] text-[10px] font-bold uppercase tracking-widest transition-colors py-2"
          >
            Restaurar Histórico Original
          </button>
        </div>

        {/* Right Card: Table */}
        <div className="lg:col-span-2 bg-white rounded-[20px] p-8 shadow-[0px_3px_20px_rgba(112,144,176,0.08)] flex flex-col min-h-[600px]">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[#1B2559] font-bold text-[11px] uppercase tracking-widest">Evolução de Salário por Ano</h3>
            <button 
              onClick={() => {
                if (!isAdding) {
                  setNewYear(String(maxYear + 1));
                }
                setIsAdding(!isAdding);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-[16px] text-sm font-bold transition-all hover:scale-105 ${
                isAdding 
                  ? 'bg-gray-100 text-[#A3AED0] hover:bg-gray-200 hover:text-[#1B2559]' 
                  : 'btn-navy'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{isAdding ? 'close' : 'add'}</span>
              {isAdding ? 'Cancelar' : 'Projetar Ano'}
            </button>
          </div>

          {isAdding && (
            <div className="mb-6 p-4 bg-[#F4F7FE] rounded-2xl grid grid-cols-3 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A3AED0] uppercase">Ano</label>
                <input 
                  type="number" 
                  value={newYear} 
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="2027"
                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-[#1B2559] outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A3AED0] uppercase">Reajuste %</label>
                <input 
                  type="number" 
                  value={newPercentage} 
                  onChange={(e) => setNewPercentage(e.target.value)}
                  placeholder="5.00"
                  className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-[#1B2559] outline-none" 
                />
              </div>
              <button 
                onClick={handleAddYear}
                className="bg-[#283575] text-white rounded-lg font-bold uppercase text-[10px] tracking-widest h-[38px] mt-auto shadow-lg shadow-[#283575]/20 hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Ano</th>
                  <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Porcentagem</th>
                  <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0]">Vlr. Aumento</th>
                  <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#A3AED0] text-right">Novo Salário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {calculatedHistory.map((row) => {
                  const isLocked = row.year <= currentYear;
                  const isBase = row.year === 2013;

                  return (
                    <tr key={row.year} className="group hover:bg-[#F4F7FE]/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${row.year > currentYear ? 'text-[#283575]' : 'text-[#A3AED0]'}`}>
                            {row.year}
                          </span>
                          {isLocked && !isBase && (
                            <span className="material-symbols-outlined text-[#A3AED0]/40 text-[14px]">lock</span>
                          )}
                          {!isLocked && (
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleStartEdit(row.year, row.percentage)} className="text-[#A3AED0] hover:text-[#283575]"><span className="material-symbols-outlined text-[14px]">edit</span></button>
                               <button onClick={() => handleRemoveYear(row.year)} className="text-[#A3AED0] hover:text-red-500"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                             </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {isBase ? (
                          <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">Base Inicial</span>
                        ) : editingYear === row.year ? (
                           <div className="flex items-center gap-2">
                             <input 
                               autoFocus
                               type="number" 
                               value={editValue} 
                               onChange={(e) => setEditValue(e.target.value)}
                               className="w-16 bg-white border border-[#283575] rounded px-2 py-1 text-xs font-bold outline-none"
                             />
                             <button onClick={handleSaveEdit} className="text-[#283575]"><span className="material-symbols-outlined text-base">check</span></button>
                             <button onClick={() => setEditingYear(null)} className="text-red-400"><span className="material-symbols-outlined text-base">close</span></button>
                           </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#283575]">trending_up</span>
                            <span className="text-[#283575] font-bold text-xs">{row.percentage.toFixed(2)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-[#A3AED0] text-xs font-bold">
                          {isBase ? '—' : `+ ${formatCurrency(row.increaseValue)}`}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`text-sm font-bold tracking-tight ${row.year > currentYear ? 'text-[#1B2559]' : 'text-[#A3AED0]'}`}>
                          {formatCurrency(row.salary)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BaseSalaryCalculator;