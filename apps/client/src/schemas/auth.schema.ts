import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signUpSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(1, 'Full name is required')
      .max(100, 'Full name must be at most 100 characters'),
    email: loginSchema.shape.email.max(254, 'Email is too long'),
    password: loginSchema.shape.password.max(
      128,
      'Password must be at most 128 characters',
    ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const otpCodeSchema = z
  .string()
  .length(4, 'Enter the four-digit code')
  .regex(/^[0-9]+$/, 'Use digits only');

export const verifyOtpSchema = z.object({
  name: signUpSchema.shape.name,
  email: signUpSchema.shape.email.transform((email) => email.toLowerCase()),
  password: signUpSchema.shape.password,
  otp: otpCodeSchema,
});

export type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: signUpSchema.shape.email.transform((email) => email.toLowerCase()),
});

export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;

export const verifyRecoveryOtpSchema = forgotPasswordSchema.extend({
  otp: otpCodeSchema,
});

export type VerifyRecoveryOtpPayload = z.infer<typeof verifyRecoveryOtpSchema>;

export const recoveryAuthorizationSchema = z.object({
  resetToken: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]+$/),
  expiresInSeconds: z.number().int().positive(),
});

export const resetPasswordSchema = z
  .object({
    newPassword: signUpSchema.shape.password,
    confirmPassword: signUpSchema.shape.confirmPassword,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const resetPasswordPayloadSchema = forgotPasswordSchema.extend({
  resetToken: recoveryAuthorizationSchema.shape.resetToken,
  newPassword: signUpSchema.shape.password,
});

export type ResetPasswordPayload = z.infer<typeof resetPasswordPayloadSchema>;
