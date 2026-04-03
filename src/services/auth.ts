import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'ngs_token';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  if (response.token) {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    api.setToken(response.token);
  }
  return response;
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/register', {
    email,
    password,
    displayName,
  });
  if (response.token) {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    api.setToken(response.token);
  }
  return response;
}

export function logout(): void {
  api.setToken(null);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function initAuth(): void {
  const token = getStoredToken();
  if (token) {
    api.setToken(token);
  }
}
