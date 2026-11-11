'use client';

import {
  currentUserQuery,
  getApiErrorMessage,
  loginMutation,
} from '@/api/auth';
import { AuthCard } from '@/components';
import { type LoginFormValues, loginSchema } from '@/schemas';
import { zodResolver } from '@/utils/zod-resolver';
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  Input,
  Label,
} from '@packages/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function Login() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const useLoginMutation = useMutation({
    ...loginMutation,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: currentUserQuery.queryKey });
      await queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      });
      router.push('/');
    },
    onError: (error) => {
      setServerError(
        getApiErrorMessage(error, 'Login failed. Please try again.'),
      );
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setServerError(null);
    useLoginMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Welcome back."
      description={
        <>
          Sign in to your Eshop account.
          <br />
          Your next find is waiting.
        </>
      }
      footer={
        <>
          New to Eshop?{' '}
          <Link
            href="/sign-up"
            className="rounded-xs font-medium text-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <Field>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="alex@example.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <FieldError id="email-error">{errors.email.message}</FieldError>
          )}
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <FieldError id="password-error">
              {errors.password.message}
            </FieldError>
          )}
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex min-h-11 items-center gap-2">
            <Checkbox id="remember-me" name="rememberMe" />
            <Label
              htmlFor="remember-me"
              className="flex min-h-11 cursor-pointer items-center font-normal"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="rounded-xs font-medium text-text underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting || useLoginMutation.isPending}
          className="w-full"
        >
          Sign in
        </Button>
        {serverError && (
          <p
            role="alert"
            className="rounded-sm bg-red-100 p-4 text-sm text-red-700"
          >
            {serverError}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
