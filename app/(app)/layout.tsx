export const dynamic = 'force-dynamic';

import { AppHeader } from '@/components/layout/AppHeader';
import { AuthProvider } from '@/components/providers/AuthProvider';
import ToastContainer from '@/components/ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <ToastContainer />
    </AuthProvider>
  );
}
