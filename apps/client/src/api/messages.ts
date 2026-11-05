import axios from 'axios';

export function getApiMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object' || !('message' in data)) {
    return fallback;
  }

  const message = data.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  timeoutMessage = 'The request timed out. It may still have completed. Check before trying again.',
): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return timeoutMessage;
  }

  return getApiMessage(error.response?.data, fallback);
}
