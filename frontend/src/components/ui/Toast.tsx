import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast, ToastType } from '../../store/ToastContext';
import { useEffect } from 'react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="text-emerald-500" size={20} />,
  error: <XCircle className="text-red-500" size={20} />,
  warning: <AlertCircle className="text-amber-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: any; onRemove: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [onRemove, toast.duration]);

  return (
    <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-border-base dark:border-gray-600 shadow-dark-lg rounded-xl p-4 min-w-[300px] max-w-sm pointer-events-auto animate-slide-left">
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type as ToastType]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{toast.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-ink-muted hover:text-ink transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
