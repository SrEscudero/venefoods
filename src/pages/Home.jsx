import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp, Truck, ShieldCheck, Star, Loader2, Search, MessageCircle,
  ShoppingBasket, ChevronRight, MapPin
} from "lucide-react";
import { Helmet } from 'react-helmet-async';
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import CartSummary from "../components/CartSummary";
import CartModal from "../components/CartModal";
import Footer from "../components/Footer";
import StoreClosedBanner from "../components/StoreClosedBanner";

// --- FIREBASE IMPORTS ---
import { db } from '../firebase/client';
import { collection, getDocs } from 'firebase/firestore';
// ------------------------
import { useStoreSettings } from "../hooks/useStoreSettings";

export default function Home({
  cart,
  addToCart,
  removeFromCart,
  deleteFromCart,
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("todo");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const {
    storeStatus,
    closedMessage,
    bannerUrl,
    topBarActive,
    topBarText,
    whatsappNumber,
    shippingMin
  } = useStoreSettings();

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Productos
        const productsSnap = await getDocs(collection(db, "products"));
        const productsData = productsSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            price: Number(d.price),
            stock: Number(d.stock),
            badge: d.badge ? { text: d.badge.text, color: d.badge.color } : null
          };
        });
        setProducts(productsData);

        // 2. Categorías
        const catsSnap = await getDocs(collection(db, "categories"));
        const catsData = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (catsData.length === 0) {
          setCategories([
            { id: 'harinas', name: 'Harinas' },
            { id: 'quesos', name: 'Quesos' },
            { id: 'dulces', name: 'Dulces' }
          ]);
        } else {
          setCategories(catsData);
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- SCROLL ---
  useEffect(() => {
    const handleScroll = () => { setShowScrollTop(window.scrollY > 400); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth" }); };

  // --- FILTROS ---
  const filteredProducts = products.filter((product) => {
    const prodCat = product.category ? product.category.toLowerCase() : '';
    const activeCat = activeCategory.toLowerCase();
    const matchesCategory = activeCategory === "todo" || prodCat === activeCat;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans relative overflow-hidden selection:bg-blue-200">
      {/* --- FONDO ATMOSFÉRICO ESTILO APPLE (VIDRIO) --- */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/20 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-red-400/15 rounded-full blur-[130px] mix-blend-multiply"></div>
      </div>

      <Helmet>
        <title>Inicio | Venefoods</title>
        <meta name="description" content="Delivery de productos venezolanos en Passo Fundo." />
      </Helmet>

      {/* --- BARRA SUPERIOR CRISTAL (EFECTO VIDRIO) --- */}
      {topBarActive && topBarText && (
        <div className="bg-slate-900/80 backdrop-blur-md text-white text-center text-xs font-semibold py-3 px-4 shadow-sm relative z-50 tracking-wide border-b border-white/10">
          {topBarText} {shippingMin > 0 && <span className="text-yellow-400 ml-1">(Mínimo R$ {shippingMin})</span>}
        </div>
      )}

      <Navbar cartCount={totalItems} onSearch={setSearchTerm} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 space-y-20 w-full relative z-10">
        {/* --- HERO SECTION (DISEÑO GLASS PREMIUM) --- */}
        {searchTerm === "" && (
          <div className="space-y-12 animate-fade-in-up">
            <div className="relative rounded-[2.5rem] overflow-hidden p-8 md:p-16 shadow-2xl shadow-blue-900/20 min-h-[460px] flex items-center">
              {/* Fondo del Banner */}
              <div className="absolute inset-0 z-0">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
                )}
                {/* Overlay degradado elegante */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
              </div>

              <div className="relative z-10 max-w-2xl space-y-6">
                {/* Badge de Estado */}
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${storeStatus === 'open' ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'}`}>
                  <div className={`w-2 h-2 rounded-full ${storeStatus === 'open' ? 'bg-green-400 shadow-[0_0_12px_#4ade80]' : 'bg-white'}`}></div>
                  {storeStatus === 'open' ? 'Tienda Abierta' : 'Cerrado Temporalmente'}
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
            </div>

            {/* Tarjetas de Información Flotantes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassInfoCard icon={<Truck />} title="Delivery Rápido" desc="Directo a tu puerta" color="text-blue-500" />
              <GlassInfoCard icon={<Star />} title="Calidad Premium" desc="Productos 100% originales" color="text-yellow-500" />
              <GlassInfoCard icon={<ShieldCheck />} title="Pago Seguro" desc="Paga al recibir" color="text-green-500" />
            </div>
          </div>
        )}

        {/* --- CATEGORÍAS (PÍLDORAS ESTILO IOS) --- */}
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

        {/* --- GRID DE PRODUCTOS --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="font-medium text-lg tracking-wide mt-6 text-slate-500">Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 ${storeStatus === 'closed' ? 'opacity-60 grayscale pointer-events-none' : ''}`}>
            {filteredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="block group">
                <div className="h-full transition-transform duration-300 group-hover:-translate-y-2">
                  <ProductCard
                    product={product}
                    onAdd={addToCart}
                    cart={cart}
                  />
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

      {/* --- BOTONES FLOTANTES (ESTILO IOS CONTROL CENTER) --- */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col gap-4">
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
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
      {storeStatus === 'open' && (
        <CartSummary
          count={totalItems}
          total={totalPrice}
          shippingMin={shippingMin}
          onClick={() => setIsModalOpen(true)}
        />
      )}

      {storeStatus === 'closed' && <StoreClosedBanner message={closedMessage} />}

      <CartModal
        cart={cart}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onDelete={deleteFromCart}
        storeStatus={storeStatus}
        shippingMin={shippingMin}
      />
    </div>
  );
}

// --- COMPONENTES UI PERSONALIZADOS MEJORADOS ---

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