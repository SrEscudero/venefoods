import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
      <div
        className={`
          flex items-center gap-3 px-5 py-3 rounded-full shadow-xl border backdrop-blur-xl
          ${
            type === 'success'
              ? 'bg-white/90 border-green-100 text-slate-800'
              : 'bg-white/90 border-red-100 text-slate-800'
          }
        `}
      >
        {type === 'success' ? (
          <div className="bg-green-500 p-1 rounded-full text-white shadow-sm">
            <CheckCircle size={16} />
          </div>
        ) : (
          <div className="bg-red-500 p-1 rounded-full text-white shadow-sm">
            <XCircle size={16} />
          </div>
        )}
        <span className="text-sm font-semibold tracking-wide pr-2">{message}</span>
      </div>
    </div>
  );
}