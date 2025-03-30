'use client';

import { useEffect, useState, ReactNode } from 'react';

interface NoSsrProps {
  children: ReactNode;
}

export function NoSsr({ children }: NoSsrProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
} 