import { Outlet } from 'react-router-dom';
import { ToastContainer } from '../components/ui/Toast';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-bg-surface text-text-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/20 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-2xl shadow-glow-sm">
            V
          </div>
          <span className="font-display font-bold text-3xl tracking-tight text-ink">VibeConnect</span>
        </div>
        
        <Outlet />
      </div>

      <ToastContainer />
    </div>
  );
};
