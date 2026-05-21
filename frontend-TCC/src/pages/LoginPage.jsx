import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User } from 'lucide-react';
import api from '../services/api';
import logoBazani from '../assets/logo-bazani.png';
import decorPneu from '../assets/decor-pneu.png';
import decorTrigo from '../assets/decor-trigo.png';

export function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const token = res.data.token;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (onLogin) onLogin(token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 429) {
        const retryMinutes = Math.ceil((err.response.headers['retry-after'] || 900) / 60);
        setErro(`Muitas tentativas de login. Aguarde ${retryMinutes} minutos.`);
      } else {
        setErro('Login ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Decoração: Rastro de pneu (esquerda) */}
      <img src={decorPneu} alt="" style={styles.tireTrack} />

      {/* Decoração: Trigo (direita) */}
      <img src={decorTrigo} alt="" style={styles.wheatDecor} />

      {/* Conteúdo central */}
      <div style={styles.content}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src={logoBazani} alt="Bazani Mecânica Agrícola" style={styles.logo} />
        </div>

        {/* Card */}
        <div style={styles.cardOuter}>
          <div style={styles.card}>
            <h2 style={styles.title}>Entrar no sistema</h2>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Usuário */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Usuário</label>
                <div style={styles.inputWrapper}>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={form.login}
                    onChange={e => setForm({ ...form, login: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <User size={18} style={styles.inputIcon} />
                </div>
              </div>

              {/* Senha */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Senha</label>
                <div style={styles.inputWrapper}>
                  <input
                    className="login-input"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <button
                    className="login-eye"
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={styles.eyeButton}
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {erro && <div style={styles.erro}>{erro}</div>}

              {/* Botão */}
              <button className="login-btn" type="submit" disabled={loading} style={styles.submitButton}>
                {loading ? (
                  <span style={styles.spinner} />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p style={styles.footer}>Bazani Mecânica © {new Date().getFullYear()}</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-input::placeholder {
          color: rgba(148, 163, 184, 0.6);
        }
        .login-input:focus {
          border-color: rgba(100, 160, 255, 0.4);
          background: rgba(255, 255, 255, 0.08);
        }
        .login-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0, 100, 120, 0.4);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-eye:hover {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1a2540 30%, #1e3054 60%, #1a2f5a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '16px',
  },
  tireTrack: {
    position: 'absolute',
    left: '-10%',
    top: '-25%',
    height: '150vh',
    width: 'auto',
    transform: 'rotate(30deg)',
    pointerEvents: 'none',
    opacity: 0.15,
    mixBlendMode: 'multiply',
  },
  wheatDecor: {
    position: 'absolute',
    right: '-5%',
    bottom: '-5%',
    width: '65vw',
    minWidth: '800px',
    height: 'auto',
    objectFit: 'contain',
    pointerEvents: 'none',
    opacity: 0.12,
    mixBlendMode: 'multiply',
    filter: 'grayscale(100%)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '440px',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logo: {
    width: '240px',
    height: 'auto',
    margin: '0 auto',
    display: 'block',
    filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3)) brightness(1.1)',
    mixBlendMode: 'lighten',
  },
  subtitle: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: '14px',
    marginTop: '8px',
    letterSpacing: '0.5px',
  },
  cardOuter: {
    borderRadius: '24px',
    padding: '1px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(200,168,78,0.25) 100%)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(200,168,78,0.05)',
  },
  card: {
    background: 'linear-gradient(180deg, rgba(25, 35, 60, 0.95) 0%, rgba(20, 30, 50, 0.98) 100%)',
    borderRadius: '23px',
    padding: '36px 32px 32px',
    backdropFilter: 'blur(20px)',
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '28px',
    marginTop: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: 'rgba(203, 213, 225, 0.9)',
    fontSize: '13px',
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '14px 48px 14px 16px',
    borderRadius: '14px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  },
  inputIcon: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(148, 163, 184, 0.5)',
    pointerEvents: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'rgba(148, 163, 184, 0.5)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    transition: 'color 0.2s ease',
  },
  erro: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#fca5a5',
    fontSize: '13px',
    padding: '12px 16px',
    borderRadius: '12px',
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(180deg, #1a7a8a 0%, #0d5e6e 50%, #0a4f5e 100%)',
    boxShadow: '0 4px 15px rgba(0, 80, 100, 0.3), inset 0 1px 0 rgba(200, 168, 78, 0.4)',
    borderTop: '1px solid rgba(200, 168, 78, 0.35)',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(100, 116, 139, 0.6)',
    fontSize: '12px',
    marginTop: '28px',
    letterSpacing: '0.3px',
  },
};