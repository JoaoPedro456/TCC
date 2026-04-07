import { useEffect, useState } from 'react';
import api from '../services/api';
import { UserPlus, Trash2, X } from 'lucide-react';

export function PessoaPage() {
  const [pessoa, setPessoa] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', cpf: '', telefone: '', endereco: '',
    tipo: 'CLIENTE', cargo: '', percentualComissao: '', salarioBase: ''
  });

  const carregar = async () => {
    const res = await api.get('/pessoa');
    setPessoa(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/pessoa', formData);
    setModalAberto(false);
    setFormData({ nome: '', cpf: '', telefone: '', endereco: '', tipo: 'CLIENTE', cargo: '', percentualComissao: '', salarioBase: '' });
    carregar();
  };

  useEffect(() => { carregar(); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Gestão de Pessoas</h2>
          <p className="text-slate-500 text-sm mt-1">Cadastre clientes e configure sua equipe</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition"
        >
          <UserPlus size={20} /> Novo Cadastro
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contato</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Dados / Comissão</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pessoa.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{p.nome}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.telefone || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {p.tipo === 'FUNCIONARIO'
                    ? `${p.cargo || '—'} | ${p.percentualComissao || 0}% | R$ ${Number(p.salarioBase || 0).toFixed(2)}`
                    : p.cpf || '—'}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={async () => { if (confirm('Excluir?')) { await api.delete(`/pessoa/${p.id}`); carregar(); } }}
                    className="text-slate-300 hover:text-red-600 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Cadastrar Pessoa</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nome *" className="w-full border p-3 rounded-xl outline-blue-500"
                onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
              <input placeholder="Telefone" className="w-full border p-3 rounded-xl outline-blue-500"
                onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
              <input placeholder="CPF" className="w-full border p-3 rounded-xl outline-blue-500"
                onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
              <input placeholder="Endereço" className="w-full border p-3 rounded-xl outline-blue-500"
                onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
              <select className="w-full border p-3 rounded-xl outline-blue-500"
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                <option value="CLIENTE">Cliente</option>
                <option value="FUNCIONARIO">Funcionário</option>
              </select>
              {formData.tipo === 'FUNCIONARIO' && (
                <div className="space-y-3">
                  <input placeholder="Cargo (ex: Mecânico, Soldador)" className="w-full border p-3 rounded-xl"
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Salário Base R$" type="number" step="0.01" className="flex-1 border p-3 rounded-xl"
                      onChange={e => setFormData({ ...formData, salarioBase: e.target.value })} />
                    <input placeholder="Comissão %" type="number" className="w-28 border p-3 rounded-xl"
                      onChange={e => setFormData({ ...formData, percentualComissao: e.target.value })} />
                  </div>
                </div>
              )}
              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}