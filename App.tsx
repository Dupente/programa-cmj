import React, { useState, useRef, useEffect } from 'react';
import { Page, Employee, Printer, AdjustmentEntry } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import Inventory from './components/Inventory';
import AnniversaryCalendar from './components/AnniversaryCalendar';
import AdjustmentHistory from './components/AdjustmentHistory';
import SalaryAdjustmentModal from './components/SalaryAdjustmentModal';
import VacationManagement from './components/VacationManagement';
import BaseSalaryCalculator from './components/BaseSalaryCalculator';
import TransportationVoucher from './components/TransportationVoucher';
import ToastNotification, { NotificationType } from './components/ToastNotification';
import SecurityModal from './components/SecurityModal';
import { supabase } from './lib/supabaseClient';

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Sim, Continuar" }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[30px] shadow-2xl p-8 space-y-6">
        <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <span className="material-symbols-outlined text-red-500 text-3xl filled">warning</span>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-text-main tracking-tight">{title}</h3>
          <p className="text-text-secondary text-sm font-medium">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">{confirmLabel}</button>
          <button onClick={onClose} className="w-full px-6 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-[#1B2559] hover:bg-gray-50 transition-colors uppercase tracking-wider">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentEntry[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const [notification, setNotification] = useState<{ show: boolean; message: string; type: NotificationType }>({
    show: false, message: '', type: 'success'
  });

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<AdjustmentEntry | null>(null);
  const [adjustmentToDelete, setAdjustmentToDelete] = useState<AdjustmentEntry | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingSecurityAction, setPendingSecurityAction] = useState<(() => void) | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('PWA installed');
    });
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const showToast = (message: string, type: NotificationType = 'success') => {
    setNotification({ show: true, message, type });
  };
  const closeToast = () => setNotification(prev => ({ ...prev, show: false }));

  const requestSecurityCheck = (action: () => void) => {
    setPendingSecurityAction(() => action);
    setIsSecurityModalOpen(true);
  };
  const handleSecurityConfirm = () => {
    setIsSecurityModalOpen(false);
    if (pendingSecurityAction) { pendingSecurityAction(); setPendingSecurityAction(null); }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data: empData, error: empError } = await supabase.from('employees').select('*');
      if (empError) throw empError;
      const { data: printData, error: printError } = await supabase.from('printers').select('*');
      if (printError) throw printError;
      const { data: adjData, error: adjError } = await supabase.from('adjustments').select('*').order('created_at', { ascending: false });
      if (adjError) throw adjError;

      if (empData) setEmployees(empData.map((emp: any) => ({ 
        ...emp, 
        salary: Number(emp.salary),
        // Garantir tipos corretos para as novas colunas
        vtEntitled: Boolean(emp.vtEntitled),
        vtDailyValue: Number(emp.vtDailyValue || 0),
        vtDays: emp.vtDays ? Number(emp.vtDays) : undefined
      })));
      else setEmployees([]);
      
      if (printData) setPrinters(printData); else setPrinters([]);
      if (adjData) setAdjustments(adjData.map((adj: any) => ({ ...adj, value: Number(adj.value), totalImpact: Number(adj.totalImpact) }))); else setAdjustments([]);

      setIsOnline(true);
    } catch (error) {
      console.error('Erro ao conectar Supabase:', error);
      setIsOnline(false);
      if (showLoading) showToast('Erro de conexão com o banco.', 'error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    const sync = async () => {
      if (isFirstRender.current) { await fetchData(true); isFirstRender.current = false; }
      else { await fetchData(false); }
    };
    sync();
  }, [currentPage]);

  const handleAddEmployee = async (emp: Employee) => {
    showToast('Gravando registro...', 'loading');
    try {
      const { error } = await supabase.from('employees').insert([emp]);
      if (error) throw error;
      await fetchData(false);
      showToast('Funcionário gravado com sucesso!', 'success');
    } catch (error: any) {
      showToast(`Erro ao gravar: ${error.message}`, 'error');
    }
  };

  const handleUpdateEmployee = async (emp: Employee) => {
    showToast('Atualizando registro...', 'loading');
    try {
      // Garantir que não estamos enviando undefined
      const cleanEmp = {
        ...emp,
        vtEntitled: emp.vtEntitled ?? false,
        vtDailyValue: emp.vtDailyValue ?? 0,
        // Se vtDays for undefined, enviamos null para limpar o campo no banco
        vtDays: emp.vtDays !== undefined ? emp.vtDays : null
      };
      const { error } = await supabase.from('employees').update(cleanEmp).eq('id', emp.id);
      if (error) throw error;
      await fetchData(false);
      showToast('Dados atualizados com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar funcionário.', 'error');
    }
  };

  const handleAddPrinter = async (printer: Printer) => {
    showToast('Gravando impressora...', 'loading');
    try {
      const { error } = await supabase.from('printers').insert([printer]);
      if (error) throw error;
      await fetchData(false);
      showToast('Impressora cadastrada!', 'success');
    } catch (error: any) {
      showToast('Erro ao cadastrar impressora.', 'error');
    }
  };

  const handleUpdatePrinter = async (printer: Printer) => {
    try {
      const { currentRating, previousRating, usage, ...cleanPrinter } = printer as any;
      const { error } = await supabase.from('printers').update(cleanPrinter).eq('id', cleanPrinter.id);
      if (error) throw error;
      await fetchData(false);
      showToast('Dados salvos!', 'success');
    } catch (error: any) {
      console.error('Update Error:', error);
      showToast(`Erro ao atualizar: ${error.message || 'Desconhecido'}`, 'error');
    }
  };

  const handleDeletePrinter = async (id: string) => {
    try {
      const { error } = await supabase.from('printers').delete().eq('id', id);
      if (error) throw error;
      await fetchData(false);
      await fetchData(false);
      showToast('Impressora removida!', 'success');
    } catch (error) {
      showToast('Erro ao remover.', 'error');
    }
  };

  const handleBulkUpdatePrinters = async (printersToUpdate: Printer[]) => {
    showToast('Salvando leituras em massa...', 'loading');
    try {
      const { error } = await supabase.from('printers').upsert(printersToUpdate);
      if (error) throw error;
      await fetchData(false);
      showToast(`${printersToUpdate.length} leituras salvas!`, 'success');
    } catch (error: any) {
      showToast(`Erro ao salvar: ${error.message}`, 'error');
    }
  };

  const handleBulkImport = async (newEmployees: Employee[]) => {
    showToast('Processando importação...', 'loading');
    try {
      const uniqueEmployees = Array.from(new Map(newEmployees.map(item => [item.id, item])).values());
      const { error } = await supabase.from('employees').upsert(uniqueEmployees, { onConflict: 'id' });
      if (error) throw error;
      await fetchData(false);
      showToast(`${uniqueEmployees.length} registros processados!`, 'success');
    } catch (error: any) {
      showToast(`Erro na importação: ${error.message}`, 'error');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    showToast('Removendo registro...', 'loading');
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      await fetchData(false);
      showToast('Funcionário excluído.', 'success');
    } catch (error) {
      showToast('Erro ao excluir registro.', 'error');
    }
  };

  const executeClearData = async () => {
    setIsClearModalOpen(false);
    showToast('Limpando dados...', 'loading');
    try {
      await supabase.from('employees').delete().neq('id', 'x');
      await supabase.from('printers').delete().neq('id', 'x');
      await supabase.from('adjustments').delete().neq('id', 'x');
      setEmployees([]); setPrinters([]); setAdjustments([]);
      localStorage.removeItem('rh_vacation_schedules_v2');
      showToast('Banco de dados limpo com sucesso!', 'success');
    } catch (error: any) {
      showToast(`Erro ao limpar: ${error.message}`, 'error');
    }
  };

  const handleBackupData = async () => {
    showToast('Gerando backup...', 'loading');
    try {
      const { data: dbEmployees } = await supabase.from('employees').select('*');
      const { data: dbPrinters } = await supabase.from('printers').select('*');
      const { data: dbAdjustments } = await supabase.from('adjustments').select('*');
      const dataToBackup = {
        employees: dbEmployees || employees,
        printers: dbPrinters || printers,
        adjustments: dbAdjustments || adjustments,
        vacationSchedules: JSON.parse(localStorage.getItem('rh_vacation_schedules_v2') || '{}'),
        backupDate: new Date().toISOString(),
        source: 'supabase_production_v2_public'
      };
      const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `backup_rh_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      showToast('Backup gerado!', 'success');
    } catch (error) {
      showToast('Falha ao gerar backup.', 'error');
    }
  };

  const executeImportBackup = async () => {
    setIsImportModalOpen(false);
    if (pendingImportData) {
      showToast('Restaurando backup...', 'loading');
      try {
        if (pendingImportData.employees?.length) await supabase.from('employees').upsert(pendingImportData.employees);
        if (pendingImportData.printers?.length) await supabase.from('printers').upsert(pendingImportData.printers);
        if (pendingImportData.adjustments?.length) await supabase.from('adjustments').upsert(pendingImportData.adjustments);
        if (pendingImportData.vacationSchedules) localStorage.setItem('rh_vacation_schedules_v2', JSON.stringify(pendingImportData.vacationSchedules));
        await fetchData(false);
        showToast('Backup restaurado com sucesso!', 'success');
      } catch (e: any) {
        showToast(`Erro na restauração: ${e.message}`, 'error');
      }
    }
    setPendingImportData(null);
  };

  const handleSyncData = async () => {
    showToast('Sincronizando...', 'loading');
    await fetchData(false);
    if (isOnline) showToast('Sincronização concluída!', 'success');
    else showToast('Falha na conexão.', 'error');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.employees || json.printers) { setPendingImportData(json); setIsImportModalOpen(true); }
        else { showToast('Arquivo inválido.', 'error'); }
      } catch (err) { showToast('Arquivo corrompido.', 'error'); }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const executeDeleteAdjustment = async () => {
    if (adjustmentToDelete) {
      showToast('Calculando e revertendo salários...', 'loading');
      try {
        const affectedEmployees = employees.filter(emp => adjustmentToDelete.regimes.includes(emp.regime) && emp.status === 'Ativo');
        if (affectedEmployees.length > 0) {
          const updates = affectedEmployees.map(emp => {
            let previousSalary = emp.salary;
            if (adjustmentToDelete.type === 'fixed') previousSalary = emp.salary - adjustmentToDelete.value;
            else { const factor = 1 + (adjustmentToDelete.value / 100); previousSalary = emp.salary / factor; }
            previousSalary = Math.max(0, Math.round(previousSalary * 100) / 100);
            return { ...emp, salary: previousSalary };
          });
          const { error: updateError } = await supabase.from('employees').upsert(updates);
          if (updateError) throw updateError;
        }
        const { error } = await supabase.from('adjustments').delete().eq('id', adjustmentToDelete.id);
        if (error) throw error;
        setAdjustments(prev => prev.filter(a => a.id !== adjustmentToDelete.id));
        setAdjustmentToDelete(null);
        await fetchData(false);
        showToast(`Reversão concluída!`, 'success');
      } catch (e: any) {
        showToast(`Erro ao reverter: ${e.message}`, 'error');
      }
    }
  };

  const handleEditAdjustment = (adj: AdjustmentEntry) => { setEditingAdjustment(adj); setIsAdjustmentModalOpen(true); };

  const handleConfirmNewAdjustment = async (data: any) => {
    if (data.selectedEmployeeIds && data.selectedEmployeeIds.length > 0) {
      showToast(`Aplicando reajuste...`, 'loading');
      try {
        const updates = employees.filter(emp => data.selectedEmployeeIds.includes(emp.id)).map(emp => {
          let newSalary = emp.salary;
          if (data.type === 'percentage') newSalary = emp.salary * (1 + data.value / 100);
          else newSalary = emp.salary + data.value;
          return { ...emp, salary: Math.round(newSalary * 100) / 100 };
        });
        const { error: empError } = await supabase.from('employees').upsert(updates);
        if (empError) throw empError;
        const adjustmentRecord = {
          id: data.id || `adj-${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          description: data.description,
          type: data.type,
          value: data.value,
          affectedCount: data.affected,
          totalImpact: data.impact,
          regimes: data.regimes
        };
        const { error: adjError } = await supabase.from('adjustments').upsert(adjustmentRecord);
        if (adjError) throw adjError;
        await fetchData(false);
        showToast('Reajuste aplicado!', 'success');
      } catch (e) { showToast('Erro ao processar reajuste.', 'error'); }
    }
    setIsAdjustmentModalOpen(false);
    setEditingAdjustment(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center min-h-[600px]">
          <div className="flex flex-col items-center gap-6">
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm font-bold">Carregando...</p>
          </div>
        </div>
      );
    }
    switch (currentPage) {
      case Page.Dashboard: return <Dashboard employees={employees} onPageChange={setCurrentPage} />;
      case Page.Employees: return <EmployeeList employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} onImport={handleBulkImport} />;
      case Page.Vacation: return <VacationManagement employees={employees} onNotification={showToast} />;
      case Page.Inventory: return <Inventory printers={printers} onAdd={handleAddPrinter} onUpdate={handleUpdatePrinter} onDelete={handleDeletePrinter} onBulkUpdate={handleBulkUpdatePrinters} />;
      case Page.Adjustments: return <AdjustmentHistory adjustments={adjustments} onNewAdjustment={() => { setEditingAdjustment(null); setIsAdjustmentModalOpen(true); }} onDelete={(id) => { const adj = adjustments.find(a => a.id === id); if (adj) setAdjustmentToDelete(adj); }} onEdit={handleEditAdjustment} />;
      case Page.Anniversaries: return <AnniversaryCalendar employees={employees} />;
      case Page.BaseSalaryCalculator: return <BaseSalaryCalculator />;
      case Page.Transportation: return <TransportationVoucher employees={employees} onUpdateEmployee={handleUpdateEmployee} onNotification={showToast} />;
      default: return <Dashboard employees={employees} onPageChange={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case Page.Dashboard: return 'Painel de Gestão';
      case Page.Employees: return 'Gestão de Pessoas';
      case Page.Vacation: return 'Controle de Férias';
      case Page.Inventory: return 'Inventário TI';
      case Page.Anniversaries: return 'Calendário';
      case Page.Adjustments: return 'Histórico Salarial';
      case Page.BaseSalaryCalculator: return 'Projeção Salarial';
      case Page.Transportation: return 'Vale Transporte';
      default: return 'RH Gestão';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-text-main font-sans selection:bg-brand/20">
      <ToastNotification show={notification.show} message={notification.message} type={notification.type} onClose={closeToast} />
      <SecurityModal isOpen={isSecurityModalOpen} onClose={() => { setIsSecurityModalOpen(false); setPendingSecurityAction(null); }} onConfirm={handleSecurityConfirm} />
      <input type="file" ref={backupFileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />

      <ConfirmationModal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} onConfirm={() => requestSecurityCheck(executeClearData)} title="Limpar Dados?" message="Esta ação apagará todos os registros." confirmLabel="Limpar Tudo" />
      <ConfirmationModal isOpen={isImportModalOpen} onClose={() => { setIsImportModalOpen(false); setPendingImportData(null); }} onConfirm={() => requestSecurityCheck(executeImportBackup)} title="Restaurar Backup?" message="Substituirá os dados atuais." confirmLabel="Restaurar" />
      <ConfirmationModal isOpen={!!adjustmentToDelete} onClose={() => setAdjustmentToDelete(null)} onConfirm={() => requestSecurityCheck(executeDeleteAdjustment)} title="Reverter Reajuste?" message="Isso recalculará os salários anteriores." confirmLabel="Reverter" />

      <SalaryAdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => { setIsAdjustmentModalOpen(false); setEditingAdjustment(null); }} employees={employees} onConfirm={handleConfirmNewAdjustment} editingAdjustment={editingAdjustment} />

      <Sidebar
        currentPage={currentPage}
        onPageChange={(page) => { setCurrentPage(page); setIsSidebarOpen(false); }}
        onClearData={() => setIsClearModalOpen(true)}
        onSync={handleSyncData}
        onBackup={handleBackupData}
        onImportBackup={() => backupFileInputRef.current?.click()}
        isOnline={isOnline}
        onInstall={handleInstallApp}
        canInstall={!!deferredPrompt}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative print:h-auto overflow-hidden">
        <Header title={getPageTitle()} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 print:p-0 print:overflow-visible">
          <div className="max-w-[1800px] mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;