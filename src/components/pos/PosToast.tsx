import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface PosToastNotification {
  id: number;
  message: string;
  type?: 'warning' | 'error' | 'info' | 'success';
  title?: string;
  duration?: number;
}

interface PosToastProps {
  toast: PosToastNotification | null;
  onDismiss: () => void;
}

export const PosToast: React.FC<PosToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration ?? 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          id="pos-validation-toast"
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-5 right-5 sm:right-8 z-50 max-w-md w-full no-print shadow-2xl rounded-2xl pointer-events-auto"
        >
          <div
            className={`p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3 text-sm shadow-xl transition-all ${
              toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 ring-1 ring-rose-500/30 shadow-rose-950/50'
                : toast.type === 'info'
                ? 'bg-sky-950/95 border-sky-500/50 text-sky-100 ring-1 ring-sky-500/30 shadow-sky-950/50'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 ring-1 ring-emerald-500/30 shadow-emerald-950/50'
                : 'bg-amber-950/95 border-amber-500/60 text-amber-100 ring-1 ring-amber-500/40 shadow-amber-950/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : toast.type === 'info' ? (
                <Info className="w-5 h-5 text-sky-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <h4 className="font-extrabold text-xs uppercase tracking-wider mb-1 opacity-90">
                  {toast.title}
                </h4>
              )}
              <p className="font-medium text-xs sm:text-sm leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 p-1 rounded-lg hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
