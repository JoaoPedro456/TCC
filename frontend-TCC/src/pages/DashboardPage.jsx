import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users, ClipboardList, ArrowUpRight, CheckCircle2, Calendar, Activity, Folder, FileText, Clock, ChevronRight, PlusCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Hook para Animação dos Números (CountUp) ---
function AnimatedNumber({ value, prefix = '', suffix = '', isCurrency = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endValue = Number(value) || 0;
    if (endValue === 0) return;
    
    let startTimestamp = null;
    const duration = 1500; // 1.5 segundos

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * endValue);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  if (isCurrency) {
    return <span>{prefix}{count.toFixed(2).replace('.', ',')}{suffix}</span>;
  }
  return <span>{prefix}{Math.floor(count)}{suffix}</span>;
}

// Os dados agora vêm do backend!

export function DashboardPage() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [stats, setStats] = useState({
    clientes: 0, 
    funcionarios: 0, 
    faturamentoMes: 0, 
    osMes: 0,
    osConcluidasMes: 0,
    ordensHojeTotal: 0,
    hojeAbertas: 0,
    hojeConcluidas: 0,
    hojeCanceladas: 0
  });
  
  const [historicoFaturamento, setHistoricoFaturamento] = useState([]);
  
  const [ultimasOrdens, setUltimasOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesFormatado, setMesFormatado] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const carregar = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setNomeUsuario(payload.sub || 'Usuário');
        } catch {
          setNomeUsuario('Usuário');
        }
      }

      try {
          const [resDash, resOrdens] = await Promise.all([
            api.get('/relatorios/dashboard'),
            api.get('/ordens', { params: { size: 4, sort: 'id,desc' } })
          ]);

          const d = new Date();
          const year = d.getFullYear();

          const listaDeOrdens = resOrdens.data.content || [];
          setUltimasOrdens(listaDeOrdens);

          const nomeMes = d.toLocaleString('pt-BR', { month: 'long' });
          const textoMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' de ' + year;
          setMesFormatado(textoMes);

          // Atualiza o gráfico com dados reais do backend
          if (resDash.data.historicoFaturamento) {
            setHistoricoFaturamento(resDash.data.historicoFaturamento);
          }

          setStats({
            clientes: resDash.data.totalClientes || 0,
            funcionarios: resDash.data.totalFuncionarios || 0,
            faturamentoMes: resDash.data.faturamentoMes || 0,
            osMes: resDash.data.osMes || 0,
            osConcluidasMes: resDash.data.osConcluidasMes || 0,
            ordensHojeTotal: resDash.data.osHoje || 0,
            hojeAbertas: resDash.data.hojeAbertas || 0,
            hojeConcluidas: resDash.data.hojeConcluidas || 0,
            hojeCanceladas: resDash.data.hojeCanceladas || 0,
          });

      } catch (err) {
        // Erro silencioso
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  // --- Lógica para calcular o crescimento real em % ---
  let percentualCrescimento = 0;
  if (historicoFaturamento.length >= 2) {
    const atual = historicoFaturamento[historicoFaturamento.length - 1].faturamento;
    const anterior = historicoFaturamento[historicoFaturamento.length - 2].faturamento;
    if (anterior > 0) {
      percentualCrescimento = ((atual - anterior) / anterior) * 100;
    } else if (atual > 0) {
      percentualCrescimento = 100;
    }
  }
  
  const textoCrescimento = percentualCrescimento > 0 
    ? `+${percentualCrescimento.toFixed(1)}%` 
    : `${percentualCrescimento.toFixed(1)}%`;
    
  const corCrescimento = percentualCrescimento >= 0 
    ? "text-emerald-600 bg-emerald-50" 
    : "text-red-600 bg-red-50";
  // ----------------------------------------------------

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium tracking-wide">Iniciando sistema...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 bg-slate-50/30 min-h-screen">
      
      {/* Header Clean */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Olá, {nomeUsuario}!
          </h2>
          <p className="text-slate-500 mt-1">
            Resumo de atividades em <span className="text-blue-600 font-medium">{mesFormatado}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
           <Calendar size={18} className="text-slate-400" />
           <span className="text-slate-600 text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Destaques Superiores (Brancos, Minimalistas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Faturamento Atual"
          value={<AnimatedNumber value={stats.faturamentoMes} prefix="R$ " isCurrency={true} />}
          icon={<Activity size={20} />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          label="OS Concluídas"
          value={<AnimatedNumber value={stats.osConcluidasMes} />}
          icon={<CheckCircle2 size={20} />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          label="Total de OS"
          value={<AnimatedNumber value={stats.osMes} />}
          icon={<Folder size={20} />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          label="Clientes Ativos"
          value={<AnimatedNumber value={stats.clientes} />}
          icon={<Users size={20} />}
          colorClass="text-sky-600"
          bgClass="bg-sky-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Principal - Esquerda (Gráfico e Resumo de Hoje) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Gráfico Elegante */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 tracking-tight">Evolução do Faturamento</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${corCrescimento}`}>
                  {textoCrescimento} vs último mês
                </span>
             </div>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicoFaturamento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(value) => [`R$ ${value}`, 'Faturamento']}
                    />
                    <Area type="monotone" dataKey="faturamento" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* O antigo Painel Escuro, agora Branco Clean */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" /> Movimentação de Hoje
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                 <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
                 <p className="text-2xl font-black text-slate-800">{stats.ordensHojeTotal}</p>
               </div>
               <div className="p-4 rounded-xl bg-blue-50 border border-blue-100/50">
                 <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">Abertas</p>
                 <p className="text-2xl font-black text-blue-900">{stats.hojeAbertas}</p>
               </div>
               <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100/50">
                 <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Concluídas</p>
                 <p className="text-2xl font-black text-emerald-900">{stats.hojeConcluidas}</p>
               </div>
               <div className="p-4 rounded-xl bg-red-50 border border-red-100/50">
                 <p className="text-red-600 text-xs font-semibold uppercase tracking-wider mb-1">Canceladas</p>
                 <p className="text-2xl font-black text-red-900">{stats.hojeCanceladas}</p>
               </div>
            </div>
          </div>

        </div>

        {/* Coluna Lateral - Direita (Atividades Recentes) */}
        <div className="flex flex-col gap-6">
          
          {/* Feed de Últimas OS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-800 tracking-tight">Últimas OS</h3>
              <button onClick={() => navigate('/ordens')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver todas</button>
            </div>
            
            <div className="flex flex-col gap-4">
              {ultimasOrdens.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Nenhuma ordem recente.</p>
              ) : (
                ultimasOrdens.map(os => (
                  <div key={os.id} className="flex gap-3 group cursor-pointer" onClick={() => navigate('/ordens')}>
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                    <div className="flex-1 border-b border-slate-50 pb-3 group-hover:border-blue-100 transition-colors">
                      <p className="text-sm font-semibold text-slate-800">{os.cliente?.nome || 'Cliente'}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{os.veiculo || 'Serviços gerais'}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">OS #{String(os.id).padStart(4, '0')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Acesso Rápido */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-400">Atalhos</h3>
            <div className="flex flex-col gap-2">
              <QuickAction onClick={() => navigate('/ordens')} title="Nova Ordem de Serviço" icon={<PlusCircle size={16} />} />
              <QuickAction onClick={() => navigate('/faturamento')} title="Receber Pagamento" icon={<Activity size={16} />} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Componentes Menores ---

function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ onClick, title, icon }) {
  return (
    <button 
      onClick={onClick} 
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 border border-slate-800 transition-all duration-200 group"
    >
      <div className="text-slate-400 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-slate-300 group-hover:text-white transition-colors text-sm">{title}</h3>
      </div>
      <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
    </button>
  );
}