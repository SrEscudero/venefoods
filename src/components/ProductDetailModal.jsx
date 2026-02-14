import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Star } from 'lucide-react';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleAdd = () => {
    onAddToCart({ ...product, quantity });
    setQuantity(1);
    onClose();
  };

  // Cálculo de descuento para mostrar
  const discountPercent = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop oscuro */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Imagen Header */}
        <div className="relative h-64 bg-gray-50 flex items-center justify-center p-8">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl"
          />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all text-slate-600"
          >
            <X size={20} />
          </button>

          {/* Badges Flotantes */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isFeatured && (
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                <Star size={12} fill="currentColor"/> TOP
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">{product.name}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {product.description || "Sin descripción disponible para este producto."}
            </p>
          </div>

          {/* Controles de Precio y Cantidad */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
              <button onClick={handleDecrement} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                <Minus size={18} />
              </button>
              <span className="text-lg font-bold text-slate-800 w-6 text-center">{quantity}</span>
              <button onClick={handleIncrement} className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <Plus size={18} />
              </button>
            </div>

            <div className="text-right">
              {product.originalPrice > product.price && (
                <p className="text-xs text-gray-400 line-through font-medium mb-0.5">
                  R$ {Number(product.originalPrice).toFixed(2)}
                </p>
              )}
              <p className="text-2xl font-black text-slate-900">
                R$ {(product.price * quantity).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Botón Agregar */}
          <button 
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 ${
              product.stock > 0 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag size={20} />
            {product.stock > 0 ? "Agregar al Carrito" : "Agotado"}
          </button>
        </div>
      </div>
    </div>
  );
}