import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LayoutAdm } from './layouts/LayoutAdm.jsx';
import { PessoaPage } from './pages/PessoaPage.jsx';
import { ServicoPage } from './pages/ServicoPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LayoutAdm />}>
          <Route index element={<DashboardPage />} />
          <Route path="pessoas" element={<PessoaPage />} />
          <Route path="servicos" element={<ServicoPage />} />
          
          <Route path="ordens" element={<div className="p-8 italic text-slate-400">Em breve...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}