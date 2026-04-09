import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, Wrench, ClipboardList, TrendingUp, ArrowUpRight, AlertCircle, CheckCircle2, BarChart2 } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({
    clientes: 0, funcionarios: 0, ordensAbertas: 0, ordensHoje: 0, faturamentoMes: 0, osMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resPessoas, resOrdens, resDash] = await Promise.all([
          api.get('/pessoa'),
          api.get('/ordens'),
          api.get('/relatorios/dashboard'),
        ]);
        const hoje = new Date().toISOString().split('T')[0];
        setStats({
          clientes: resPessoas.data.filter(p => p.tipo === 'CLIENTE').length,
          funcionarios: resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO').length,
          ordensAbertas: resOrdens.data.filter(o => o.status === 'ABERTA' || o.status === 'EM_SERVICO').length,
          ordensHoje: resOrdens.data.filter(o => o.dataRegisto === hoje).length,
          faturamentoMes: resDash.data.faturamentoMes || 0,
          osMes: resDash.data.osMes || 0,
          mesRef: resDash.data.mesReferencia || '',
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
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[40px] font-bold text-slate-900 tracking-tight">Olá Andressa!</h2>
        <p className="text-slate-500 text-[18px] mt-1">Aqui esta o resumo da oficina hoje.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Clientes cadastrados"
          value={stats.clientes}
          icon={<Users size={20} />}
          color="from-blue-500 to-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Funcionarios ativos"
          value={stats.funcionarios}
          icon={<TrendingUp size={20} />}
          color="from-emerald-500 to-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          label="OS em aberto"
          value={stats.ordensAbertas}
          icon={<ClipboardList size={20} />}
          color="from-amber-500 to-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          label="Faturamento do mes"
          value={`R$ ${Number(stats.faturamentoMes || 0).toFixed(2)}`}
          icon={<Wrench size={20} />}
          color="from-blue-600 to-blue-700"
          bg="bg-blue-50"
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          to="/ordens"
          title="Nova Ordem de Serviço"
          desc="Registrar um novo atendimento"
          icon={<ClipboardList size={18} />}
        />
        <QuickAction
          to="/pessoas"
          title="Cadastrar Cliente"
          desc="Adicionar cliente ao sistema"
          icon={<Users size={18} />}
        />
        <QuickAction
          to="/relatorios"
          title="Ver Relatórios"
          desc="Comissoes e faturamento"
          icon={<BarChart2 size={18} />}
        />
      </div>

      {/* Proximas */}
      {stats.ordensHoje > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <h3 className="font-semibold text-slate-900 text-sm">{stats.ordensHoje} OS registrada(s) hoje</h3>
          </div>
          <p className="text-xs text-slate-400">Consulte a aba Ordens de Servico para mais detalhes.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${bg} text-white`}>
        <div className={color}>{icon}</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
          <ArrowUpRight size={14} className="text-slate-300" />
        </div>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, title, desc, icon }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition group block">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-[#0D1117] group-hover:text-[#3B82F6] transition">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <p className="text-xs text-slate-400">{desc}</p>
    </Link>
  );
}
