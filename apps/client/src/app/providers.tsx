'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import React, { useState } from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        scriptProps={{
          type:
            typeof window === 'undefined'
              ? 'text/javascript'
              : 'application/json',
        }}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
