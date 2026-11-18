import { currentUserSchema, loginSchema } from '@/schemas';
import { axiosInstance } from '@/utils/axiosInstance';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import axios from 'axios';
import type { z } from 'zod';

export function getApiMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object' || !('message' in data))
    return fallback;
  const message = data.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  timeoutMessage = 'The request timed out. It may still have completed. Check before trying again.',
): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    return timeoutMessage;
  return getApiMessage(error.response?.data, fallback);
}

export const currentUserQuery = queryOptions({
  queryKey: ['seller'],
  queryFn: async ({ signal }) => {
    try {
      const { data } = await axiosInstance.get('/api/logged-in-user', {
        signal,
      });
      return currentUserSchema.parse(data.user);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401)
        return null;
      throw error;
    }
  },
  staleTime: 5 * 60 * 1000,
  retry: false,
});

export const loginMutation = mutationOptions({
  mutationKey: ['auth', 'login'],
  retry: false,
  mutationFn: async (payload: z.input<typeof loginSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/login',
      loginSchema.parse(payload),
    );

    return {
      message: getApiMessage(data, 'Login successful.'),
    };
  },
});
