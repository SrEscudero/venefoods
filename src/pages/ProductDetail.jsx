import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, ShoppingBag, Check, ChevronRight, Star, Loader2, 
    Minus, Plus, MessageCircle, AlertCircle, Truck, ShieldCheck 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';

export default function ProductDetail({ cart, addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qtyToAdd, setQtyToAdd] = useState(1); // Estado para la cantidad a agregar

  // --- 1. CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);

        // A. Buscar el producto principal
        const { data: currentProduct, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError || !currentProduct) {
          toast.error("Producto no encontrado");
          navigate('/'); 
          return;
        }

        // Formatear el badge
        const formattedProduct = {
            ...currentProduct,
            badge: currentProduct.badge_text ? { text: currentProduct.badge_text, color: currentProduct.badge_color } : null
        };
        
        setProduct(formattedProduct);

        // B. Buscar productos relacionados
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', currentProduct.category)
          .neq('id', id)
          .limit(4);

        if (relatedData) setRelatedProducts(relatedData);

      } catch (error) {
        console.error("Error general:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
    setQtyToAdd(1); // Resetear cantidad al cambiar de producto
  }, [id, navigate]);

  // --- 2. LÓGICA DE STOCK INTELIGENTE ---
  
  // A. Buscamos cuántos tiene ya en el carrito
  const cartItem = product ? cart.find(item => item.id === product.id) : null;
  const currentInCart = cartItem ? cartItem.quantity : 0;
  
  // B. Definimos el stock real
  const stock = product ? (product.stock || 0) : 0;
  
  // C. Calculamos cuántos más puede agregar
  const availableStock = Math.max(0, stock - currentInCart);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < 5;

  // --- 3. HANDLERS ---

  const handleAdd = () => {
    if (qtyToAdd > availableStock) {
      toast.error(`Solo quedan ${availableStock} unidades disponibles`);
      return;
    }

    // Agregamos la cantidad seleccionada
    // Como addToCart agrega de 1 en 1, hacemos un bucle rápido
    for(let i=0; i<qtyToAdd; i++) {
        addToCart(product);
    }
    
    // Opcional: Feedback extra si vació el stock
    if (availableStock - qtyToAdd === 0) {
        toast("¡Te llevaste lo último!", { icon: '📦' });
    }
    
    // Reiniciamos el contador a 1 (o 0 si ya no hay stock)
    setQtyToAdd(1);
  };

  const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // --- RENDERIZADO ---

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col bg-[#F2F2F7]">
            <Navbar cartCount={cart.length} isDetailPage={true} />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans flex flex-col">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="flex-1 max-w-6xl mx-auto md:pt-10 pb-20 w-full animate-fade-in px-4">
        
        {/* --- DETALLE PRINCIPAL --- */}
        <div className="flex flex-col md:flex-row gap-8 mb-16">

          {/* COLUMNA IZQ: IMAGEN */}
          <div className="w-full md:w-1/2 relative bg-white rounded-[2.5rem] overflow-hidden h-[50vh] md:h-[500px] flex items-center justify-center group shadow-sm border border-gray-100">
             
             {/* Botón flotante volver (móvil) */}
             <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-full text-slate-800 shadow-sm z-20 active:scale-90 transition">
                <ArrowLeft size={24} />
             </button>
            
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-blue-50/50 rounded-[2.5rem] transform rotate-3 scale-90 transition-transform group-hover:rotate-0 group-hover:scale-100 z-0"></div>

            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-contain p-8 md:p-12 mix-blend-multiply relative z-10 group-hover:scale-110 transition-transform duration-500"
            />

            {/* Aviso de Pocas Unidades */}
            {!isOutOfStock && isLowStock && (
                <div className="absolute top-6 right-6 bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 animate-pulse z-20 shadow-sm border border-red-200">
                    <AlertCircle size={18}/> ¡Últimas {stock}!
                </div>
            )}

            {/* Aviso de Agotado */}
            {isOutOfStock && (
                <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl transform -rotate-6">AGOTADO</span>
                </div>
            )}
          </div>

          {/* COLUMNA DER: INFO */}
          <div className="w-full md:w-1/2 px-2 md:px-4 py-4 flex flex-col justify-center">
            
            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link to="/" className="hover:text-blue-600 font-medium">Inicio</Link>
                <ChevronRight size={14} />
                <span className="capitalize bg-white px-2 py-1 rounded-md shadow-sm">{product.category}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
                <p className="text-4xl font-black text-blue-600">
                {formatMoney(product.price)}
                </p>
                {product.badge && !isOutOfStock && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white 
                        ${product.badge.color === 'red' ? 'bg-red-500' : 
                          product.badge.color === 'blue' ? 'bg-blue-500' : 'bg-slate-800'}`}>
                        {product.badge.text}
                    </span>
                )}
            </div>
            
            <p className="text-gray-600 leading-relaxed text-lg mb-8">
                {product.description || "El sabor auténtico de Venezuela, directo a tu mesa. Calidad garantizada."}
            </p>

            {/* Tarjetas de Confianza */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Truck size={20}/></div>
                    <span className="text-xs font-bold text-gray-600">Entrega Rápida</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShieldCheck size={20}/></div>
                    <span className="text-xs font-bold text-gray-600">Compra Segura</span>
                </div>
            </div>
            
            {/* --- ZONA DE ACCIÓN (Selector + Botones) --- */}
            <div className="space-y-4">
                
                {/* 1. Selector y Botón Agregar (Solo si hay stock) */}
                {!isOutOfStock ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Selector de Cantidad */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-2 h-16 w-full sm:w-auto shadow-sm">
                            <button 
                                onClick={() => setQtyToAdd(q => Math.max(1, q - 1))} 
                                className="p-4 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                disabled={qtyToAdd <= 1}
                            >
                                <Minus size={20}/>
                            </button>
                            <span className="font-black text-xl w-12 text-center text-slate-800">{qtyToAdd}</span>
                            <button 
                                onClick={() => setQtyToAdd(q => Math.min(availableStock, q + 1))} 
                                className="p-4 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                disabled={qtyToAdd >= availableStock}
                            >
                                <Plus size={20}/>
                            </button>
                        </div>

                        {/* Botón Principal */}
                        <button 
                            onClick={handleAdd}
                            disabled={availableStock === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <ShoppingBag size={24} />
                            {availableStock === 0 ? "Sin Stock Suficiente" : "Agregar al Carrito"}
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-200 p-4 rounded-2xl text-center text-gray-500 font-bold border border-gray-300">
                        Lo sentimos, este producto está agotado temporalmente.
                    </div>
                )}

                {/* 2. Botón WhatsApp (Siempre visible) */}
                <a 
                    href={`https://wa.me/5554993294396?text=Hola, tengo una duda sobre el producto: ${product.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <MessageCircle size={24}/> Tengo una duda sobre este producto
                </a>
            </div>

          </div>
        </div>

        {/* --- PRODUCTOS RELACIONADOS --- */}
        {relatedProducts.length > 0 && (
            <section className="mt-20">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" /> También te podría gustar
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map((item) => (
                        <Link 
                            to={`/product/${item.id}`} 
                            key={item.id}
                            className="bg-white rounded-[1.5rem] p-4 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block"
                        >
                            <div className="h-40 mb-4 flex items-center justify-center bg-gray-50 rounded-2xl p-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors duration-300"></div>
                                <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 relative z-10"
                                />
                            </div>
                            <div className="px-1">
                                <h4 className="font-bold text-slate-900 text-sm mb-1 truncate leading-tight">{item.name}</h4>
                                <p className="text-blue-600 font-extrabold text-lg">{formatMoney(item.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        )}

      </main>
      <Footer />
    </div>
  );
}