"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext';
import { AnchorView } from "@/components/anchor-view";
import { OfflineStatus } from '@/components/offline-status';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppPage() {
  const { isAuthenticated, isLoading, user } = useDatabaseAuthSafe();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isHydrated, isAuthenticated, isLoading, router]);

  // Show loading state while initializing or before hydration
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <Skeleton className="h-8 w-64" />
          <div className="text-sm text-gray-500">
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Offline Status Bar */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <OfflineStatus compact={true} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <AnchorView />
      </div>
    </main>
  );
}