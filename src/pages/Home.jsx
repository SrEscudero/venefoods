import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp, Truck, ShieldCheck, Star, Loader2, Search, MessageCircle,
  ShoppingBasket, ChevronRight, MapPin, Plus
} from "lucide-react";
import { Helmet } from 'react-helmet-async';
import Navbar from "../components/Navbar";
import CartSummary from "../components/CartSummary";
import CartModal from "../components/CartModal";
import Footer from "../components/Footer";
import StoreClosedBanner from "../components/StoreClosedBanner";
import ProductDetailModal from '../components/ProductDetailModal'; // Asegúrate de tener este componente o quitar su uso si usas navegación

// --- FIREBASE IMPORTS ---
import { db } from '../firebase/client';
import { collection, getDocs } from 'firebase/firestore';

export default function Home({
  cart,
  addToCart,
  removeFromCart,
  deleteFromCart,
  clearCart
}) {
  // --- ESTADOS DE DATOS ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- CONFIGURACIÓN (Con soporte para Array de Banners) ---
  const [config, setConfig] = useState({
    banners: [],
    top_bar_text: "",
    top_bar_active: "false",
    store_status: "open",
    store_closed_message: "",
    whatsapp_number: "",
    shipping_min_value: "0"
  });

  // --- ESTADOS UI ---
  const [activeCategory, setActiveCategory] = useState("todo");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Para modal de detalle si se usa
  
  // --- ESTADO CARRUSEL ---
  const [currentBanner, setCurrentBanner] = useState(0);

  // 1. CARGA DE DATOS CENTRALIZADA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Productos (Mapeando campos nuevos: isFeatured, originalPrice)
        const productsSnap = await getDocs(collection(db, "products"));
        const productsData = productsSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            price: Number(d.price),
            originalPrice: Number(d.originalPrice || 0),
            stock: Number(d.stock),
            isFeatured: d.isFeatured || false,
            badge: d.badge ? { text: d.badge.text, color: d.badge.color } : null
          };
        });
        setProducts(productsData);

        // B. Categorías
        const catsSnap = await getDocs(collection(db, "categories"));
        const catsData = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (catsData.length === 0) {
            // Fallback visual si no hay categorías
            setCategories([{ id: 'general', name: 'General' }]);
        } else {
            setCategories(catsData);
        }

        // C. Configuración (Parsing inteligente de Banners)
        const settingsSnap = await getDocs(collection(db, "site_settings"));
        const newConfig = {};
        
        settingsSnap.docs.forEach(doc => {
            const val = doc.data().value;
            // Intentar parsear JSON (para banners y zonas)
            try {
                newConfig[doc.id] = JSON.parse(val);
            } catch {
                newConfig[doc.id] = val; // Si falla, es un string normal
            }
        });

        // Asegurar que banners sea un array
        if (!Array.isArray(newConfig.banners)) {
            newConfig.banners = newConfig.home_banner ? [newConfig.home_banner] : [];
        }

        setConfig(prev => ({ ...prev, ...newConfig }));

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. ROTACIÓN AUTOMÁTICA DEL CARRUSEL
  useEffect(() => {
    if (!config.banners || config.banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % config.banners.length);
    }, 4000); // 4 segundos
    return () => clearInterval(interval);
  }, [config.banners]);

  // 3. SCROLL TOP
  useEffect(() => {
    const handleScroll = () => { setShowScrollTop(window.scrollY > 400); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth" }); };

  // 4. FILTROS Y ORDENAMIENTO
  const filteredProducts = products.filter((product) => {
    // Normalizar ID de categoría para comparación
    const prodCatId = product.category ? product.category : ''; 
    // Nota: Si guardas el ID de categoría en el producto, usa eso. Si guardas el nombre, ajusta aquí.
    
    // Comparación flexible (nombre o id)
    const matchesCategory = activeCategory === "todo" || prodCatId === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.active !== false;
  });

  // Ordenar: Destacados primero
  filteredProducts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Totales Carrito
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans relative overflow-hidden selection:bg-blue-200">
      
      {/* --- FONDO ATMOSFÉRICO --- */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-red-400/15 rounded-full blur-[130px] mix-blend-multiply"></div>
      </div>

      <Helmet>
        <title>Inicio | Venefoods</title>
        <meta name="description" content="Delivery de productos venezolanos en Passo Fundo." />
      </Helmet>

      {/* --- BARRA SUPERIOR DE ANUNCIOS --- */}
      {config.top_bar_active === "true" && config.top_bar_text && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-center text-xs font-bold py-2.5 px-4 shadow-sm relative z-50 tracking-wide border-b border-white/10 animate-fade-in-down">
          {config.top_bar_text} 
          {Number(config.shipping_min_value) > 0 && 
            <span className="text-yellow-400 ml-1">(Envío gratis +R$ {config.shipping_min_value})</span>
          }
        </div>
      )}

      <Navbar cartCount={totalItems} onSearch={setSearchTerm} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-16 w-full relative z-10">
        
        {/* --- HERO SECTION / CARRUSEL --- */}
        {searchTerm === "" && (
          <div className="space-y-12 animate-fade-in-up">
            
            {/* COMPONENTE CARRUSEL */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 min-h-[460px] flex items-center group">
              
              {/* Slides */}
              {config.banners.length > 0 ? (
                config.banners.map((banner, index) => (
                  <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBanner ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <img src={banner} alt={`Banner ${index}`} className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[2000ms]" />
                    {/* Overlay degradado para legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent"></div>
                  </div>
                ))
              ) : (
                // Fallback si no hay banners
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
              )}

              {/* Contenido Hero */}
              <div className="relative z-10 max-w-2xl space-y-6 p-8 md:p-16">
                {/* Badge de Estado */}
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${config.store_status === 'open' ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'}`}>
                  <div className={`w-2 h-2 rounded-full ${config.store_status === 'open' ? 'bg-green-400 shadow-[0_0_12px_#4ade80]' : 'bg-white'}`}></div>
                  {config.store_status === 'open' ? 'Tienda Abierta' : 'Cerrado Temporalmente'}
                </div>

                <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight drop-shadow-2xl">
                  Sabor que te <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400">
                    conecta.
                  </span>
                </h2>

                <p className="text-lg text-slate-200 font-medium max-w-lg leading-relaxed drop-shadow-md">
                  Los productos de tu tierra, entregados con el cariño que mereces en Passo Fundo.
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  <TricolorButton onClick={() => document.getElementById("categorias").scrollIntoView({ behavior: "smooth" })}>
                    Ver Catálogo
                  </TricolorButton>

                  <div className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold shadow-lg">
                    <MapPin size={18} className="text-red-400" /> Passo Fundo, RS
                  </div>
                </div>
              </div>

              {/* Indicadores del Carrusel (Puntos) */}
              {config.banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {config.banners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBanner ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tarjetas Flotantes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassInfoCard icon={<Truck />} title="Delivery Rápido" desc="Directo a tu puerta" color="text-blue-500" />
              <GlassInfoCard icon={<Star />} title="Calidad Premium" desc="Productos 100% originales" color="text-yellow-500" />
              <GlassInfoCard icon={<ShieldCheck />} title="Pago Seguro" desc="Paga al recibir" color="text-green-500" />
            </div>
          </div>
        )}

        {/* --- CATEGORÍAS --- */}
        <section id="categorias" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Categorías</h3>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar px-1">
            <CategoryPill
              active={activeCategory === "todo"}
              onClick={() => setActiveCategory("todo")}
              label="Todo"
              icon={<ShoppingBasket size={18} />}
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                label={cat.name}
              />
            ))}
          </div>
        </section>

        {/* --- GRID DE PRODUCTOS (CON OFERTAS Y DESTACADOS) --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="font-medium text-lg tracking-wide mt-6 text-slate-500">Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 ${config.store_status === 'closed' ? 'opacity-60 grayscale pointer-events-none' : ''}`}>
            {filteredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="block group h-full">
                <div className={`bg-white p-4 rounded-3xl shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 h-full flex flex-col relative overflow-hidden ${product.isFeatured ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-100'}`}>
                  
                  {/* --- ETIQUETAS (OFERTA / DESTACADO) --- */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {/* Destacado */}
                    {product.isFeatured && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> TOP
                      </span>
                    )}
                    {/* Oferta (Calculada) */}
                    {product.originalPrice > product.price && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm animate-pulse">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* IMAGEN */}
                  <div className="w-full h-36 md:h-44 bg-gray-50 rounded-2xl p-4 mb-3 flex items-center justify-center relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110" 
                    />
                  </div>

                  {/* INFO DEL PRODUCTO */}
                  <div className="flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 mb-1 leading-tight text-sm md:text-base line-clamp-2 min-h-[2.5em]">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div className="flex flex-col">
                        {/* PRECIO TACHADO (Si existe oferta) */}
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] md:text-xs text-gray-400 line-through font-medium">
                            R$ {Number(product.originalPrice).toFixed(2)}
                          </span>
                        )}
                        {/* PRECIO REAL */}
                        <span className="text-base md:text-lg font-black text-slate-900">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Botón Añadir Rápido */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault(); // Evitar navegación del Link
                          addToCart(product);
                        }}
                        disabled={config.store_status === 'closed' || product.stock <= 0}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 z-20 ${
                          config.store_status === 'closed' || product.stock <= 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-sm">
            <div className="bg-white p-6 rounded-full shadow-lg mb-6">
              <Search size={48} className="text-slate-300" />
            </div>
            <p className="text-2xl font-bold text-slate-700">No encontramos productos</p>
            <p className="text-slate-500 mt-2 font-medium">Intenta con otra categoría o búsqueda</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('todo'); }}
              className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Ver todo el catálogo
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* --- BOTONES FLOTANTES --- */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col gap-4">
        {config.whatsapp_number && (
          <a
            href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-2xl shadow-xl shadow-green-500/30 hover:scale-110 hover:shadow-2xl transition-all duration-300"
          >
            <MessageCircle size={28} fill="white" className="drop-shadow-md" />
            <span className="absolute right-full mr-4 bg-white/90 backdrop-blur text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm whitespace-nowrap pointer-events-none border border-white/50">
              ¡Escríbenos!
            </span>
          </a>
        )}

        <button
          onClick={scrollToTop}
          className={`w-14 h-14 bg-white/80 backdrop-blur-xl text-slate-800 rounded-2xl shadow-xl border border-white/50 flex items-center justify-center transition-all duration-500 hover:bg-white hover:scale-110 ${
            showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <ArrowUp size={24} className="text-slate-600" />
        </button>
      </div>

      {/* Resumen del Carrito */}
      {config.store_status === 'open' && (
        <CartSummary
          count={totalItems}
          total={totalPrice}
          shippingMin={config.shipping_min_value}
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {config.store_status === 'closed' && <StoreClosedBanner message={config.store_closed_message} />}

      <CartModal
        cart={cart}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onDelete={deleteFromCart}
        clearCart={clearCart}
        storeStatus={config.store_status}
        shippingMin={config.shipping_min_value}
      />
      
      {/* Modal Detalle (Opcional, si no usas Link) */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function GlassInfoCard({ icon, title, desc, color }) {
  return (
    <div className="group bg-white/70 backdrop-blur-lg border border-white/40 p-6 rounded-3xl shadow-lg shadow-slate-200/50 flex items-center gap-4 hover:bg-white/90 hover:shadow-xl hover:border-white/60 transition-all duration-300">
      <div className={`p-3.5 rounded-2xl bg-white shadow-md ${color} group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon, { size: 22, strokeWidth: 1.8 })}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-base">{title}</h4>
        <p className="text-slate-500 text-xs font-medium mt-1">{desc}</p>
      </div>
    </div>
  );
}

function CategoryPill({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap snap-start transition-all duration-300 border
        ${
          active
            ? "bg-slate-900 text-white shadow-xl shadow-slate-900/30 scale-[1.02] border-slate-900"
            : "bg-white/80 backdrop-blur-md text-slate-600 border-white/50 hover:bg-white hover:border-slate-200 hover:shadow-md"
        }
      `}
    >
      {icon ? (
        icon
      ) : (
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-yellow-400' : 'bg-slate-400'}`}></div>
      )}
      {label}
    </button>
  );
}

function TricolorButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative px-8 py-3.5 rounded-2xl font-bold text-slate-900 bg-white shadow-lg transition-all active:scale-95 overflow-hidden hover:shadow-xl"
    >
      {/* Borde degradado tricolor */}
      <div className="absolute inset-0 p-[2px] rounded-2xl bg-gradient-to-r from-yellow-400 via-blue-500 to-red-500 -z-10 opacity-80 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute inset-[2px] bg-white rounded-[14px] -z-10"></div>

      <div className="flex items-center gap-2 relative z-10">
        {children}
        <ChevronRight size={18} className="text-blue-600 group-hover:translate-x-1.5 transition-transform" />
      </div>
    </button>
  );
}