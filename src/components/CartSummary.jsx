import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CartSummary({ count, total, onClick }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto animate-slide-up">
      <button 
        onClick={onClick}
        className="w-full bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl shadow-slate-900/30 flex items-center justify-between group active:scale-[0.98] transition-all border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm">
            {count}
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-300 font-medium">Total estimado</p>
            <p className="font-bold text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 font-semibold text-sm bg-white/10 px-4 py-2 rounded-xl group-hover:bg-white/20 transition">
          Ver Pedido <ArrowRight size={16} />
        </div>
      </button>
    </div>
  );
}