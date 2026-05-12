import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { MobileNav } from '../components/layout/MobileNav';
import { ToastContainer } from '../components/ui/Toast';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#eef1f6] dark:bg-surface-50 text-gray-900 dark:text-ink">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(env(safe-area-inset-bottom)+3.5rem)] md:pb-0">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto md:p-6 lg:p-8 animate-fade-in relative">
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
