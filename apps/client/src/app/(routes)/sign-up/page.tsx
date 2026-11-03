'use client';

import { AuthCard } from '@/components';
import { type SignUpFormValues, signUpSchema } from '@/schemas';
import { zodResolver } from '@/utils/zod-resolver';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  Input,
  Label,
} from '@packages/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function SignUpPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  return (
    <AuthCard
      title="Create your account"
      description="Start with your name, email, and a password."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded-sm font-semibold text-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus dark:text-focus"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(() => setSubmitted(true))}
        noValidate
        className="flex flex-col gap-5"
      >
        <Field className="font-roboto">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Your full name"
            autoComplete="name"
            required
            maxLength={100}
            className="h-12 rounded-lg font-roboto"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <FieldError id="name-error">{errors.name.message}</FieldError>
          )}
        </Field>

        <Field className="font-roboto">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            maxLength={254}
            className="h-12 rounded-lg font-roboto"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <FieldError id="email-error">{errors.email.message}</FieldError>
          )}
        </Field>

        <Field className="font-roboto">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
            maxLength={128}
            className="h-12 rounded-lg font-roboto"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'password-hint password-error' : 'password-hint'
            }
            {...register('password')}
          />
          <FieldDescription id="password-hint" className="text-xs">
            Use between 8 and 128 characters.
          </FieldDescription>
          {errors.password && (
            <FieldError id="password-error">
              {errors.password.message}
            </FieldError>
          )}
        </Field>

        <Field className="font-roboto">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            maxLength={128}
            className="h-12 rounded-lg font-roboto"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? 'confirm-password-error' : undefined
            }
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <FieldError id="confirm-password-error">
              {errors.confirmPassword.message}
            </FieldError>
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-lg font-roboto font-semibold shadow-sm"
        >
          Create account
        </Button>
        {submitted && (
          <p
            role="status"
            className="rounded-lg bg-surface-alt p-3 text-sm text-muted"
          >
            Account creation is not available yet. Your details have not been
            sent.
          </p>
        )}
      </form>
    </AuthCard>
  );
}
