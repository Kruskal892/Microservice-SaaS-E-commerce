import { ValidationError } from '@packages/error-handler';
import prisma from '@packages/libs/prisma';
import redis from '@packages/libs/redis';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sendEmail } from '../mail';

const resetLifetimeSeconds = 300;
const invalidResetMessage = 'Invalid or expired password reset token';

export function recoveryBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be an object');
  }
  return body as Record<string, unknown>;
}

export function normalizeRecoveryEmail(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  ) {
    throw new ValidationError('Invalid email format');
  }
  return value.trim().toLowerCase();
}

export function recoveryOtpKey(email: string): string {
  return `password_reset_otp:${email}`;
}

const recoveryAttemptsKey = (email: string) =>
  `password_reset_otp_attempts:${email}`;
const resetGrantKey = (email: string) => `password_reset_grant:${email}`;
// Binding the digest to the current credentials invalidates it after a password change.
const resetDigest = (
  user: { id: string; password: string | null },
  token: string,
) =>
  crypto
    .createHash('sha256')
    .update(`${user.id}:${user.password ?? ''}:${token}`)
    .digest('hex');

export async function issuePasswordResetToken(email: string, otp: unknown) {
  if (typeof otp !== 'string' || otp.length !== 4 || !/^[0-9]{4}$/.test(otp)) {
    throw new ValidationError('Enter the four-digit code');
  }
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw new ValidationError('Expired or invalid OTP!');

  const resetToken = crypto.randomBytes(32).toString('hex');
  // Verification, attempt counting, OTP consumption, and grant creation are atomic.
  const result = await redis.eval(
    `if redis.call('EXISTS', KEYS[3]) == 1 then return -2 end
     local code = redis.call('GET', KEYS[1])
     if not code then return -1 end
     if code ~= ARGV[1] then
       local attempts = redis.call('INCR', KEYS[2])
       redis.call('EXPIRE', KEYS[2], 300)
       if attempts >= 3 then
         redis.call('SET', KEYS[3], 'locked', 'EX', 1800)
         redis.call('DEL', KEYS[1], KEYS[2])
         return -2
       end
       return -3
     end
     redis.call('SET', KEYS[4], ARGV[2], 'EX', ARGV[3])
     redis.call('DEL', KEYS[1], KEYS[2])
     return 1`,
    4,
    recoveryOtpKey(email),
    recoveryAttemptsKey(email),
    `otp_lock:${email}`,
    resetGrantKey(email),
    otp,
    resetDigest(user, resetToken),
    resetLifetimeSeconds,
  );
  if (result === -2) {
    throw new ValidationError('Account is locked. Try again after 30 minutes');
  }
  if (result === -3) throw new ValidationError('Incorrect OTP');
  if (result !== 1) throw new ValidationError('Expired or invalid OTP!');
  return { resetToken, expiresInSeconds: resetLifetimeSeconds };
}

export async function completePasswordReset(body: unknown): Promise<void> {
  const payload = recoveryBody(body);
  const email = normalizeRecoveryEmail(payload.email);
  const { resetToken, newPassword } = payload;
  if (
    typeof resetToken !== 'string' ||
    resetToken.length !== 64 ||
    !/^[a-f0-9]{64}$/.test(resetToken)
  ) {
    throw new ValidationError(invalidResetMessage);
  }
  if (
    typeof newPassword !== 'string' ||
    newPassword.length < 8 ||
    newPassword.length > 128
  ) {
    throw new ValidationError(
      'Password must contain between 8 and 128 characters',
    );
  }

  const key = resetGrantKey(email);
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw new ValidationError(invalidResetMessage);
  const digest = resetDigest(user, resetToken);
  if ((await redis.get(key)) !== digest) {
    throw new ValidationError(invalidResetMessage);
  }

  const password = await bcrypt.hash(newPassword, 10);
  // Consume before writing: retries or concurrent requests cannot reuse the grant.
  // A database failure after this point requires a new recovery request.
  const consumed = await redis.eval(
    `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
     redis.call('DEL', KEYS[1], KEYS[2], KEYS[3])
     return 1`,
    3,
    key,
    recoveryOtpKey(email),
    recoveryAttemptsKey(email),
    digest,
  );
  if (consumed !== 1) throw new ValidationError(invalidResetMessage);

  // A grant issued before another password change cannot overwrite that change.
  const updated = await prisma.users.updateMany({
    where: { id: user.id, email, password: user.password },
    data: { password },
  });
  if (updated.count !== 1) throw new ValidationError(invalidResetMessage);

  // Notification delivery must not turn a committed password change into a failure.
  await sendEmail(
    email,
    'Your Eshop password was changed',
    'password-reset-success-email',
    {},
  ).catch(() => console.error('Unable to send password change notification'));
}
