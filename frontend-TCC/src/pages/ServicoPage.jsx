import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, X, Search, PenIcon } from 'lucide-react'; // <-- PenIcon importado
import { useToast } from '../components/ToastProvider.jsx';

export function ServicoPage() {
  const [servicos, setServicos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nomeServico: '', precoTabela: '' });
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const { success, error } = useToast();

  const carregar = async () => {
    try {
      const res = await api.get('/servico', {
        params: { busca, page: pagina - 1, size: 15 }
      });
      setServicos(res.data.content);
      setTotalPaginas(res.data.totalPages);
    } catch (err) {
      error('Erro ao carregar catálogo');
    }
  };

  useEffect(() => {
    setPagina(1);
  }, [busca]);

  useEffect(() => { 
    const timer = setTimeout(carregar, 300);
    return () => clearTimeout(timer);
  }, [busca, pagina]);

  // --- NOVAS FUNÇÕES DE EDIÇÃO ---
  const handleEditar = (servico) => {
    setIdEdicao(servico.id);
    setFormData({
      nomeServico: servico.nomeServico || '',
      precoTabela: servico.precoTabela || ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEdicao(null);
    setFormData({ nomeServico: '', precoTabela: '' });
  };
  // -------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Garante que o preço vá como número para o Java
      const payload = {
        ...formData,
        precoTabela: parseFloat(formData.precoTabela || 0)
      };

      if (idEdicao) {
        // Se tem ID, atualiza (PUT)
        await api.put(`/servico/${idEdicao}`, payload);
        success('Serviço atualizado com sucesso!');
      } else {
        // Se não tem ID, cadastra novo (POST)
        await api.post('/servico', payload);
        success('Serviço cadastrado com sucesso!');
      }
      
      fecharModal();
      await carregar();
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao salvar serviço';
      if (err.response?.data?.campos) {
        const campos = err.response.data.campos.map(c => c.mensagem).join(', ');
        error(campos);
      } else {
        error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Excluir este serviço?')) return;
    try {
      await api.delete(`/servico/${id}`);
      await carregar();
      success('Serviço excluído com sucesso!');
    } catch (err) {
      error('Erro ao excluir serviço');
    }
  };

  const listaFiltrada = servicos;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Serviços</h2>
          <p className="text-slate-500 text-sm mt-1">Defina os preços padrão da oficina</p>
        </div>
        <button
          onClick={() => { fecharModal(); setModalAberto(true); }} // <-- Limpa antes de abrir
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {/* Busca */}
      <div className="flex gap-3 items-center mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* Grid de servicos */}
      {listaFiltrada.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">Nenhum serviço encontrado no Banco de Dados.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listaFiltrada.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex items-center justify-between group">
            <div>
              <h3 className="font-semibold text-slate-900">{s.nomeServico}</h3>
              <p className="text-lg font-black text-slate-900 mt-1">
                R$ {Number(s.precoTabela || 0).toFixed(2)}
              </p>
            </div>
            
            {/* --- BOTÕES DE AÇÃO --- */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditar(s)}
                className="text-slate-300 hover:text-blue-500 transition p-2 rounded-lg hover:bg-blue-50"
              >
                <PenIcon size={16} />
              </button>
              <button
                onClick={() => handleExcluir(s.id)}
                className="text-slate-300 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-sm text-slate-500">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina(p => Math.max(p - 1, 1))}
              disabled={pagina === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))}
              disabled={pagina === totalPaginas}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {idEdicao ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={fecharModal} className="text-slate-300 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Descrição</label>
                <input
                  placeholder="Ex: Alinhamento"
                  value={formData.nomeServico} // <-- Adicionado o VALUE
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, nomeServico: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Preço (R$)</label>
                <input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={formData.precoTabela} // <-- Adicionado o VALUE
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, precoTabela: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : 'Salvar no Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}