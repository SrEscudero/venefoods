import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  
  // Auto-cierre después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-full shadow-xl border backdrop-blur-md
        ${type === 'success' 
            ? 'bg-white/90 border-green-100 text-slate-800' 
            : 'bg-white/90 border-red-100 text-slate-800'}
      `}>
        {type === 'success' ? (
            <div className="bg-green-100 p-1 rounded-full text-green-600">
                <CheckCircle size={18} fill="currentColor" className="text-white" />
            </div>
        ) : (
            <div className="bg-red-100 p-1 rounded-full text-red-600">
                <XCircle size={18} fill="currentColor" className="text-white" />
            </div>
        )}
        
        <span className="text-sm font-bold tracking-wide pr-2">
            {message}
        </span>
      </div>
    </div>
  );
}