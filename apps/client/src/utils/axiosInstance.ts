import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<unknown> | null = null;

// Handle logout and prevent infinite loops
const handleLogout = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Handle expired access token and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: RetryRequestConfig | undefined = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url === '/api/login' ||
      originalRequest.url === '/api/refresh-token'
    ) {
      throw error;
    }

    originalRequest._retry = true;
    refreshPromise ??= axiosInstance
      .post('/api/refresh-token', {})
      .finally(() => {
        refreshPromise = null;
      });

    try {
      await refreshPromise;
    } catch (refreshError) {
      if (
        originalRequest.url !== '/api/logged-in-user' &&
        axios.isAxiosError(refreshError) &&
        refreshError.response?.status === 401
      ) {
        handleLogout();
      }
      throw refreshError;
    }
    return axiosInstance(originalRequest);
  },
);
