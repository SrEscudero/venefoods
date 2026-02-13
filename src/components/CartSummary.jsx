import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartSummary({ count, total, onClick }) {
  const navigate = useNavigate();

  if (count === 0) return null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up flex justify-center pointer-events-none">
      <button
        onClick={handleClick}
        className="pointer-events-auto group relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl text-white p-2 pr-3 rounded-3xl shadow-2xl shadow-slate-900/40 border border-white/20 flex items-center justify-between transition-all duration-300 active:scale-[0.98] hover:bg-slate-900"
      >
        {/* Efecto de brillo sutil en el borde superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>

        <div className="flex items-center gap-4 pl-2">
          {/* Icono con Badge flotante */}
          <div className="relative">
            <div className="bg-white/10 p-3.5 rounded-full backdrop-blur-md">
              <ShoppingBag size={22} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-900 animate-bounce-subtle">
              {count}
            </div>
          </div>

          {/* Información del Total */}
          <div className="text-left flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">
              Total Estimado
            </p>
            <p className="text-xl font-black leading-none tracking-tight">
              R$ {total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Botón de Acción (Píldora blanca) */}
        <div className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-white/5 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:shadow-white/20">
          <span>Ver Pedido</span>
          <ArrowRight size={18} className="text-blue-600" />
        </div>
      </button>
    </div>
  );
}