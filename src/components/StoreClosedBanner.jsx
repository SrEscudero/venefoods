import React from 'react';
import { Clock, Lock } from 'lucide-react';

export default function StoreClosedBanner({ message }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-slide-up">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-6 shadow-2xl border-t border-slate-700 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-red-500/20 p-3 rounded-full text-red-400">
                <Lock size={24} />
            </div>
            <div>
                <h3 className="font-bold text-lg text-white">Tienda Cerrada Temporalmente</h3>
                <p className="text-gray-400 text-sm">{message || "No estamos aceptando pedidos en este momento."}</p>
            </div>
        </div>
        <div className="text-xs font-mono bg-slate-800 px-3 py-1 rounded text-gray-500 flex items-center gap-2">
            <Clock size={12}/> Horario no disponible
        </div>
      </div>
    </div>
  );
}