
import { Employee, Printer, AdjustmentEntry } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '#008291',
    name: 'João Silva',
    avatar: 'JS',
    cpf: '123.456.789-00',
    role: 'Senior Developer',
    regime: 'Efetivo',
    admissionDate: '01/02/2021',
    birthDate: '15/05/1988',
    department: 'Engenharia de Software',
    salary: 12500,
    status: 'Ativo'
  },
  {
    id: '#001',
    name: 'Carlos Alberto',
    avatar: 'CA',
    cpf: '123.456.789-00',
    role: 'Analista Sênior',
    regime: 'Efetivo',
    admissionDate: '12/05/2015',
    birthDate: '14/02/1985',
    department: 'TI',
    salary: 8500,
    status: 'Ativo'
  },
  {
    id: '#002',
    name: 'Maria Souza',
    avatar: 'MS',
    cpf: '987.654.321-11',
    role: 'Assessora Legislativa',
    regime: 'Comissionado',
    admissionDate: '20/01/2023',
    birthDate: '30/11/1990',
    department: 'Gabinete',
    salary: 12500,
    status: 'Ativo'
  },
  {
    id: '#005',
    name: 'Ricardo Almeida (Ex-Servidor)',
    avatar: 'RA',
    cpf: '555.444.333-22',
    role: 'Técnico Administrativo',
    regime: 'Contratado',
    admissionDate: '10/03/2018',
    dismissalDate: '15/11/2023',
    dismissalReason: 'Término de Contrato',
    birthDate: '12/09/1982',
    department: 'Administração',
    salary: 4200,
    status: 'Desligado'
  },
  {
    id: '#003',
    name: 'João Pereira',
    avatar: 'JP',
    cpf: '456.789.123-22',
    role: 'Gerente de Projetos',
    regime: 'Contratado',
    admissionDate: '15/06/2022',
    birthDate: '05/05/1982',
    department: 'Projetos',
    salary: 9200,
    status: 'Ativo'
  },
  {
    id: '#004',
    name: 'Ana Lúcia',
    avatar: 'AL',
    cpf: '321.654.987-33',
    role: 'Vereadora',
    regime: 'Vereador',
    admissionDate: '01/01/2021',
    birthDate: '22/07/1975',
    department: 'Câmara',
    salary: 15000,
    status: 'Ativo'
  }
];

export const MOCK_PRINTERS: Printer[] = [
  {
    id: 'p1',
    name: 'HP LaserJet Enterprise',
    ip: '192.168.1.15',
    status: 'Online',
    supplies: { label: 'Preto (K)', level: 82 },
    location: 'Sede - 2º Andar',
    subLocation: 'Sala 204 (RH)'
  },
  {
    id: 'p2',
    name: 'Canon ImageRunner',
    ip: '192.168.1.22',
    status: 'Erro',
    supplies: { label: 'Manutenção Kit', level: 12 },
    location: 'Filial Norte',
    subLocation: 'Recepção'
  },
  {
    id: 'p3',
    name: 'Epson EcoTank Pro',
    ip: '192.168.1.48',
    status: 'Online',
    supplies: { label: 'Colorida', level: 35, color: '#eab308' },
    location: 'Sede - 1º Andar',
    subLocation: 'Depto Design'
  }
];

export const MOCK_ADJUSTMENTS: AdjustmentEntry[] = [
  {
    id: 'adj-001',
    date: '10/01/2024',
    description: 'Reajuste Inflacionário Anual',
    type: 'percentage',
    value: 4.5,
    affectedCount: 142,
    totalImpact: 45200.50,
    regimes: ['Efetivo', 'Comissionado']
  },
  {
    id: 'adj-002',
    date: '15/03/2024',
    description: 'Ajuste Piso Categoria TI',
    type: 'fixed',
    value: 850.00,
    affectedCount: 12,
    totalImpact: 10200.00,
    regimes: ['Efetivo', 'Contratado']
  }
];
