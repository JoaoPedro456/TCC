import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, X, Trash2, ClipboardList, CheckCircle, Clock, XCircle, Wrench, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
  ABERTA: { label: 'Aberta', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
  EM_SERVICO: { label: 'Em Serviço', color: 'bg-orange-100 text-orange-700', icon: <Wrench size={12} /> },
  CONCLUIDA: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> },
};

export function OrdemServicoPage() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const formInicial = {
    clienteId: '',
    observacao: '',
    quilometragem: '',
    valorTotal: '',
    itensServicoIds: [],
    mecanicos: [],
  };
  const [form, setForm] = useState(formInicial);
  const [mecanicoSelecionado, setMecanicoSelecionado] = useState({ id: '', valor: '' });

  const carregar = async () => {
    try {
      const [resOrdens, resPessoas, resServicos] = await Promise.all([
        api.get('/ordens'),
        api.get('/pessoa'),
        api.get('/servico'),
      ]);
      setOrdens(resOrdens.data);
      setClientes(resPessoas.data.filter(p => p.tipo === 'CLIENTE'));
      setFuncionarios(resPessoas.data.filter(p => p.tipo === 'FUNCIONARIO'));
      setServicos(resServicos.data);
    } catch (err) {
      console.error('Erro ao carregar dados', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const adicionarMecanico = () => {
    if (!mecanicoSelecionado.id || !mecanicoSelecionado.valor) return;
    const func = funcionarios.find(f => f.id === Number(mecanicoSelecionado.id));
    if (!func) return;
    if (form.mecanicos.find(m => m.mecanicoId === func.id)) return;
    setForm(prev => ({
      ...prev,
      mecanicos: [...prev.mecanicos, {
        mecanicoId: func.id,
        nome: func.nome,
        cargo: func.cargo,
        percentual: func.percentualComissao,
        valorAtribuido: Number(mecanicoSelecionado.valor),
      }]
    }));
    setMecanicoSelecionado({ id: '', valor: '' });
  };

  const removerMecanico = (id) => {
    setForm(prev => ({ ...prev, mecanicos: prev.mecanicos.filter(m => m.mecanicoId !== id) }));
  };

  const toggleServico = (id) => {
    const srv = servicos.find(s => s.id === id);
    setForm(prev => {
      const jatem = prev.itensServicoIds.includes(id);
      const novosIds = jatem
        ? prev.itensServicoIds.filter(i => i !== id)
        : [...prev.itensServicoIds, id];
      const novoValor = novosIds.reduce((acc, sid) => {
        const s = servicos.find(sv => sv.id === sid);
        return acc + Number(s?.precoTabela || 0);
      }, 0);
      return { ...prev, itensServicoIds: novosIds, valorTotal: novoValor.toFixed(2) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        cliente: { id: Number(form.clienteId) },
        observacao: form.observacao,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        valorTotal: Number(form.valorTotal),
        itensServico: form.itensServicoIds.map(id => ({ id })),
        mecanicos: form.mecanicos.map(m => ({
          mecanico: { id: m.mecanicoId },
          valorAtribuido: m.valorAtribuido,
        })),
      };
      await api.post('/ordens', payload);
      setModalAberto(false);
      setForm(formInicial);
      carregar();
    } catch (err) {
      console.error('Erro ao salvar OS', err);
      alert('Erro ao salvar a OS. Verifique os dados.');
    }
  };

  const atualizarStatus = async (id, status) => {
    await api.put(`/ordens/${id}/status?status=${status}`);
    carregar();
  };

  const excluir = async (id) => {
    if (confirm('Excluir esta OS?')) {
      await api.delete(`/ordens/${id}`);
      carregar();
    }
  };

  const ordensFiltradas = filtroStatus === 'TODOS'
    ? ordens
    : ordens.filter(o => o.status === filtroStatus);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Ordens de Serviço</h2>
          <p className="text-slate-500 text-sm mt-1">{ordens.length} ordens registradas</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition"
        >
          <Plus size={20} /> Nova OS
        </button>
      </div>

      {/* Filtro por status */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['TODOS', 'ABERTA', 'EM_SERVICO', 'CONCLUIDA', 'CANCELADA'].map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filtroStatus === s
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Lista de OS */}
      <div className="space-y-4">
        {ordensFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhuma ordem encontrada</p>
          </div>
        )}
        {ordensFiltradas.map(os => {
          const st = STATUS_CONFIG[os.status] || STATUS_CONFIG.ABERTA;
          return (
            <div key={os.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-sm font-mono">#{String(os.id).padStart(4, '0')}</span>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                    <span className="text-slate-400 text-xs">{os.dataRegisto}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {os.cliente?.nome || 'Cliente não informado'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">{os.observacao}</p>
                  {os.quilometragem && (
                    <p className="text-slate-400 text-xs mt-1">📍 {os.quilometragem} km</p>
                  )}
                  {os.mecanicos?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {os.mecanicos.map(m => (
                        <span key={m.id} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-medium">
                          🔧 {m.mecanico?.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-black text-green-600">
                    R$ {Number(os.valorTotal || 0).toFixed(2)}
                  </p>
                  <div className="flex gap-2 mt-3 justify-end">
                    <select
                      value={os.status}
                      onChange={e => atualizarStatus(os.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 cursor-pointer"
                    >
                      <option value="ABERTA">Aberta</option>
                      <option value="EM_SERVICO">Em Serviço</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                    <button
                      onClick={() => excluir(os.id)}
                      className="text-slate-300 hover:text-red-500 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nova OS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Nova Ordem de Serviço</h3>
              <button onClick={() => { setModalAberto(false); setForm(formInicial); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Cliente */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Cliente *</label>
                <select
                  className="w-full border border-slate-200 p-3 rounded-xl outline-blue-500 bg-white text-slate-700"
                  value={form.clienteId}
                  onChange={e => setForm({ ...form, clienteId: e.target.value })}
                  required
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Observação */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Descrição do serviço *</label>
                <textarea
                  placeholder="Descreva o que foi realizado..."
                  className="w-full border border-slate-200 p-3 rounded-xl outline-blue-500 resize-none"
                  rows={3}
                  value={form.observacao}
                  onChange={e => setForm({ ...form, observacao: e.target.value })}
                  required
                />
              </div>

              {/* Quilometragem */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Quilometragem (opcional)</label>
                <input
                  type="number"
                  placeholder="Ex: 150"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-blue-500"
                  value={form.quilometragem}
                  onChange={e => setForm({ ...form, quilometragem: e.target.value })}
                />
              </div>

              {/* Serviços do catálogo */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Serviços do catálogo</label>
                <div className="grid grid-cols-2 gap-2">
                  {servicos.map(s => {
                    const selecionado = form.itensServicoIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleServico(s.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selecionado
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <p className="font-bold text-sm">{s.nomeServico}</p>
                        <p className="text-xs mt-1">R$ {Number(s.precoTabela).toFixed(2)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor total */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-slate-200 p-3 rounded-xl outline-blue-500 font-bold text-green-700"
                  value={form.valorTotal}
                  onChange={e => setForm({ ...form, valorTotal: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Preenchido automaticamente ao selecionar serviços. Pode ajustar manualmente.</p>
              </div>

              {/* Mecânicos */}
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Mecânicos envolvidos</label>
                <div className="flex gap-2 mb-3">
                  <select
                    className="flex-1 border border-slate-200 p-3 rounded-xl outline-blue-500 bg-white text-slate-700"
                    value={mecanicoSelecionado.id}
                    onChange={e => setMecanicoSelecionado({ ...mecanicoSelecionado, id: e.target.value })}
                  >
                    <option value="">Selecione o funcionário</option>
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} — {f.cargo} ({f.percentualComissao}%)</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor R$"
                    className="w-32 border border-slate-200 p-3 rounded-xl outline-blue-500"
                    value={mecanicoSelecionado.valor}
                    onChange={e => setMecanicoSelecionado({ ...mecanicoSelecionado, valor: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={adicionarMecanico}
                    className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition font-bold"
                  >
                    +
                  </button>
                </div>

                {form.mecanicos.length > 0 && (
                  <div className="space-y-2">
                    {form.mecanicos.map(m => (
                      <div key={m.mecanicoId} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <p className="font-bold text-sm text-slate-700">{m.nome}</p>
                          <p className="text-xs text-slate-400">{m.cargo} — {m.percentual}% comissão</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-green-600 text-sm">R$ {Number(m.valorAtribuido).toFixed(2)}</span>
                          <button type="button" onClick={() => removerMecanico(m.mecanicoId)} className="text-slate-300 hover:text-red-500 transition">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition mt-2"
              >
                Salvar Ordem de Serviço
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}