import { useMutation, useQuery } from '@tanstack/react-query';
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
} from '@/services/auth';
import type { AuthUser } from '@/services/auth';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginService(email, password),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => registerService(email, password, displayName),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`,
        );
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

export function useLogout() {
  return () => {
    logoutService();
  };
}
