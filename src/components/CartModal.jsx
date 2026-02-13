import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, MessageCircle, Loader2, ShoppingBag } from 'lucide-react';
// --- FIREBASE IMPORTS ---
import { db } from '../firebase/client';
import { runTransaction, doc } from 'firebase/firestore';
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

    try {
      let customId = "";

      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "orders");
        const counterDoc = await transaction.get(counterRef);

        let nextSequence = 1;
        if (counterDoc.exists()) {
          nextSequence = counterDoc.data().count + 1;
        }

        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const sequence = String(nextSequence).padStart(4, '0');

        customId = `VF-${year}${month}${day}-${sequence}`;

        const newOrderRef = doc(db, "orders", customId);

        const orderData = {
          id: customId,
          customer_name: customerName,
          total: total,
          status: 'pendiente',
          created_at: now.toISOString(),
          origin: 'web_modal',
          payment_method: 'whatsapp',
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        };

        transaction.set(newOrderRef, orderData);
        transaction.set(counterRef, { count: nextSequence });
      });

      const phone = "5554993294396";
      let message = `Hola Venefoods! 🇻🇪 Soy *${customerName}*.\n`;
      message += `Pedido ID: *${customId}*\n\n`;
      cart.forEach(item => {
        message += `▪️ ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      toast.success(`¡Pedido #${customId} enviado!`);

      if (clearCart) clearCart();
      window.open(whatsappUrl, '_blank');
      onClose();
      setCustomerName('');

    } catch (error) {
      console.error("Error crítico:", error);
      toast.error("Error de conexión. Enviando por WhatsApp...");

      const phone = "5554993294396";
      let message = `Hola Venefoods! Soy ${customerName}. (Pedido Manual - Error Web)\n\n`;
      cart.forEach(item => {
        message += `▪️ ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      onClose();

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      {/* Overlay oscuro con blur suave */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md pointer-events-auto transition-opacity duration-300" onClick={onClose} />

      {/* Modal Container: Efecto Cristal (Glassmorphism) */}
      <div className="relative bg-white/90 backdrop-blur-2xl w-full md:w-[520px] md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto animate-slide-up border border-white/50 overflow-hidden">

        {/* Header Elegante */}
        <div className="p-6 pb-4 flex justify-between items-center bg-gradient-to-b from-white/50 to-transparent border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <ShoppingBag className="text-blue-600" size={24} />
              Tu Carrito
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {cart.length} {cart.length === 1 ? 'producto' : 'productos'} seleccionados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="opacity-30" />
              </div>
              <p className="text-lg font-medium">Tu carrito está vacío.</p>
              <button
                onClick={onClose}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Ir a comprar
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Imagen con fondo suave */}
                <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 flex items-center justify-center shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-blue-600 font-extrabold text-sm">
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>

                {/* Controles Cantidad Estilo Cápsula */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => onRemove(item)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-slate-600 shadow-sm active:scale-90 transition-transform"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onAdd(item)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-800 text-white rounded-md shadow-sm active:scale-90 transition-transform"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout (Glassmorphism más denso) */}
        {cart.length > 0 && (
          <div className="p-6 bg-white/80 backdrop-blur-md border-t border-white/30 space-y-5">
            {/* Input Nombre Estilo iOS */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Tu Nombre
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ej: Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:shadow-md focus:ring-2 focus:ring-blue-500/30 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-end px-2">
              <span className="text-slate-500 font-medium">Total a pagar</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                R$ {total.toFixed(2)}
              </span>
            </div>

            {/* Botón Principal (Verde WhatsApp con Glow) */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="relative w-full bg-gradient-to-r from-[#25D366] to-[#1fbd59] hover:from-[#1fbd59] hover:to-[#128C7E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  <MessageCircle size={24} className="fill-white/20" />
                  <span>Pedir por WhatsApp</span>
                </>
              )}
              {/* Brillo interno */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}