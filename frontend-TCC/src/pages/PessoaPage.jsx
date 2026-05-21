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
    nome: '', tipo: 'CLIENTE', tipoPessoaFisica: true, cpf: '', cnpj: '', telefone: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    cargo: '', percentualComissao: '', salarioBase: ''
  });
  
  const { success, error } = useToast();

  // 1. Funções de formatação (Máscaras)
  const formatarCPF = (valor) => {
    if (!valor) return '';
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatarCNPJ = (valor) => {
    if (!valor) return '';
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{2})\d+?$/, '$1');
  };

  const formatarTelefone = (valor) => {
    if (!valor) return '';
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatarCEP = (valor) => {
    if (!valor) return '';
    return valor.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const buscarCEP = async (cep) => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP", err);
    }
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto == 10) || (resto == 11)) resto = 0;
    if (resto != parseInt(cpf.substring(9, 10)) ) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto == 10) || (resto == 11)) resto = 0;
    if (resto != parseInt(cpf.substring(10, 11) ) ) return false;
    return true;
  };

  const validarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0, pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0; pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
  };

  // 2. Função para carregar dados da API
  const carregar = async () => {
    try {
      const res = await api.get('/pessoa');
      setPessoas(res.data);
    } catch (err) {
      console.error('Erro ao carregar pessoas:', err);
      error('Erro ao carregar dados do servidor.');
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // 3. Função para abrir modal de edição
  const handleEditar = (p) => {
    setIdEdicao(p.id);
    setFormData({
      nome: p.nome || '',
      tipo: p.tipo || 'CLIENTE',
      tipoPessoaFisica: p.cnpj ? false : true,
      cpf: p.cpf || '',
      cnpj: p.cnpj || '',
      telefone: p.telefone || '',
      cep: p.cep || '',
      logradouro: p.logradouro || '',
      numero: p.numero || '',
      complemento: p.complemento || '',
      bairro: p.bairro || '',
      cidade: p.cidade || '',
      estado: p.estado || '',
      cargo: p.cargo || '',
      percentualComissao: p.percentualComissao || '',
      salarioBase: p.salarioBase || ''
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setIdEdicao(null);
    setFormData({ nome: '', tipo: 'CLIENTE', tipoPessoaFisica: true, cpf: '', cnpj: '', telefone: '',
      cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
      cargo: '', percentualComissao: '', salarioBase: '' });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.tipoPessoaFisica && formData.cpf && !validarCPF(formData.cpf)) {
      error('CPF inválido!');
      return;
    }
    if (!formData.tipoPessoaFisica && formData.cnpj && !validarCNPJ(formData.cnpj)) {
      error('CNPJ inválido!');
      return;
    }

    setLoading(true);

    try {
      const payload = { 
        ...formData,
        cpf: formData.tipoPessoaFisica ? formData.cpf : null,
        cnpj: !formData.tipoPessoaFisica ? formData.cnpj : null,
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
      // 2. Melhoria na captura de erro: mostra a mensagem exata do backend
      const msg = err.response?.data?.erro || err.response?.data?.message || 'Erro ao salvar. Verifique se o CPF/Telefone já existem.';
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
      p.cpf?.includes(busca) || p.cnpj?.includes(busca);
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
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Documento</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Contato</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Endereço</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Profissional</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listaFiltrada.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900">{p.nome}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${
                      p.tipo === 'CLIENTE' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-800 text-white border-slate-800'
                    }`}>
                      {p.tipo === 'CLIENTE' ? 'Cliente' : 'Funcionário'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500 font-mono text-[13px] tracking-tight">{p.cpf || p.cnpj || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{p.telefone || '—'}</td>
                <td className="px-5 py-3.5 text-sm">
                  {p.logradouro || p.cidade ? (
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{p.logradouro}{p.numero ? `, ${p.numero}` : ''}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {[p.bairro, p.cidade ? `${p.cidade}${p.estado ? `/${p.estado}` : ''}` : null].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm">
                  {p.tipo === 'FUNCIONARIO' ? (
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{p.cargo || '—'}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Comissão: <span className="text-emerald-600 font-bold">{p.percentualComissao || 0}%</span></span>
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
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
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
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
              
              <div className="flex gap-4 items-center px-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" checked={formData.tipoPessoaFisica} onChange={() => setFormData({...formData, tipoPessoaFisica: true, cnpj: ''})} className="w-4 h-4 text-blue-600" />
                  Pessoa Física
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" checked={!formData.tipoPessoaFisica} onChange={() => setFormData({...formData, tipoPessoaFisica: false, cpf: ''})} className="w-4 h-4 text-blue-600" />
                  Pessoa Jurídica
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  placeholder="Telefone" 
                  value={formData.telefone}
                  maxLength="15"
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                  onChange={e => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })} 
                />
                {formData.tipoPessoaFisica ? (
                  <input 
                    placeholder="CPF *" 
                    value={formData.cpf}
                    maxLength="14"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })} 
                    required
                  />
                ) : (
                  <input 
                    placeholder="CNPJ *" 
                    value={formData.cnpj}
                    maxLength="18"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, cnpj: formatarCNPJ(e.target.value) })} 
                    required
                  />
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Endereço Completo</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input 
                    placeholder="CEP" 
                    value={formData.cep}
                    maxLength="9"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, cep: formatarCEP(e.target.value) })} 
                    onBlur={() => buscarCEP(formData.cep)}
                  />
                  <input 
                    placeholder="Logradouro (Rua, Av.)" 
                    value={formData.logradouro}
                    className="w-full col-span-2 border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, logradouro: e.target.value })} 
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input 
                    placeholder="Número" 
                    value={formData.numero}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, numero: e.target.value })} 
                  />
                  <input 
                    placeholder="Complemento" 
                    value={formData.complemento}
                    className="w-full col-span-2 border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, complemento: e.target.value })} 
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input 
                    placeholder="Bairro" 
                    value={formData.bairro}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, bairro: e.target.value })} 
                  />
                  <input 
                    placeholder="Cidade" 
                    value={formData.cidade}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition"
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })} 
                  />
                  <input 
                    placeholder="UF" 
                    value={formData.estado}
                    maxLength="2"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-slate-900 transition uppercase"
                    onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} 
                  />
                </div>
              </div>

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
