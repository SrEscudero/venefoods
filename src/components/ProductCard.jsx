import React from 'react';
import { Plus, ShoppingCart, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductCard({ product, onAdd, cart = [] }) {
  
  // 1. LÓGICA DE INVENTARIO
  // Buscamos cuántas unidades de este producto tiene YA el cliente en su carrito
  const cartItem = cart.find(item => item.id === product.id);
  const currentQty = cartItem ? cartItem.quantity : 0;
  
  // Definimos estados basados en el stock (asegurando que sea número con || 0)
  const stock = product.stock || 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < 5;
  const canAdd = currentQty < stock;

  // 2. FUNCIÓN DE AGREGAR (Compra Rápida)
  const handleQuickAdd = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (isOutOfStock) return;

    onAdd(product);
};

  // 3. FUNCIÓN DE COLOR DE BADGE (Tu diseño original)
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
    <div className={`bg-white rounded-[2rem] p-4 relative group shadow-sm transition-all duration-300 border border-gray-100 flex flex-col h-full 
      ${isOutOfStock ? 'opacity-70 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}
    `}>
      
      {/* --- ETIQUETAS FLOTANTES (BADGES) --- */}
      
      {/* Caso A: Agotado */}
      {isOutOfStock && (
        <span className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-lg bg-slate-800 text-white rotate-[-5deg]">
            AGOTADO
        </span>
      )}

      {/* Caso B: Pocas Unidades (Prioridad sobre marketing) */}
      {!isOutOfStock && isLowStock && (
        <span className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-lg bg-red-100 text-red-600 flex items-center gap-1 animate-pulse border border-red-200">
            <AlertCircle size={10} /> ¡Quedan {stock}!
        </span>
      )}

      {/* Caso C: Badge de Marketing (Solo si hay stock normal) */}
      {!isOutOfStock && !isLowStock && product.badge && (
        <span className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-lg ${getBadgeColor(product.badge.color)}`}>
            {product.badge.text}
        </span>
      )}

      {/* --- IMAGEN CON ZOOM --- */}
      <div className="h-40 w-full mb-4 flex items-center justify-center p-2 relative overflow-visible">
         {/* Círculo decorativo */}
         <div className="absolute w-28 h-28 bg-gray-50 rounded-full blur-xl group-hover:bg-blue-50 transition-colors duration-500"></div>
         
         <img 
           src={product.image} 
           alt={product.name}
           loading="lazy"
           className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500 ease-out mix-blend-multiply relative z-10"
         />
      </div>

      {/* --- INFORMACIÓN --- */}
      <div className="flex-1 flex flex-col">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 text-[15px]">{product.name}</h3>
          
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-50 pt-3">
            <div>
                {/* Precio Anterior (si existe) */}
                {product.oldPrice && (
                    <span className="block text-xs text-gray-400 line-through decoration-red-400 decoration-2">
                        R$ {product.oldPrice.toFixed(2)}
                    </span>
                )}
                <span className="text-lg font-extrabold text-blue-600 block">
                    R$ {product.price.toFixed(2)}
                </span>
            </div>

            {/* BOTÓN DE ACCIÓN RÁPIDA */}
            <button 
                onClick={handleQuickAdd}
                disabled={isOutOfStock || !canAdd}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                    ${isOutOfStock 
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                        : !canAdd
                            ? 'bg-orange-100 text-orange-400 cursor-not-allowed' // Lleno
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110 shadow-blue-200'
                    }
                `}
                title={isOutOfStock ? "Agotado" : !canAdd ? "Stock máximo alcanzado" : "Agregar rápido"}
            >
                {isOutOfStock ? <ShoppingCart size={18} className="line-through opacity-50"/> : <Plus size={20} strokeWidth={3} />}
            </button>
          </div>
      </div>
    </div>
  );
}