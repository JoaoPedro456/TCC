import React, { useState } from 'react';
import { Sidebar } from './components/SideBar'; 
import { OrdemServicoPage } from './pages/OrdemServicoPage'; 
import { PessoaPage } from './pages/PessoaPage'; 
import { ServicoPage } from './pages/ServicoPage'; 
import { RelatorioPage } from './pages/RelatorioPage'; 
import { ToastProvider } from './components/ToastProvider'; 
import { ComissaoPage } from './pages/ComissaoPage';
import { DashboardPage } from './pages/DashboardPage';
import { FaturamentoPage } from './pages/FaturamentoPage';  
import { LoginPage } from './pages/LoginPage'; 

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('os'); 

  // Pega o token do navegador
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <ToastProvider>
        <LoginPage /> 
      </ToastProvider>
    );
  }

  // Se tem token, renderiza o sistema por dentro
  const renderizarPagina = () => {
    switch (abaAtiva) {
      case 'dashboard':
        return <DashboardPage setAbaAtiva={setAbaAtiva} />;
      case 'os':
        return <OrdemServicoPage />;
      case 'pessoas':
        return <PessoaPage />;
      case 'catalogo':
        return <ServicoPage />;
      case 'faturamento':
        return <FaturamentoPage />;
      case 'comissoes':
        return <ComissaoPage />;
      case 'relatorios':
        return <RelatorioPage abaInicial={abaAtiva} />;
      default:
        return <OrdemServicoPage />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50/50 flex">
        
        <Sidebar abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />

        <main className="flex-1 ml-72 min-w-0">
          <div className="p-8">
            {renderizarPagina()}
          </div>
        </main>
        
      </div>
    </ToastProvider>
  );
}