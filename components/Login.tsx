import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister?: (email: string, password: string, name?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password || isLoading) return;

    if (isRegisterMode) {
      if (!onRegister) return;
      if (password !== confirmPassword) {
        setLocalError('As senhas não conferem.');
        return;
      }
      await onRegister(email, password, name || undefined);
    } else {
      await onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex bg-background-light text-text-main">
      {/* Lateral esquerda com branding (desktop) */}
      <div className="hidden lg:flex w-[46%] xl:w-1/2 bg-gradient-to-b from-[#111C44] to-[#283575] text-white flex-col justify-between px-10 py-10 rounded-r-[40px] shadow-2xl">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg shadow-black/30">
              <span className="material-symbols-outlined text-4xl text-white">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/70">
                Câmara Municipal de Juatuba
              </span>
              <span className="text-xl font-extrabold tracking-tight leading-tight text-white">
                Sistema de Gestão de Recursos Humanos
              </span>
            </div>
          </div>

          <div className="mt-10 space-y-4 max-w-md">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              RH • Férias • Reajustes • Benefícios
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              Centralize o cadastro de servidores, acompanhe férias, controle de vale transporte
              e histórico de reajustes salariais em um único painel moderno.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-[11px] text-white/70">
          <p className="font-semibold tracking-[0.2em] uppercase">
            Gestão segura e integrada para o Legislativo Municipal
          </p>
          <p className="text-white/50">
            Desenvolvido para o setor de Recursos Humanos da Câmara Municipal, com foco em controle,
            rastreabilidade e praticidade no dia a dia.
          </p>
        </div>
      </div>

      {/* Área do formulário */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-card border border-slate-100 px-7 py-8 space-y-6">
          {/* Cabeçalho do cartão */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-background-light px-3 py-1 border border-slate-200">
              <span className="material-symbols-outlined text-[18px] text-brand">shield_person</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Acesso RH • Câmara Municipal
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-extrabold tracking-tight text-text-main">
                {isRegisterMode ? 'Criar usuário do sistema' : 'Entrar no sistema RH'}
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                {isRegisterMode
                  ? 'Informe os dados abaixo para criar um usuário autorizado e acessar o painel de gestão.'
                  : 'Acesse com seu e-mail institucional e senha para gerenciar colaboradores e rotinas de RH.'}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Nome do usuário
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl bg-background-light border border-slate-200 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand/80 transition-shadow"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                E-mail institucional
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  mail
                </span>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-light border border-slate-200 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand/80 transition-shadow"
                  placeholder="seu.email@cmj.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  lock
                </span>
                <input
                  type="password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-light border border-slate-200 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand/80 transition-shadow"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Confirmar senha
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    lock
                  </span>
                  <input
                    type="password"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-light border border-slate-200 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/70 focus:border-brand/80 transition-shadow"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            )}

            {(localError || error) && (
              <div className="rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-xs text-red-600">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg shadow-brand/30 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">
                {isRegisterMode ? 'person_add' : 'login'}
              </span>
              {isLoading
                ? isRegisterMode ? 'Criando usuário...' : 'Entrando...'
                : isRegisterMode ? 'Criar usuário do sistema' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-center">
            <button
              type="button"
              className="w-full text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary hover:text-text-main transition-colors"
              onClick={() => {
                setLocalError(null);
                setIsRegisterMode((prev) => !prev);
              }}
            >
              {isRegisterMode
                ? 'Já tenho usuário - voltar para login'
                : 'Não tenho usuário - criar acesso ao sistema'}
            </button>

            <p className="text-[10px] text-text-secondary leading-relaxed">
              Acesso restrito ao setor de Recursos Humanos da Câmara Municipal.
              Em caso de dúvidas sobre login ou criação de usuário, contate o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

