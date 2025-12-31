import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

export default function CartModal({ cart, isOpen, onClose, onAdd, onRemove, onDelete, clearCart }) {
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error("Por favor, escribe tu nombre para el pedido.");
      return;
    }

    setIsSubmitting(true);

    // 1. Preparar los datos para Supabase
    const orderData = {
      customer_name: customerName,
      total: total,
      status: 'pendiente',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      // 2. Guardar en Supabase
      const { error } = await supabase.from('orders').insert([orderData]);

      if (error) throw error;

      // 3. Crear mensaje de WhatsApp
      const phone = "5511999999999"; // ¡PON AQUÍ TU NÚMERO!
      let message = `Hola Venefoods! 🌽 Soy *${customerName}*.\nQuiero hacer el siguiente pedido:\n\n`;
      cart.forEach(item => {
        message += `▪️ ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;
      
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      // 4. Éxito: Limpiar carrito, cerrar modal y abrir WhatsApp
      toast.success("¡Pedido registrado! Abriendo WhatsApp...");
      
      // Si tienes una función para limpiar el carrito globalmente, úsala aquí.
      // Si no, recarga la página o maneja el estado (aquí asumimos que se limpia o el usuario vuelve)
      // clearCart(); <--- Idealmente deberías pasar esta función desde App.jsx
      
      window.open(whatsappUrl, '_blank');
      onClose();
      setCustomerName(''); // Limpiar nombre

    } catch (error) {
      console.error("Error guardando pedido:", error);
      toast.error("Hubo un problema registrando el pedido, pero intenta por WhatsApp.");
      // Fallback: Abrir WhatsApp igual si falla la base de datos
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div className="relative bg-white w-full md:w-[480px] md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto animate-slide-up md:animate-fade-in">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white md:rounded-t-3xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🛒 Tu Carrito <span className="bg-blue-600 text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Tu carrito está vacío.</p>
              <button onClick={onClose} className="mt-4 text-blue-600 font-bold hover:underline">Ir a comprar</button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-blue-600 font-bold text-sm">R$ {item.price.toFixed(2)}</p>
                </div>
                
                {/* Controles Cantidad */}
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                  <button onClick={() => onRemove(item)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"><Minus size={14}/></button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => onAdd(item)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"><Plus size={14}/></button>
                </div>
                
                <button onClick={() => onDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 md:rounded-b-3xl space-y-4">
            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-700 ml-1">Tu Nombre (para el pedido):</label>
               <input 
                  type="text" 
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
               />
            </div>

            <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-2">
              <span>Total Estimado:</span>
              <span className="text-2xl">R$ {total.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <> <Loader2 className="animate-spin" /> Registrando... </>
              ) : (
                <> <MessageCircle size={24} /> Pedir por WhatsApp </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}