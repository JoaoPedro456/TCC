import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Wrench, TrendingUp, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({ clientes: 0, funcionarios: 0, servicos: 0 });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resPessoas, resServicos] = await Promise.all([
          api.get('/pessoa'),
          api.get('/servico')
        ]);
        
        setStats({
          clientes: resPessoas.data.filter(p => p.tipo === 'CLIENTE').length,
          funcionarios: resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO').length,
          servicos: resServicos.data.length
        });
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      }
    };
    carregarDados();
  }, []);

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">Visão Geral</h2>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Total Clientes" value={stats.clientes} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <Card title="Equipe Técnica" value={stats.funcionarios} icon={<TrendingUp className="text-green-600" />} color="bg-green-50" />
      </div>

      {/* Seção de Avisos Rápidos */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-500" /> Status do Sistema
        </h3>
        <p className="text-slate-600">
          O sistema está conectado ao banco de dados **PostgreSQL**. 
          Tudo pronto para iniciar as Ordens de Serviço!
        </p>
      </div>
    </div>
  );
}

// Sub-componente interno para os Cards (limpa o código)
function Card({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}
