/**
 * Decodifica o payload de um JWT sem validar assinatura
 * (apenas para checar expiração no lado cliente).
 */
function decodificarPayload(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Retorna true se o token estiver expirado ou inválido.
 */
export function tokenExpirado(token) {
  const payload = decodificarPayload(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}

/**
 * Limpa o token e retorna true se estava expirado.
 */
export function limparTokenSeExpirado() {
  const token = localStorage.getItem('token');
  if (!token || tokenExpirado(token)) {
    localStorage.removeItem('token');
    return true;
  }
  return false;
}

/**
 * Retorna os segundos restantes até a expiração do token.
 */
export function tempoRestante(token) {
  const payload = decodificarPayload(token || localStorage.getItem('token'));
  if (!payload || !payload.exp) return 0;
  const restante = Math.floor((payload.exp * 1000 - Date.now()) / 1000);
  return restante > 0 ? restante : 0;
}

/**
 * Retorna o payload completo decodificado do token atual ou fornecido.
 */
export function obterPayload(token) {
  const t = token || localStorage.getItem('token');
  if (!t) return null;
  return decodificarPayload(t);
}

/**
 * Retorna a role do usuário (ex: 'ADMIN', 'OPERADOR').
 */
export function obterRole(token) {
  const payload = obterPayload(token);
  if (!payload?.role) return null;
  return String(payload.role).toUpperCase();
}

/**
 * Retorna true se o usuário logado tiver papel de Administrador.
 */
export function usuarioEhAdmin(token) {
  const role = obterRole(token);
  return role === 'ADMIN' || role === 'ROLE_ADMIN';
}

/**
 * Retorna o login/identificador do usuário logado.
 */
export function obterLoginUsuario(token) {
  const payload = obterPayload(token);
  return payload?.sub || null;
}
