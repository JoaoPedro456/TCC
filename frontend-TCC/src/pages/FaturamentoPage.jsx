import { formatarMoeda as formatarMoedaUtil } from '../utils/formatters';
import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Plus, Clock, AlertCircle, Trash2, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, BadgePercent, Percent, CheckSquare } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider.jsx';

const FORMAS_PAGAMENTO = [
  { id: 'PIX', label: 'PIX', icon: '📱' },
  { id: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
  { id: 'CARTAO_DEBITO', label: 'Débito', icon: '💳' },
  { id: 'CARTAO_CREDITO', label: 'Crédito', icon: '💳' },
  { id: 'BOLETO', label: 'Boleto', icon: '📄' },
];

export function FaturamentoPage() {
  const [abaAtiva, setAbaAtiva] = useState('RECEBER'); 
  const [loading, setLoading] = useState(false);
  
  // --- NOVOS ESTADOS PARA FILTRO E PAGINAÇÃO ---
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS'); // TODOS, PENDENTE, PAGO, ATRASADO
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  
  const [contasSelecionadasMap, setContasSelecionadasMap] = useState({});
  const selecionados = Object.keys(contasSelecionadasMap).map(Number);
  const listaSelecionadas = Object.values(contasSelecionadasMap);
  // ---------------------------------------------

  const [modalAberto, setModalAberto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formInicial = { descricao: '', envolvido: '', valor: '', vencimento: '', tipo: 'RECEBER', status: 'PENDENTE' };
  const [form, setForm] = useState(formInicial);

  // Estados para baixa individual (com desconto ou parcial)
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [contaParaBaixa, setContaParaBaixa] = useState(null);
  const [modoBaixaIndividual, setModoBaixaIndividual] = useState('TOTAL'); // 'TOTAL' ou 'PARCIAL'
  const [baixaDesconto, setBaixaDesconto] = useState('0');
  const [baixaValorParcial, setBaixaValorParcial] = useState('');
  const [baixaNovoVencimento, setBaixaNovoVencimento] = useState('');
  const [baixaFormaPagamento, setBaixaFormaPagamento] = useState('PIX');
  const [baixaDataPagamento, setBaixaDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);

  // Estados para baixa em LOTE com desconto e pagamento parcial
  const [modalBaixaLoteAberto, setModalBaixaLoteAberto] = useState(false);
  const [modoAbaBaixaLote, setModoAbaBaixaLote] = useState('TOTAL'); // 'TOTAL' (Quitação) ou 'PARCIAL' (Abatimento)
  const [baixaLoteValorParcial, setBaixaLoteValorParcial] = useState('');
  const [baixaLoteNovoVencimento, setBaixaLoteNovoVencimento] = useState('');
  const [modoDescontoLote, setModoDescontoLote] = useState('TOTAL'); // 'TOTAL' ou 'INDIVIDUAL'
  const [descontoLoteTotal, setDescontoLoteTotal] = useState('0');
  const [descontosIndividuais, setDescontosIndividuais] = useState({}); // { [id]: string }
  const [formaPagamentoLote, setFormaPagamentoLote] = useState('PIX');
  const [dataPagamentoLote, setDataPagamentoLote] = useState(new Date().toISOString().split('T')[0]);
  const [salvandoBaixaLote, setSalvandoBaixaLote] = useState(false);

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
        status: filtroStatus !== 'TODOS' ? filtroStatus : undefined,
        sort: 'id,desc'
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
    setContasSelecionadasMap({}); // Limpa a seleção ao mudar filtros
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

  const abrirModalBaixa = (conta) => {
    if (!conta) return;
    if (conta.status === 'PAGO') {
      error('Esta conta já foi dada como paga e não pode receber baixa novamente.');
      return;
    }
    setContaParaBaixa(conta);
    setModoBaixaIndividual('TOTAL');
    setBaixaDesconto('0');
    setBaixaValorParcial('');
    setBaixaFormaPagamento('PIX');
    setBaixaDataPagamento(new Date().toISOString().split('T')[0]);
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    setBaixaNovoVencimento(d30.toISOString().split('T')[0]);
    setModalBaixaAberto(true);
  };

  const confirmarBaixaComDesconto = async (e) => {
    if (e) e.preventDefault();
    if (!contaParaBaixa) return;

    if (contaParaBaixa.status === 'PAGO') {
      return error('Esta conta já foi quitada e não pode receber baixa novamente.');
    }

    if (modoBaixaIndividual === 'PARCIAL') {
      const valorParcialNum = parseFloat(baixaValorParcial) || 0;
      if (valorParcialNum <= 0) {
        return error('Informe um valor recebido maior que zero.');
      }
      if (valorParcialNum >= contaParaBaixa.valor) {
        return error('Para quitar o valor integral ou maior, utilize a aba de Quitação Total.');
      }
      setSalvandoBaixa(true);
      try {
        await api.put(`/financeiro/${contaParaBaixa.id}/baixa`, {
          pagamentoParcial: true,
          valorRecebidoParcial: valorParcialNum,
          formaPagamento: baixaFormaPagamento,
          dataPagamento: baixaDataPagamento || new Date().toISOString().split('T')[0],
          novoVencimentoRestante: baixaNovoVencimento || undefined
        });
        const saldoRestante = contaParaBaixa.valor - valorParcialNum;
        success(`Pagamento parcial de ${formatarMoeda(valorParcialNum)} registrado! Saldo de ${formatarMoeda(saldoRestante)} permanece em aberto.`);
        setModalBaixaAberto(false);
        setContaParaBaixa(null);
        recarregarTudo();
      } catch (err) {
        error(err.response?.data?.message || err.response?.data?.erro || 'Erro ao registrar pagamento parcial.');
      } finally {
        setSalvandoBaixa(false);
      }
      return;
    }

    const descNum = parseFloat(baixaDesconto) || 0;
    if (descNum < 0) {
      return error('O desconto não pode ser negativo.');
    }
    if (descNum > contaParaBaixa.valor) {
      return error('O desconto não pode ser maior que o valor da conta.');
    }

    setSalvandoBaixa(true);
    try {
      const valorPago = contaParaBaixa.valor - descNum;
      await api.put(`/financeiro/${contaParaBaixa.id}/baixa`, {
        desconto: descNum,
        valorPago: valorPago,
        formaPagamento: baixaFormaPagamento,
        dataPagamento: baixaDataPagamento || new Date().toISOString().split('T')[0]
      });
      success(`Baixa realizada com sucesso! Valor: ${formatarMoeda(valorPago)} (${baixaFormaPagamento})`);
      setModalBaixaAberto(false);
      setContaParaBaixa(null);
      recarregarTudo();
    } catch (err) {
      error('Erro ao dar baixa no lançamento.');
    } finally {
      setSalvandoBaixa(false);
    }
  };

  const selecionarTodasDoCliente = (nomeCliente) => {
    if (!nomeCliente) return;
    const nomeLimpo = nomeCliente.trim().toLowerCase();
    const contasAbertasCliente = contas.filter(c => 
      c.status !== 'PAGO' && 
      (c.envolvido || '').trim().toLowerCase() === nomeLimpo
    );
    if (contasAbertasCliente.length === 0) {
      error(`Nenhuma conta em aberto para "${nomeCliente}" encontrada na lista atual.`);
      return;
    }
    setContasSelecionadasMap(prev => {
      const next = { ...prev };
      contasAbertasCliente.forEach(c => {
        next[c.id] = c;
      });
      return next;
    });
    success(`${contasAbertasCliente.length} conta(s) em aberto de "${nomeCliente}" selecionada(s)!`);
  };

  const atualizarStatus = async (id, novoStatus) => {
    if (novoStatus === 'PAGO') {
      const conta = contas.find(c => c.id === id);
      if (conta) {
        if (conta.status === 'PAGO') {
          return;
        }
        abrirModalBaixa(conta);
        return;
      }
    }
    try {
      await api.put(`/financeiro/${id}/status?status=${novoStatus}`);
      success('Status atualizado!');
      recarregarTudo();
    } catch (err) {
      error('Erro ao atualizar o status.');
    }
  };

  const excluirLancamento = async (id) => {
    const conta = contas.find(c => c.id === id);
    if (conta && conta.status === 'PAGO') {
      return error('Operação negada: Não é permitido excluir um lançamento financeiro já quitado.');
    }
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/financeiro/${id}`);
      success('Lançamento excluído!');
      recarregarTudo();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao excluir.';
      error(typeof msg === 'string' ? msg : 'Erro ao excluir.');
    }
  };

  const abrirModalBaixaLote = () => {
    if (listaSelecionadas.length === 0) return;
    const jaPagas = listaSelecionadas.filter(c => c.status === 'PAGO');
    if (jaPagas.length > 0) {
      error('Existem contas já quitadas/pagas na seleção. Remova-as antes de prosseguir com a baixa em lote.');
      return;
    }
    setModoAbaBaixaLote('TOTAL');
    setDescontoLoteTotal('0');
    setModoDescontoLote('TOTAL');
    setDescontosIndividuais({});
    setFormaPagamentoLote('PIX');
    setDataPagamentoLote(new Date().toISOString().split('T')[0]);
    setBaixaLoteValorParcial('');
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    setBaixaLoteNovoVencimento(d30.toISOString().split('T')[0]);
    setModalBaixaLoteAberto(true);
  };

  const toggleSelecao = (conta) => {
    if (!conta) return;
    if (conta.status === 'PAGO') {
      error('Contas já pagas não podem ser selecionadas para baixa.');
      return;
    }
    setContasSelecionadasMap(prev => {
      const next = { ...prev };
      if (next[conta.id]) {
        delete next[conta.id];
      } else {
        next[conta.id] = conta;
      }
      return next;
    });
  };

  const toggleSelecionarTodos = () => {
    const contasAbertas = contasPaginadas.filter(c => c.status !== 'PAGO');
    if (contasAbertas.length === 0) {
      error('Não há contas em aberto nesta página para selecionar.');
      return;
    }
    const todasAbertasSelecionadas = contasAbertas.every(c => !!contasSelecionadasMap[c.id]);
    if (todasAbertasSelecionadas) {
      setContasSelecionadasMap(prev => {
        const next = { ...prev };
        contasAbertas.forEach(c => delete next[c.id]);
        return next;
      });
    } else {
      setContasSelecionadasMap(prev => {
        const next = { ...prev };
        contasAbertas.forEach(c => {
          next[c.id] = c;
        });
        return next;
      });
    }
  };

  const formatarMoeda = (valor) => `R$ ${formatarMoedaUtil(valor)}`;
  const formatarData = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // ==========================================
  // LÓGICA DE FILTRAGEM E PAGINAÇÃO
  // ==========================================
  
  const contasPaginadas = contas;
  const contasAbertasPaginadas = contasPaginadas.filter(c => c.status !== 'PAGO');
  const todasAbertasSelecionadas = contasAbertasPaginadas.length > 0 && contasAbertasPaginadas.every(c => !!contasSelecionadasMap[c.id]);
  const indexPrimeiroItem = (paginaAtual - 1) * itensPorPagina;
  const indexUltimoItem = indexPrimeiroItem + contas.length;
  const totalSelecionado = listaSelecionadas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  // Cálculos dinâmicos da Sessão de Descontos em Lote
  const calcularItensLote = () => {
    if (modoDescontoLote === 'INDIVIDUAL') {
      return listaSelecionadas.map(c => {
        const desc = Math.min(Number(c.valor || 0), Math.max(0, parseFloat(descontosIndividuais[c.id]) || 0));
        return {
          ...c,
          descontoCalculado: desc,
          valorFinal: Math.max(0, Number(c.valor || 0) - desc)
        };
      });
    }

    const descTotal = Math.min(totalSelecionado, Math.max(0, parseFloat(descontoLoteTotal) || 0));
    if (descTotal === 0 || totalSelecionado === 0) {
      return listaSelecionadas.map(c => ({
        ...c,
        descontoCalculado: 0,
        valorFinal: Number(c.valor || 0)
      }));
    }

    let acum = 0;
    return listaSelecionadas.map((c, idx) => {
      let desc = 0;
      if (idx === listaSelecionadas.length - 1) {
        desc = Math.max(0, Math.round((descTotal - acum) * 100) / 100);
      } else {
        desc = Math.round(((Number(c.valor || 0) * descTotal) / totalSelecionado) * 100) / 100;
        acum += desc;
      }
      return {
        ...c,
        descontoCalculado: desc,
        valorFinal: Math.max(0, Number(c.valor || 0) - desc)
      };
    });
  };

  const itensCalculadosLote = calcularItensLote();
  const somaDescontosLote = itensCalculadosLote.reduce((acc, i) => acc + i.descontoCalculado, 0);
  const valorLiquidoTotalLote = Math.max(0, totalSelecionado - somaDescontosLote);

  const confirmarBaixaEmLote = async (e) => {
    if (e) e.preventDefault();
    if (listaSelecionadas.length === 0) return;

    const jaPagas = listaSelecionadas.filter(c => c.status === 'PAGO');
    if (jaPagas.length > 0) {
      return error('Existem contas já quitadas/pagas na seleção. Remova-as antes de prosseguir com a baixa.');
    }

    if (modoAbaBaixaLote === 'PARCIAL') {
      const valorParcialNum = parseFloat(baixaLoteValorParcial) || 0;
      if (valorParcialNum <= 0) {
        return error('Informe um valor recebido hoje maior que zero.');
      }
      if (valorParcialNum >= totalSelecionado) {
        return error(`Para receber o valor integral (${formatarMoeda(totalSelecionado)}) ou maior, utilize a aba de Quitação Total.`);
      }
      if (!baixaLoteNovoVencimento) {
        return error('Informe a data de vencimento do saldo restante.');
      }

      setSalvandoBaixaLote(true);
      try {
        const payload = {
          ids: listaSelecionadas.map(c => c.id),
          pagamentoParcial: true,
          valorRecebidoParcial: valorParcialNum,
          novoVencimentoRestante: baixaLoteNovoVencimento,
          formaPagamento: formaPagamentoLote,
          dataPagamento: dataPagamentoLote || new Date().toISOString().split('T')[0],
        };

        await api.put('/financeiro/baixa-lote', payload);
        const saldoRestante = totalSelecionado - valorParcialNum;
        success(`Pagamento parcial de ${formatarMoeda(valorParcialNum)} registrado! Saldo restante de ${formatarMoeda(saldoRestante)} gerado com sucesso.`);
        setModalBaixaLoteAberto(false);
        setContasSelecionadasMap({});
        recarregarTudo();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao registrar pagamento parcial em lote.';
        error(typeof msg === 'string' ? msg : 'Erro ao dar baixa em lote.');
      } finally {
        setSalvandoBaixaLote(false);
      }
      return;
    }

    setSalvandoBaixaLote(true);
    try {
      const payload = {
        ids: listaSelecionadas.map(c => c.id),
        descontoTotal: somaDescontosLote,
        formaPagamento: formaPagamentoLote,
        dataPagamento: dataPagamentoLote || new Date().toISOString().split('T')[0],
        itens: itensCalculadosLote.map(item => ({
          id: item.id,
          desconto: item.descontoCalculado,
          valorPago: item.valorFinal
        }))
      };

      await api.put('/financeiro/baixa-lote', payload);
      success(`${listaSelecionadas.length} contas quitadas com sucesso! Desconto total aplicado: ${formatarMoeda(somaDescontosLote)}`);
      setModalBaixaLoteAberto(false);
      setContasSelecionadasMap({});
      recarregarTudo();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || 'Erro ao dar baixa nas contas selecionadas.';
      error(typeof msg === 'string' ? msg : 'Erro ao dar baixa em lote.');
    } finally {
      setSalvandoBaixaLote(false);
    }
  };

  // Função para gerar as caixinhas de paginação (até 10 caixinhas visíveis com avanço inteligente)
  const renderizarBotoesPaginacao = () => {
    const maxBotoes = 10;
    let paginas = [];

    if (totalPaginas <= maxBotoes) {
      paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
    } else {
      const metade = Math.floor(maxBotoes / 2); // 5
      let inicio = paginaAtual - metade;
      let fim = paginaAtual + (maxBotoes - metade - 1);

      if (inicio < 1) {
        inicio = 1;
        fim = maxBotoes;
      } else if (fim > totalPaginas) {
        fim = totalPaginas;
        inicio = totalPaginas - maxBotoes + 1;
      }

      for (let i = inicio; i <= fim; i++) {
        paginas.push(i);
      }
    }

    const primeiroVisivel = paginas[0] || 1;
    const ultimoVisivel = paginas[paginas.length - 1] || totalPaginas;

    return (
      <div className="flex items-center gap-1">
        {/* Ir para primeira página se ela não estiver no grupo visível */}
        {primeiroVisivel > 1 && (
          <>
            <button
              type="button"
              onClick={() => setPaginaAtual(1)}
              className="w-8 h-8 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer"
              title="Primeira página (1)"
            >
              1
            </button>
            {primeiroVisivel > 2 && (
              <button
                type="button"
                onClick={() => setPaginaAtual(Math.max(1, primeiroVisivel - maxBotoes))}
                className="w-8 h-8 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                title={`Voltar ${maxBotoes} páginas`}
              >
                ...
              </button>
            )}
          </>
        )}

        {/* Caixinhas das páginas (até 10 caixinhas) */}
        {paginas.map(numeroDaPagina => (
          <button
            key={numeroDaPagina}
            type="button"
            onClick={() => setPaginaAtual(numeroDaPagina)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              paginaAtual === numeroDaPagina 
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30' 
                : 'border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-400'
            }`}
          >
            {numeroDaPagina}
          </button>
        ))}

        {/* Ir para última página se ela não estiver no grupo visível */}
        {ultimoVisivel < totalPaginas && (
          <>
            {ultimoVisivel < totalPaginas - 1 && (
              <button
                type="button"
                onClick={() => setPaginaAtual(Math.min(totalPaginas, ultimoVisivel + maxBotoes))}
                className="w-8 h-8 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                title={`Avançar ${maxBotoes} páginas`}
              >
                ...
              </button>
            )}
            <button
              type="button"
              onClick={() => setPaginaAtual(totalPaginas)}
              className="w-8 h-8 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 transition-colors cursor-pointer"
              title={`Última página (${totalPaginas})`}
            >
              {totalPaginas}
            </button>
          </>
        )}
      </div>
    );
  };

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

        {/* Barra de Filtros e Busca */}
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full md:w-auto">
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
            {busca.trim() && (
              <button
                type="button"
                onClick={() => {
                  const termo = busca.trim().toLowerCase();
                  const abertasBusca = contas.filter(c => 
                    c.status !== 'PAGO' && 
                    ((c.envolvido || '').toLowerCase().includes(termo) || (c.descricao || '').toLowerCase().includes(termo))
                  );
                  if (abertasBusca.length === 0) {
                    error(`Nenhuma conta em aberto encontrada para "${busca}".`);
                    return;
                  }
                  setContasSelecionadasMap(prev => {
                    const next = { ...prev };
                    abertasBusca.forEach(c => { next[c.id] = c; });
                    return next;
                  });
                  success(`${abertasBusca.length} conta(s) em aberto selecionada(s)!`);
                }}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                title={`Selecionar todas as contas em aberto da busca`}
              >
                <CheckSquare size={14} /> Marcar todas da busca
              </button>
            )}
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
                      checked={todasAbertasSelecionadas} 
                      disabled={contasAbertasPaginadas.length === 0}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                      title={contasAbertasPaginadas.length === 0 ? "Não há contas em aberto nesta página" : "Selecionar todas as contas em aberto desta página"}
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
                    <tr key={conta.id} className={`hover:bg-slate-50 transition-colors group ${contasSelecionadasMap[conta.id] ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={!!contasSelecionadasMap[conta.id]} 
                          disabled={conta.status === 'PAGO'}
                          onChange={() => toggleSelecao(conta)} 
                          className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${
                            conta.status === 'PAGO' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`} 
                          title={conta.status === 'PAGO' ? 'Esta conta já foi paga e não pode ser selecionada para baixa' : 'Selecionar conta'}
                        />
                      </td>
                      <td className="p-4 text-slate-900 font-medium">{conta.descricao}</td>
                      <td className="p-4 text-slate-600 text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-800">{conta.envolvido}</span>
                          {conta.status !== 'PAGO' && (
                            <button
                              type="button"
                              onClick={() => selecionarTodasDoCliente(conta.envolvido)}
                              className="text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                              title={`Marcar todas as contas em aberto de ${conta.envolvido}`}
                            >
                              + Todas
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{formatarData(conta.vencimento)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5">
                            <select 
                              value={conta.status} 
                              disabled={conta.status === 'PAGO'}
                              onChange={(e) => atualizarStatus(conta.id, e.target.value)}
                              className={`text-xs font-bold rounded-full px-2.5 py-1 transition-colors border ${
                                conta.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 cursor-not-allowed opacity-90' : 
                                conta.status === 'ATRASADO' ? 'bg-red-100 text-red-700 border-red-200 cursor-pointer outline-none' : 
                                'bg-amber-100 text-amber-700 border-amber-200 cursor-pointer outline-none'
                              }`}
                              title={conta.status === 'PAGO' ? 'Lançamentos já quitados não podem ter seu status alterado diretamente' : 'Alterar status'}
                            >
                              <option value="PENDENTE">⏳ Pendente</option>
                              <option value="PAGO">✅ Pago</option>
                              <option value="ATRASADO">⚠️ Atrasado</option>
                            </select>
                            {conta.status !== 'PAGO' && (
                              <button
                                type="button"
                                onClick={() => abrirModalBaixa(conta)}
                                className="text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                                title="Dar baixa"
                              >
                                Baixa
                              </button>
                            )}
                          </div>
                          {conta.status === 'PAGO' && conta.formaPagamento && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                              {conta.formaPagamento === 'PIX' ? '📱 PIX' :
                               conta.formaPagamento === 'DINHEIRO' ? '💵 Dinheiro' :
                               conta.formaPagamento === 'CARTAO_DEBITO' ? '💳 Débito' :
                               conta.formaPagamento === 'CARTAO_CREDITO' ? '💳 Crédito' :
                               conta.formaPagamento === 'BOLETO' ? '📄 Boleto' : conta.formaPagamento}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`p-4 text-right ${abaAtiva === 'RECEBER' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {conta.status === 'PAGO' && conta.desconto && Number(conta.desconto) > 0 ? (
                          <div>
                            <span className="font-black text-base">{formatarMoeda(conta.valorPago ?? (conta.valor - conta.desconto))}</span>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Original: {formatarMoeda(conta.valor)}
                            </div>
                            <div className="text-[10px] text-amber-600 font-semibold">
                              Desc: -{formatarMoeda(conta.desconto)}
                            </div>
                          </div>
                        ) : (
                          <span className={`font-black ${conta.status === 'PAGO' ? 'opacity-50 line-through decoration-2' : ''}`}>
                            {formatarMoeda(conta.valor)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {conta.status === 'PAGO' ? (
                          <span 
                            className="text-slate-300 p-2 cursor-not-allowed inline-block"
                            title="Lançamentos já quitados (PAGO) não podem ser excluídos"
                          >
                            <Trash2 size={16} className="opacity-30" />
                          </span>
                        ) : (
                          <button 
                            onClick={() => excluirLancamento(conta.id)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50 gap-3">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-900">{contasPaginadas.length > 0 ? indexPrimeiroItem + 1 : 0}</span> a <span className="font-bold text-slate-900">{indexUltimoItem}</span> de <span className="font-bold text-slate-900">{totalElementos}</span> registros
            </p>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
              <button 
                type="button"
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Primeira página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              {renderizarBotoesPaginacao()}

              <button 
                type="button"
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Última página"
              >
                <ChevronsRight size={16} />
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
            type="button"
            onClick={abrirModalBaixaLote} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle size={18} /> Dar Baixa
          </button>
          <button
            type="button"
            onClick={() => setContasSelecionadasMap({})}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            Limpar
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

      {/* Modal de Baixa / Quitação */}
      {modalBaixaAberto && contaParaBaixa && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-[3px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-[slideIn_0.2s_ease-out] overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Baixa & Recebimento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {contaParaBaixa.descricao} • <span className="font-semibold text-slate-700">{contaParaBaixa.envolvido}</span>
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setModalBaixaAberto(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={confirmarBaixaComDesconto} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Abas: Quitação Total vs Pagamento Parcial */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModoBaixaIndividual('TOTAL')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    modoBaixaIndividual === 'TOTAL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💵 Quitação Total (com ou sem desc.)
                </button>
                <button
                  type="button"
                  onClick={() => setModoBaixaIndividual('PARCIAL')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    modoBaixaIndividual === 'PARCIAL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ✂️ Pagamento Parcial (Abatimento)
                </button>
              </div>

              {/* Seletor de Forma de Pagamento */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {FORMAS_PAGAMENTO.map(fp => (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => setBaixaFormaPagamento(fp.id)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1 ${
                        baixaFormaPagamento === fp.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-base">{fp.icon}</span>
                      <span className="text-[11px] truncate w-full">{fp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {modoBaixaIndividual === 'TOTAL' ? (
                <>
                  {/* Seção de Desconto */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block">
                      Desconto Concedido (R$)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={contaParaBaixa.valor}
                          placeholder="0.00"
                          value={baixaDesconto}
                          onChange={e => setBaixaDesconto(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-amber-700 outline-none focus:border-emerald-600 bg-white"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setBaixaDesconto('0')}
                          className="text-[11px] px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                        >
                          Zerar
                        </button>
                        <button
                          type="button"
                          onClick={() => setBaixaDesconto((contaParaBaixa.valor * 0.03).toFixed(2))}
                          className="text-[11px] px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                        >
                          3%
                        </button>
                        <button
                          type="button"
                          onClick={() => setBaixaDesconto((contaParaBaixa.valor * 0.05).toFixed(2))}
                          className="text-[11px] px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                        >
                          5%
                        </button>
                        <button
                          type="button"
                          onClick={() => setBaixaDesconto((contaParaBaixa.valor * 0.10).toFixed(2))}
                          className="text-[11px] px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                        >
                          10%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DIDÁTICA VISUAL DE 3 CORES */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ⚪ Valor Original
                      </span>
                      <span className="text-base font-black text-slate-800 mt-0.5 block">
                        {formatarMoeda(contaParaBaixa.valor)}
                      </span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                        🔴 Desconto Aplicado
                      </span>
                      <span className="text-base font-black text-rose-700 mt-0.5 block">
                        - {formatarMoeda(parseFloat(baixaDesconto) || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Card Verde Grande */}
                  <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-500/40 flex justify-between items-center shadow-xs">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 uppercase block tracking-wider">
                        🟢 TOTAL A RECEBER EM CAIXA
                      </span>
                      <span className="text-[11px] text-emerald-700 mt-0.5 block">
                        Conferir na maquininha ou dinheiro físico
                      </span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700">
                      {formatarMoeda(Math.max(0, contaParaBaixa.valor - (parseFloat(baixaDesconto) || 0)))}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Seção de Pagamento Parcial */}
                  <div className="space-y-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                    <div>
                      <label className="text-xs font-bold text-amber-950 block mb-1">
                        Valor Recebido Hoje (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={contaParaBaixa.valor - 0.01}
                          autoFocus
                          placeholder="Ex: 500.00"
                          value={baixaValorParcial}
                          onChange={e => setBaixaValorParcial(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-amber-300 rounded-lg text-base font-black text-slate-900 outline-none focus:border-emerald-600 bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Resumo do Abatimento */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-white border border-emerald-300 p-2.5 rounded-lg">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          🟢 Recebido Hoje
                        </span>
                        <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                          {formatarMoeda(parseFloat(baixaValorParcial) || 0)}
                        </span>
                      </div>
                      <div className="bg-white border border-amber-300 p-2.5 rounded-lg">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          🟠 Saldo que Fica em Aberto
                        </span>
                        <span className="text-sm font-black text-amber-900 mt-0.5 block">
                          {formatarMoeda(Math.max(0, contaParaBaixa.valor - (parseFloat(baixaValorParcial) || 0)))}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Novo Vencimento do Saldo Restante
                      </label>
                      <input
                        type="date"
                        value={baixaNovoVencimento}
                        onChange={e => setBaixaNovoVencimento(e.target.value)}
                        className="w-full border border-slate-300 p-2 rounded-lg text-xs outline-none focus:border-emerald-600 bg-white text-slate-700 font-medium"
                        required
                      />
                    </div>

                    <p className="text-[11px] text-amber-900 leading-relaxed bg-amber-100/60 p-2 rounded-lg">
                      ℹ️ Esta conta será quitada no valor de <strong>{formatarMoeda(parseFloat(baixaValorParcial) || 0)}</strong> e o sistema criará automaticamente uma nova conta pendente com o saldo de <strong>{formatarMoeda(Math.max(0, contaParaBaixa.valor - (parseFloat(baixaValorParcial) || 0)))}</strong>.
                    </p>
                  </div>
                </>
              )}

              {/* Data da Baixa / Pagamento */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data da Baixa / Pagamento
                </label>
                <input
                  type="date"
                  value={baixaDataPagamento}
                  onChange={e => setBaixaDataPagamento(e.target.value)}
                  className="w-full border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-emerald-600 transition text-slate-700 font-medium"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBaixaAberto(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoBaixa}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  {salvandoBaixa ? 'Processando...' : modoBaixaIndividual === 'PARCIAL' ? 'Confirmar Pagamento Parcial' : 'Confirmar Quitação Total'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Baixa em Lote com Desconto (Sessão de Descontos) */}
      {modalBaixaLoteAberto && listaSelecionadas.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-[slideIn_0.2s_ease-out] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <BadgePercent size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sessão de Baixa & Descontos em Lote
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quitando <span className="font-semibold text-slate-700">{listaSelecionadas.length} contas</span> selecionadas simultaneamente
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalBaixaLoteAberto(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modalidade no Lote: Quitação Total vs Pagamento Parcial */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setModoAbaBaixaLote('TOTAL')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                  modoAbaBaixaLote === 'TOTAL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CheckCircle size={15} className="text-emerald-600" />
                Quitação Total (com ou sem Desconto)
              </button>
              <button
                type="button"
                onClick={() => setModoAbaBaixaLote('PARCIAL')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                  modoAbaBaixaLote === 'PARCIAL'
                    ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BadgePercent size={15} className="text-amber-600" />
                Pagamento Parcial (Abatimento de Saldo)
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {modoAbaBaixaLote === 'TOTAL' ? (
                <>
                  {/* Cards de Resumo dos Valores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        ⚪ Total Original Bruto
                      </span>
                      <span className="text-xl font-black text-slate-800">
                        {formatarMoeda(totalSelecionado)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Soma das contas</span>
                    </div>

                    <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl">
                      <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                        🔴 Desconto Total
                      </span>
                      <span className="text-xl font-black text-rose-700">
                        - {formatarMoeda(somaDescontosLote)}
                      </span>
                      <span className="text-[10px] text-rose-600/80 block mt-0.5">
                        {totalSelecionado > 0 ? `${((somaDescontosLote / totalSelecionado) * 100).toFixed(1)}% do total` : '0%'}
                      </span>
                    </div>

                    <div className="bg-emerald-50 border-2 border-emerald-500/50 p-3.5 rounded-xl shadow-xs">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                        🟢 {abaAtiva === 'RECEBER' ? 'TOTAL A RECEBER EM CAIXA' : 'TOTAL A PAGAR'}
                      </span>
                      <span className="text-2xl font-black text-emerald-700 block">
                        {formatarMoeda(valorLiquidoTotalLote)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                        Conferir na maquininha ou dinheiro físico
                      </span>
                    </div>
                  </div>

                  {/* Seletor e Configuração de Desconto */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Definir Desconto
                      </label>
                      <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setModoDescontoLote('TOTAL')}
                          className={`px-3 py-1 rounded-md transition cursor-pointer ${modoDescontoLote === 'TOTAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Ratear no Total Geral
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoDescontoLote('INDIVIDUAL')}
                          className={`px-3 py-1 rounded-md transition cursor-pointer ${modoDescontoLote === 'INDIVIDUAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Editar por Conta
                        </button>
                      </div>
                    </div>

                    {modoDescontoLote === 'TOTAL' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalSelecionado}
                              value={descontoLoteTotal}
                              onChange={e => setDescontoLoteTotal(e.target.value)}
                              placeholder="0,00"
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-base font-bold text-amber-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                              autoFocus
                            />
                          </div>
                          {/* Chips rápidos */}
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setDescontoLoteTotal('0')}
                              className="text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                            >
                              Sem desc.
                            </button>
                            <button
                              type="button"
                              onClick={() => setDescontoLoteTotal((totalSelecionado * 0.03).toFixed(2))}
                              className="text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                            >
                              3%
                            </button>
                            <button
                              type="button"
                              onClick={() => setDescontoLoteTotal((totalSelecionado * 0.05).toFixed(2))}
                              className="text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                            >
                              5%
                            </button>
                            <button
                              type="button"
                              onClick={() => setDescontoLoteTotal((totalSelecionado * 0.10).toFixed(2))}
                              className="text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                            >
                              10%
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          O valor do desconto acima é automaticamente rateado proporcionalmente entre cada uma das contas selecionadas.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Edite o desconto individualmente na coluna "Desconto" da tabela abaixo para cada conta.
                      </p>
                    )}
                  </div>

                  {/* Tabela de Contas com Desconto Rateado/Aplicado */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-3">Conta / OS</th>
                            <th className="p-3">Cliente / Envolvido</th>
                            <th className="p-3 text-right">Valor Original</th>
                            <th className="p-3 text-right w-36">Desconto (R$)</th>
                            <th className="p-3 text-right">Líquido Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itensCalculadosLote.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3 font-semibold text-slate-900">
                                {item.descricao}
                              </td>
                              <td className="p-3 text-slate-600">
                                {item.envolvido}
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {formatarMoeda(item.valor)}
                              </td>
                              <td className="p-3 text-right">
                                {modoDescontoLote === 'TOTAL' ? (
                                  <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    - {formatarMoeda(item.descontoCalculado)}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={item.valor}
                                    placeholder="0,00"
                                    value={descontosIndividuais[item.id] ?? ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setDescontosIndividuais(prev => ({ ...prev, [item.id]: val }));
                                    }}
                                    className="w-24 text-right px-2 py-1 border border-slate-300 rounded font-bold text-amber-700 outline-none focus:border-emerald-600"
                                  />
                                )}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700">
                                {formatarMoeda(item.valorFinal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Seção de Pagamento Parcial em Lote */}
                  <div className="space-y-4 bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-amber-950 block mb-1">
                          Valor Recebido Hoje (R$) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={totalSelecionado - 0.01}
                            autoFocus
                            placeholder="Ex: 3000.00"
                            value={baixaLoteValorParcial}
                            onChange={e => setBaixaLoteValorParcial(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-amber-300 rounded-lg text-base font-black text-slate-900 outline-none focus:border-emerald-600 bg-white"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-amber-950 block mb-1">
                          Novo Vencimento do Saldo Restante *
                        </label>
                        <input
                          type="date"
                          value={baixaLoteNovoVencimento}
                          onChange={e => setBaixaLoteNovoVencimento(e.target.value)}
                          className="w-full border border-amber-300 p-2 rounded-lg text-xs outline-none focus:border-emerald-600 bg-white text-slate-700 font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Resumo do Abatimento */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white border border-slate-200 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          ⚪ Total Original do Lote
                        </span>
                        <span className="text-base font-black text-slate-800 mt-0.5 block">
                          {formatarMoeda(totalSelecionado)}
                        </span>
                        <span className="text-[10px] text-slate-400">{listaSelecionadas.length} contas selecionadas</span>
                      </div>

                      <div className="bg-white border border-emerald-300 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          🟢 Recebido Hoje em Caixa
                        </span>
                        <span className="text-base font-black text-emerald-800 mt-0.5 block">
                          {formatarMoeda(parseFloat(baixaLoteValorParcial) || 0)}
                        </span>
                        <span className="text-[10px] text-emerald-600">Entrando no caixa agora</span>
                      </div>

                      <div className="bg-white border border-amber-300 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          🟠 Saldo em Aberto para Próximo Mês
                        </span>
                        <span className="text-base font-black text-amber-900 mt-0.5 block">
                          {formatarMoeda(Math.max(0, totalSelecionado - (parseFloat(baixaLoteValorParcial) || 0)))}
                        </span>
                        <span className="text-[10px] text-amber-700">Nova conta gerada automaticamente</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-900 leading-relaxed bg-amber-100/60 p-2.5 rounded-lg">
                      ℹ️ As <strong>{listaSelecionadas.length} contas</strong> selecionadas serão quitadas pelo valor recebido hoje de <strong>{formatarMoeda(parseFloat(baixaLoteValorParcial) || 0)}</strong>. O sistema gerará automaticamente <strong>1 nova conta a receber pendente</strong> com o saldo de <strong>{formatarMoeda(Math.max(0, totalSelecionado - (parseFloat(baixaLoteValorParcial) || 0)))}</strong> com vencimento para <strong>{formatarData(baixaLoteNovoVencimento)}</strong>.
                    </p>
                  </div>

                  {/* Lista de Contas que estão sendo negociadas */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-3">Conta / OS</th>
                            <th className="p-3">Cliente / Envolvido</th>
                            <th className="p-3 text-right">Valor Original</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {listaSelecionadas.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3 font-semibold text-slate-900">{item.descricao}</td>
                              <td className="p-3 text-slate-600">{item.envolvido}</td>
                              <td className="p-3 text-right font-bold text-slate-800">{formatarMoeda(item.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Forma de Pagamento e Data da Baixa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-end">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {FORMAS_PAGAMENTO.map(fp => (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => setFormaPagamentoLote(fp.id)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-0.5 ${
                          formaPagamentoLote === fp.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-sm">{fp.icon}</span>
                        <span className="text-[10px] truncate w-full">{fp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Data da Baixa / Pagamento:
                  </label>
                  <input
                    type="date"
                    value={dataPagamentoLote}
                    onChange={e => setDataPagamentoLote(e.target.value)}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-emerald-600 text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalBaixaLoteAberto(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBaixaEmLote}
                disabled={salvandoBaixaLote}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle size={16} />
                {salvandoBaixaLote 
                  ? 'Processando...' 
                  : modoAbaBaixaLote === 'PARCIAL' 
                    ? `Confirmar Pagamento Parcial (Receber ${formatarMoeda(parseFloat(baixaLoteValorParcial) || 0)})`
                    : `Confirmar Quitação (${listaSelecionadas.length} contas)`}
              </button>
            </div>
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