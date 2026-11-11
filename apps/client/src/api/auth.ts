import {
  currentUserSchema,
  forgotPasswordSchema,
  loginSchema,
  recoveryAuthorizationSchema,
  registrationSchema,
  resetPasswordPayloadSchema,
  verifyRecoveryOtpSchema,
  verifyOtpSchema,
} from '@/schemas';
import { axiosInstance } from '@/utils/axiosInstance';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import axios from 'axios';
import type { z } from 'zod';

export function getApiRetryAfterSeconds(data: unknown): number | undefined {
  if (!data || typeof data !== 'object' || !('retryAfterSeconds' in data))
    return;
  const seconds = data.retryAfterSeconds;
  return typeof seconds === 'number' &&
    Number.isSafeInteger(seconds) &&
    seconds >= 0
    ? seconds
    : undefined;
}

export function getApiErrorRetryAfterSeconds(
  error: unknown,
): number | undefined {
  if (!axios.isAxiosError(error)) return;
  const data: unknown = error.response?.data;
  if (!data || typeof data !== 'object' || !('details' in data)) return;
  return getApiRetryAfterSeconds(data.details);
}

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
  queryKey: ['user'],
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

export const registrationMutation = mutationOptions({
  mutationKey: ['auth', 'registration'],
  retry: false,
  mutationFn: async (payload: z.input<typeof registrationSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/user-registration',
      registrationSchema.parse(payload),
    );

    return {
      message: getApiMessage(
        data,
        'A verification code has been sent. Please check your email.',
      ),
      retryAfterSeconds: getApiRetryAfterSeconds(data) ?? 60,
    };
  },
});

export const verifyOtpMutation = mutationOptions({
  mutationKey: ['auth', 'verify-otp'],
  retry: false,
  mutationFn: async (payload: z.input<typeof verifyOtpSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/verify-registration',
      verifyOtpSchema.parse(payload),
    );

    return {
      message: getApiMessage(
        data,
        'Your account has been successfully verified.',
      ),
    };
  },
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

export const forgotPasswordMutation = mutationOptions({
  mutationKey: ['auth', 'forgot-password'],
  retry: false,
  mutationFn: async (payload: z.input<typeof forgotPasswordSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/forgot-password-user',
      forgotPasswordSchema.parse(payload),
    );

    return {
      message: getApiMessage(
        data,
        'A verification code has been sent. Please check your email.',
      ),
      retryAfterSeconds: getApiRetryAfterSeconds(data) ?? 60,
    };
  },
});

export const verifyRecoveryOtpMutation = mutationOptions({
  mutationKey: ['auth', 'verify-recovery-otp'],
  retry: false,
  gcTime: 0,
  mutationFn: async (payload: z.input<typeof verifyRecoveryOtpSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/verify-forgot-password-user',
      verifyRecoveryOtpSchema.parse(payload),
    );
    return recoveryAuthorizationSchema.parse(data);
  },
});

export const resetPasswordMutation = mutationOptions({
  mutationKey: ['auth', 'reset-password'],
  retry: false,
  gcTime: 0,
  mutationFn: async (payload: z.input<typeof resetPasswordPayloadSchema>) => {
    const { data } = await axiosInstance.post(
      '/api/reset-password-user',
      resetPasswordPayloadSchema.parse(payload),
    );
    return {
      message: getApiMessage(
        data,
        'Your password has been reset. Sign in with your new password.',
      ),
    };
  },
});
