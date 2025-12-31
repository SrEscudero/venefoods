import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, ChevronRight, Star, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabase/client'; // <--- Importamos Supabase

export default function ProductDetail({ cart, addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
          .single(); // .single() porque esperamos solo uno

        if (productError || !currentProduct) {
          console.error("Error cargando producto:", productError);
          navigate('/'); // Si falla, volvemos al inicio
          return;
        }

        // Formatear el badge (unir texto y color)
        const formattedProduct = {
            ...currentProduct,
            badge: currentProduct.badge_text ? { text: currentProduct.badge_text, color: currentProduct.badge_color } : null
        };
        
        setProduct(formattedProduct);

        // B. Buscar productos relacionados (Misma categoría, pero NO el actual)
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', currentProduct.category)
          .neq('id', id) // neq = No EQual (diferente a)
          .limit(4);

        if (relatedData) {
            setRelatedProducts(relatedData);
        }

      } catch (error) {
        console.error("Error general:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0); // Subir al inicio de la página
  }, [id, navigate]);

  // --- RENDERIZADO ---

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar cartCount={cart.length} isDetailPage={true} />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        </div>
    );
  }

  if (!product) return null;

  const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="flex-1 max-w-5xl mx-auto md:pt-10 pb-20 w-full animate-fade-in">
        
        {/* --- DETALLE PRINCIPAL --- */}
        <div className="flex flex-col md:flex-row gap-8 mb-24 px-4 md:px-0">

          {/* Imagen */}
          <div className="w-full md:w-1/2 relative bg-gray-50 md:rounded-[2.5rem] overflow-hidden h-[50vh] md:h-[500px] flex items-center justify-center group rounded-b-[2.5rem]">
             <Link to="/" className="md:hidden absolute top-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-full text-slate-800 shadow-sm z-10 active:scale-90 transition">
                <ArrowLeft size={24} />
             </Link>
            
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-contain p-8 md:p-12 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Info */}
          <div className="w-full md:w-1/2 px-2 md:px-0 py-4 flex flex-col">
            
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link to="/" className="hover:text-blue-600">Inicio</Link>
                <ChevronRight size={14} />
                <span className="capitalize">{product.category}</span>
                <ChevronRight size={14} />
                <span className="text-slate-900 font-medium truncate">{product.name}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
                <p className="text-4xl font-extrabold text-blue-600">
                {formatMoney(product.price)}
                </p>
                {product.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white bg-slate-800`}>
                        {product.badge.text}
                    </span>
                )}
            </div>
            
            <div className="prose prose-slate mb-8">
              <h3 className="text-lg font-bold mb-2">Descripción</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {product.description || "Sabor 100% venezolano garantizado."}
              </p>
            </div>

            <div className="space-y-3 mb-12 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <div className="p-1 bg-green-100 rounded-full text-green-600"><Check size={14} strokeWidth={3} /></div> 
                    Entrega inmediata en Passo Fundo
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <div className="p-1 bg-yellow-100 rounded-full text-yellow-600"><Star size={14} strokeWidth={3} /></div> 
                    Calidad Original Garantizada
                </div>
            </div>
            
            {/* Botón Compra */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:p-0 md:border-0 md:bg-transparent mt-auto z-50 md:z-auto">
                <button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                <ShoppingBag size={24} />
                Agregar al Carrito
                </button>
            </div>
          </div>
        </div>

        {/* --- RELACIONADOS --- */}
        {relatedProducts.length > 0 && (
            <section className="px-4 md:px-0">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">También te podría gustar</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedProducts.map((item) => (
                        <Link 
                            to={`/product/${item.id}`} 
                            key={item.id}
                            className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 group block"
                        >
                            <div className="h-32 mb-4 flex items-center justify-center">
                                <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform"
                                />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1 truncate">{item.name}</h4>
                            <p className="text-blue-600 font-bold text-sm">{formatMoney(item.price)}</p>
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