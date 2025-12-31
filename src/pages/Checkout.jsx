import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Send, User, Loader2, Phone, FileText, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

export default function Checkout({ cart, addToCart, removeFromCart, clearCart }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cart.length === 0) navigate('/');
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const [formData, setFormData] = useState({
    name: '', phone: '', cpf: '', cep: '', street: '', number: '', district: '', complement: '', paymentMethod: 'pix'
  });

  // Cálculo seguro del total
  const total = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  // --- MÁSCARAS ---
  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substr(0, 15);
  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substr(0, 14);
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substr(0, 9);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'phone') formattedValue = formatPhone(value);
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'cep') formattedValue = formatCEP(value);
    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 14) return toast.error("Ingresa un WhatsApp válido");
    
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando...");

    try {
        const fullAddress = `${formData.street}, ${formData.number} - ${formData.district} (CEP: ${formData.cep}) ${formData.complement || ''}`;
        
        const orderData = {
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_cpf: formData.cpf,
            address: fullAddress,
            address_cep: formData.cep,
            address_street: formData.street,
            address_number: formData.number,
            address_district: formData.district,
            address_complement: formData.complement,
            payment_method: formData.paymentMethod,
            total: total,
            status: 'pendiente',
            items: cart.map(item => ({
                id: item.id, 
                name: item.name, 
                price: Number(item.price), 
                quantity: item.quantity || 1
            }))
        };

        const { error } = await supabase.from('orders').insert([orderData]);
        if (error) throw error;

        toast.success("¡Pedido Enviado!", { id: toastId });

        // WhatsApp
        const PHONE_NUMBER = "5554993294396"; 
        let message = `*NUEVO PEDIDO WEB 🇻🇪*\n--------------------------------\n`;
        message += `👤 *Cliente:* ${formData.name}\n📱 *Tel:* ${formData.phone}\n📍 *Entrega:* ${fullAddress}\n💰 *Pago:* ${formData.paymentMethod.toUpperCase()}\n`;
        message += `--------------------------------\n*PEDIDO:*\n`;
        cart.forEach(item => {
            message += `▪️ ${item.quantity || 1}x ${item.name} (R$ ${(Number(item.price) * item.quantity).toFixed(2)})\n`;
        });
        message += `\n*TOTAL FINAL: R$ ${total.toFixed(2)}*`;

        const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        
        setTimeout(() => {
            window.open(url, '_blank');
            if (clearCart) clearCart();
            navigate('/');
        }, 1500);

    } catch (error) {
        console.error(error);
        toast.error("Error al registrar.", { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans pb-24">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="max-w-6xl mx-auto px-4 pt-6 animate-fade-in">
        
        <form onSubmit={handleFinalize} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="lg:col-span-7 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <User className="text-blue-600" /> Datos de Envío
                </h1>

                {/* Tarjeta Datos Personales */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 ml-1">Nombre Completo</label>
                        <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Juan Pérez" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 ml-1">WhatsApp</label>
                            <div className="relative"><Phone className="absolute left-3 top-3.5 text-gray-400" size={18} /><input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500" placeholder="(99) 99999-9999" maxLength={15} /></div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 ml-1">CPF</label>
                            <div className="relative"><FileText className="absolute left-3 top-3.5 text-gray-400" size={18} /><input required name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00" maxLength={14} /></div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Dirección */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2"><MapPin className="text-blue-600" size={20} /><h3 className="font-bold">Dirección</h3></div>
                    <div className="grid grid-cols-3 gap-4">
                        <input required name="cep" value={formData.cep} onChange={handleChange} className="col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="CEP" maxLength={9} />
                        <input required name="district" value={formData.district} onChange={handleChange} className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Barrio" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <input required name="street" value={formData.street} onChange={handleChange} className="col-span-3 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle / Avenida" />
                        <input required name="number" value={formData.number} onChange={handleChange} className="col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nº" />
                    </div>
                    <input name="complement" value={formData.complement} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Complemento / Referencia" />
                </div>

                {/* Tarjeta Pago */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="text-green-600" /> Método de Pago</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {['pix', 'efectivo', 'tarjeta'].map((method) => (
                            <button key={method} type="button" onClick={() => setFormData({...formData, paymentMethod: method})} className={`py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all ${formData.paymentMethod === method ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{method}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA: RESUMEN DEL PEDIDO */}
            <div className="lg:col-span-5 space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="text-blue-600" /> Resumen del Pedido
                </h1>
                
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
                    {/* LISTA DE PRODUCTOS */}
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center border border-gray-200 shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.name}</h4>
                                    <p className="text-blue-600 font-bold text-xs mt-1">R$ {Number(item.price).toFixed(2)}</p>
                                </div>
                                
                                {/* CONTROLES DE CANTIDAD (Ahora sí funcionan) */}
                                <div className="flex items-center gap-2 bg-white rounded-lg px-1 py-1 shadow-sm border border-gray-200">
                                    <button 
                                        type="button" 
                                        onClick={() => removeFromCart(item)} // Usa la función corregida de App.jsx
                                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        {item.quantity > 1 ? <Minus size={14}/> : <Trash2 size={14}/>}
                                    </button>
                                    
                                    <span className="text-sm font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => addToCart(item)} // Usa la función corregida de App.jsx
                                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                        <Plus size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-4 pt-4 space-y-2">
                        <div className="flex justify-between text-gray-500 text-sm">
                            <span>Subtotal</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-sm">
                            <span>Entrega</span>
                            <span className="text-green-600 font-bold">Gratis</span>
                        </div>
                        <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-2">
                            <span className="font-bold text-slate-800 text-lg">Total</span>
                            <span className="font-black text-slate-900 text-3xl">R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSubmitting ? <><Loader2 className="animate-spin" /> Procesando...</> : <><Send size={20} /> Finalizar Pedido</>}
                    </button>
                </div>
            </div>

        </form>
      </main>
    </div>
  );
}