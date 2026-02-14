import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, DollarSign, Send, User, Loader2, Phone, FileText, ShoppingBag, Plus, Minus, Trash2, Tag, Check, X, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { db } from '../firebase/client';
import { runTransaction, doc, collection, getDocs, query, where, getDoc } from 'firebase/firestore'; 
import toast from 'react-hot-toast';

export default function Checkout({ cart, addToCart, removeFromCart, clearCart }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // --- ESTADOS DE CONFIGURACIÓN Y ENVÍO ---
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null); // Objeto zona: { name: "Centro", price: 5 }
  const [shippingCost, setShippingCost] = useState(0);
  const [freeShippingMin, setFreeShippingMin] = useState(99999);

  // --- ESTADOS CUPÓN ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // --- 1. CARGAR CONFIGURACIÓN (Zonas y Mínimo Envío) ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Cargar Zonas
        const settingsRef = doc(db, "site_settings", "shipping_zones");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          try {
            const zones = JSON.parse(settingsSnap.data().value);
            setShippingZones(Array.isArray(zones) ? zones : []);
          } catch (e) { console.error("Error parseando zonas", e); }
        }

        // Cargar Mínimo para envío gratis
        const minRef = doc(db, "site_settings", "shipping_min_value");
        const minSnap = await getDoc(minRef);
        if (minSnap.exists()) {
          setFreeShippingMin(Number(minSnap.data().value) || 99999);
        }
      } catch (error) {
        console.error("Error cargando config:", error);
      }
    };
    fetchConfig();
  }, []);

  // --- 2. RECUPERAR CUPÓN DEL CARRITO ---
  useEffect(() => {
    if (location.state?.savedCoupon) {
      setAppliedCoupon(location.state.savedCoupon);
      setCouponCode(location.state.savedCoupon.code);
      toast.success("¡Cupón del carrito aplicado!", { icon: '🎫' });
    } else if (location.state?.savedCode) {
      setCouponCode(location.state.savedCode);
    }
  }, [location.state]);

  useEffect(() => {
    if (cart.length === 0) navigate('/');
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const [formData, setFormData] = useState({
    name: '', phone: '', cpf: '',
    cep: '', street: '', number: '', district: '', city: '', state: '', complement: '',
    paymentMethod: 'pix'
  });

  // --- CÁLCULOS ---
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  
  // Calcular descuento
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.discount) / 100;
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }

  // Calcular Envío Final (Gratis si supera el mínimo, sino costo de zona)
  const finalShippingCost = subtotal >= freeShippingMin ? 0 : shippingCost;
  
  // Total Final
  const total = Math.max(0, subtotal - discountAmount + finalShippingCost);

  // --- HELPERS ---
  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substr(0, 15);
  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substr(0, 14);
  const formatCEP = (v) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substr(0, 9);

  // --- LÓGICA CUPÓN ---
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
        toast.success("¡Cupón aplicado!");
      }
    } catch (error) {
      console.error("Error cupón:", error);
      toast.error("Error al validar");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // --- SELECCIÓN DE ZONA ---
  const handleZoneChange = (e) => {
    const idx = e.target.value;
    if (idx === "") {
      setSelectedZone(null);
      setShippingCost(0);
      return;
    }
    const zone = shippingZones[idx];
    setSelectedZone(zone);
    setShippingCost(Number(zone.price));
  };

  // --- API CEP ---
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
        setTimeout(() => document.getElementById('address_number')?.focus(), 100);
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

  // --- FINALIZAR PEDIDO ---
  const handleFinalize = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 14) return toast.error("Ingresa un WhatsApp válido");
    
    // Validación de zona (si hay zonas configuradas y no es envío gratis)
    if (shippingZones.length > 0 && subtotal < freeShippingMin && !selectedZone) {
      return toast.error("Por favor selecciona tu zona de envío");
    }

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
          // Datos de envío
          shipping_zone: selectedZone ? selectedZone.name : "Estándar",
          shipping_cost: finalShippingCost,
          
          payment_method: formData.paymentMethod,
          origin: 'web_checkout',
          subtotal: subtotal,
          discount: discountAmount,
          coupon_used: appliedCoupon ? appliedCoupon.code : null,
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
      message += `👤 *Cliente:* ${formData.name}\n📱 *Tel:* ${formData.phone}\n📍 *Entrega:* ${fullAddress}\n`;
      
      // Info de zona en el mensaje
      if (selectedZone) {
        message += `🚚 *Zona:* ${selectedZone.name} (R$ ${finalShippingCost.toFixed(2)})\n`;
      }
      
      message += `💰 *Pago:* ${formData.paymentMethod.toUpperCase()}\n`;
      message += `--------------------------------\n*PEDIDO:*\n`;
      cart.forEach(item => {
        message += `▪️ ${item.quantity || 1}x ${item.name} (R$ ${(Number(item.price) * (item.quantity || 1)).toFixed(2)})\n`;
      });
      
      if (appliedCoupon) {
        message += `\n🏷️ *CUPÓN:* ${appliedCoupon.code} (-R$ ${discountAmount.toFixed(2)})`;
      }
      
      if (finalShippingCost > 0) {
        message += `\n🚚 *ENVÍO:* +R$ ${finalShippingCost.toFixed(2)}`;
      } else {
        message += `\n🚚 *ENVÍO:* GRATIS`;
      }
      
      message += `\n*TOTAL FINAL: R$ ${total.toFixed(2)}*`;

      const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(url, '_blank');
        if (clearCart) clearCart();
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans pb-24">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="max-w-6xl mx-auto px-4 pt-6 animate-fade-in">
        <form onSubmit={handleFinalize} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <User className="text-blue-600" size={24} /> Datos de Envío
            </h1>

            {/* Datos Personales */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 ml-1">Nombre Completo</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="Ej: Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="(99) 99999-9999" maxLength={15} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-1">CPF</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input required name="cpf" value={formData.cpf} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="000.000.000-00" maxLength={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dirección y ZONA */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800">Dirección de Entrega</h3>
              </div>

              {/* SELECTOR DE ZONA (NUEVO) */}
              {shippingZones.length > 0 && (
                <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">
                    Selecciona tu Barrio / Zona
                  </label>
                  <select 
                    onChange={handleZoneChange}
                    className="w-full p-3 rounded-xl border-2 border-blue-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Elige tu zona para calcular envío --</option>
                    {shippingZones.map((zone, idx) => (
                      <option key={idx} value={idx}>
                        {zone.name} (+ R$ {Number(zone.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {subtotal >= freeShippingMin && (
                    <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                      <Check size={12} /> ¡Tienes envío gratis por compra superior a R$ {freeShippingMin}!
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 md:col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">CEP</label>
                  <div className="relative">
                    <input required name="cep" value={formData.cep} onChange={handleChange} onBlur={checkCEP} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="00000-000" maxLength={9} />
                    {loadingCep && <Loader2 className="absolute right-3 top-3.5 animate-spin text-blue-600" size={16} />}
                  </div>
                </div>
                <div className="col-span-5 md:col-span-7">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ciudad</label>
                  <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 outline-none text-gray-600 cursor-not-allowed" readOnly tabIndex={-1} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">UF</label>
                  <input required name="state" value={formData.state} onChange={handleChange} className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 outline-none text-gray-600 cursor-not-allowed text-center" readOnly tabIndex={-1} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Calle</label>
                  <input required name="street" value={formData.street} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nº</label>
                  <input required id="address_number" name="number" value={formData.number} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Barrio</label>
                  <input required name="district" value={formData.district} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Complemento</label>
                  <input name="complement" value={formData.complement} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Pago */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20} /> Método de Pago
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {['pix', 'efectivo', 'tarjeta'].map((method) => (
                  <button key={method} type="button" onClick={() => setFormData({ ...formData, paymentMethod: method })} className={`py-3 px-2 rounded-xl text-sm font-bold capitalize transition-all ${formData.paymentMethod === method ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN */}
          <div className="lg:col-span-5 space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <ShoppingBag className="text-blue-600" size={24} /> Resumen
            </h1>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain mix-blend-multiply" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-2">{item.name}</h4>
                      <p className="text-blue-600 font-bold text-xs mt-1">R$ {Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">x{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón */}
              <div className="mb-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input type="text" placeholder="CUPÓN" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full pl-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold uppercase outline-none focus:border-blue-500" />
                    <button type="button" onClick={handleApplyCoupon} disabled={!couponCode || isValidatingCoupon} className="bg-slate-800 text-white px-4 rounded-xl font-bold text-xs disabled:opacity-50">
                      {isValidatingCoupon ? "..." : "OK"}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl">
                    <span className="text-green-700 font-bold text-xs flex items-center gap-1"><Check size={12}/> {appliedCoupon.code}</span>
                    <button type="button" onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="border-t border-dashed border-gray-300 my-4 pt-4 space-y-2">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                   <div className="flex justify-between text-green-600 text-sm font-bold">
                    <span>Descuento</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Lógica Visual de Envío */}
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Envío {selectedZone ? `(${selectedZone.name})` : ''}</span>
                  {finalShippingCost === 0 ? (
                    <span className="text-green-600 font-bold">Gratis</span>
                  ) : (
                    <span className="font-medium">R$ {finalShippingCost.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-2">
                  <span className="font-bold text-slate-800 text-lg">Total</span>
                  <span className="font-black text-slate-900 text-3xl tracking-tight">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="relative w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#0e6b5e] text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Finalizar Pedido</>}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}