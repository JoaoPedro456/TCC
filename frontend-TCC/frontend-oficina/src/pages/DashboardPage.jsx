import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Wrench, ClipboardList, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({
    clientes: 0, funcionarios: 0, ordensAbertas: 0, ordensHoje: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resPessoas, resOrdens] = await Promise.all([
          api.get('/pessoa'),
          api.get('/ordens')
        ]);
        const hoje = new Date().toISOString().split('T')[0];
        setStats({
          clientes: resPessoas.data.filter(p => p.tipo === 'CLIENTE').length,
          funcionarios: resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO').length,
          ordensAbertas: resOrdens.data.filter(o => o.status === 'ABERTA' || o.status === 'EM_SERVICO').length,
          ordensHoje: resOrdens.data.filter(o => o.dataRegisto === hoje).length,
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
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">Visão Geral</h2>
        <p className="text-slate-500 text-sm mt-1">Bem-vindo ao sistema da Bazani Mecânica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Clientes" value={stats.clientes} icon={<Users size={22} />} color="blue" />
        <Card title="Funcionários" value={stats.funcionarios} icon={<TrendingUp size={22} />} color="green" />
        <Card title="OS em Aberto" value={stats.ordensAbertas} icon={<Clock size={22} />} color="orange" />
        <Card title="OS Hoje" value={stats.ordensHoje} icon={<ClipboardList size={22} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-700">
            <CheckCircle size={20} className="text-green-500" /> Status do Sistema
          </h3>
          <div className="space-y-2">
            <StatusItem label="Banco de dados" ok />
            <StatusItem label="Backend Spring Boot" ok />
            <StatusItem label="Autenticação JWT" ok />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-700">
            <AlertCircle size={20} className="text-blue-500" /> Acesso Rápido
          </h3>
          <div className="space-y-2">
            <QuickLink href="/ordens" label="Nova Ordem de Serviço" icon={<ClipboardList size={16} />} />
            <QuickLink href="/pessoas" label="Cadastrar Cliente" icon={<Users size={16} />} />
            <QuickLink href="/relatorios" label="Ver Relatórios" icon={<TrendingUp size={16} />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatusItem({ label, ok }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {ok ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

function QuickLink({ href, label, icon }) {
  return (
    <a href={href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition text-sm font-medium">
      {icon} {label}
    </a>
  );
}