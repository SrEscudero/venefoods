import React from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Importar esto
import { ArrowRight } from 'lucide-react';

export default function CartSummary({ count, total }) {
  const navigate = useNavigate(); // <--- Hook de navegación

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 animate-slide-up">
      <button 
        // Cambiamos el onClick para ir a checkout
        onClick={() => navigate('/checkout')} 
        className="bg-slate-900 text-white w-full p-4 rounded-[2rem] shadow-2xl flex items-center justify-between hover:bg-slate-800 transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
            {count}
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total estimado</p>
            <p className="text-xl font-bold">R$ {total.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm font-bold">
          Ver Pedido <ArrowRight size={18} />
        </div>
      </button>
    </div>
  );
}