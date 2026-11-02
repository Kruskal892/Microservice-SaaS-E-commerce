'use client';
import { GoogleButton } from '@/components';
import { type LoginFormValues, loginSchema } from '@/schemas';
import { zodResolver } from '@/utils/zod-resolver';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldError,
  Input,
  Label,
} from '@packages/ui';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const Login = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    console.log('Form submitted:', data);
  };

  return (
    <div className="flex min-h-[85vh] w-full flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="font-poppins text-3xl font-semibold text-text">Login</h1>
        <p className="mt-1 text-sm text-muted">
          <Link href="/" className="hover:text-text">
            Home
          </Link>{' '}
          <span aria-hidden="true">/</span> Login
        </p>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-poppins text-2xl">
            Login to Your Account
          </CardTitle>
          <CardDescription>
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="font-medium text-action hover:underline"
            >
              Register
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <GoogleButton />

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="flex-1 border-t border-border" />
            <span>or sign in with email</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
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
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                {...register('password')}
              />
              {errors.password && (
                <FieldError id="password-error">
                  {errors.password.message}
                </FieldError>
              )}
            </Field>

            <div className="flex items-center justify-between pt-1 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember-me"
                  className="cursor-pointer font-normal text-muted"
                >
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="font-medium text-action hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {serverError && <FieldError>{serverError}</FieldError>}

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-800 focus-visible:outline-black"
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
