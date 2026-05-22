import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Plus, X, Trash2, ClipboardList, CheckCircle, Clock, XCircle, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';

const STATUS_CONFIG = {
  ABERTA: { label: 'Aberta', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: <Clock size={12} /> },
  CONCLUIDA: { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle size={12} /> },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: <XCircle size={12} /> },
};

export function OrdemServicoPage() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [buscaServico, setBuscaServico] = useState('');
  const [paginaServicos, setPaginaServicos] = useState(1);
  const servicosPorPagina = 8;
  const [paginaOS, setPaginaOS] = useState(0);
  const [totalPaginasOS, setTotalPaginasOS] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const { success, error } = useToast();

  // --- ATUALIZAÇÃO DO ESTADO INICIAL ---
  const formInicial = {
    clienteId: '',
    observacao: '',
    veiculo: '',
    quilometragem: '',
    valorKm: '',      // Preço cobrado por KM
    valorServico: '', // Preço cobrado pela mão de obra/peças
    valorTotal: 0,    // Calculado automaticamente
    itensServicoIds: [],
    mecanicos: [],
  };
  const [form, setForm] = useState(formInicial);

  const carregar = useCallback(async () => {
    try {
      const params = {
        page: paginaOS,
        size: 20,
      };
      if (filtroStatus !== 'TODOS') {
        params.status = filtroStatus;
      }

      const [resOrdens, resPessoas, resServicos] = await Promise.all([
        api.get('/ordens', { params }),
        api.get('/pessoa'),
        api.get('/servico'),
      ]);
      setOrdens(resOrdens.data.content || []);
      setTotalPaginasOS(resOrdens.data.totalPages || 1);
      setTotalElementos(resOrdens.data.totalElements || 0);
      setClientes(resPessoas.data.filter(p => p.tipo === 'CLIENTE'));
      setFuncionarios(resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO'));
      setServicos(resServicos.data);
    } catch (err) {
      // console.error('Erro ao carregar dados', err);
      error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [error, paginaOS, filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- NOVA FUNÇÃO MAGICA DE CALCULO ---
  // Atualiza um campo e recalcula o total imediatamente
  const atualizarCampoMagico = (campo, valor) => {
    setForm(prev => {
      const newState = { ...prev, [campo]: valor };
      
      const servico = parseFloat(newState.valorServico) || 0;
      const km = parseFloat(newState.quilometragem) || 0;
      const precoKm = parseFloat(newState.valorKm) || 0;
      
      // O Total é a soma do Serviço + Custo da Viagem
      newState.valorTotal = (servico + (km * precoKm)).toFixed(2);
      return newState;
    });
  };

  const toggleMecanico = (id) => {
    const func = funcionarios.find(f => f.id === id);
    setForm(prev => {
      const jatem = prev.mecanicos.find(m => m.mecanicoId === id);
      if (jatem) {
        return { ...prev, mecanicos: prev.mecanicos.filter(m => m.mecanicoId !== id) };
      }
      return { ...prev, mecanicos: [...prev.mecanicos, { mecanicoId: func.id, nome: func.nome, cargo: func.cargo }] };
    });
  };

  const toggleServico = (id) => {
    setForm(prev => {
      const jatem = prev.itensServicoIds.includes(id);
      const novosIds = jatem
        ? prev.itensServicoIds.filter(i => i !== id)
        : [...prev.itensServicoIds, id];
      
      // Quando seleciona um serviço do catálogo, ele soma todos e joga no "valorServico"
      const novoValorCat = novosIds.reduce((acc, sid) => {
        const s = servicos.find(sv => sv.id === sid);
        return acc + Number(s?.precoTabela || 0);
      }, 0);

      // Recalcula o total com a nova soma do catálogo
      const km = parseFloat(prev.quilometragem) || 0;
      const precoKm = parseFloat(prev.valorKm) || 0;
      const totalRecalculado = (novoValorCat + (km * precoKm)).toFixed(2);

      return { 
        ...prev, 
        itensServicoIds: novosIds, 
        valorServico: novoValorCat.toFixed(2), // Preenche o input do serviço automaticamente
        valorTotal: totalRecalculado 
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clienteId) {
      error('Selecione um cliente.');
      return;
    }
    const total = Number(form.valorTotal);
    if (isNaN(total) || total <= 0) {
      error('Informe valores válidos para o serviço ou quilometragem.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        cliente: { id: Number(form.clienteId) },
        observacao: form.observacao,
        veiculo: form.veiculo || null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        valorKm: form.valorKm ? Number(form.valorKm) : null, // Envia o valor do KM
        valorTotal: total,
        itensServicoIds: form.itensServicoIds,
        mecanicos: form.mecanicos.map(m => ({ mecanico: { id: m.mecanicoId } })),
      };
      await api.post('/ordens', payload);
      setModalAberto(false);
      setForm(formInicial);
      await carregar();
      success('Ordem de Serviço criada com sucesso!');
    } catch (err) {
      // console.error('Erro ao salvar OS', err);
      const msg = err.response?.data?.erro || 'Erro ao salvar a OS.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      await api.put(`/ordens/${id}/status?status=${status}`);
      await carregar();
      success('Status atualizado!');
    } catch {
      error('Erro ao atualizar status');
    }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir esta OS?')) return;
    try {
      await api.delete(`/ordens/${id}`);
      await carregar();
      success('OS excluída com sucesso!');
    } catch {
      error('Erro ao excluir OS');
    }
  };

  const baixarPdf = async (id) => {
    try {
      const res = await api.get(`/ordens/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OS_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('PDF baixado!');
    } catch {
      error('Erro ao gerar o PDF da OS.');
    }
  };

  const ordensFiltradas = ordens.filter(o => {
    const matchStatus = filtroStatus === 'TODOS' || o.status === filtroStatus;
    const matchBusca = !busca ||
      o.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      String(o.id).includes(busca) ||
      (o.veiculo && o.veiculo.toLowerCase().includes(busca.toLowerCase()));
    return matchStatus && matchBusca;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ordens de Serviço</h2>
          <p className="text-slate-500 text-sm mt-1">{totalElementos} ordens registradas</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition">
          <Plus size={18} /> Nova OS
        </button>
      </div>

      {/* Barra de busca + Filtros */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, nº da OS ou veículo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition"
          />
        </div>
        {['TODOS', 'ABERTA', 'CONCLUIDA', 'CANCELADA'].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${filtroStatus === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
            {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Lista de OS */}
      <div className="space-y-3">
        {ordensFiltradas.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhuma ordem encontrada</p>
          </div>
        )}
        {ordensFiltradas.map(os => {
          const st = STATUS_CONFIG[os.status] || STATUS_CONFIG.ABERTA;
          return (
            <div key={os.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-sm font-mono">#{String(os.id).padStart(4, '0')}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                    <span className="text-slate-400 text-xs">{os.dataRegisto}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{os.cliente?.nome || 'Sem cliente'}</h3>
                  <p className="text-slate-500 text-sm mt-0.5 truncate">{os.observacao}</p>
                  {(os.quilometragem || os.veiculo) && (
                    <p className="text-slate-400 text-xs mt-1.5 flex gap-3">
                      {os.veiculo && <span>🚗 {os.veiculo}</span>}
                      {os.quilometragem && <span>🛤️ {os.quilometragem} km</span>}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-slate-900">R$ {Number(os.valorTotal || 0).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <select value={os.status || 'ABERTA'} onChange={e => atualizarStatus(os.id, e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 cursor-pointer outline-none focus:border-slate-400">
                      <option value="ABERTA">Aberta</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                    <button type="button" onClick={() => baixarPdf(os.id)} className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1.5 transition" title="Baixar PDF">
                      <Printer size={14} />
                    </button>
                    <button type="button" onClick={() => excluir(os.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPaginasOS > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-xl border border-slate-200 px-5 py-3">
          <p className="text-sm text-slate-500">
            Página {paginaOS + 1} de {totalPaginasOS}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaOS(p => Math.max(p - 1, 0))}
              disabled={paginaOS === 0}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPaginaOS(p => Math.min(p + 1, totalPaginasOS - 1))}
              disabled={paginaOS >= totalPaginasOS - 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Nova OS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[4px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[70%] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-[30px] font-bold text-slate-900">Nova Ordem de Serviço</h3>
                <p className="text-[14px] text-slate-400 mt-0.5">Preencha os dados do atendimento</p>
              </div>
              <button onClick={() => { setModalAberto(false); setForm(formInicial); }} className="text-slate-300 hover:text-slate-500 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Linha 1: Cliente e Veículo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1.5">Cliente *</label>
                  <select
                    className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition bg-white"
                    value={form.clienteId}
                    onChange={e => atualizarCampoMagico('clienteId', e.target.value)}
                    required
                  >
                    <option value="">Selecione o cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cpf ? `- CPF: ${c.cpf}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1.5">Veículo / Maquinário</label>
                  <input
                    placeholder="Ex: Trator/Implemento"
                    className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    value={form.veiculo}
                    onChange={e => atualizarCampoMagico('veiculo', e.target.value)}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1.5">Descrição do serviço *</label>
                <textarea
                  placeholder="Descreva o que foi realizado: troca de óleo, revisão dos freios, etc."
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-slate-900 resize-none transition"
                  rows={3}
                  value={form.observacao}
                  onChange={e => atualizarCampoMagico('observacao', e.target.value)}
                  required
                />
              </div>

              {/* Serviços do catálogo */}
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1.5">
                  Serviços do catálogo <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Buscar serviço no catálogo..."
                  value={buscaServico}
                  onChange={e => { setBuscaServico(e.target.value); setPaginaServicos(1); }}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition mb-2"
                />
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {servicos.filter(s => s.nomeServico.toLowerCase().includes(buscaServico.toLowerCase())).slice((paginaServicos - 1) * servicosPorPagina, paginaServicos * servicosPorPagina).map(s => {
                    const selecionado = form.itensServicoIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleServico(s.id)}
                        className={`p-3 rounded-lg border text-left transition ${selecionado ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <p className="font-medium text-sm">{s.nomeServico}</p>
                        <p className="text-xs mt-0.5 text-slate-400">R$ {Number(s.precoTabela || 0).toFixed(2)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- NOVA ÁREA FINANCEIRA --- */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Detalhes Financeiros</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  
                  {/* Bloco Valor do Serviço */}
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Valor dos Serviços</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        className="w-full border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                        value={form.valorServico}
                        onChange={e => atualizarCampoMagico('valorServico', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bloco Quilometragem */}
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Distância</label>
                    <div className="relative">
                      <input
                        type="number" step="0.1" placeholder="Ex: 30"
                        className="w-full border border-slate-200 px-3 pr-10 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                        value={form.quilometragem}
                        onChange={e => atualizarCampoMagico('quilometragem', e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">km</span>
                    </div>
                  </div>

                  {/* Bloco Valor por KM */}
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Custo por KM</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                      <input
                        type="number" step="0.01" placeholder="2.50"
                        className="w-full border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                        value={form.valorKm}
                        onChange={e => atualizarCampoMagico('valorKm', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Totalizador (Somente Leitura) */}
                <div className="bg-slate-900 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-semibold uppercase tracking-wider">Total a Pagar</p>
                    <p className="text-slate-400 text-xs mt-0.5">Serviços + (Distância x Custo KM)</p>
                  </div>
                  <p className="text-3xl font-black text-white">
                    R$ {Number(form.valorTotal || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {/* ---------------------------- */}

              {/* Mecânicos */}
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1.5">Mecânicos Responsáveis</label>
                <div className="grid grid-cols-2 gap-2">
                  {funcionarios.map(f => {
                    const selecionado = form.mecanicos.some(m => m.mecanicoId === f.id);
                    return (
                      <button
                        key={f.id} type="button" onClick={() => toggleMecanico(f.id)}
                        className={`p-3 rounded-lg border text-left transition ${selecionado ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <p className="font-medium text-sm">{f.nome}</p>
                        <p className="text-xs mt-0.5 text-slate-400">{f.cargo || '—'} • {f.percentualComissao || 0}%</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalAberto(false); setForm(formInicial); }} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Criar OS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}