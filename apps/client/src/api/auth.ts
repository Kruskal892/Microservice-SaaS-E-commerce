import {
  type LoginFormValues,
  type SignUpFormValues,
  type VerifyOtpPayload,
  verifyOtpSchema,
} from '@/schemas';
import { mutationOptions } from '@tanstack/react-query';
import { api } from './client';
import { getApiMessage } from './messages';

type RegistrationPayload = Pick<
  SignUpFormValues,
  'name' | 'email' | 'password'
>;

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
