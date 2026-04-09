import { useEffect, useState } from 'react';
import api from '../services/api';
import { UserPlus, Trash2, X, Search, PenIcon } from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';

export function PessoaPage() {
  const [pessoas, setPessoas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', cpf: '', telefone: '', endereco: '',
    tipo: 'CLIENTE', cargo: '', percentualComissao: '', salarioBase: ''
  });
  
  const { success, error } = useToast();

  const carregar = async () => {
    try {
      const res = await api.get('/pessoa');
      setPessoas(res.data);
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
      error('Não foi possível carregar os dados do servidor.');
    }
  };

  useEffect(() => { 
    carregar(); 
  }, []);

  const handleEditar = (pessoa) => {
    setIdEdicao(pessoa.id); 
    setFormData({
      nome: pessoa.nome || '',
      cpf: pessoa.cpf || '',
      telefone: pessoa.telefone || '',
      endereco: pessoa.endereco || '',
      tipo: pessoa.tipo || 'CLIENTE',
      cargo: pessoa.cargo || '',
      percentualComissao: pessoa.percentualComissao || '',
      salarioBase: pessoa.salarioBase || ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEdicao(null);
    setFormData({ 
      nome: '', cpf: '', telefone: '', endereco: '', 
      tipo: 'CLIENTE', cargo: '', percentualComissao: '', salarioBase: '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { 
        ...formData,
        percentualComissao: formData.tipo === 'FUNCIONARIO' ? parseFloat(formData.percentualComissao || 0) : 0,
        salarioBase: formData.tipo === 'FUNCIONARIO' ? parseFloat(formData.salarioBase || 0) : 0
      };

      if (idEdicao) {
        await api.put(`/pessoa/${idEdicao}`, payload);
        success('Dados atualizados com sucesso!');
      } else {
        await api.post('/pessoa', payload);
        success('Cadastrado com sucesso!');
      }
      
      fecharModal();
      await carregar(); 
    } catch (err) {
      console.error('Erro ao salvar:', err.response || err);
      const msg = err.response?.data?.erro || 'Erro ao salvar. Verifique a conexão.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      await api.delete(`/pessoa/${id}`);
      await carregar();
      success('Registro removido!');
    } catch (err) {
      console.error('Erro ao excluir:', err);
      error('Erro ao excluir do servidor.');
    }
  };

  const listaFiltrada = pessoas.filter(p => {
    const matchTipo = filtroTipo === 'TODOS' || p.tipo === filtroTipo;
    const matchBusca = !busca || 
      p.nome?.toLowerCase().includes(busca.toLowerCase()) || 
      p.cpf?.includes(busca);
    return matchTipo && matchBusca;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes & Equipe</h2>
          <p className="text-slate-500 text-sm mt-1">{pessoas.length} registros no banco</p>
        </div>
        <button
          onClick={() => { fecharModal(); setModalAberto(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition"
        >
          <UserPlus size={16} /> Novo Cadastro
        </button>
      </div>

      <div className="flex gap-3 items-center mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition"
          />
        </div>
        {['TODOS', 'CLIENTE', 'FUNCIONARIO'].map(s => (
          <button
            key={s}
            onClick={() => setFiltroTipo(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              filtroTipo === s
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {s === 'TODOS' ? 'Todos' : s === 'CLIENTE' ? 'Clientes' : 'Funcionários'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Nome</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tipo</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Contato</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Detalhes</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaFiltrada.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{p.nome}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                    p.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.tipo === 'CLIENTE' ? 'Cliente' : 'Funcionário'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{p.telefone || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">
                  {p.tipo === 'FUNCIONARIO'
                    ? <span className="text-slate-700">{p.cargo || '—'} • {p.percentualComissao || 0}%</span>
                    : p.cpf || '—'}
                </td>
                <td className="px-5 py-3.5 text-center flex justify-center gap-4">
                   <button 
                    onClick={() => handleEditar(p)} 
                    className="text-slate-300 hover:text-blue-500 transition"
                  >
                    <PenIcon size={16} />
                  </button>
                  <button
                    onClick={() => handleExcluir(p.id)}
                    className="text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {listaFiltrada.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                  Nenhum registro encontrado no Banco de Dados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {idEdicao ? 'Editar Registro' : 'Novo Cadastro'}
              </h3>
              <button onClick={fecharModal} className="text-slate-300 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <input 
                placeholder="Nome Completo *" 
                value={formData.nome}
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                required 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input 
                  placeholder="Telefone" 
                  value={formData.telefone}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })} 
                />
                <input 
                  placeholder="CPF" 
                  value={formData.cpf}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, cpf: e.target.value })} 
                />
              </div>

              <input 
                placeholder="Endereço" 
                value={formData.endereco}
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                onChange={e => setFormData({ ...formData, endereco: e.target.value })} 
              />

              <select 
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition bg-white"
                onChange={e => setFormData({ ...formData, tipo: e.target.value })} 
                value={formData.tipo}
              >
                <option value="CLIENTE">Cliente</option>
                <option value="FUNCIONARIO">Funcionário (Mecânico)</option>
              </select>

              {formData.tipo === 'FUNCIONARIO' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <input 
                    placeholder="Cargo (ex: Mecânico)" 
                    value={formData.cargo}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })} 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Salário R$" 
                      type="number" 
                      value={formData.salarioBase}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                      onChange={e => setFormData({ ...formData, salarioBase: e.target.value })} 
                    />
                    <input 
                      placeholder="Comissão %" 
                      type="number" 
                      value={formData.percentualComissao}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                      onChange={e => setFormData({ ...formData, percentualComissao: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Salvar no Banco'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}