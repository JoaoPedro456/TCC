import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, ClipboardList, LogOut } from 'lucide-react';

export function LayoutAdm() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/pessoas', label: 'Clientes & Equipe', icon: <Users size={20} /> },
    { path: '/servicos', label: 'Serviços', icon: <Wrench size={20} /> },
    { path: '/ordens', label: 'Ordens de Serviço', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black flex items-center gap-4 text-blue-400">
            <Wrench size={24} /> BAZANI MECÂNICA
          </h1>
        </div>
        
        <nav className="p-4 flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 p-3 w-full text-slate-400 hover:text-white transition">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}