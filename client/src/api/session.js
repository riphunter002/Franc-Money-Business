// tudo que precisa ser lembrado entre um F5 e outro (token + dados do
// usuario) fica junto aqui - token e user sao sempre gravados/limpos juntos,
// entao faz sentido serem uma unidade so em vez de dois modulos separados
const TOKEN_KEY = 'fmb_token';
const USER_KEY = 'fmb_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
