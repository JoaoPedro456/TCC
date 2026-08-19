import { useState, useEffect } from 'react';
import { formatarMoeda } from '../utils/formatters';
import api from '../services/api';
import { Search, Calendar, DollarSign, ClipboardList, Users, Wrench, Download, ArrowUpRight, BarChart2, CheckCircle2, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Componente para Formatação de Moeda Customizada no Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800">
        <p className="text-sm font-semibold mb-1">{label || payload[0].name}</p>
        <p className="text-emerald-400 font-bold">
          R$ {formatarMoeda(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function RelatorioPage() {
  // Helper dates
  const getPrimeiroDiaMesAtual = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };
  const getHoje = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [periodo, setPeriodo] = useState({
    inicio: getPrimeiroDiaMesAtual(),
    fim: getHoje(),
  });
  
  const [filtroRapido, setFiltroRapido] = useState('esteMes');
  const [relatorio, setRelatorio] = useState(null);
  const [faturamento, setFaturamento] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('visao-geral');
  const { success, error } = useToast();

  const aplicarFiltroRapido = (filtro) => {
    setFiltroRapido(filtro);
    const hoje = new Date();
    let inicio, fim;
    
    fim = hoje.toISOString().split('T')[0];

    if (filtro === 'esteMes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    } else if (filtro === 'mesPassado') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0];
    } else if (filtro === 'ultimos30') {
      const trintaDias = new Date();
      trintaDias.setDate(hoje.getDate() - 30);
      inicio = trintaDias.toISOString().split('T')[0];
    } else if (filtro === 'ultimos7') {
      const seteDias = new Date();
      seteDias.setDate(hoje.getDate() - 7);
      inicio = seteDias.toISOString().split('T')[0];
    }
    setPeriodo({ inicio, fim });
  };

  const buscar = async () => {
    setLoading(true);
    try {
      const [resFuncionarios, resFaturamento, resDashboard] = await Promise.all([
        api.get(`/relatorios/funcionarios?inicio=${periodo.inicio}&fim=${periodo.fim}`),
        api.get(`/relatorios/faturamento?inicio=${periodo.inicio}&fim=${periodo.fim}`),
        api.get('/relatorios/dashboard'),
      ]);
      setRelatorio(resFuncionarios.data);
      setFaturamento(resFaturamento.data);
      setDashboard(resDashboard.data);
      success('Relatório gerado com sucesso!');
    } catch (err) {
      error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (type, value) => {
    setPeriodo({ ...periodo, [type]: value });
    setFiltroRapido('');
  };

  const dadosOS = faturamento ? [
    { name: 'Abertas', value: Number(faturamento.abertas || 0), color: '#3b82f6' },   // blue-500
    { name: 'Concluídas', value: Number(faturamento.concluidas || 0), color: '#10b981' }, // emerald-500
    { name: 'Canceladas', value: Number(faturamento.canceladas || 0), color: '#ef4444' }, // red-500
  ].filter(d => d.value > 0) : []; // Esconde fatias zeradas

  const dadosComissao = relatorio ? relatorio.map(r => ({
    nome: r.nome.split(' ')[0], // Pega apenas primeiro nome para o grafico ficar limpo
    comissao: Number(r.totalComissao || 0),
    os: r.quantidadeOS
  })).sort((a,b) => b.comissao - a.comissao) : [];

  return (
    <div className="max-w-7xl mx-auto pb-10 bg-slate-50/30 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Gerais</h2>
          <p className="text-slate-500 mt-1">Métricas de faturamento e performance da equipe</p>
        </div>
      </div>

      {/* Barra de Filtros Premium */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Botões Rápidos */}
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
            {[
              { id: 'esteMes', label: 'Este Mês' },
              { id: 'mesPassado', label: 'Mês Passado' },
              { id: 'ultimos30', label: '30 Dias' },
              { id: 'ultimos7', label: '7 Dias' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => aplicarFiltroRapido(f.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  filtroRapido === f.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

          {/* Seletores Nativos */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
              <Calendar size={14} className="text-slate-400 mr-2" />
              <input 
                type="date" 
                className="bg-transparent text-sm text-slate-700 outline-none"
                value={periodo.inicio}
                onChange={e => handleDateChange('inicio', e.target.value)}
              />
            </div>
            <span className="text-slate-400 text-sm">até</span>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
              <Calendar size={14} className="text-slate-400 mr-2" />
              <input 
                type="date" 
                className="bg-transparent text-sm text-slate-700 outline-none"
                value={periodo.fim}
                onChange={e => handleDateChange('fim', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={buscar}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 whitespace-nowrap shadow-sm"
        >
          {loading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Search size={16} />
          )}
          Processar Dados
        </button>
      </div>

      {/* KPI Cards */}
      {faturamento && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard 
            title="Faturamento do Período" 
            value={`R$ ${formatarMoeda(faturamento.totalFaturado || 0)}`}
            icon={<DollarSign size={20} />} 
            color="emerald" 
          />
          <KpiCard 
            title="OS Concluídas" 
            value={faturamento.concluidas || 0}
            icon={<CheckCircle2 size={20} />} 
            color="blue" 
          />
          <KpiCard 
            title="OS Abertas / Pendentes" 
            value={faturamento.abertas || 0}
            icon={<ClipboardList size={20} />} 
            color="amber" 
          />
          <KpiCard 
            title="OS Canceladas" 
            value={faturamento.canceladas || 0}
            icon={<X size={20} />} 
            color="red" 
          />
        </div>
      )}

      {/* Abas */}
      {relatorio && (
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-6">
            {[
              { key: 'visao-geral', label: 'Métricas e Gráficos' },
              { key: 'tabela', label: 'Fechamento de Comissões' },
            ].map(a => (
              <button
                key={a.key}
                onClick={() => setAba(a.key)}
                className={`pb-4 text-sm font-bold transition-colors relative ${
                  aba === a.key 
                    ? 'text-blue-600' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {a.label}
                {aba === a.key && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Visão Geral */}
      {aba === 'visao-geral' && faturamento && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
          
          {/* Gráfico de Barras: Performance da Equipe */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Users size={18} className="text-purple-500" /> Top Comissões (Performance)
            </h3>
            <div className="h-[300px] w-full">
              {dadosComissao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosComissao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="comissao" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                  Sem dados de comissão no período.
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Rosca: Status */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-500" /> Distribuição de Serviços
            </h3>
            <div className="h-[300px] w-full flex flex-col">
              {dadosOS.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosOS}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {dadosOS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} OS`, 'Quantidade']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                  Nenhuma OS processada no período.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ABA: Tabela Fechamento */}
      {aba === 'tabela' && relatorio && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h3 className="font-bold text-slate-800 text-lg">Acerto Financeiro da Equipe</h3>
             <button className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
               <Download size={16} /> Exportar Relatório
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mecânico / Funcionário</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">OS Feitas</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Salário Base</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Comissões</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right bg-emerald-50/50">Valor Final a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relatorio.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Nenhum funcionário com produção neste período.</td>
                  </tr>
                ) : (
                  relatorio.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{r.nome}</p>
                        <p className="text-xs text-slate-500 font-medium">{r.cargo || 'Mecânico'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                          {r.quantidadeOS} serviços
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium text-right">
                        R$ {formatarMoeda(r.salarioBase || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right">
                        + R$ {formatarMoeda(r.totalComissao || 0)}
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">({r.percentualComissao}% de repasse)</span>
                      </td>
                      <td className="px-6 py-4 text-right bg-emerald-50/30">
                        <span className="text-lg font-black text-emerald-600">
                          R$ {formatarMoeda(r.totalReceber || 0)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Subcomponente KPI ---
function KpiCard({ title, value, icon, color, iconOverride }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };
  const ringColors = {
    emerald: 'ring-emerald-500/20',
    blue: 'ring-blue-500/20',
    amber: 'ring-amber-500/20',
    red: 'ring-red-500/20',
  };

  return (
    <div className={`bg-white rounded-2xl border ${colors[color].split(' ')[2]} p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colors[color].split(' ')[0]} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center mb-4 ring-4 ${ringColors[color]}`}>
          {iconOverride || icon}
        </div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}