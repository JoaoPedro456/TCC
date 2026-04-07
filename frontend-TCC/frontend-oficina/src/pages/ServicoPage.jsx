import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, X } from 'lucide-react';

export function ServicoPage() {
  const [servico, setServico] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ nomeServico: '', precoTabela: '' });

  const carregar = async () => {
    try {
      const res = await api.get('/servico');
      setServico(res.data);
    } catch (err) {
      console.error("Erro ao carregar serviços", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/servico', formData);
    setModalAberto(false);
    setFormData({ nomeServico: '', precoTabela: '' });
    carregar();
  };

  useEffect(() => { carregar(); }, []);

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Catálogo de Serviços</h2>
          <p className="text-slate-500 text-sm font-medium">Defina os preços padrão da sua oficina</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {servico.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition">
            <div>
              <h3 className="font-bold text-lg text-slate-700">{s.nomeServico}</h3>
              <p className="text-green-600 font-black text-xl">
                R$ {Number(s.precoTabela).toFixed(2)}
              </p>
            </div>
            <button
              onClick={async () => {
                if (confirm('Excluir serviço?')) {
                  await api.delete(`/servico/${s.id}`);
                  carregar();
                }
              }}
              className="text-slate-300 hover:text-red-500 p-2 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Novo Serviço</h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600">Descrição do Serviço</label>
                <input
                  placeholder="Ex: Balanceamento"
                  className="w-full border p-3 rounded-xl mt-1 outline-blue-500"
                  onChange={e => setFormData({ ...formData, nomeServico: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600">Preço de Tabela (R$)</label>
                <input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  className="w-full border p-3 rounded-xl mt-1 outline-blue-500"
                  onChange={e => setFormData({ ...formData, precoTabela: e.target.value })}
                  required
                />
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
                Salvar no Catálogo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}