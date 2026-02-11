
export enum Page {
  Dashboard = 'dashboard',
  Employees = 'employees',
  Vacation = 'vacation',
  Inventory = 'inventory',
  Anniversaries = 'anniversaries',
  Adjustments = 'adjustments',
  BaseSalaryCalculator = 'base-salary-calculator',
  Transportation = 'transportation'
}

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  cpf: string;
  role: string;
  regime: 'Efetivo' | 'Comissionado' | 'Contratado' | 'Vereador';
  admissionDate: string;
  birthDate: string;
  department: string;
  salary: number;
  unit?: string;
  birthdayDay?: number;
  status: 'Ativo' | 'Desligado';
  dismissalDate?: string;
  dismissalReason?: string;
  internalNotes?: string;
  // Vale Transporte
  vtEntitled?: boolean;
  vtDailyValue?: number;
  vtDays?: number; // Dias úteis personalizados para o funcionário
}

export interface Printer {
  id: string;
  name: string;
  ip: string;
  status: 'Online' | 'Offline' | 'Erro';
  supplies: {
    label: string;
    level: number;
    color?: string;
  };
  location: string;
  subLocation: string;
  // New fields for Counter Control
  model?: string;
  type?: 'PB' | 'Color';
  initialCounter?: number;
  readings?: PrinterReading[];
}

export interface PrinterReading {
  date: string; // ISO format YYYY-MM UTC? Or YYYY-MM-DD
  value: number;
}

export interface AdjustmentEntry {
  id: string;
  date: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  affectedCount: number;
  totalImpact: number;
  regimes: string[];
}