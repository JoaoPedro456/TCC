import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, ClipboardList, ArrowUpRight, CheckCircle2, Calendar, X, Folder, Activity, PlusCircle, FileText, Clock } from 'lucide-react';
import { PessoaPage } from './PessoaPage';

export function DashboardPage({ setAbaAtiva }) {
  const [stats, setStats] = useState({
    clientes: 0, 
    funcionarios: 0, 
    faturamentoMes: 0, 
    osMes: 0,
    osConcluidasMes: 0,
    // --- Novos estados para o DIA DE HOJE ---
    ordensHojeTotal: 0,
    hojeAbertas: 0,
    hojeConcluidas: 0,
    hojeCanceladas: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [mesFormatado, setMesFormatado] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resPessoas, resOrdens, resDash] = await Promise.all([
          api.get('/pessoa'),
          api.get('/ordens'),
          api.get('/relatorios/dashboard'),
        ]);

        // 1. Pega a data de hoje formatada (YYYY-MM-DD) considerando o fuso local
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hoje = `${year}-${month}-${day}`;

        // 2. Filtra as Ordens criadas HOJE
        const ordensHoje = resOrdens.data.filter(o => o.dataRegisto === hoje);

        // 3. Formata o mês para o Português (Ex: "Abril de 2026")
        const nomeMes = d.toLocaleString('pt-BR', { month: 'long' });
        const textoMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' de ' + year;
        setMesFormatado(textoMes);

        // 4. Atualiza os estados
        setStats({
          clientes: resPessoas.data.filter(p => p.tipo === 'CLIENTE').length,
          funcionarios: resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO').length,
          faturamentoMes: resDash.data.faturamentoMes || 0,
          osMes: resDash.data.osMes || 0,
          osConcluidasMes: resDash.data.osConcluidasMes || 0,
          
          // Contadores de Hoje
          ordensHojeTotal: ordensHoje.length,
          hojeAbertas: ordensHoje.filter(o => o.status === 'ABERTA').length,
          hojeConcluidas: ordensHoje.filter(o => o.status === 'CONCLUIDA').length,
          hojeCanceladas: ordensHoje.filter(o => o.status === 'CANCELADA').length,
        });

      } catch (err) {
        console.error('Erro ao carregar dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <p className="text-slate-500 font-medium animate-pulse">Carregando seu espaço de trabalho...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Olá, Andressa <span className="animate-bounce origin-bottom inline-block">👋</span>
          </h2>
          <p className="text-slate-500 text-lg mt-2">
            Seu panorama de negócios em <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{mesFormatado}</span>
          </p>
        </div>
      </div>

      {/* Destaques Principais (Métricas do Mês Todo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Faturamento Atual"
          value={`R$ ${Number(stats.faturamentoMes || 0).toFixed(2)}`}
          icon={<Activity size={24} />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          label="OS Concluídas no Mês"
          value={stats.osConcluidasMes}
          icon={<CheckCircle2 size={24} />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          label="Total OS no Mês"
          value={stats.osMes}
          icon={<Folder size={24} />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
        <StatCard
          label="Clientes Ativos"
          value={stats.clientes}
          icon={<Users size={24} />}
          colorClass="text-sky-600"
          bgClass="bg-sky-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Coluna Principal - Esquerda (Agora é o Painel de HOJE) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* SUPER PAINEL: Resumo de Hoje */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            
            {/* Efeitos de Fundo Luminoso */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                    <Calendar size={24} className="text-blue-300" />
                  </div>
                  Resumo de Hoje
                </h3>
                <p className="text-slate-400 mt-2 text-sm">Acompanhamento em tempo real do dia</p>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-5xl font-black text-white">{stats.ordensHojeTotal}</p>
                <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mt-1">Total de OS Hoje</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
              {/* Card Interno: Abertas */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">Abertas Hoje</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.hojeAbertas}</p>
              </div>

              {/* Card Interno: Concluídas */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-md hover:bg-emerald-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Concluídas Hoje</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.hojeConcluidas}</p>
              </div>

              {/* Card Interno: Canceladas */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 backdrop-blur-md hover:bg-red-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <X size={14} className="text-red-400" />
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Canceladas Hoje</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats.hojeCanceladas}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Lateral - Direita (Ações) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Acesso Rápido
            </h3>
            <div className="flex flex-col gap-3">
              <QuickAction
                onClick={() => setAbaAtiva('os')}
                title="Ir para Ordens de Serviço"
                icon={<ClipboardList size={18} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <QuickAction
                onClick={() => setAbaAtiva('pessoas')}
                title="Gerenciar Clientes"
                icon={<Users size={18} />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <QuickAction
                onClick={() => setAbaAtiva('relatorios')}
                title="Acessar Relatórios"
                icon={<FileText size={18} />}
                color="text-purple-600"
                bg="bg-purple-50"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Componentes Menores ---

function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgClass} ${colorClass} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          {icon}
        </div>
        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors duration-300" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
        <p className="text-2xl md:text-3xl font-black text-slate-800 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ onClick, title, icon, color, bg }) {
  return (
    <button 
      onClick={onClick} 
      className="w-full text-left flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-200 group cursor-pointer"
    >
      <div className={`p-2.5 rounded-lg ${bg} ${color} group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors text-sm">{title}</h3>
      </div>
      <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform group-hover:translate-x-1 group-hover:-translate-y-1" />
    </button>
  );
}