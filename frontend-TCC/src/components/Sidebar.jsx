import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  Wrench,
  LayoutDashboard,
  DollarSign,
  BarChart2,
  PieChart,
  LogOut,
  Settings,
  X,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';
import { useToast } from './ToastProvider';

const ROUTE_MAP = {
  dashboard: '/dashboard',
  os: '/ordens',
  pessoas: '/pessoas',
  catalogo: '/catalogo',
  faturamento: '/faturamento',
  comissoes: '/comissoes',
  relatorios: '/relatorios',
};

const MENU_ID_BY_PATH = Object.entries(ROUTE_MAP).reduce((acc, [id, path]) => {
  acc[path] = id;
  return acc;
}, {});

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = MENU_ID_BY_PATH[location.pathname] || 'dashboard';
  const { success, error } = useToast();
  
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [formSenha, setFormSenha] = useState({ senhaAtual: '', novaSenha: '' });
  const [loadingSenha, setLoadingSenha] = useState(false);

  const menuPrincipal = [
    { id: 'dashboard', nome: 'Dashboard', icone: LayoutDashboard },
    { id: 'os', nome: 'Ordens de Serviço', icone: ClipboardList },
    { id: 'pessoas', nome: 'Clientes & Equipe', icone: Users },
    { id: 'catalogo', nome: 'Catálogo de Serviços', icone: Wrench },
  ];

  const menuFinanceiro = [
    { id: 'faturamento', nome: 'Faturamento', icone: DollarSign },
    { id: 'comissoes', nome: 'Comissões', icone: PieChart },
    { id: 'relatorios', nome: 'Relatórios Gerais', icone: BarChart2 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
    window.location.reload();
  };

  const handleMudarSenha = async (e) => {
    e.preventDefault();
    setLoadingSenha(true);
    try {
      await api.put('/auth/alterar-senha', formSenha);
      success('Senha alterada com sucesso!');
      setModalSenhaAberto(false);
      setFormSenha({ senhaAtual: '', novaSenha: '' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao alterar a senha. Verifique sua senha atual.';
      error(msg);
    } finally {
      setLoadingSenha(false);
    }
  };

  const handleNavigate = (routeKey) => {
    navigate(ROUTE_MAP[routeKey]);
  };

  const renderItem = (item) => {
    const ativo = activeId === item.id;
    const Icone = item.icone;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
          ativo
            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icone size={18} className={ativo ? 'text-blue-600' : 'text-slate-400'} />
        {item.nome}
      </button>
    );
  };

  return (
    <>
      <aside className="w-72 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Bazani <span className="text-blue-600">Mecânica</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
            Gestão de Oficina
          </p>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-6">
          <div>
            <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </h3>
            <div className="space-y-1">
              {menuPrincipal.map(renderItem)}
            </div>
          </div>

          <div>
            <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Financeiro
            </h3>
            <div className="space-y-1">
              {menuFinanceiro.map(renderItem)}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => setModalSenhaAberto(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <Settings size={18} className="text-slate-400" />
            Alterar Senha
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={18} className="text-red-400" />
            Sair
          </button>
        </div>
      </aside>

      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock size={16} className="text-slate-500" /> Alterar Senha
              </h3>
              <button onClick={() => setModalSenhaAberto(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleMudarSenha} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Senha Atual</label>
                <input 
                  type="password" 
                  value={formSenha.senhaAtual} 
                  onChange={e => setFormSenha({...formSenha, senhaAtual: e.target.value})} 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nova Senha (min. 6 caracteres)</label>
                <input 
                  type="password" 
                  minLength={6}
                  value={formSenha.novaSenha} 
                  onChange={e => setFormSenha({...formSenha, novaSenha: e.target.value})} 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loadingSenha} 
                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
              >
                {loadingSenha ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Confirmar Alteração'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
