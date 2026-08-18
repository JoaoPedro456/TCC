import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Plus, X, Trash2, ClipboardList, CheckCircle, Clock, XCircle, Printer, Search, ChevronLeft, ChevronRight, Edit2, Play } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { AutocompleteSelect } from '../components/AutocompleteSelect.jsx';

export function OrcamentoPage() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [materiaisCat, setMateriaisCat] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  
  // Catálogo states
  const [buscaServico, setBuscaServico] = useState('');
  const [paginaServicos, setPaginaServicos] = useState(1);
  const servicosPorPagina = 8;
  const [filtroCatalogo, setFiltroCatalogo] = useState('TODOS'); // TODOS, NOVO
  const [novoServicoDescricao, setNovoServicoDescricao] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');

  // Catálogo Materiais
  const [buscaMaterial, setBuscaMaterial] = useState('');
  const [paginaMateriais, setPaginaMateriais] = useState(1);
  const materiaisPorPagina = 8;
  const [filtroCatMaterial, setFiltroCatMaterial] = useState('TODOS');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialPreco, setNovoMaterialPreco] = useState('');
  const [novoMaterialQtd, setNovoMaterialQtd] = useState('1');

  // Pagination Orcamentos
  const [paginaOrc, setPaginaOrc] = useState(0);
  const [totalPaginasOrc, setTotalPaginasOrc] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);

  const { success, error } = useToast();

  const formInicial = {
    clienteId: '',
    observacao: '',
    veiculo: '',
    quilometragem: '',
    valorKm: '',
    valorDesconto: '',
    valorTotal: 0,
    itensServico: [],
    materiais: [],
  };
  const [form, setForm] = useState(formInicial);

  const fecharModal = () => {
    setModalAberto(false);
    setForm(formInicial);
    setEditId(null);
    setBuscaServico('');
    setPaginaServicos(1);
    setFiltroCatalogo('TODOS');
    setNovoServicoDescricao('');
    setNovoServicoPreco('');

    setBuscaMaterial('');
    setPaginaMateriais(1);
    setFiltroCatMaterial('TODOS');
    setNovoMaterialDescricao('');
    setNovoMaterialPreco('');
    setNovoMaterialQtd('1');
  };

  const abrirEditar = async (orc) => {
    setEditId(orc.id);
    try {
      const res = await api.get(`/orcamentos/${orc.id}`);
      const orcCompleta = res.data;
      
      setForm({
        clienteId: orcCompleta.cliente?.id || '',
        observacao: orcCompleta.observacao || '',
        veiculo: orcCompleta.veiculo || '',
        quilometragem: orcCompleta.quilometragem || '',
        valorKm: orcCompleta.valorKm || '',
        valorDesconto: orcCompleta.valorDesconto || '',
        valorTotal: orcCompleta.valorTotal || 0,
        itensServico: orcCompleta.itensServico?.map(item => ({
          id: item.itemServico?.id, // Pode ser null se fosse criado na hora e não retornado, mas o backend sempre retorna
          nomeServico: item.itemServico?.nomeServico,
          precoTabela: item.itemServico?.precoTabela,
          precoCobrado: item.precoCobrado
        })) || [],
        materiais: orcCompleta.materiais?.map(m => ({
          id: m.material?.id,
          nomeMaterial: m.material?.nomeMaterial || m.nomeMaterial,
          precoUnitario: m.precoUnitario,
          quantidade: m.quantidade,
          precoTotal: m.precoTotal
        })) || []
      });
      setModalAberto(true);
    } catch (err) {
      error('Erro ao carregar dados do orçamento para edição.');
    }
  };

  const fetchClientes = async (busca) => {
    try {
      const res = await api.get('/pessoa/clientes', { params: { busca, size: 20 } });
      return res.data.content.map(c => ({
        value: c.id,
        label: c.nome,
        sublabel: c.cpf ? `CPF: ${c.cpf}` : (c.cnpj ? `CNPJ: ${c.cnpj}` : ''),
        searchString: `${c.nome} ${c.cpf || ''} ${c.cnpj || ''}`
      }));
    } catch (err) {
      console.error('Erro buscar clientes', err);
      return [];
    }
  };

  const fetchServicos = async (busca) => {
    try {
      const res = await api.get(`/servico?busca=${busca || ''}`);
      return res.data.content || res.data;
    } catch (err) {
      console.error('Erro buscar serviços', err);
      return [];
    }
  };

  const fetchMateriais = async (busca) => {
    try {
      const res = await api.get(`/materiais?busca=${busca || ''}&size=500`);
      return res.data.content || res.data;
    } catch (err) {
      console.error('Erro buscar materiais', err);
      return [];
    }
  };

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        const resClientes = await fetchClientes('');
        setClientes(Array.isArray(resClientes) ? resClientes : []);
        const resServicos = await fetchServicos('');
        setServicos(Array.isArray(resServicos) ? resServicos : []);
        const resMateriais = await fetchMateriais('');
        setMateriaisCat(Array.isArray(resMateriais) ? resMateriais : []);
      } catch (err) {
        console.error('Erro ao carregar dados base', err);
      }
    };
    carregarTudo();
  }, []);

  const carregarOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/orcamentos?page=${paginaOrc}&size=10`;
      if (filtroStatus !== 'TODOS') url += `&status=${filtroStatus}`;
      if (busca) url += `&busca=${busca}`;

      const res = await api.get(url);
      setOrcamentos(res.data.content || []);
      setTotalPaginasOrc(res.data.totalPages || 1);
      setTotalElementos(res.data.totalElements || 0);
    } catch {
      error('Erro ao carregar orçamentos.');
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, busca, paginaOrc, error]);

  useEffect(() => {
    carregarOrcamentos();
  }, [carregarOrcamentos]);

  useEffect(() => {
    recalcularTotal();
  }, [form.itensServico, form.materiais, form.quilometragem, form.valorKm, form.valorDesconto]);

  const recalcularTotal = () => {
    setForm(prev => {
      const vServicos = prev.itensServico.reduce((acc, i) => acc + Number(i.precoCobrado || 0), 0);
      const vMateriais = prev.materiais.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0);
      const k = Number(prev.quilometragem) || 0;
      const vK = Number(prev.valorKm) || 0;
      const d = Number(prev.valorDesconto) || 0;
      const t = (vServicos + vMateriais + (k * vK)) - d;
      const vTotal = t > 0 ? t : 0;
      
      if (prev.valorTotal === vTotal) return prev;
      return { ...prev, valorTotal: vTotal };
    });
  };

  const adicionarServicoCatalogo = (item) => {
    setForm(prev => {
      if (prev.itensServico.some(i => i.id === item.id)) {
        error('Serviço já adicionado.');
        return prev;
      }
      return {
        ...prev,
        itensServico: [...prev.itensServico, { id: item.id, nomeServico: item.nomeServico, precoTabela: item.precoTabela, precoCobrado: item.precoTabela }]
      };
    });
  };

  const adicionarServicoNovo = () => {
    if (!novoServicoDescricao.trim()) {
      error('Informe a descrição do serviço.');
      return;
    }
    const preco = Number(novoServicoPreco);
    if (isNaN(preco) || preco < 0) {
      error('Informe um preço válido.');
      return;
    }
    setForm(prev => {
      return {
        ...prev,
        itensServico: [...prev.itensServico, { id: null, nomeServico: novoServicoDescricao, precoCobrado: preco }]
      };
    });
    setNovoServicoDescricao('');
    setNovoServicoPreco('');
    success('Serviço customizado adicionado!');
  };

  const removerServico = (index) => {
    setForm(prev => {
      const novosItens = [...prev.itensServico];
      novosItens.splice(index, 1);
      return { ...prev, itensServico: novosItens };
    });
  };

  const adicionarMaterialCatalogo = (item) => {
    setForm(prev => {
      if (prev.materiais.some(i => i.id === item.id)) {
        error('Material já adicionado.');
        return prev;
      }
      return {
        ...prev,
        materiais: [...prev.materiais, { 
          id: item.id, 
          nomeMaterial: item.nomeMaterial, 
          precoUnitario: item.precoTabela, 
          quantidade: 1,
          precoTotal: item.precoTabela 
        }]
      };
    });
  };

  const adicionarMaterialNovo = () => {
    if (!novoMaterialDescricao.trim()) {
      error('Informe a descrição do material.');
      return;
    }
    const preco = Number(novoMaterialPreco);
    if (isNaN(preco) || preco < 0) {
      error('Informe um preço válido.');
      return;
    }
    const qtd = Number(novoMaterialQtd);
    if (isNaN(qtd) || qtd <= 0) {
      error('Informe uma quantidade válida.');
      return;
    }
    setForm(prev => {
      return {
        ...prev,
        materiais: [...prev.materiais, { 
          id: null, 
          nomeMaterial: novoMaterialDescricao, 
          precoUnitario: preco,
          quantidade: qtd,
          precoTotal: preco * qtd
        }]
      };
    });
    setNovoMaterialDescricao('');
    setNovoMaterialPreco('');
    setNovoMaterialQtd('1');
    success('Material customizado adicionado!');
  };

  const removerMaterial = (index) => {
    setForm(prev => {
      const novos = [...prev.materiais];
      novos.splice(index, 1);
      return { ...prev, materiais: novos };
    });
  };

  const atualizarQtdMaterial = (index, novaQtd) => {
    const qtd = Number(novaQtd) || 0;
    setForm(prev => {
      const novos = [...prev.materiais];
      novos[index].quantidade = qtd;
      novos[index].precoTotal = novos[index].precoUnitario * qtd;
      return { ...prev, materiais: novos };
    });
  };

  const atualizarPrecoMaterial = (index, novoPreco) => {
    const p = Number(novoPreco) || 0;
    setForm(prev => {
      const novos = [...prev.materiais];
      novos[index].precoUnitario = p;
      novos[index].precoTotal = p * novos[index].quantidade;
      return { ...prev, materiais: novos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        cliente: form.clienteId ? { id: Number(form.clienteId) } : null,
        observacao: form.observacao,
        veiculo: form.veiculo || null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        valorKm: form.valorKm ? Number(form.valorKm) : null,
        valorDesconto: form.valorDesconto ? Number(form.valorDesconto) : null,
        valorTotal: Number(form.valorTotal),
        itensServico: form.itensServico.map(item => ({
          itemServicoId: item.id ? Number(item.id) : null,
          descricaoServico: item.id ? null : item.nomeServico,
          precoCobrado: Number(item.precoCobrado || 0)
        })),
        materiais: form.materiais.map(item => ({
          materialId: item.id ? Number(item.id) : null,
          nomeMaterial: item.id ? null : item.nomeMaterial,
          precoUnitario: Number(item.precoUnitario || 0),
          quantidade: Number(item.quantidade || 0),
          precoTotal: Number(item.precoTotal || 0)
        })),
      };
      
      if (editId) {
        await api.put(`/orcamentos/${editId}`, payload);
      } else {
        await api.post('/orcamentos', payload);
      }
      fecharModal();
      await carregarOrcamentos();
      success(editId ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!');
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao salvar orçamento.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      await api.put(`/orcamentos/${id}/status?status=${status}`);
      await carregarOrcamentos();
      success('Status atualizado!');
    } catch {
      error('Erro ao atualizar status');
    }
  };

  const aprovarEGerarOS = async (id) => {
    if (!confirm('Deseja aprovar este orçamento e gerar uma Ordem de Serviço automaticamente?')) return;
    try {
      const res = await api.post(`/orcamentos/${id}/aprovar`);
      await carregarOrcamentos();
      success(`Orçamento aprovado! OS #${res.data.id} gerada com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao aprovar orçamento.';
      error(msg);
    }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este orçamento?')) return;
    try {
      await api.delete(`/orcamentos/${id}`);
      await carregarOrcamentos();
      success('Orçamento excluído com sucesso!');
    } catch {
      error('Erro ao excluir orçamento');
    }
  };

  const baixarPdf = async (id) => {
    try {
      const res = await api.get(`/orcamentos/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Orcamento_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('PDF baixado!');
    } catch {
      error('Erro ao baixar PDF');
    }
  };

  const servicosFiltrados = servicos.filter(s => s.nomeServico?.toLowerCase().includes(buscaServico.toLowerCase()));
  const indexUltimoServico = paginaServicos * servicosPorPagina;
  const indexPrimeiroServico = indexUltimoServico - servicosPorPagina;
  const servicosAtuais = servicosFiltrados.slice(indexPrimeiroServico, indexUltimoServico);
  const totalPaginasCatalogo = Math.ceil(servicosFiltrados.length / servicosPorPagina) || 1;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'PENDENTE': return <Clock className="text-amber-500" size={20} />;
      case 'REPROVADO': return <XCircle className="text-red-500" size={20} />;
      case 'EXPIRADO': return <XCircle className="text-slate-500" size={20} />;
      default: return <ClipboardList className="text-slate-400" size={20} />;
    }
  };

  const materiaisAtuais = materiaisCat
    .filter(m => (m.nomeMaterial || '').toLowerCase().includes(buscaMaterial.toLowerCase()))
    .slice((paginaMateriais - 1) * materiaisPorPagina, paginaMateriais * materiaisPorPagina);

  const totalPaginasCatMaterial = Math.ceil(
    materiaisCat.filter(m => (m.nomeMaterial || '').toLowerCase().includes(buscaMaterial.toLowerCase())).length / materiaisPorPagina
  ) || 1;

  const getStatusColor = (status) => {
    switch (status) {
      case 'APROVADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REPROVADO': return 'bg-red-50 text-red-700 border-red-200';
      case 'EXPIRADO': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orçamentos</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Crie, negocie e feche mais serviços.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition shadow-lg shadow-slate-900/20"
        >
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, nome do orçamento ou número..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition"
          />
        </div>
        {['TODOS', 'PENDENTE', 'APROVADO', 'REPROVADO', 'EXPIRADO'].map(status => (
          <button
            key={status}
            onClick={() => { setFiltroStatus(status); setPaginaOrc(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              filtroStatus === status
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {status === 'TODOS' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Carregando orçamentos...</p>
          </div>
        ) : orcamentos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <ClipboardList className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">Nenhum orçamento encontrado</h3>
            <p className="text-slate-500 mt-1">Crie um novo orçamento para começar.</p>
          </div>
        ) : (
          orcamentos.map(orc => (
            <div key={orc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition group">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-sm font-mono">#{String(orc.id).padStart(4, '0')}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${getStatusColor(orc.status)}`}>
                      {getStatusIcon(orc.status)} {orc.status.charAt(0) + orc.status.slice(1).toLowerCase()}
                    </span>
                    {orc.dataRegisto && <span className="text-slate-400 text-xs">{new Date(orc.dataRegisto + 'T00:00:00').toLocaleDateString()}</span>}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {orc.veiculo || 'Orçamento sem nome'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1 truncate">
                    👤 {orc.cliente?.nome || 'Cliente sem cadastro'}
                    {orc.quilometragem ? ` • ${orc.quilometragem} km` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-slate-900">R$ {Number(orc.valorTotal || 0).toFixed(2)}</p>
                  
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <select 
                      value={orc.status || 'PENDENTE'} 
                      onChange={e => {
                        if (e.target.value === 'APROVADO') {
                          aprovarEGerarOS(orc.id);
                        } else {
                          atualizarStatus(orc.id, e.target.value);
                        }
                      }} 
                      className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 cursor-pointer outline-none focus:border-slate-400"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="APROVADO">Aprovado</option>
                      <option value="REPROVADO">Reprovado</option>
                      <option value="EXPIRADO">Expirado</option>
                    </select>
                    
                    <button type="button" onClick={() => baixarPdf(orc.id)} className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1.5 transition" title="Baixar PDF">
                      <Printer size={14} />
                    </button>
                    <button type="button" onClick={() => abrirEditar(orc)} className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-md p-1.5 transition" title="Editar Orçamento">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => excluir(orc.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalPaginasOrc > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-xl border border-slate-200 px-5 py-3">
          <p className="text-sm text-slate-500">
            Página {paginaOrc + 1} de {totalPaginasOrc}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaginaOrc(p => Math.max(p - 1, 0))} disabled={paginaOrc === 0} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPaginaOrc(p => Math.min(p + 1, totalPaginasOrc - 1))} disabled={paginaOrc >= totalPaginasOrc - 1} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={fecharModal}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{editId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
                <p className="text-sm text-slate-500 mt-1">Preencha os dados e adicione os serviços orçados</p>
              </div>
              <button onClick={fecharModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna Esquerda: Dados Básicos */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Dados Principais</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Orçamento</label>
                        <input type="text" value={form.veiculo} onChange={e => setForm({...form, veiculo: e.target.value})} placeholder="" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cliente (Opcional)</label>
                        <AutocompleteSelect
                          fetchOptions={fetchClientes}
                          options={[]}
                          value={form.clienteId}
                          onChange={(val) => setForm({ ...form, clienteId: val })}
                          placeholder="Buscar cliente por nome..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Observações</label>
                        <textarea value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} rows="3" placeholder="" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none"></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Distância (Km)</label>
                          <input type="number" step="0.1" min="0" value={form.quilometragem} onChange={e => setForm({...form, quilometragem: e.target.value})} placeholder="0.0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preço por Km (R$)</label>
                          <input type="number" step="0.01" min="0" value={form.valorKm} onChange={e => setForm({...form, valorKm: e.target.value})} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 mt-8">2. Resumo Financeiro</h4>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                        <span>Total dos Serviços:</span>
                        <span>R$ {form.itensServico.reduce((acc, i) => acc + Number(i.precoCobrado || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                        <span>Total dos Materiais:</span>
                        <span>R$ {form.materiais.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                        <span>Deslocação (Km):</span>
                        <span>R$ {((Number(form.quilometragem) || 0) * (Number(form.valorKm) || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600 border-b border-slate-200 pb-3">
                        <span className="mt-2">Desconto (R$):</span>
                        <input type="number" step="0.01" min="0" value={form.valorDesconto} onChange={e => setForm({...form, valorDesconto: e.target.value})} placeholder="0.00" className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right focus:outline-none focus:border-slate-900" />
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-bold text-slate-900">Total Geral:</span>
                        <span className="text-2xl font-black text-emerald-600">R$ {form.valorTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Serviços e Materiais */}
                <div className="flex flex-col gap-6">
                
                {/* BLOCO DE SERVIÇOS */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100 flex flex-col shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">3. Serviços Oferecidos</h4>
                  
                  {/* Seletor de Tipo de Serviço */}
                  <div className="flex p-1 bg-slate-200/50 rounded-lg mb-4">
                    <button type="button" onClick={() => setFiltroCatalogo('TODOS')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${filtroCatalogo === 'TODOS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Do Catálogo</button>
                    <button type="button" onClick={() => setFiltroCatalogo('NOVO')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${filtroCatalogo === 'NOVO' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Criar Novo</button>
                  </div>

                  {filtroCatalogo === 'TODOS' ? (
                    <div className="mb-6 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar no catálogo..." value={buscaServico} onChange={e => { setBuscaServico(e.target.value); setPaginaServicos(1); }} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {servicosAtuais.map(s => (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{s.nomeServico}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">R$ {Number(s.precoTabela).toFixed(2)}</p>
                            </div>
                            <button type="button" onClick={() => adicionarServicoCatalogo(s)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">
                              <Plus size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {totalPaginasCatalogo > 1 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                          <button type="button" onClick={() => setPaginaServicos(p => Math.max(p - 1, 1))} disabled={paginaServicos === 1} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50"><ChevronLeft size={14} /></button>
                          <span className="text-xs font-semibold text-slate-500">{paginaServicos} / {totalPaginasCatalogo}</span>
                          <button type="button" onClick={() => setPaginaServicos(p => Math.min(p + 1, totalPaginasCatalogo))} disabled={paginaServicos === totalPaginasCatalogo} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50"><ChevronRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Serviço Customizado</label>
                        <input type="text" value={novoServicoDescricao} onChange={e => setNovoServicoDescricao(e.target.value)} placeholder="Ex: Reparo placa principal..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Preço Sugerido (R$)</label>
                        <input type="number" step="0.01" min="0" value={novoServicoPreco} onChange={e => setNovoServicoPreco(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                      </div>
                      <button type="button" onClick={adicionarServicoNovo} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition">Adicionar ao Orçamento</button>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Serviços Adicionados ({form.itensServico.length})</h5>
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                      {form.itensServico.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-8 font-medium">Nenhum serviço adicionado ainda.</p>
                      ) : (
                        form.itensServico.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{item.nomeServico}</p>
                              {item.id && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Item de Catálogo</p>}
                              {!item.id && <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Item Customizado</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Orçado (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precoCobrado}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setForm(prev => {
                                      const newItens = [...prev.itensServico];
                                      newItens[index].precoCobrado = val;
                                      return { ...prev, itensServico: newItens };
                                    });
                                  }}
                                  className="w-24 px-2 py-1 text-sm font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                              </div>
                              <button type="button" onClick={() => removerServico(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition self-end">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                {/* BLOCO DE MATERIAIS */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100 flex flex-col shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">4. Materiais Aplicados</h4>
                  
                  <div className="flex p-1 bg-slate-200/50 rounded-lg mb-4">
                    <button type="button" onClick={() => setFiltroCatMaterial('TODOS')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${filtroCatMaterial === 'TODOS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Do Catálogo</button>
                    <button type="button" onClick={() => setFiltroCatMaterial('NOVO')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition ${filtroCatMaterial === 'NOVO' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Material Avulso</button>
                  </div>

                  {filtroCatMaterial === 'TODOS' ? (
                    <div className="mb-6 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar material..." value={buscaMaterial} onChange={e => { setBuscaMaterial(e.target.value); setPaginaMateriais(1); }} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {materiaisAtuais.map(m => (
                          <div key={m.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition">
                            <div>
                              <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[9px] uppercase tracking-wider">{m.unidadeMedida}</span>
                                {m.nomeMaterial}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">R$ {Number(m.precoTabela).toFixed(2)}</p>
                            </div>
                            <button type="button" onClick={() => adicionarMaterialCatalogo(m)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">
                              <Plus size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {totalPaginasCatMaterial > 1 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                          <button type="button" onClick={() => setPaginaMateriais(p => Math.max(p - 1, 1))} disabled={paginaMateriais === 1} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50"><ChevronLeft size={14} /></button>
                          <span className="text-xs font-semibold text-slate-500">{paginaMateriais} / {totalPaginasCatMaterial}</span>
                          <button type="button" onClick={() => setPaginaMateriais(p => Math.min(p + 1, totalPaginasCatMaterial))} disabled={paginaMateriais === totalPaginasCatMaterial} className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50"><ChevronRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                        <input type="text" value={novoMaterialDescricao} onChange={e => setNovoMaterialDescricao(e.target.value)} placeholder="Ex: Óleo 5W40..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Qtd</label>
                          <input type="number" step="0.01" min="0.01" value={novoMaterialQtd} onChange={e => setNovoMaterialQtd(e.target.value)} placeholder="1" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Preço (R$)</label>
                          <input type="number" step="0.01" min="0" value={novoMaterialPreco} onChange={e => setNovoMaterialPreco(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
                        </div>
                      </div>
                      <button type="button" onClick={adicionarMaterialNovo} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition">Adicionar Material</button>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Materiais Adicionados ({form.materiais.length})</h5>
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                      {form.materiais.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-8 font-medium">Nenhum material adicionado.</p>
                      ) : (
                        form.materiais.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{item.nomeMaterial}</p>
                              {item.id && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Item de Catálogo</p>}
                              {!item.id && <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-0.5">Item Avulso</p>}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex flex-col w-20">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.quantidade}
                                  onChange={e => atualizarQtdMaterial(index, e.target.value)}
                                  className="w-full px-2 py-1 text-sm font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                              </div>
                              <div className="flex flex-col w-24">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Unitário</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.precoUnitario}
                                  onChange={e => atualizarPrecoMaterial(index, e.target.value)}
                                  className="w-full px-2 py-1 text-sm font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-900"
                                />
                              </div>
                              <div className="flex flex-col w-24">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Total</label>
                                <span className="px-2 py-1 text-sm font-black text-slate-900">R$ {Number(item.precoTotal).toFixed(2)}</span>
                              </div>
                              <button type="button" onClick={() => removerMaterial(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition self-end">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={fecharModal} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-slate-900/20">
                  {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : (editId ? 'Salvar Orçamento' : 'Criar Orçamento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}