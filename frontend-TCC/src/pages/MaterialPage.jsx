import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, X, Search, PenIcon, PackageOpen } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';

export function MaterialPage() {
  const [materiais, setMateriais] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null); 
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nomeMaterial: '', unidadeMedida: 'UNIDADE', precoTabela: '' });
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const { success, error } = useToast();

  const carregar = async () => {
    try {
      const res = await api.get('/materiais', {
        params: { busca, page: pagina - 1, size: 15 }
      });
      setMateriais(res.data.content);
      setTotalPaginas(res.data.totalPages);
    } catch (err) {
      error('Erro ao carregar catálogo de materiais');
    }
  };

  useEffect(() => {
    setPagina(1);
  }, [busca]);

  useEffect(() => { 
    const timer = setTimeout(carregar, 300);
    return () => clearTimeout(timer);
  }, [busca, pagina]);

  const handleEditar = (material) => {
    setIdEdicao(material.id);
    setFormData({
      nomeMaterial: material.nomeMaterial || '',
      unidadeMedida: material.unidadeMedida || 'UNIDADE',
      precoTabela: material.precoTabela || ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEdicao(null);
    setFormData({ nomeMaterial: '', unidadeMedida: 'UNIDADE', precoTabela: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        precoTabela: parseFloat(formData.precoTabela || 0)
      };

      if (idEdicao) {
        await api.put(`/materiais/${idEdicao}`, payload);
        success('Material atualizado com sucesso!');
      } else {
        await api.post('/materiais', payload);
        success('Material cadastrado com sucesso!');
      }
      
      fecharModal();
      await carregar();
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao salvar material';
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
    if (!confirm('Excluir este material?')) return;
    try {
      await api.delete(`/materiais/${id}`);
      await carregar();
      success('Material excluído com sucesso!');
    } catch (err) {
      error('Erro ao excluir material');
    }
  };

  const unidades = [
    { value: 'UNIDADE', label: 'Unidade (un)' },
    { value: 'KG', label: 'Quilograma (kg)' },
    { value: 'METRO', label: 'Metro (m)' },
    { value: 'BARRA', label: 'Barra' },
    { value: 'LITRO', label: 'Litro (L)' }
  ];

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PackageOpen className="text-slate-900" size={24} /> Catálogo de Materiais
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie os materiais e peças da oficina</p>
        </div>
        <button
          onClick={() => { fecharModal(); setModalAberto(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition"
        >
          <Plus size={16} /> Novo Material
        </button>
      </div>

      <div className="flex gap-3 items-center mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar material..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition"
          />
        </div>
      </div>

      {materiais.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <PackageOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm font-medium">Nenhum material encontrado no banco de dados.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materiais.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex items-center justify-between group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {m.unidadeMedida}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{m.nomeMaterial}</h3>
              <p className="text-lg font-black text-slate-900 mt-1">
                R$ {Number(m.precoTabela || 0).toFixed(2)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEditar(m)}
                className="text-slate-300 hover:text-blue-500 transition p-2 rounded-lg hover:bg-blue-50"
              >
                <PenIcon size={16} />
              </button>
              <button
                onClick={() => handleExcluir(m.id)}
                className="text-slate-300 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

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

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {idEdicao ? 'Editar Material' : 'Novo Material'}
              </h3>
              <button onClick={fecharModal} className="text-slate-300 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nome / Descrição</label>
                <input
                  placeholder="Ex: Ferro redondo 1/2"
                  value={formData.nomeMaterial}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, nomeMaterial: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Unidade de Medida</label>
                <select
                  value={formData.unidadeMedida}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition bg-white"
                  onChange={e => setFormData({ ...formData, unidadeMedida: e.target.value })}
                  required
                >
                  {unidades.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Preço Base (R$)</label>
                <input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={formData.precoTabela}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, precoTabela: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : 'Salvar Material'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}