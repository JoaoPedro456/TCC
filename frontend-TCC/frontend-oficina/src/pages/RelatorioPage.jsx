import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart2, Search, TrendingUp, DollarSign, ClipboardList, Users, Wrench } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
// Importações do Recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function RelatorioPage() {
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  });
  const [relatorio, setRelatorio] = useState(null);
  const [faturamento, setFaturamento] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('visao-geral');
  const { success, error } = useToast();

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
      console.error('Erro ao buscar relatorio', err);
      error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const totalGeral = relatorio
    ? relatorio.reduce((acc, r) => acc + Number(r.totalReceber || 0), 0)
    : 0;

  // Preparando os dados para o Gráfico (só executa se 'faturamento' existir)
  const dadosOS = faturamento ? [
    { name: 'Abertas', value: Number(faturamento.abertas || 0), color: '#F59E0B' },   // amber-500
    { name: 'Concluídas', value: Number(faturamento.concluidas || 0), color: '#10B981' }, // emerald-500
    { name: 'Canceladas', value: Number(faturamento.canceladas || 0), color: '#EF4444' }, // red-500
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Relatórios</h2>
        <p className="text-slate-500 text-sm mt-1">Comissões, faturamento e análises detalhadas</p>
      </div>

      {/* Filtro de periodo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
          <BarChart2 size={16} /> Selecionar Período
        </h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wide">Data Início</label>
            <input
              type="date"
              className="border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
              value={periodo.inicio}
              onChange={e => setPeriodo({ ...periodo, inicio: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wide">Data Fim</label>
            <input
              type="date"
              className="border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
              value={periodo.fim}
              onChange={e => setPeriodo({ ...periodo, fim: e.target.value })}
            />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50 text-sm"
          >
            {loading
              ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              : <Search size={16} />
            }
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Cards rapidos do dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <MiniCard icon={<DollarSign size={18} />} label="Faturamento Mês" value={`R$ ${Number(dashboard.faturamentoMes || 0).toFixed(2)}`} />
          <MiniCard icon={<ClipboardList size={18} />} label="OS no Mês" value={dashboard.osMes} />
          <MiniCard icon={<Users size={18} />} label="Clientes" value={dashboard.totalClientes} />
          <MiniCard icon={<Wrench size={18} />} label="Funcionários" value={dashboard.totalFuncionarios} />
        </div>
      )}

      {/* Abas */}
      {relatorio && (
        <div className="mb-5">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {[
              { key: 'visao-geral', label: 'Visão Geral' },
              { key: 'comissoes', label: 'Comissões' },
              { key: 'tabela', label: 'Tabela' },
            ].map(a => (
              <button
                key={a.key}
                onClick={() => setAba(a.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  aba === a.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ABA: Visao Geral */}
      {aba === 'visao-geral' && faturamento && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* GRÁFICO OS POR STATUS (Atualizado com Recharts) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">OS por Status</h3>
            <div className="h-64 w-full flex-1">
              {faturamento.quantidadeOS > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosOS}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dadosOS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} OS`, 'Quantidade']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Nenhuma OS encontrada neste período
                </div>
              )}
            </div>
          </div>

          {/* Faturamento */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">{faturamento.periodo}</h3>
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Faturamento Total</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  R$ {Number(faturamento.totalFaturado || 0).toFixed(2)}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{faturamento.quantidadeOS || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-black text-amber-600">{faturamento.abertas || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Abertas</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-black text-emerald-600">{faturamento.concluidas || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Concluídas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-black text-red-600">{faturamento.canceladas || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Canceladas</p>
                </div>
              </div>
              {totalGeral > 0 && (
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Comissões + Salários</p>
                  <p className="text-xl font-black text-white mt-1">R$ {totalGeral.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA: Tabela de comissoes */}
      {aba === 'tabela' && relatorio && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Funcionário</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Cargo</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Comissão %</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">OS</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Salário</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Comissão</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relatorio.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{r.funcionario}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{r.cargo || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{r.percentualComissao}%</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{r.quantidadeOS}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">R$ {Number(r.salarioBase || 0).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-blue-600">R$ {Number(r.totalComissao || 0).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-sm font-black text-green-600">R$ {Number(r.totalReceber || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA: Comissoes grafico (simplificado) */}
      {aba === 'comissoes' && relatorio && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Comissões por Funcionário</h3>
          <div className="space-y-3">
            {relatorio.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-32">
                  <p className="font-semibold text-slate-900 text-sm">{r.funcionario}</p>
                  <p className="text-xs text-slate-400">{r.cargo || '—'}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min((Number(r.totalReceber || 0) / (totalGeral || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <p className="font-black text-slate-900">R$ {Number(r.totalReceber || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{r.quantidadeOS} OS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
      <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">{icon}</div>
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}