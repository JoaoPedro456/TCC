import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, ClipboardList, BarChart2, LogOut } from 'lucide-react';

export function LayoutAdm() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/pessoas', label: 'Clientes & Equipe', icon: <Users size={18} /> },
    { path: '/servicos', label: 'Serviços', icon: <Wrench size={18} /> },
    { path: '/ordens', label: 'Ordens de Serviço', icon: <ClipboardList size={18} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart2 size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <aside className="w-60 bg-[#0D1117] fixed h-full shadow-2xl flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h1 className="text-base font-extrabold flex items-center gap-2.5 text-[#3B82F6]">
            <Wrench size={18} /> BAZANI MECÂNICA
          </h1>
          <p className="text-[#6B7280] text-[10px] mt-1 uppercase tracking-widest">Sistema de Gestão</p>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex flex-col gap-0.5 flex-1">
          {menuItems.map((item) => {
            const ativo = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  ativo
                    ? 'bg-[#1B2A4A] text-[#3B82F6]'
                    : 'text-[#848E9A] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-[#848E9A] hover:text-red-400 hover:bg-white/[0.05] rounded-lg transition text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}