import { useState } from 'react';
import api from '../services/api';
import { BarChart2, Search, TrendingUp, DollarSign, ClipboardList, User } from 'lucide-react';

export function RelatorioPage() {
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  });
  const [relatorio, setRelatorio] = useState(null);
  const [faturamento, setFaturamento] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    try {
      const [resFuncionarios, resFaturamento] = await Promise.all([
        api.get(`/relatorios/funcionarios?inicio=${periodo.inicio}&fim=${periodo.fim}`),
        api.get(`/relatorios/faturamento?inicio=${periodo.inicio}&fim=${periodo.fim}`),
      ]);
      setRelatorio(resFuncionarios.data);
      setFaturamento(resFaturamento.data);
    } catch (err) {
      console.error('Erro ao buscar relatório', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">Relatórios</h2>
        <p className="text-slate-500 text-sm mt-1">Comissões e faturamento por período</p>
      </div>

      {/* Filtro de período */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart2 size={18} /> Selecionar Período
        </h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2">Data Início</label>
            <input
              type="date"
              className="border border-slate-200 p-3 rounded-xl outline-blue-500"
              value={periodo.inicio}
              onChange={e => setPeriodo({ ...periodo, inicio: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2">Data Fim</label>
            <input
              type="date"
              className="border border-slate-200 p-3 rounded-xl outline-blue-500"
              value={periodo.fim}
              onChange={e => setPeriodo({ ...periodo, fim: e.target.value })}
            />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {loading
              ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              : <Search size={18} />
            }
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Faturamento */}
      {faturamento && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Faturamento Total</p>
              <p className="text-3xl font-black text-green-600">
                R$ {Number(faturamento.totalFaturado || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total de OS no período</p>
              <p className="text-3xl font-black text-blue-600">{faturamento.quantidadeOS}</p>
            </div>
          </div>
        </div>
      )}

      {/* Relatório por funcionário */}
      {relatorio && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
            <TrendingUp size={20} /> Comissões por Funcionário
          </h3>
          {relatorio.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <User size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Nenhum funcionário com OS no período</p>
            </div>
          )}
          {relatorio.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h4 className="font-black text-xl text-slate-800">{r.funcionario}</h4>
                  <p className="text-slate-500 text-sm">{r.cargo} — {r.percentualComissao}% de comissão</p>
                  <p className="text-slate-400 text-sm mt-1">{r.quantidadeOS} OS realizadas no período</p>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium">Salário Base</p>
                      <p className="font-bold text-slate-700">R$ {Number(r.salarioBase || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium">Comissão</p>
                      <p className="font-bold text-blue-600">R$ {Number(r.totalComissao || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium">Total a Receber</p>
                      <p className="font-black text-green-600 text-lg">R$ {Number(r.totalReceber || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}