import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, DollarSign, Printer, Search, TrendingUp } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';

export function ComissaoPage() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtro, setFiltro] = useState({ funcionarioId: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    api.get('/pessoa').then(res => setFuncionarios(res.data.filter(p => p.tipo === 'FUNCIONARIO')));
  }, []);

  const buscarComissoes = async () => {
    if (!filtro.funcionarioId) return error('Selecione um funcionário');
    setLoading(true);

    try {
      const ultimoDia = new Date(filtro.ano, filtro.mes, 0).getDate();
      const inicio = `${filtro.ano}-${String(filtro.mes).padStart(2, '0')}-01`;
      const fim = `${filtro.ano}-${String(filtro.mes).padStart(2, '0')}-${ultimoDia}`;
      
      // 1. Vai buscar o funcionário selecionado diretamente à lista de cadastros
      const funcSelecionado = funcionarios.find(f => f.id === Number(filtro.funcionarioId));
      const salario = Number(funcSelecionado?.salarioBase || 0);
      const res = await api.get(`/relatorios/comissao-resumo?funcionarioId=${filtro.funcionarioId}&inicio=${inicio}&fim=${fim}`);

      const comissao = Number(res.data.totalComissao || 0);
      
      // 3. Atualiza a tela
      setDados({ 
        salarioBase: salario, 
        totalComissao: comissao, 
        totalReceber: salario + comissao 
      });
      
    } catch {
      error('Erro ao buscar dados do servidor');
    } finally { 
      setLoading(false); 
    }
  };

  const baixarPdf = async () => {
    try {
      const ultimoDia = new Date(filtro.ano, filtro.mes, 0).getDate();
      
      const inicio = `${filtro.ano}-${String(filtro.mes).padStart(2, '0')}-01`;
      const fim = `${filtro.ano}-${String(filtro.mes).padStart(2, '0')}-${ultimoDia}`;
      
      const res = await api.get(`/relatorios/comissao-detalhada?funcionarioId=${filtro.funcionarioId}&inicio=${inicio}&fim=${fim}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Comissao_${filtro.funcionarioId}_${filtro.mes}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { 
      error('Erro ao gerar PDF das comissões'); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Comissões</h2>
        {dados && (
          <button onClick={baixarPdf} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
            <Printer size={18} /> Imprimir Demonstrativo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Funcionário</label>
          <select 
            className="w-full border border-slate-200 p-2.5 rounded-lg outline-none focus:border-blue-500 transition bg-white"
            value={filtro.funcionarioId}
            onChange={e => setFiltro({...filtro, funcionarioId: e.target.value})}
          >
            <option value="">Selecione...</option>
            {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} - {f.cargo}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mês</label>
          <select 
            className="w-full border border-slate-200 p-2.5 rounded-lg outline-none transition bg-white"
            value={filtro.mes}
            onChange={e => setFiltro({...filtro, mes: e.target.value})}
          >
            {[
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ].map((nomeMes, index) => (
              <option key={index + 1} value={index + 1}>
                {nomeMes}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Ano</label>
          <select 
            className="w-full border border-slate-200 p-2.5 rounded-lg outline-none transition bg-white"
            value={filtro.ano}
            onChange={e => setFiltro({...filtro, ano: Number(e.target.value)})}
          >
            {[...Array(5)].map((_, i) => {
              const anoSelect = new Date().getFullYear() - 2 + i;
              return <option key={anoSelect} value={anoSelect}>{anoSelect}</option>;
            })}
          </select>
        </div>
        <button onClick={buscarComissoes} disabled={loading} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2">
          {loading ? 'Calculando...' : <><Search size={18} /> Calcular</>}
        </button>
      </div>

      {/* Resultado */}
      {dados && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardResumo label="Salário Fixo" valor={dados.salarioBase} icon={<DollarSign className="text-slate-400" />} />
          <CardResumo label="Comissões do Mês" valor={dados.totalComissao} icon={<TrendingUp className="text-emerald-500" />} color="text-emerald-600" />
          <CardResumo label="Total a Pagar" valor={dados.totalReceber} icon={<Users className="text-blue-500" />} color="text-blue-600" highlight />
        </div>
      )}
    </div>
  );
}

function CardResumo({ label, valor, icon, color = "text-slate-900", highlight = false }) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'} shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-black ${color}`}>R$ {Number(valor).toFixed(2)}</p>
    </div>
  );
}
