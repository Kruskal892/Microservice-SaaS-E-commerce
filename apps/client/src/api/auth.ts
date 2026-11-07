import {
  type LoginFormValues,
  type SignUpFormValues,
  type VerifyOtpPayload,
  verifyOtpSchema,
} from '@/schemas';
import { mutationOptions } from '@tanstack/react-query';
import axios from 'axios';
import { api } from './client';

type RegistrationPayload = Pick<
  SignUpFormValues,
  'name' | 'email' | 'password'
>;

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

export const registrationMutation = mutationOptions({
  mutationKey: ['auth', 'registration'],
  retry: false,
  mutationFn: async ({ name, email, password }: RegistrationPayload) => {
    const { data } = await api.post('/api/user-registration', {
      name,
      email,
      password,
    });

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
  mutationFn: async (payload: VerifyOtpPayload) => {
    const { data } = await api.post(
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
  mutationFn: async (payload: LoginFormValues) => {
    const { data } = await api.post('/api/login', payload, {
      withCredentials: true,
    });

    return {
      message: getApiMessage(data, 'Login successful.'),
    };
  },
});
