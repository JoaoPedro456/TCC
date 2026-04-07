import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, ClipboardList, BarChart2, LogOut } from 'lucide-react';

export function LayoutAdm() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/pessoas', label: 'Clientes & Equipe', icon: <Users size={20} /> },
    { path: '/servicos', label: 'Serviços', icon: <Wrench size={20} /> },
    { path: '/ordens', label: 'Ordens de Serviço', icon: <ClipboardList size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart2 size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-gray-800">
      <aside className="w-64 bg-slate-900 text-white fixed h-full shadow-xl flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-black flex items-center gap-3 text-blue-400">
            <Wrench size={22} /> BAZANI MECÂNICA
          </h1>
          <p className="text-slate-500 text-xs mt-1">Sistema de Gestão</p>
        </div>

        <nav className="p-4 flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const ativo = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  ativo
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}