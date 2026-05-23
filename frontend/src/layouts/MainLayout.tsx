import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { ToastContainer } from '../components/ui/Toast';
import { Navbar } from '../components/layout/Navbar';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-surface dark:bg-surface-900 text-text-primary">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Feed Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(env(safe-area-inset-bottom)+3.5rem)] md:pb-0">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto animate-fade-in relative bg-surface-50 dark:bg-surface-900">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
