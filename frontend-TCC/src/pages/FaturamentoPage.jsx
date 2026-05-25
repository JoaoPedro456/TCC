import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Clock, AlertCircle, Trash2, X, Search, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider.jsx';

export function FaturamentoPage() {
  const [abaAtiva, setAbaAtiva] = useState('RECEBER'); 
  const [loading, setLoading] = useState(false);
  
  // --- NOVOS ESTADOS PARA FILTRO E PAGINAÇÃO ---
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS'); // TODOS, PENDENTE, PAGO, ATRASADO
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  
  const [selecionados, setSelecionados] = useState([]);
  // ---------------------------------------------

  const [modalAberto, setModalAberto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formInicial = { descricao: '', envolvido: '', valor: '', vencimento: '', tipo: 'RECEBER', status: 'PENDENTE' };
  const [form, setForm] = useState(formInicial);

  const { success, error } = useToast();

  const [contas, setContas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [resumoFinanceiro, setResumoFinanceiro] = useState({ totalReceberPendente: 0, totalPagarPendente: 0, saldoAtual: 0 });

  const carregarResumo = async () => {
    try {
      const res = await api.get('/financeiro/resumo');
      setResumoFinanceiro(res.data);
    } catch (err) {
      console.error("Erro ao carregar resumo", err);
    }
  };

  const carregarContas = async () => {
    setLoading(true);
    try {
      const params = {
        page: paginaAtual - 1,
        size: itensPorPagina,
        busca: busca || undefined,
        status: filtroStatus !== 'TODOS' ? filtroStatus : undefined
      };
      
      const endpoint = abaAtiva === 'RECEBER' ? '/financeiro/receber' : '/financeiro/pagar';
      const res = await api.get(endpoint, { params });
      
      setContas(res.data.content || []);
      setTotalPaginas(res.data.totalPages || 1);
      setTotalElementos(res.data.totalElements || 0);
    } catch (err) {
      error("Erro ao carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  const recarregarTudo = () => {
    carregarContas();
    carregarResumo();
  };

  // Carrega resumo inicial
  useEffect(() => {
    carregarResumo();
  }, []);

  // Carrega contas quando mudam os filtros ou a página
  useEffect(() => {
    carregarContas();
  }, [abaAtiva, busca, filtroStatus, paginaAtual]);

  // Toda vez que mudarmos a aba, a busca ou o status, voltamos para a página 1
  useEffect(() => {
    setPaginaAtual(1);
    setSelecionados([]); // Limpa a seleção ao mudar filtros
  }, [abaAtiva, busca, filtroStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, valor: parseFloat(form.valor) };
      await api.post('/financeiro', payload);
      success('Lançamento registrado!');
      setModalAberto(false);
      setForm(formInicial);
      recarregarTudo(); 
    } catch (err) {
      error('Erro ao registrar lançamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/financeiro/${id}/status?status=${novoStatus}`);
      success('Status atualizado!');
      recarregarTudo();
    } catch (err) {
      error('Erro ao atualizar o status.');
    }
  };

  const excluirLancamento = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/financeiro/${id}`);
      success('Lançamento excluído!');
      recarregarTudo();
    } catch (err) {
      error('Erro ao excluir.');
    }
  };

  const darBaixaEmLote = async () => {
    try {
      setLoading(true);
      await api.put('/financeiro/status-lote?status=PAGO', selecionados);
      success(`${selecionados.length} contas marcadas como pagas com sucesso!`);
      setSelecionados([]);
      recarregarTudo();
    } catch (err) {
      error('Erro ao dar baixa em lote.');
      setLoading(false);
    }
  };

  const toggleSelecao = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelecionarTodos = () => {
    if (selecionados.length === contasPaginadas.length && contasPaginadas.length > 0) {
      setSelecionados([]);
    } else {
      setSelecionados(contasPaginadas.map(c => c.id));
    }
  };

  const formatarMoeda = (valor) => `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
  const formatarData = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // ==========================================
  // LÓGICA DE FILTRAGEM E PAGINAÇÃO
  // ==========================================
  
  const contasPaginadas = contas;
  const indexPrimeiroItem = (paginaAtual - 1) * itensPorPagina;
  const indexUltimoItem = indexPrimeiroItem + contas.length;
  const totalSelecionado = contasPaginadas.filter(c => selecionados.includes(c.id)).reduce((acc, curr) => acc + curr.valor, 0);

  // ==========================================

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Financeiro
          </h2>
          <p className="text-slate-500 mt-1">Gestão de contas a pagar e a receber.</p>
        </div>
        <button 
          onClick={() => { setForm({ ...formInicial, tipo: abaAtiva }); setModalAberto(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <ResumoCard titulo="A Receber (Pendente)" valor={formatarMoeda(resumoFinanceiro.totalReceberPendente)} icone={<ArrowUpCircle size={24} />} cor="text-emerald-600" bg="bg-emerald-50" />
        <ResumoCard titulo="A Pagar (Pendente)" valor={formatarMoeda(resumoFinanceiro.totalPagarPendente)} icone={<ArrowDownCircle size={24} />} cor="text-red-600" bg="bg-red-50" />
        <ResumoCard titulo="Saldo Atual (Em Caixa)" valor={formatarMoeda(resumoFinanceiro.saldoAtual)} icone={<DollarSign size={24} />} cor={resumoFinanceiro.saldoAtual >= 0 ? "text-blue-600" : "text-red-600"} bg={resumoFinanceiro.saldoAtual >= 0 ? "bg-blue-50" : "bg-red-50"} />
      </div>

      {/* Área Principal - Listagem */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Controles de Aba */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button 
            onClick={() => { setAbaAtiva('RECEBER'); setFiltroStatus('TODOS'); setBusca(''); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${abaAtiva === 'RECEBER' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowUpCircle size={18} /> Contas a Receber
          </button>
          <button 
            onClick={() => { setAbaAtiva('PAGAR'); setFiltroStatus('TODOS'); setBusca(''); }}
            className={`flex-1 py-4 text-center font-semibold transition-colors flex items-center justify-center gap-2 ${abaAtiva === 'PAGAR' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowDownCircle size={18} /> Contas a Pagar
          </button>
        </div>

        {/* --- NOVA BARRA DE FILTROS --- */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por descrição ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {['TODOS', 'PENDENTE', 'PAGO', 'ATRASADO'].map(status => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  filtroStatus === status 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status === 'TODOS' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase() + 's'}
              </button>
            ))}
          </div>
        </div>
        {/* ----------------------------- */}

        {/* Tabela de Dados */}
        <div className="p-0 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full" />
              <p className="text-slate-500 font-medium">Carregando lançamentos...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={toggleSelecionarTodos} 
                      checked={contasPaginadas.length > 0 && selecionados.length === contasPaginadas.length} 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                  </th>
                  <th className="p-4 font-bold">Descrição</th>
                  <th className="p-4 font-bold">Envolvido</th>
                  <th className="p-4 font-bold">Vencimento</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Valor</th>
                  <th className="p-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contasPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400">
                      Nenhum lançamento encontrado para estes filtros.
                    </td>
                  </tr>
                ) : (
                  contasPaginadas.map((conta) => (
                    <tr key={conta.id} className={`hover:bg-slate-50 transition-colors group ${selecionados.includes(conta.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selecionados.includes(conta.id)} 
                          onChange={() => toggleSelecao(conta.id)} 
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        />
                      </td>
                      <td className="p-4 text-slate-900 font-medium">{conta.descricao}</td>
                      <td className="p-4 text-slate-600 text-sm">{conta.envolvido}</td>
                      <td className="p-4 text-slate-600 text-sm">{formatarData(conta.vencimento)}</td>
                      <td className="p-4">
                        <select 
                          value={conta.status} 
                          onChange={(e) => atualizarStatus(conta.id, e.target.value)}
                          className={`text-xs font-bold rounded-full px-2.5 py-1 cursor-pointer outline-none transition-colors border ${
                            conta.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                            conta.status === 'ATRASADO' ? 'bg-red-100 text-red-700 border-red-200' : 
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="PENDENTE">⏳ Pendente</option>
                          <option value="PAGO">✅ Pago</option>
                          <option value="ATRASADO">⚠️ Atrasado</option>
                        </select>
                      </td>
                      <td className={`p-4 text-right font-black ${abaAtiva === 'RECEBER' ? 'text-emerald-600' : 'text-red-600'} ${conta.status === 'PAGO' ? 'opacity-50 line-through decoration-2' : ''}`}>
                        {formatarMoeda(conta.valor)}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => excluirLancamento(conta.id)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Excluir Lançamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* --- CONTROLES DE PAGINAÇÃO --- */}
        {!loading && totalPaginas > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-900">{contasPaginadas.length > 0 ? indexPrimeiroItem + 1 : 0}</span> a <span className="font-semibold text-slate-900">{indexUltimoItem}</span> de <span className="font-semibold text-slate-900">{totalElementos}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numeroDaPagina => (
                  <button
                    key={numeroDaPagina}
                    onClick={() => setPaginaAtual(numeroDaPagina)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      paginaAtual === numeroDaPagina 
                        ? 'bg-blue-600 text-white' 
                        : 'border border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {numeroDaPagina}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        {/* ----------------------------- */}

      </div>

      {/* --- BARRA FLUTUANTE DE AÇÃO EM LOTE --- */}
      {selecionados.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-[slideIn_0.3s_ease-out_forwards]">
          <div className="flex flex-col">
            <span className="text-sm text-slate-300">{selecionados.length} conta(s) selecionada(s)</span>
            <span className="text-lg font-black tracking-tight">{formatarMoeda(totalSelecionado)}</span>
          </div>
          <div className="w-px h-10 bg-slate-700"></div>
          <button 
            onClick={darBaixaEmLote} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <CheckCircle size={18} /> Dar Baixa
          </button>
        </div>
      )}
      {/* --------------------------------------- */}

      {/* Modal Novo Lançamento (Mantido Igual) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Novo Lançamento</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tipo da Conta</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                    <option value="RECEBER">A Receber (Entrada)</option>
                    <option value="PAGAR">A Pagar (Saída)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Status Inicial</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Já Pago/Recebido</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Descrição</label>
                <input placeholder="Ex: Conta de Luz, Venda de Peças..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Envolvido / Cliente</label>
                <input placeholder="Nome do cliente ou fornecedor" value={form.envolvido} onChange={e => setForm({...form, envolvido: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Valor (R$)</label>
                  <input type="number" step="0.01" min="0.1" placeholder="0.00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Vencimento</label>
                  <input type="date" value={form.vencimento} onChange={e => setForm({...form, vencimento: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" required />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 mt-2 flex justify-center">
                {submitting ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Salvar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumoCard({ titulo, valor, icone, cor, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center shadow-sm">
      <div className="flex items-center gap-4 mb-2">
        <div className={`p-3 rounded-xl ${bg} ${cor}`}>{icone}</div>
        <p className="text-slate-500 font-semibold text-sm">{titulo}</p>
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">{valor}</p>
    </div>
  );
}