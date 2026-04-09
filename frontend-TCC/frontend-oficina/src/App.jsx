import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutAdm } from './layouts/LayoutAdm.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { PessoaPage } from './pages/PessoaPage.jsx';
import { ServicoPage } from './pages/ServicoPage.jsx';
import { OrdemServicoPage } from './pages/OrdemServicoPage.jsx';
import { RelatorioPage } from './pages/RelatorioPage.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <LayoutAdm />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="pessoas" element={<PessoaPage />} />
            <Route path="servicos" element={<ServicoPage />} />
            <Route path="ordens" element={<OrdemServicoPage />} />
            <Route path="relatorios" element={<RelatorioPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}