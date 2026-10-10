import { useEffect, useState, useCallback } from 'react';
import { formatarMoeda } from '../utils/formatters';
import api from '../services/api';
import { Plus, X, Trash2, ClipboardList, CheckCircle, Clock, XCircle, Printer, Search, ChevronLeft, ChevronRight, Edit2, FileText, Download, CheckSquare, Square, Calendar, BadgePercent, Percent, Wrench, Package } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { AutocompleteSelect } from '../components/AutocompleteSelect.jsx';

const STATUS_CONFIG = {
  ABERTA: { label: 'Aberta', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: <Clock size={12} /> },
  CONCLUIDA: { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle size={12} /> },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: <XCircle size={12} /> },
};

const FORMAS_PAGAMENTO = [
  { id: 'PIX', label: 'PIX', icon: '⚡' },
  { id: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
  { id: 'CARTAO_DEBITO', label: 'Débito', icon: '💳' },
  { id: 'CARTAO_CREDITO', label: 'Crédito', icon: '💳' },
  { id: 'BOLETO', label: 'Boleto', icon: '📄' },
];

export function OrdemServicoPage() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  
  const [buscaServico, setBuscaServico] = useState('');
  const [paginaServicos, setPaginaServicos] = useState(1);
  const servicosPorPagina = 8;
  const [filtroCatalogo, setFiltroCatalogo] = useState('TODOS');
  
  const [materiaisCat, setMateriaisCat] = useState([]);
  const [buscaMaterial, setBuscaMaterial] = useState('');
  const [paginaMateriais, setPaginaMateriais] = useState(1);
  const materiaisPorPagina = 8;
  const [filtroCatMaterial, setFiltroCatMaterial] = useState('TODOS');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialPreco, setNovoMaterialPreco] = useState('');
  const [novoMaterialQtd, setNovoMaterialQtd] = useState('1');
  const [paginaOS, setPaginaOS] = useState(0);
  const [totalPaginasOS, setTotalPaginasOS] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [buscaMecanico, setBuscaMecanico] = useState('');
  const [paginaMecanicos, setPaginaMecanicos] = useState(1);
  const mecanicosPorPagina = 4;
  const { success, error } = useToast();

  // --- ESTADOS PARA CLIENTE RÁPIDO ---
  const [modalClienteRapido, setModalClienteRapido] = useState(false);
  const [clienteRapidoNome, setClienteRapidoNome] = useState('');
  const [clienteRapidoTelefone, setClienteRapidoTelefone] = useState('');
  const [salvandoClienteRapido, setSalvandoClienteRapido] = useState(false);
  const [clientesExtras, setClientesExtras] = useState([]);

  // --- ESTADOS PARA SELEÇÃO E PDF EM LOTE ---
  const [osSelecionadas, setOsSelecionadas] = useState([]);
  const [baixandoPdfLote, setBaixandoPdfLote] = useState(false);

  // --- ESTADO PARA ALTERAÇÃO DE STATUS EM LOTE ---
  const [salvandoStatusLote, setSalvandoStatusLote] = useState(false);

  // --- ESTADOS PARA MODAL DE PDF POR CLIENTE/MÊS ---
  const [modalPdfMesAberto, setModalPdfMesAberto] = useState(false);
  const [pdfMesClienteId, setPdfMesClienteId] = useState('');
  const [pdfMesMes, setPdfMesMes] = useState(new Date().getMonth() + 1);
  const [pdfMesAno, setPdfMesAno] = useState(new Date().getFullYear());
  const [gerandoPdfMes, setGerandoPdfMes] = useState(false);

  // --- ATUALIZAÇÃO DO ESTADO INICIAL ---
  const formInicial = {
    clienteId: '',
    dataRealizacao: '',
    observacao: '',
    veiculo: '',
    quilometragem: '',
    valorKm: '',      // Preço cobrado por KM
    valorServico: '', // Preço cobrado pela mão de obra/serviços
    valorTorno: '',   // Serviço de Torno (não entra na comissão)
    valorTotal: 0,    // Calculado automaticamente
    itensServico: [],
    materiais: [],
    mecanicos: [],
  };
  const [form, setForm] = useState(formInicial);
  const [abaItensOS, setAbaItensOS] = useState('SERVICOS'); // 'SERVICOS' ou 'MATERIAIS'

  const fecharModal = () => {
    setModalAberto(false);
    setForm(formInicial);
    setEditId(null);
    setBuscaServico('');
    setPaginaServicos(1);
    setFiltroCatalogo('TODOS');
    setAbaItensOS('SERVICOS');
    setBuscaMecanico('');
    setPaginaMecanicos(1);

    setBuscaMaterial('');
    setPaginaMateriais(1);
    setFiltroCatMaterial('TODOS');
    setNovoMaterialDescricao('');
    setNovoMaterialPreco('');
    setNovoMaterialQtd('1');
  };

  const abrirEditar = async (os) => {
    setEditId(os.id);
    try {
      const res = await api.get(`/ordens/${os.id}`);
      const osCompleta = res.data;
      
      const valorServicos = osCompleta.itensServico?.reduce((acc, item) => acc + (item.precoCobrado || 0), 0) || 0;
      
      setForm({
        clienteId: osCompleta.cliente?.id || '',
        dataRealizacao: osCompleta.dataRealizacao || '',
        observacao: osCompleta.observacao || '',
        veiculo: osCompleta.veiculo || '',
        quilometragem: osCompleta.quilometragem || '',
        valorKm: osCompleta.valorKm || '',
        valorServico: valorServicos.toFixed(2),
        valorTorno: osCompleta.valorTorno != null ? String(osCompleta.valorTorno) : '',
        valorTotal: osCompleta.valorTotal || 0,
        itensServico: osCompleta.itensServico?.map(item => ({
          id: item.itemServico?.id,
          nomeServico: item.itemServico?.nomeServico,
          precoTabela: item.itemServico?.precoTabela,
          precoCobrado: item.precoCobrado
        })) || [],
        materiais: osCompleta.materiais?.map(m => ({
          id: m.material?.id,
          nomeMaterial: m.material?.nomeMaterial || m.nomeMaterial,
          precoUnitario: m.precoUnitario,
          quantidade: m.quantidade,
          precoTotal: m.precoTotal
        })) || [],
        mecanicos: osCompleta.mecanicos?.map(m => ({
          mecanicoId: m.mecanico?.id,
          nome: m.mecanico?.nome,
          cargo: m.mecanico?.cargo
        })) || []
      });
      setModalAberto(true);
    } catch (err) {
      error('Erro ao carregar dados da OS para edição.');
    }
  };

  // Fetch functions para os seletores (serão chamadas pelo Autocomplete ou useEffects)
  const fetchClientes = async (busca) => {
    try {
      const res = await api.get('/pessoa/clientes', { params: { busca, size: 20 } });
      return res.data.content.map(c => ({
        value: c.id,
        label: c.nome,
        sublabel: c.cpf ? `CPF: ${c.cpf}` : (c.cnpj ? `CNPJ: ${c.cnpj}` : ''),
        searchString: `${c.nome} ${c.cpf || ''} ${c.cnpj || ''}`
      }));
    } catch {
      return [];
    }
  };

  // Carregar Serviços Paginados do Servidor
  useEffect(() => {
    if (!modalAberto) return;
    const loadServicos = async () => {
      try {
        const res = await api.get('/servico', { 
          params: { busca: buscaServico, page: paginaServicos - 1, size: servicosPorPagina } 
        });
        setServicos(res.data.content);
        // Não precisamos mais do totalPaginasServicos local
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(loadServicos, 300);
    return () => clearTimeout(timer);
  }, [modalAberto, buscaServico, paginaServicos]);

  // Carregar Mecânicos Paginados do Servidor
  useEffect(() => {
    if (!modalAberto) return;
    const loadMecanicos = async () => {
      try {
        const res = await api.get('/pessoa/funcionarios', { 
          params: { busca: buscaMecanico, page: paginaMecanicos - 1, size: mecanicosPorPagina } 
        });
        setFuncionarios(res.data.content);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(loadMecanicos, 300);
    return () => clearTimeout(timer);
  }, [modalAberto, buscaMecanico, paginaMecanicos]);

  useEffect(() => {
    if (!modalAberto) return;
    const loadMateriais = async () => {
      try {
        const res = await api.get('/materiais', { 
          params: { busca: buscaMaterial, size: 500 } 
        });
        setMateriaisCat(res.data.content || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMateriais();
  }, [modalAberto]);


  // 2. Carregar Ordens de Serviço paginadas e filtradas
  const carregarOrdens = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: paginaOS,
        size: 20,
        busca: busca || undefined,
        sort: 'id,desc',
      };
      if (filtroStatus !== 'TODOS') {
        params.status = filtroStatus;
      }

      const res = await api.get('/ordens', { params });
      setOrdens(res.data.content || []);
      setTotalPaginasOS(res.data.totalPages || 1);
      setTotalElementos(res.data.totalElements || 0);
    } catch (err) {
      error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  }, [error, paginaOS, filtroStatus, busca]);

  useEffect(() => {
    carregarOrdens();
  }, [carregarOrdens]);

  // 3. Resetar página para 0 ao mudar filtros de busca ou status
  useEffect(() => {
    setPaginaOS(0);
  }, [filtroStatus, busca]);

  // --- FUNÇÃO MAGICA UNIFICADA DE CALCULO ---
  const calcularTotalOS = (state) => {
    const servico = parseFloat(state.valorServico) || 0;
    const km = parseFloat(state.quilometragem) || 0;
    const precoKm = parseFloat(state.valorKm) || 0;
    const vMateriais = state.materiais?.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0) || 0;
    const torno = parseFloat(state.valorTorno) || 0;
    return (servico + vMateriais + (km * precoKm) + torno).toFixed(2);
  };

  // Atualiza um campo e recalcula o total imediatamente
  const atualizarCampoMagico = (campo, valor) => {
    setForm(prev => {
      const newState = { ...prev, [campo]: valor };
      newState.valorTotal = calcularTotalOS(newState);
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
    const s = servicos.find(sv => sv.id === id);
    if (!s) return;

    setForm(prev => {
      const jatem = prev.itensServico.some(item => item.id === id);
      const novosItens = jatem
        ? prev.itensServico.filter(item => item.id !== id)
        : [...prev.itensServico, { id: s.id, nomeServico: s.nomeServico, precoTabela: s.precoTabela, precoCobrado: Number(s.precoTabela || 0).toFixed(2) }];
      
      // Quando seleciona um serviço do catálogo, ele soma todos e joga no "valorServico"
      const novoValorCat = novosItens.reduce((acc, item) => {
        return acc + Number(item.precoCobrado || 0);
      }, 0);

      const newState = { 
        ...prev, 
        itensServico: novosItens, 
        valorServico: novoValorCat.toFixed(2),
      };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
    });
  };

  const handleEditarPrecoServico = (id, novoPreco) => {
    setForm(prev => {
      const novosItens = prev.itensServico.map(item => {
        if (item.id === id) {
          return { ...item, precoCobrado: novoPreco };
        }
        return item;
      });

      // Recalcula o valor total dos serviços
      const novoValorCat = novosItens.reduce((acc, item) => {
        return acc + Number(item.precoCobrado || 0);
      }, 0);

      const newState = {
        ...prev,
        itensServico: novosItens,
        valorServico: novoValorCat.toFixed(2),
      };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
    });
  };

  const adicionarMaterialCatalogo = (item) => {
    setForm(prev => {
      if (prev.materiais.some(i => i.id === item.id)) {
        error('Material já adicionado.');
        return prev;
      }
      const novos = [...prev.materiais, { 
        id: item.id, 
        nomeMaterial: item.nomeMaterial, 
        precoUnitario: item.precoTabela, 
        quantidade: 1,
        precoTotal: item.precoTabela 
      }];
      
      const newState = {
        ...prev,
        materiais: novos,
      };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
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
      const novos = [...prev.materiais, { 
        id: null, 
        nomeMaterial: novoMaterialDescricao, 
        precoUnitario: preco,
        quantidade: qtd,
        precoTotal: preco * qtd
      }];
      
      const newState = {
        ...prev,
        materiais: novos,
      };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
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
      
      const newState = { ...prev, materiais: novos };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
    });
  };

  const atualizarQtdMaterial = (index, novaQtd) => {
    const qtd = Number(novaQtd) || 0;
    setForm(prev => {
      const novos = [...prev.materiais];
      novos[index].quantidade = qtd;
      novos[index].precoTotal = novos[index].precoUnitario * qtd;
      
      const newState = { ...prev, materiais: novos };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
    });
  };

  const atualizarPrecoMaterial = (index, novoPreco) => {
    const p = Number(novoPreco) || 0;
    setForm(prev => {
      const novos = [...prev.materiais];
      novos[index].precoUnitario = p;
      novos[index].precoTotal = p * novos[index].quantidade;
      
      const newState = { ...prev, materiais: novos };
      newState.valorTotal = calcularTotalOS(newState);
      return newState;
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
        dataRealizacao: form.dataRealizacao ? form.dataRealizacao : null,
        observacao: form.observacao,
        veiculo: form.veiculo || null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        valorKm: form.valorKm ? Number(form.valorKm) : null, // Envia o valor do KM
        valorTorno: form.valorTorno ? Number(form.valorTorno) : null, // Envia o valor do Torno
        valorTotal: total,
        itensServico: form.itensServico.map(item => ({
          itemServicoId: Number(item.id),
          precoCobrado: Number(item.precoCobrado || 0)
        })),
        materiais: form.materiais.map(item => ({
          materialId: item.id ? Number(item.id) : null,
          nomeMaterial: item.id ? null : item.nomeMaterial,
          precoUnitario: Number(item.precoUnitario || 0),
          quantidade: Number(item.quantidade || 0),
          precoTotal: Number(item.precoTotal || 0)
        })),
        mecanicos: form.mecanicos.map(m => ({ mecanico: { id: m.mecanicoId } })),
      };
      if (editId) {
        await api.put(`/ordens/${editId}`, payload);
      } else {
        await api.post('/ordens', payload);
      }
      fecharModal();
      await carregarOrdens();
      success(editId ? 'Ordem de Serviço atualizada com sucesso!' : 'Ordem de Serviço criada com sucesso!');
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
      await carregarOrdens();
      success('Status atualizado!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao atualizar status';
      error(typeof msg === 'string' ? msg : 'Erro ao atualizar status');
    }
  };

  const excluir = async (id) => {
    if (!confirm('Excluir esta OS?')) return;
    try {
      await api.delete(`/ordens/${id}`);
      await carregarOrdens();
      success('OS excluída com sucesso!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao excluir OS';
      error(typeof msg === 'string' ? msg : 'Erro ao excluir OS');
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

  const handleCadastrarClienteRapido = async (nome, telefone = '') => {
    if (!nome?.trim()) {
      error('O nome do cliente é obrigatório.');
      return;
    }
    setSalvandoClienteRapido(true);
    try {
      const res = await api.post('/pessoa', {
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        tipo: 'CLIENTE',
        tipoPessoaFisica: true,
      });
      const novo = res.data;
      const novoClienteOption = {
        value: novo.id,
        label: novo.nome,
        sublabel: novo.telefone ? `Tel: ${novo.telefone}` : 'Cliente Rápido',
        searchString: `${novo.nome} ${novo.telefone || ''}`
      };
      setClientesExtras(prev => [novoClienteOption, ...prev]);
      atualizarCampoMagico('clienteId', novo.id);
      success(`Cliente "${novo.nome}" cadastrado e selecionado!`);
      setModalClienteRapido(false);
      setClienteRapidoNome('');
      setClienteRapidoTelefone('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao cadastrar cliente rápido';
      error(typeof msg === 'string' ? msg : 'Erro ao cadastrar cliente rápido');
    } finally {
      setSalvandoClienteRapido(false);
    }
  };

  const toggleSelecionarOS = (id) => {
    setOsSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelecionarTodasOS = () => {
    if (osSelecionadas.length === ordens.length && ordens.length > 0) {
      setOsSelecionadas([]);
    } else {
      setOsSelecionadas(ordens.map(o => o.id));
    }
  };

  const selecionarTodasDoCliente = (nomeCliente) => {
    if (!nomeCliente) return;
    const ossDoCliente = ordens.filter(o => 
      o.cliente?.nome === nomeCliente && o.status === 'ABERTA'
    );
    if (ossDoCliente.length === 0) {
      error(`Nenhuma OS aberta encontrada para "${nomeCliente}".`);
      return;
    }
    setOsSelecionadas(prev => {
      const set = new Set(prev);
      ossDoCliente.forEach(o => set.add(o.id));
      return Array.from(set);
    });
    success(`${ossDoCliente.length} OS(s) aberta(s) de "${nomeCliente}" selecionada(s)!`);
  };

  const baixarPdfLote = async () => {
    if (osSelecionadas.length === 0) return error('Selecione ao menos uma OS.');
    setBaixandoPdfLote(true);
    try {
      const res = await api.post('/ordens/pdf-lote', osSelecionadas, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Notinhas_Selecionadas_${osSelecionadas.length}_OS.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success(`${osSelecionadas.length} notinhas unificadas em PDF com sucesso!`);
    } catch (err) {
      error('Erro ao gerar PDF unificado das notinhas.');
    } finally {
      setBaixandoPdfLote(false);
    }
  };

  const baixarPdfMesCliente = async () => {
    if (!pdfMesClienteId) return error('Selecione um cliente para gerar as notinhas do mês.');
    setGerandoPdfMes(true);
    try {
      const res = await api.get(`/ordens/cliente/${pdfMesClienteId}/pdf-periodo`, {
        params: { mes: Number(pdfMesMes), ano: Number(pdfMesAno) },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Notinhas_Cliente_${pdfMesClienteId}_${String(pdfMesMes).padStart(2, '0')}_${pdfMesAno}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('PDF do mês baixado com sucesso!');
      setModalPdfMesAberto(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Nenhuma OS encontrada para este cliente no mês selecionado.';
      error(typeof msg === 'string' ? msg : 'Erro ao gerar PDF do cliente no mês.');
    } finally {
      setGerandoPdfMes(false);
    }
  };

  const alterarStatusEmLote = async (novoStatus) => {
    if (osSelecionadas.length === 0) return;
    const label = STATUS_CONFIG[novoStatus]?.label || novoStatus;
    if (!confirm(`Deseja alterar o status de ${osSelecionadas.length} OS(s) para "${label}"?`)) return;

    setSalvandoStatusLote(true);
    try {
      await api.put('/ordens/status-lote', osSelecionadas, {
        params: { status: novoStatus }
      });
      success(`${osSelecionadas.length} OS(s) alterada(s) para "${label}" com sucesso!`);
      setOsSelecionadas([]);
      await carregarOrdens();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao alterar status em lote.';
      error(typeof msg === 'string' ? msg : 'Erro ao alterar status das OSs.');
    } finally {
      setSalvandoStatusLote(false);
    }
  };

  const ordensFiltradas = ordens;

  // Como o backend já traz paginado, servicosExibidos é o próprio array servicos do estado.
  // Porem precisamos tratar o filtro "SELECIONADOS".
  const servicosExibidos = filtroCatalogo === 'SELECIONADOS' 
    ? form.itensServico 
    : servicos;

  // totalPaginasServicos precisaria vir da API, mas para manter simples na tela, vamos só exibir +1 e -1 
  // se houver resultados na API ou usar um estado caso queiramos o número exato. Como já tínhamos a lógica local,
  // vamos simplificar.
  const mecanicosExibidos = funcionarios;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ordens de Serviço</h2>
          <p className="text-slate-500 text-sm mt-1">{totalElementos} ordens registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setModalPdfMesAberto(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Calendar size={18} /> Notinhas por Cliente/Mês
          </button>
          <button onClick={() => setModalAberto(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition cursor-pointer">
            <Plus size={18} /> Nova OS
          </button>
        </div>
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
        {busca.trim() && (
          <button
            type="button"
            onClick={() => {
              const abertasBusca = ordens.filter(o => o.status === 'ABERTA');
              if (abertasBusca.length === 0) {
                error('Nenhuma OS aberta encontrada na busca atual.');
                return;
              }
              setOsSelecionadas(prev => {
                const set = new Set(prev);
                abertasBusca.forEach(o => set.add(o.id));
                return Array.from(set);
              });
              success(`${abertasBusca.length} OS(s) aberta(s) selecionada(s)!`);
            }}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2.5 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Selecionar todas as OS abertas da busca"
          >
            <CheckSquare size={14} /> Marcar todas abertas da busca
          </button>
        )}
        {['TODOS', 'ABERTA', 'CONCLUIDA', 'CANCELADA'].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${filtroStatus === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}>
            {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Barra de ações para OS selecionadas */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl mb-3 text-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelecionarTodasOS}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer select-none"
          >
            {osSelecionadas.length > 0 && osSelecionadas.length === ordens.length ? (
              <CheckSquare size={18} className="text-blue-600" />
            ) : (
              <Square size={18} className="text-slate-400" />
            )}
            <span>
              {osSelecionadas.length > 0 && osSelecionadas.length === ordens.length
                ? 'Desmarcar todas'
                : 'Selecionar todas desta página'}
            </span>
          </button>
          {osSelecionadas.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
              {osSelecionadas.length} selecionada{osSelecionadas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {osSelecionadas.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alterarStatusEmLote('CONCLUIDA')}
              disabled={salvandoStatusLote}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
              title="Marcar OSs selecionadas como Concluídas (envia para o Financeiro)"
            >
              <CheckCircle size={14} />
              Concluir ({osSelecionadas.length})
            </button>
            <button
              type="button"
              onClick={() => alterarStatusEmLote('ABERTA')}
              disabled={salvandoStatusLote}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
              title="Reabrir OSs selecionadas"
            >
              <Clock size={14} />
              Reabrir ({osSelecionadas.length})
            </button>
            <button
              type="button"
              onClick={() => alterarStatusEmLote('CANCELADA')}
              disabled={salvandoStatusLote}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
              title="Cancelar OSs selecionadas"
            >
              <XCircle size={14} />
              Cancelar ({osSelecionadas.length})
            </button>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            <button
              type="button"
              onClick={baixarPdfLote}
              disabled={baixandoPdfLote}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Download size={14} />
              {baixandoPdfLote ? 'Gerando PDF...' : `PDF Unificado (${osSelecionadas.length})`}
            </button>
            <button
              type="button"
              onClick={() => setOsSelecionadas([])}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </div>

      {/* Lista de OS */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
        {!loading && ordensFiltradas.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Nenhuma ordem encontrada</p>
          </div>
        )}
        {!loading && ordensFiltradas.map(os => {
          const st = STATUS_CONFIG[os.status] || STATUS_CONFIG.ABERTA;
          const isSelected = osSelecionadas.includes(os.id);
          return (
            <div 
              key={os.id} 
              className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => toggleSelecionarOS(os.id)}
                  className="mt-1 text-slate-400 hover:text-blue-600 transition cursor-pointer shrink-0"
                  title={isSelected ? 'Desmarcar OS' : 'Selecionar OS'}
                >
                  {isSelected ? (
                    <CheckSquare size={20} className="text-blue-600" />
                  ) : (
                    <Square size={20} className="text-slate-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-sm font-mono">#{String(os.id).padStart(4, '0')}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                    <span className="text-slate-400 text-xs">{os.dataRegisto}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">{os.cliente?.nome || 'Sem cliente'}</h3>
                    {os.cliente?.nome && os.status === 'ABERTA' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selecionarTodasDoCliente(os.cliente.nome);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 font-semibold px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                        title={`Selecionar todas as OSs abertas de ${os.cliente.nome}`}
                      >
                        + Todas
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5 truncate">{os.observacao}</p>
                  {(os.quilometragem || os.veiculo || (os.valorTorno && Number(os.valorTorno) > 0)) && (
                    <p className="text-slate-400 text-xs mt-1.5 flex flex-wrap items-center gap-3">
                      {os.veiculo && <span>🚗 {os.veiculo}</span>}
                      {os.quilometragem && <span>🛤️ {os.quilometragem} km</span>}
                      {os.valorTorno && Number(os.valorTorno) > 0 && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200 inline-flex items-center gap-1">
                          ⚙️ Torno: R$ {formatarMoeda(os.valorTorno)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-slate-900">R$ {formatarMoeda(os.valorTotal || 0)}</p>
                  <div className="flex items-center gap-1 mt-2 justify-end">
                    <select value={os.status || 'ABERTA'} onChange={e => atualizarStatus(os.id, e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 cursor-pointer outline-none focus:border-slate-400">
                      <option value="ABERTA">Aberta</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                    <button type="button" onClick={() => baixarPdf(os.id)} className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1.5 transition" title="Baixar PDF">
                      <Printer size={14} />
                    </button>
                    <button type="button" onClick={() => abrirEditar(os)} className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-md p-1.5 transition" title="Editar OS">
                      <Edit2 size={14} />
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
      {!loading && totalPaginasOS > 1 && (
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

      {/* Modal Nova / Editar OS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-5 z-50 backdrop-blur-[4px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Preencha os dados operacionais e confira o resumo financeiro</p>
              </div>
              <button 
                type="button"
                onClick={fecharModal} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo em 2 Colunas */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Coluna Esquerda: Operacional (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Bloco 1: Dados do Atendimento */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ClipboardList size={16} className="text-blue-600" />
                      Dados do Atendimento
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Cliente *</label>
                          <button
                            type="button"
                            onClick={() => setModalClienteRapido(true)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus size={13} /> + Cliente Rápido
                          </button>
                        </div>
                        <AutocompleteSelect
                          fetchOptions={fetchClientes}
                          options={clientesExtras}
                          value={form.clienteId}
                          onChange={val => atualizarCampoMagico('clienteId', val)}
                          onQuickCreate={termo => handleCadastrarClienteRapido(termo)}
                          quickCreateLabel="Cadastrar rápido"
                          placeholder="Buscar cliente ou cadastrar rápido..."
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Veículo / Maquinário</label>
                        <input
                          placeholder="Ex: Trator Valtra BH180..."
                          className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                          value={form.veiculo}
                          onChange={e => atualizarCampoMagico('veiculo', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Data de Realização</label>
                        <input
                          type="date"
                          className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition text-slate-600"
                          value={form.dataRealizacao}
                          onChange={e => atualizarCampoMagico('dataRealizacao', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Descrição do Serviço *</label>
                        <textarea
                          placeholder="Descreva o que foi realizado: revisão da bomba, troca de vedação, montagem..."
                          className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 resize-none transition"
                          rows={2}
                          value={form.observacao}
                          onChange={e => atualizarCampoMagico('observacao', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Itens da OS (Serviços do Catálogo & Materiais com Abas) */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {/* Abas */}
                    <div className="flex border-b border-slate-200 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setAbaItensOS('SERVICOS')}
                        className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                          abaItensOS === 'SERVICOS'
                            ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Wrench size={14} />
                        Serviços do Catálogo
                        {form.itensServico.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">
                            {form.itensServico.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbaItensOS('MATERIAIS')}
                        className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                          abaItensOS === 'MATERIAIS'
                            ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Package size={14} />
                        Peças & Materiais
                        {form.materiais.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">
                            {form.materiais.length}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {abaItensOS === 'SERVICOS' ? (
                        <div className="space-y-3">
                          {/* Busca e Filtro de Serviços */}
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Buscar serviço no catálogo..."
                                value={buscaServico}
                                onChange={e => { setBuscaServico(e.target.value); setPaginaServicos(1); }}
                                className="w-full border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-slate-900 transition"
                              />
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                              <button
                                type="button"
                                onClick={() => { setFiltroCatalogo('TODOS'); setPaginaServicos(1); }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${filtroCatalogo === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                Todos
                              </button>
                              <button
                                type="button"
                                onClick={() => { setFiltroCatalogo('SELECIONADOS'); setPaginaServicos(1); }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${filtroCatalogo === 'SELECIONADOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                              >
                                Selecionados ({form.itensServico.length})
                              </button>
                            </div>
                          </div>

                          {/* Grid de Serviços */}
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {servicosExibidos.length === 0 && (
                              <div className="col-span-2 py-4 text-center text-slate-400 text-xs">
                                Nenhum serviço encontrado
                              </div>
                            )}
                            {servicosExibidos.map(s => {
                              const selecionado = form.itensServico.some(item => item.id === s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => toggleServico(s.id)}
                                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                                    selecionado ? 'border-blue-600 bg-blue-50/60 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <p className="font-semibold text-xs truncate">{s.nomeServico}</p>
                                  <p className="text-[11px] mt-0.5 text-slate-400">R$ {formatarMoeda(s.precoTabela || 0)}</p>
                                </button>
                              );
                            })}
                          </div>

                          {/* Paginação de Serviços */}
                          <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400 font-medium">Página {paginaServicos}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPaginaServicos(p => Math.max(p - 1, 1))}
                                disabled={paginaServicos === 1}
                                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaginaServicos(p => p + 1)}
                                disabled={servicosExibidos.length < servicosPorPagina}
                                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Serviços Selecionados com Preço Editável */}
                          {form.itensServico.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 mt-2">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b border-slate-200/80 pb-1.5">
                                <span>Serviços Selecionados ({form.itensServico.length})</span>
                                <span className="text-[11px] text-slate-400 font-normal">Edite o valor se necessário</span>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {form.itensServico.map(item => (
                                  <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs text-slate-800 truncate">{item.nomeServico}</p>
                                      <p className="text-[10px] text-slate-400">Tabela: R$ {formatarMoeda(item.precoTabela || 0)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[11px] text-slate-400 font-medium">Cobrado:</span>
                                      <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-semibold">R$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={item.precoCobrado}
                                          onChange={e => handleEditarPrecoServico(item.id, e.target.value)}
                                          className="w-full border border-slate-200 pl-6 pr-1.5 py-1 rounded text-xs outline-none focus:border-slate-900 transition"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleServico(item.id)}
                                        className="text-slate-300 hover:text-red-500 p-1 transition cursor-pointer"
                                        title="Remover serviço"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Sub-abas de materiais */}
                          <div className="flex p-0.5 bg-slate-100 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setFiltroCatMaterial('TODOS')}
                              className={`flex-1 py-1 text-xs font-bold rounded-md transition ${filtroCatMaterial === 'TODOS' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Do Catálogo
                            </button>
                            <button
                              type="button"
                              onClick={() => setFiltroCatMaterial('NOVO')}
                              className={`flex-1 py-1 text-xs font-bold rounded-md transition ${filtroCatMaterial === 'NOVO' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              Material Avulso
                            </button>
                          </div>

                          {filtroCatMaterial === 'TODOS' ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                  type="text"
                                  placeholder="Buscar material no catálogo..."
                                  value={buscaMaterial}
                                  onChange={e => { setBuscaMaterial(e.target.value); setPaginaMateriais(1); }}
                                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                {materiaisCat
                                  .filter(m => (m.nomeMaterial || '').toLowerCase().includes(buscaMaterial.toLowerCase()))
                                  .slice((paginaMateriais - 1) * materiaisPorPagina, paginaMateriais * materiaisPorPagina)
                                  .map(m => (
                                    <div key={m.id} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{m.nomeMaterial}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">R$ {formatarMoeda(m.precoTabela)}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => adicionarMaterialCatalogo(m)}
                                        className="p-1 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                                        title="Adicionar à OS"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                  ))}
                              </div>
                              {Math.ceil(materiaisCat.filter(m => (m.nomeMaterial || '').toLowerCase().includes(buscaMaterial.toLowerCase())).length / materiaisPorPagina) > 1 && (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  <button type="button" onClick={() => setPaginaMateriais(p => Math.max(p - 1, 1))} disabled={paginaMateriais === 1} className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronLeft size={13} /></button>
                                  <span className="text-[11px] font-semibold text-slate-400">{paginaMateriais}</span>
                                  <button type="button" onClick={() => setPaginaMateriais(p => p + 1)} disabled={paginaMateriais === Math.ceil(materiaisCat.filter(m => (m.nomeMaterial || '').toLowerCase().includes(buscaMaterial.toLowerCase())).length / materiaisPorPagina)} className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronRight size={13} /></button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Descrição</label>
                                <input
                                  type="text"
                                  value={novoMaterialDescricao}
                                  onChange={e => setNovoMaterialDescricao(e.target.value)}
                                  placeholder="Ex: Óleo 15W40, Retentor..."
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Qtd</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={novoMaterialQtd}
                                    onChange={e => setNovoMaterialQtd(e.target.value)}
                                    placeholder="1"
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Preço Un. (R$)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={novoMaterialPreco}
                                    onChange={e => setNovoMaterialPreco(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={adicionarMaterialNovo}
                                className="w-full py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
                              >
                                Adicionar Material
                              </button>
                            </div>
                          )}

                          {/* Materiais Adicionados */}
                          {form.materiais.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 mt-2">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-800 border-b border-slate-200/80 pb-1.5">
                                <span>Materiais na OS ({form.materiais.length})</span>
                                <span className="text-slate-500 font-semibold">
                                  R$ {formatarMoeda(form.materiais.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0))}
                                </span>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {form.materiais.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs text-slate-800 truncate">{item.nomeMaterial}</p>
                                      <p className="text-[10px] text-slate-400">{item.id ? 'Catálogo' : 'Avulso'}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <div className="w-14">
                                        <input
                                          type="number" step="0.01" min="0" value={item.quantidade} onChange={e => atualizarQtdMaterial(index, e.target.value)}
                                          className="w-full border border-slate-200 px-1.5 py-1 rounded text-xs outline-none focus:border-slate-900 text-center"
                                          title="Quantidade"
                                        />
                                      </div>
                                      <div className="relative w-20">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">R$</span>
                                        <input
                                          type="number" step="0.01" min="0" value={item.precoUnitario} onChange={e => atualizarPrecoMaterial(index, e.target.value)}
                                          className="w-full border border-slate-200 pl-5 pr-1 py-1 rounded text-xs outline-none focus:border-slate-900"
                                          title="Preço Unitário"
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-800 w-16 text-right">
                                        R$ {formatarMoeda(item.precoTotal)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removerMaterial(index)}
                                        className="text-slate-300 hover:text-red-500 p-1 transition cursor-pointer"
                                        title="Remover material"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloco 3: Mecânicos Responsáveis */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>👨‍🔧 Mecânicos Responsáveis</span>
                      </h4>
                      {form.mecanicos.length > 0 && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                          {form.mecanicos.length} selecionado(s)
                        </span>
                      )}
                    </div>

                    {/* Busca de Mecânicos */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar mecânico..."
                        value={buscaMecanico}
                        onChange={e => { setBuscaMecanico(e.target.value); setPaginaMecanicos(1); }}
                        className="w-full border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-slate-900 transition"
                      />
                    </div>

                    {/* Grid de Mecânicos */}
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {mecanicosExibidos.length === 0 && (
                        <div className="col-span-2 py-4 text-center text-slate-400 text-xs">
                          Nenhum mecânico encontrado
                        </div>
                      )}
                      {mecanicosExibidos.map(f => {
                        const selecionado = form.mecanicos.some(m => m.mecanicoId === f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleMecanico(f.id)}
                            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                              selecionado ? 'border-blue-600 bg-blue-50/60 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <p className="font-semibold text-xs truncate">{f.nome}</p>
                            <p className="text-[11px] mt-0.5 text-slate-400">{f.cargo || 'Mecânico'} • {f.percentualComissao || 0}% comissão</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Paginação de Mecânicos */}
                    <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Página {paginaMecanicos}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPaginaMecanicos(p => Math.max(p - 1, 1))}
                          disabled={paginaMecanicos === 1}
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaginaMecanicos(p => p + 1)}
                          disabled={mecanicosExibidos.length < mecanicosPorPagina}
                          className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Painel Financeiro Sticky (5 cols) */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Painel Financeiro da OS</span>
                      <span className="text-[11px] font-normal text-slate-500">Cálculo automático</span>
                    </h4>

                    {/* Valor da Mão de Obra / Serviços */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mão de Obra / Serviços</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={`w-full border border-slate-200 pl-8 pr-3 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition ${
                            form.itensServico.length > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                          }`}
                          value={form.valorServico}
                          onChange={e => atualizarCampoMagico('valorServico', e.target.value)}
                          disabled={form.itensServico.length > 0}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {form.itensServico.length > 0
                          ? 'Somatório dos serviços selecionados no catálogo.'
                          : 'Preencha o valor avulso caso não use o catálogo.'}
                      </p>
                    </div>

                    {/* Valor dos Materiais */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Peças & Materiais</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                        <input
                          type="text"
                          className="w-full border border-slate-200 pl-8 pr-3 py-2 rounded-lg text-sm outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                          value={form.materiais.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0).toFixed(2)}
                          disabled
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {form.materiais.length} material(is) adicionado(s).
                      </p>
                    </div>

                    {/* SERVIÇO DE TORNO */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>⚙️ Serviço de Torno</span>
                        </label>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          Sem comissão
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border border-amber-200 pl-8 pr-3 py-2 rounded-lg text-sm outline-none focus:border-amber-500 transition bg-white"
                          value={form.valorTorno}
                          onChange={e => atualizarCampoMagico('valorTorno', e.target.value)}
                        />
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Cobrado do cliente, mas excluído da comissão de qualquer mecânico.
                      </p>
                    </div>

                    {/* Deslocamento / KM */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Deslocamento / Viagem</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Km"
                            className="w-full border border-slate-200 px-3 pr-8 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition bg-white"
                            value={form.quilometragem}
                            onChange={e => atualizarCampoMagico('quilometragem', e.target.value)}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">km</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="R$/km"
                            className="w-full border border-slate-200 pl-7 pr-2 py-2 rounded-lg text-sm outline-none focus:border-slate-900 transition bg-white"
                            value={form.valorKm}
                            onChange={e => atualizarCampoMagico('valorKm', e.target.value)}
                          />
                        </div>
                      </div>
                      {((parseFloat(form.quilometragem)||0) * (parseFloat(form.valorKm)||0)) > 0 && (
                        <p className="text-[11px] text-slate-500 text-right">
                          Custo deslocamento: R$ {formatarMoeda((parseFloat(form.quilometragem)||0) * (parseFloat(form.valorKm)||0))}
                        </p>
                      )}
                    </div>

                    {/* Card Dark Total */}
                    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total da OS</span>
                        <span className="text-2xl font-black text-white">
                          R$ {formatarMoeda(form.valorTotal || 0)}
                        </span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Serviços / Mão de Obra:</span>
                          <span>R$ {formatarMoeda(form.valorServico || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Peças e Materiais:</span>
                          <span>R$ {formatarMoeda(form.materiais.reduce((acc, i) => acc + Number(i.precoTotal || 0), 0))}</span>
                        </div>
                        {Number(form.valorTorno || 0) > 0 && (
                          <div className="flex justify-between text-amber-300 font-semibold">
                            <span>⚙️ Torno (sem comissão):</span>
                            <span>R$ {formatarMoeda(form.valorTorno || 0)}</span>
                          </div>
                        )}
                        {((parseFloat(form.quilometragem)||0) * (parseFloat(form.valorKm)||0)) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Deslocamento:</span>
                            <span>R$ {formatarMoeda((parseFloat(form.quilometragem)||0) * (parseFloat(form.valorKm)||0))}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={fecharModal}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-500/30 cursor-pointer"
                      >
                        {submitting ? (
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          editId ? 'Salvar Alterações' : 'Criar Ordem de Serviço'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido de Cliente */}
      {modalClienteRapido && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-[slideIn_0.2s_ease-out]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Cadastro Rápido de Cliente
              </h3>
              <button 
                type="button"
                onClick={() => setModalClienteRapido(false)} 
                className="text-slate-300 hover:text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <form 
              onSubmit={e => {
                e.preventDefault();
                handleCadastrarClienteRapido(clienteRapidoNome, clienteRapidoTelefone);
              }} 
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: João Fulano"
                  value={clienteRapidoNome}
                  onChange={e => setClienteRapidoNome(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Telefone / WhatsApp (opcional)
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={clienteRapidoTelefone}
                  onChange={e => setClienteRapidoTelefone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Sem necessidade de CPF ou endereço. O cliente será salvo e selecionado imediatamente na OS.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClienteRapido(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoClienteRapido}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {salvandoClienteRapido ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Gerar Notinhas do Mês por Cliente */}
      {modalPdfMesAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-[slideIn_0.2s_ease-out]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Notinhas do Mês (PDF Único)
              </h3>
              <button 
                type="button"
                onClick={() => setModalPdfMesAberto(false)} 
                className="text-slate-300 hover:text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Cliente *
                </label>
                <AutocompleteSelect
                  fetchOptions={fetchClientes}
                  options={clientesExtras}
                  value={pdfMesClienteId}
                  onChange={val => setPdfMesClienteId(val)}
                  placeholder="Buscar cliente para cobrança..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mês de Referência
                  </label>
                  <select
                    value={pdfMesMes}
                    onChange={e => setPdfMesMes(Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white outline-none focus:border-slate-900 transition"
                  >
                    {[
                      { num: 1, nome: 'Janeiro' },
                      { num: 2, nome: 'Fevereiro' },
                      { num: 3, nome: 'Março' },
                      { num: 4, nome: 'Abril' },
                      { num: 5, nome: 'Maio' },
                      { num: 6, nome: 'Junho' },
                      { num: 7, nome: 'Julho' },
                      { num: 8, nome: 'Agosto' },
                      { num: 9, nome: 'Setembro' },
                      { num: 10, nome: 'Outubro' },
                      { num: 11, nome: 'Novembro' },
                      { num: 12, nome: 'Dezembro' }
                    ].map(m => (
                      <option key={m.num} value={m.num}>{m.num.toString().padStart(2, '0')} - {m.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={pdfMesAno}
                    onChange={e => setPdfMesAno(Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    min="2020"
                    max="2035"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-700">
                O sistema junta todas as notas desse cliente na data e gera um <strong>único arquivo PDF</strong> com todas as folhas em sequência para enviar ao cliente.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPdfMesAberto(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={baixarPdfMesCliente}
                  disabled={gerandoPdfMes || !pdfMesClienteId}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} />
                  {gerandoPdfMes ? 'Gerando...' : 'Gerar e Baixar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}