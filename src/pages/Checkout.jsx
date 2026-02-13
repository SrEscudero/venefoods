import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Send, User, Loader2, Phone, FileText, ShoppingBag, Plus, Minus, Trash2, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import { db } from '../firebase/client';
import { runTransaction, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Checkout({ cart, addToCart, removeFromCart, clearCart }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (cart.length === 0) navigate('/');
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const [formData, setFormData] = useState({
    name: '', phone: '', cpf: '',
    cep: '', street: '', number: '', district: '', city: '', state: '', complement: '',
    paymentMethod: 'pix'
  });

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substr(0, 15);
  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substr(0, 14);
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substr(0, 9);

  const checkCEP = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setLoadingCep(true);
      const toastId = toast.loading("Buscando dirección...");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
          toast.error("CEP no encontrado", { id: toastId });
          setLoadingCep(false);
          return;
        }
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || '',
          district: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
        toast.success("Dirección encontrada", { id: toastId });
        setTimeout(() => {
          document.getElementById('address_number')?.focus();
        }, 100);
      } catch (error) {
        console.error(error);
        toast.error("Error al buscar CEP", { id: toastId });
      } finally {
        setLoadingCep(false);
      }
    }
  };

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
    const toastId = toast.loading("Procesando pedido...");

    try {
      const fullAddress = `${formData.street}, ${formData.number} - ${formData.district}, ${formData.city} - ${formData.state} (CEP: ${formData.cep}) ${formData.complement ? `Obs: ${formData.complement}` : ''}`;
      let customId = "";

      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "orders");
        const counterDoc = await transaction.get(counterRef);
        let nextSequence = 1;
        if (counterDoc.exists()) {
          nextSequence = counterDoc.data().count + 1;
        } else {
          transaction.set(counterRef, { count: 0 });
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
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_cpf: formData.cpf,
          address: fullAddress,
          address_cep: formData.cep,
          address_street: formData.street,
          address_number: formData.number,
          address_district: formData.district,
          address_city: formData.city,
          address_state: formData.state,
          address_complement: formData.complement,
          payment_method: formData.paymentMethod,
          origin: 'web',
          total: total,
          status: 'pendiente',
          created_at: now.toISOString(),
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity || 1
          }))
        };

        transaction.set(newOrderRef, orderData);
        transaction.set(counterRef, { count: nextSequence });
      });

      toast.success(`¡Pedido #${customId} Enviado!`, { id: toastId });

      const PHONE_NUMBER = "5554993294396";
      let message = `*NUEVO PEDIDO WEB 🇻🇪*\n*ID:* ${customId}\n--------------------------------\n`;
      message += `👤 *Cliente:* ${formData.name}\n📱 *Tel:* ${formData.phone}\n📍 *Entrega:* ${fullAddress}\n💰 *Pago:* ${formData.paymentMethod.toUpperCase()}\n`;
      message += `--------------------------------\n*PEDIDO:*\n`;
      cart.forEach(item => {
        message += `▪️ ${item.quantity || 1}x ${item.name} (R$ ${(Number(item.price) * (item.quantity || 1)).toFixed(2)})\n`;
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
      toast.error("Error de conexión. Enviando por WhatsApp...", { id: toastId });
      const PHONE_NUMBER = "5554993294396";
      const message = `Hola Venefoods! Soy ${formData.name}. (Error Web - Pedido Manual): ` + cart.map(i => i.name).join(', ');
      const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(url, '_blank');
        if (clearCart) clearCart();
        navigate('/');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans pb-24">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="max-w-6xl mx-auto px-4 pt-6 animate-fade-in">
        <form onSubmit={handleFinalize} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <User className="text-blue-600" size={24} /> Datos de Envío
            </h1>

            {/* Tarjeta Datos Personales */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 transition-all hover:shadow-md">
              <div>
                <label className="text-sm font-bold text-gray-700 ml-1">Nombre Completo</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">CPF</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      required
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Dirección (CON VIACEP) */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800">Dirección de Entrega</h3>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">CEP</label>
                  <div className="relative">
                    <input
                      required
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      onBlur={checkCEP}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-3.5">
                        <Loader2 className="animate-spin text-blue-600" size={16} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-5 md:col-span-7">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ciudad</label>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 outline-none text-gray-600 cursor-not-allowed"
                    placeholder="Ciudad"
                    readOnly
                    tabIndex={-1}
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">UF</label>
                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 outline-none text-gray-600 cursor-not-allowed text-center"
                    placeholder="UF"
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Calle / Avenida</label>
                  <input
                    required
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Nombre de la calle"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nº</label>
                  <input
                    required
                    id="address_number"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Barrio</label>
                  <input
                    required
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Barrio"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Complemento (Opcional)</label>
                  <input
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    placeholder="Apto, Bloque, Referencia..."
                  />
                </div>
              </div>
            </div>

            {/* Tarjeta Pago */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20} /> Método de Pago
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {['pix', 'efectivo', 'tarjeta'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all ${
                      formData.paymentMethod === method
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ring-2 ring-blue-600 ring-offset-2 shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN */}
          <div className="lg:col-span-5 space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <ShoppingBag className="text-blue-600" size={24} /> Resumen del Pedido
            </h1>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24 transition-all hover:shadow-xl">
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-lg p-1 flex items-center justify-center border border-gray-200 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.name}</h4>
                      <p className="text-blue-600 font-bold text-xs mt-1">R$ {Number(item.price).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white rounded-lg px-1 py-1 shadow-sm border border-gray-200">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        {item.quantity > 1 ? <Minus size={14} /> : <Trash2 size={14} />}
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 my-4 pt-4 space-y-2">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Entrega</span>
                  <span className="text-green-600 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-2">
                  <span className="font-bold text-slate-800 text-lg">Total</span>
                  <span className="font-black text-slate-900 text-3xl tracking-tight">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#0e6b5e] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Send size={20} /> Finalizar Pedido
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}