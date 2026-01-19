// App layout wrapper - includes bottom navigation for authenticated pages
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from './InstallPrompt';

export function AppLayout() {
  return (
    <div className="min-h-screen pb-16">
      {/* Page content rendered via Outlet */}
      <Outlet />

      {/* PWA install prompt (mobile only, dismissible) */}
      <InstallPrompt />

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
