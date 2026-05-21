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
    nome: '', tipo: 'CLIENTE', cpf: '', cnpj: '', telefone: '',
    endereco: '', bairro: '', numero: '', cidade: '', distrito: '',
    cargo: '', percentualComissao: '', salarioBase: ''
  });

  const { success, error } = useToast();

  // Máscaras
  const formatarCPF = (v) => {
    if (!v) return '';
    return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatarCNPJ = (v) => {
    if (!v) return '';
    return v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatarTelefone = (v) => {
    if (!v) return '';
    return v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
  };

  const carregar = async () => {
    try { setPessoas((await api.get('/pessoa')).data); }
    catch { error('Não foi possível carregar os dados.'); }
  };

  useEffect(() => { carregar(); }, []);

  const handleEditar = (p) => {
    setIdEdicao(p.id);
    setFormData({
      nome: p.nome || '', tipo: p.tipo || 'CLIENTE',
      cpf: p.cpf || '', cnpj: p.cnpj || '',
      telefone: p.telefone || '', endereco: p.endereco || '',
      bairro: p.bairro || '', numero: p.numero || '',
      cidade: p.cidade || '', distrito: p.distrito || '',
      cargo: p.cargo || '', percentualComissao: p.percentualComissao || '', salarioBase: p.salarioBase || ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false); setIdEdicao(null);
    setFormData({ nome: '', tipo: 'CLIENTE', cpf: '', cnpj: '', telefone: '', endereco: '', bairro: '', numero: '', cidade: '', distrito: '', cargo: '', percentualComissao: '', salarioBase: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = {
        ...formData,
        percentualComissao: formData.tipo === 'FUNCIONARIO' ? parseFloat(formData.percentualComissao || 0) : 0,
        salarioBase: formData.tipo === 'FUNCIONARIO' ? parseFloat(formData.salarioBase || 0) : 0
      };
      if (idEdicao) {
        await api.put('/pessoa/' + idEdicao, payload);
        success('Dados atualizados!');
      } else {
        await api.post('/pessoa', payload);
        success('Cadastrado!');
      }
      fecharModal(); await carregar();
    } catch (err) {
      error(err.response?.data?.erro || err.response?.data?.message || 'Erro ao salvar.');
    } finally { setLoading(false); }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Deseja realmente excluir?')) return;
    try { await api.delete('/pessoa/' + id); await carregar(); success('Removido!'); }
    catch { error('Erro ao excluir.'); }
  };

  const listaFiltrada = pessoas.filter(p => {
    const matchTipo = filtroTipo === 'TODOS' || p.tipo === filtroTipo;
    const matchBusca = !busca || p.nome?.toLowerCase().includes(busca.toLowerCase()) || p.cpf?.includes(busca) || p.cnpj?.includes(busca);
    return matchTipo && matchBusca;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-end flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes & Equipe</h2>
          <p className="text-slate-500 text-sm mt-1">{pessoas.length} registros</p>
        </div>
        <button onClick={() => { fecharModal(); setModalAberto(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition">
          <UserPlus size={16} /> Novo Cadastro
        </button>
      </div>

      <div className="flex gap-3 items-center mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nome, CPF ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition" />
        </div>
        {['TODOS', 'CLIENTE', 'FUNCIONARIO'].map(s => (
          <button key={s} onClick={() => setFiltroTipo(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              filtroTipo === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}>
            {s === 'TODOS' ? 'Todos' : s === 'CLIENTE' ? 'Clientes' : 'Funcionários'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Nome + Tipo</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">CPF/CNPJ</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cidade + Distrito, Bairro</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Contato</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaFiltrada.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{p.nome}</div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md mt-1 inline-block ${
                    p.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.tipo === 'CLIENTE' ? (p.cnpj ? 'Cliente (Jurídica)' : 'Cliente (Física)') : 'Funcionário'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                  {p.tipo === 'CLIENTE'
                    ? (p.cnpj || p.cpf || '
