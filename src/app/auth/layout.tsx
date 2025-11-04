'use client'

import { DatabaseAuthProvider } from '@/context/DatabaseAuthContext'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DatabaseAuthProvider>
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
          {children}
        </div>
      </div>
    </DatabaseAuthProvider>
  );
}
