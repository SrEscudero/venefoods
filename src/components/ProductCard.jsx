import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product }) {
  
  // Función para elegir el color del badge
  const getBadgeColor = (color) => {
    switch(color) {
        case 'red': return 'bg-red-500 text-white shadow-red-500/30';
        case 'blue': return 'bg-blue-500 text-white shadow-blue-500/30';
        case 'orange': return 'bg-orange-500 text-white shadow-orange-500/30';
        case 'green': return 'bg-green-500 text-white shadow-green-500/30';
        default: return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-4 relative group shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full">
      
      {/* 1. ETIQUETA (BADGE) FLOTANTE */}
      {product.badge && (
        <span className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-lg ${getBadgeColor(product.badge.color)}`}>
            {product.badge.text}
        </span>
      )}

      {/* 2. IMAGEN CON ZOOM Y LAZY LOADING */}
      <div className="h-40 w-full mb-4 flex items-center justify-center p-2 relative overflow-visible">
         {/* Círculo decorativo de fondo */}
         <div className="absolute w-28 h-28 bg-gray-50 rounded-full blur-xl group-hover:bg-blue-50 transition-colors duration-500"></div>
         
         <img 
            src={product.image} 
            alt={product.name}
            loading="lazy" // <--- Optimización de velocidad
            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500 ease-out mix-blend-multiply relative z-10"
         />
      </div>

      {/* 3. INFORMACIÓN */}
      <div className="flex-1 flex flex-col">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 text-[15px]">{product.name}</h3>
          
          <div className="mt-auto flex items-end justify-between gap-2">
            <div>
                {/* Precio Anterior (Tachado) si existe */}
                {product.oldPrice && (
                    <span className="block text-xs text-gray-400 line-through decoration-red-400 decoration-2">
                        R$ {product.oldPrice.toFixed(2)}
                    </span>
                )}
                <span className="text-lg font-extrabold text-blue-600 block">
                    R$ {product.price.toFixed(2)}
                </span>
            </div>

            {/* Botón "+" meramente visual (la acción la hace el Link padre en Home) */}
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Plus size={18} strokeWidth={3} />
            </div>
          </div>
      </div>
    </div>
  );
}