import { useState } from 'react';
// APAGUEI o useNavigate daqui!
import { Wrench, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export function LoginPage() {
  const [form, setForm] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      // Salva o token no navegador
      localStorage.setItem('token', res.data.token);
      
      // 👇 MAGIA AQUI: Recarrega a página para o App.jsx ler o token e abrir o sistema!
      window.location.reload(); 
      
    } catch {
      setErro('Login ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-4">
            <Wrench size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bazani Mecânica</h1>
          <p className="text-slate-400 mt-1 text-sm">Sistema de Gestão</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Entrar no sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">Usuário</label>
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={form.login}
                onChange={e => setForm({ ...form, login: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 p-3 rounded-xl outline-none focus:border-blue-400 focus:bg-white/15 transition"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-2">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 p-3 rounded-xl outline-none focus:border-blue-400 focus:bg-white/15 transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><LogIn size={20} /> Entrar</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Bazani Mecânica © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}