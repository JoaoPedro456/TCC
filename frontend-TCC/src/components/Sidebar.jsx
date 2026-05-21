import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  Wrench,
  LayoutDashboard,
  DollarSign,
  BarChart2,
  PieChart,
  LogOut
} from 'lucide-react';

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
    // 1. Remove o token do navegador
    localStorage.removeItem('token');
    
    // 2. Manda para a rota de login
    navigate('/login', { replace: true });
    
    // 3. O pulo do gato: Força um F5 automático para limpar a memória do React!
    window.location.reload();
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} className="text-red-400" />
          Sair
        </button>
      </div>
    </aside>
  );
}
