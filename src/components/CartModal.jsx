import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE
import { X, Trash2, Plus, Minus, Loader2, ShoppingBag, Tag, Check, ArrowRight } from 'lucide-react';
import { db } from '../firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore'; 
import toast from 'react-hot-toast';

export default function CartModal({ cart, isOpen, onClose, onAdd, onRemove, clearCart }) {
  const navigate = useNavigate(); // Hook para navegar
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  // 1. Calcular Totales
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  // 2. Calcular Descuento Visual (Solo para estimación)
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.discount) / 100;
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }
  
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // --- VALIDAR CUPÓN ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    
    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponCode.toUpperCase().trim()),
        where("active", "==", true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("Cupón inválido o expirado");
        setAppliedCoupon(null);
      } else {
        const couponData = querySnapshot.docs[0].data();
        setAppliedCoupon(couponData);
        toast.success("¡Cupón válido!");
      }
    } catch (error) {
      console.error("Error cupón:", error);
      toast.error("Error al validar cupón");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // --- NAVEGACIÓN AL CHECKOUT ---
  const handleGoToCheckout = () => {
    onClose(); 
    // Aquí está la magia: pasamos el cupón validado a la siguiente página
    navigate('/checkout', { 
      state: { 
        savedCoupon: appliedCoupon, // El objeto completo del cupón validado
        savedCode: couponCode       // El texto que escribió el usuario
      } 
    }); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px] pointer-events-auto transition-opacity duration-300" onClick={onClose} />
      
      <div className="relative bg-white/90 backdrop-blur-2xl w-full md:w-[500px] md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto animate-slide-up border border-white/50 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center bg-gradient-to-b from-white/50 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <ShoppingBag className="text-blue-600" /> Tu Carrito
            </h2>
            <p className="text-sm text-slate-500 font-medium ml-1">
                {cart.length} productos
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Lista Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                 <ShoppingBag size={32} className="opacity-30" />
              </div>
              <p className="text-lg font-medium">Tu carrito está vacío.</p>
              <button onClick={onClose} className="mt-6 text-blue-600 font-bold hover:bg-blue-50 px-6 py-2 rounded-full transition-colors">
                Ir a comprar
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-slate-50 rounded-xl p-2 flex items-center justify-center shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.name}</h4>
                  <p className="text-blue-600 font-extrabold text-sm">R$ {Number(item.price).toFixed(2)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => onRemove(item)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-slate-600 shadow-sm active:scale-90 transition-transform"><Minus size={14}/></button>
                        <span className="text-sm font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                        <button onClick={() => onAdd(item)} className="w-7 h-7 flex items-center justify-center bg-slate-800 text-white rounded-md shadow-sm active:scale-90 transition-transform"><Plus size={14}/></button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 bg-white/60 backdrop-blur-md border-t border-white space-y-5">
            
            {/* Sección Cupón (Visual) */}
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input 
                    type="text" 
                    placeholder="Estimador de Cupón"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || isValidatingCoupon}
                  className="bg-slate-800 text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  {isValidatingCoupon ? <Loader2 className="animate-spin" size={18}/> : "Probar"}
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                  <Check size={16} /> Cupón {appliedCoupon.code} válido
                </div>
                <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 font-bold text-xs">
                  Quitar
                </button>
              </div>
            )}

            {/* Resumen Totales */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-bold text-sm">
                  <span>Descuento estimado</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-300">
                <span className="text-slate-900 font-bold">Total estimado</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
            
            {/* BOTÓN IR AL CHECKOUT */}
            <button 
              onClick={handleGoToCheckout}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group"
            >
                <span>Ir a Pagar</span>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}