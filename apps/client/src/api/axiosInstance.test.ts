import { afterEach, expect, jest, test } from '@jest/globals';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '@/utils/axiosInstance';

afterEach(() => jest.restoreAllMocks());

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    data: { message: 'Unauthorized' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  });
}

test.each([true, false])(
  'concurrent requests share refresh and settle when refresh succeeds=%s',
  async (refreshSucceeds) => {
    const refreshStarted = Promise.withResolvers<void>();
    const releaseRefresh = Promise.withResolvers<void>();
    const calls: string[] = [];
    const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
      const url = config.url!;
      calls.push(url);
      if (url === '/api/refresh-token') {
        refreshStarted.resolve();
        await releaseRefresh.promise;
        if (!refreshSucceeds) throw unauthorized(config);
      } else if (calls.filter((calledUrl) => calledUrl === url).length === 1) {
        throw unauthorized(config);
      }
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    });
    jest.replaceProperty(axiosInstance.defaults, 'adapter', adapter);

    const results = Promise.allSettled([
      axiosInstance.get('/api/first'),
      axiosInstance.get('/api/second'),
    ]);
    await refreshStarted.promise;
    releaseRefresh.resolve();

    expect((await results).map((result) => result.status)).toEqual(
      refreshSucceeds ? ['fulfilled', 'fulfilled'] : ['rejected', 'rejected'],
    );
    expect(calls.filter((url) => url === '/api/refresh-token')).toHaveLength(1);
    for (const url of ['/api/first', '/api/second']) {
      expect(calls.filter((calledUrl) => calledUrl === url)).toHaveLength(
        refreshSucceeds ? 2 : 1,
      );
    }
  },
);

test.each(['/api/login', '/api/refresh-token'])(
  '%s preserves its own 401 without attempting refresh',
  async (url) => {
    const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config);
    });
    jest.replaceProperty(axiosInstance.defaults, 'adapter', adapter);

    await expect(axiosInstance.post(url, {})).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  },
);

test('a retried request cannot start another refresh', async () => {
  const calls: string[] = [];
  jest.replaceProperty(
    axiosInstance.defaults,
    'adapter',
    async (config: InternalAxiosRequestConfig) => {
      calls.push(config.url!);
      if (config.url !== '/api/refresh-token') throw unauthorized(config);
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    },
  );

  await expect(axiosInstance.get('/api/protected')).rejects.toMatchObject({
    response: { status: 401 },
  });
  expect(calls).toEqual([
    '/api/protected',
    '/api/refresh-token',
    '/api/protected',
  ]);
});

test.each([401, 500])(
  'current-user refresh failure (%s) leaves public pages open',
  async (status) => {
    const location = { pathname: '/', href: '/' };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location },
    });
    jest.replaceProperty(
      axiosInstance.defaults,
      'adapter',
      async (config: InternalAxiosRequestConfig) => {
        const error = unauthorized(config);
        if (config.url === '/api/refresh-token')
          error.response!.status = status;
        throw error;
      },
    );
    try {
      await expect(
        axiosInstance.get('/api/logged-in-user'),
      ).rejects.toMatchObject({
        response: { status },
      });
      expect(location.href).toBe('/');
    } finally {
      Reflect.deleteProperty(globalThis, 'window');
    }
  },
);
