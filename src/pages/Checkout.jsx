import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Send, User, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase/client'; // Conexión a DB
import toast from 'react-hot-toast'; // Notificaciones

export default function Checkout({ cart }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga
  
  // Si el carrito está vacío, redirigir al home
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/');
    }
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    paymentMethod: 'pix' // valor por defecto
  });

  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinalize = async (e) => {
    e.preventDefault();

    // 1. Validaciones
    if (!formData.name.trim()) return toast.error("Por favor ingresa tu nombre");
    if (!formData.address.trim()) return toast.error("Por favor ingresa tu dirección");
    
    setIsSubmitting(true);
    const toastId = toast.loading("Registrando pedido...");

    try {
        // 2. Guardar en Supabase (Base de Datos)
        const orderData = {
            customer_name: formData.name,
            address: formData.address,
            payment_method: formData.paymentMethod,
            total: total,
            status: 'pendiente',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            }))
        };

        const { error } = await supabase.from('orders').insert([orderData]);

        if (error) throw error;

        toast.success("¡Pedido registrado con éxito!", { id: toastId });

        // 3. Construir Mensaje de WhatsApp
        const PHONE_NUMBER = "5554993294396"; 
        
        let message = `*NUEVO PEDIDO - VENEFOODS 🇻🇪*\n\n`;
        message += `*Cliente:* ${formData.name}\n`;
        message += `*Dirección:* ${formData.address}\n`;
        message += `*Pago:* ${formData.paymentMethod.toUpperCase()}\n\n`;
        message += `*Pedido:*\n`;
        
        cart.forEach(item => {
            message += `▪️ ${item.quantity || 1}x ${item.name} - R$ ${(item.price * (item.quantity || 1)).toFixed(2)}\n`;
        });

        message += `\n*TOTAL A PAGAR: R$ ${total.toFixed(2)}*`;

        // 4. Redirigir a WhatsApp
        const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        
        // Pequeña pausa para que el usuario vea el mensaje de éxito antes de abrir WhatsApp
        setTimeout(() => {
            window.open(url, '_blank');
            // Opcional: navigate('/') o limpiar carrito aquí si tuvieras la función
        }, 1000);

    } catch (error) {
        console.error("Error al guardar:", error);
        toast.error("Error guardando el pedido, intenta de nuevo.", { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans pb-24">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="max-w-2xl mx-auto px-4 pt-6 animate-fade-in">
        
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="text-blue-600" />
            Datos de Entrega
        </h1>

        <form onSubmit={handleFinalize} className="space-y-6">
            
            {/* Tarjeta de Datos Personales */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Tu Nombre</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input 
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text" 
                                placeholder="Ej: Juan Pérez" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Dirección de Entrega</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <textarea 
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Calle, Número, Barrio y Referencia..." 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjeta de Pago */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Método de Pago
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                    {['pix', 'efectivo', 'tarjeta'].map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: method})}
                            className={`
                                py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all
                                ${formData.paymentMethod === method 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2' 
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                            `}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resumen Final */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 mt-8">
                <div className="flex justify-between items-center mb-6 opacity-90">
                    <span>Total items: {cart.length}</span>
                    <span className="text-xl font-bold">R$ {total.toFixed(2)}</span>
                </div>
                
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" /> Registrando...</>
                    ) : (
                        <><Send size={20} /> Confirmar Pedido</>
                    )}
                </button>
            </div>

        </form>
      </main>
    </div>
  );
}