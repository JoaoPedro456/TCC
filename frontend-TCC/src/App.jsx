import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { limparTokenSeExpirado } from './utils/token';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdemServicoPage } from './pages/OrdemServicoPage';
import { PessoaPage } from './pages/PessoaPage';
import { ServicoPage } from './pages/ServicoPage';
import { FaturamentoPage } from './pages/FaturamentoPage';
import { ComissaoPage } from './pages/ComissaoPage';
import { RelatorioPage } from './pages/RelatorioPage';
import { Sidebar } from './components/Sidebar';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <Sidebar />
      <main className="flex-1 ml-72 min-w-0">
        <div className="p-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ordens" element={<OrdemServicoPage />} />
            <Route path="/pessoas" element={<PessoaPage />} />
            <Route path="/catalogo" element={<ServicoPage />} />
            <Route path="/faturamento" element={<FaturamentoPage />} />
            <Route path="/comissoes" element={<ComissaoPage />} />
            <Route path="/relatorios" element={<RelatorioPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  // 1. Controle de estado do Token
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    limparTokenSeExpirado();
    setToken(localStorage.getItem('token'));
  }, []);

  // 2. Atualiza o estado quando o usuário logar
  const handleLogin = (novoToken) => {
    setToken(novoToken);
  };

  return (
    <ToastProvider>
      <Routes>
        {/* Rota de Login */}
        <Route 
          path="/login" 
          element={token ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />} 
        />
        
        {/* Rotas Protegidas do Sistema (AppLayout) */}
        <Route 
          path="/*" 
          element={token ? <AppLayout /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </ToastProvider>
  );
}