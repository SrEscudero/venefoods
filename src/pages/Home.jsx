import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Truck, ShieldCheck, Star, Loader2, Search } from "lucide-react";
import { Helmet } from 'react-helmet-async'; // Importamos SEO
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import CartSummary from "../components/CartSummary";
import CartModal from "../components/CartModal";
import Footer from "../components/Footer";
import { CATEGORIAS } from "../data/products";
import { supabase } from "../supabase/client";

// Imagen por defecto (puedes cambiar esta URL por una local si prefieres)
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1920&auto=format&fit=crop";

export default function Home({
  cart,
  addToCart,
  removeFromCart,
  deleteFromCart,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("todo");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estado del Banner (Empieza con el default, luego carga el de Supabase)
  const [bannerUrl, setBannerUrl] = useState(DEFAULT_BANNER);

  // --- 1. CARGA DE DATOS (PRODUCTOS + BANNER) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Cargar Configuración del Banner (Nuevo)
        const { data: bannerSetting } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'home_banner')
          .single();

        if (bannerSetting && bannerSetting.value) {
            setBannerUrl(bannerSetting.value);
        }

        // B. Cargar Productos
        const { data, error } = await supabase.from('products').select('*');
        
        if (error) {
            console.error("Error cargando productos:", error);
        } else {
          // TRUCO: Convertimos PRECIO a Número aquí para evitar el NaN
          const formattedData = data.map(item => ({
            ...item,
            price: parseFloat(item.price), // <--- CLAVE: Forzamos que sea número
            stock: parseInt(item.stock),   // <--- CLAVE: Stock como entero
            badge: item.badge_text ? { text: item.badge_text, color: item.badge_color } : null
          }));
          setProducts(formattedData);
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. LÓGICA SCROLL ---
  useEffect(() => {
    const handleScroll = () => { setShowScrollTop(window.scrollY > 400); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth" }); };

  // --- 3. CÁLCULO DE TOTAL CORREGIDO ---
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Solución definitiva al NaN:
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

  // Filtros
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "todo" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans transition-colors duration-300 flex flex-col">
      
      {/* SEO: Metadata dinámica para Google */}
      <Helmet>
        <title>Inicio | Venefoods - Sabor Venezolano en Passo Fundo</title>
        <meta name="description" content="Encuentra Harina P.A.N., Queso Llanero, Dulces y lo mejor de la gastronomía venezolana en Brasil. Envíos rápidos en Passo Fundo." />
      </Helmet>

      <Navbar cartCount={totalItems} onSearch={setSearchTerm} />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-8 flex-1 w-full">
        
        {/* Banner (Visible si no buscas nada) */}
        {searchTerm === "" && (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2.5rem] text-white p-8 md:p-16 shadow-2xl shadow-blue-900/20 text-center md:text-left animate-fade-in min-h-[380px] flex items-center group">
              <div className="absolute inset-0 z-0">
                <img 
                    src={bannerUrl} 
                    alt="Banner Promocional" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900/60 to-transparent mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 shadow-lg shadow-yellow-400/20">
                  <span>Desde Venezuela</span><span className="fi fi-ve rounded-[2px]"></span>
                  <span>Para Brasil</span><span className="fi fi-br rounded-[2px]"></span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-tight mb-4 drop-shadow-lg">
                  Más que productos, <br /> entregamos <span className="text-yellow-400">recuerdos.</span>
                </h2>
                <p className="text-blue-50 text-lg md:text-xl mb-8 opacity-95 max-w-xl font-medium leading-relaxed drop-shadow-md">
                  Encuentra la mayor variedad de productos de nuestra amada tierra a un excelente precio.
                </p>
                <button
                  onClick={() => document.getElementById("categorias").scrollIntoView({ behavior: "smooth" })}
                  className="bg-white text-blue-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-400 hover:text-slate-900 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto md:mx-0"
                >
                  Ver Catálogo <Search size={18}/>
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard icon={<Truck size={20} />} title="Delivery en Passo Fundo" desc="Rápido y seguro hasta tu puerta" />
              <InfoCard icon={<Star size={20} />} title="Calidad Original" desc="Productos 100% venezolanos" />
              <InfoCard icon={<ShieldCheck size={20} />} title="Compra Segura" desc="Paga al recibir tu pedido" />
            </div>
          </div>
        )}

        {/* Categorías */}
        <section id="categorias">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar pt-2">
            <button
                onClick={() => setActiveCategory("todo")}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap snap-start transition-all duration-300 ${
                  activeCategory === "todo" ? "bg-blue-600 text-white shadow-lg scale-105" : "bg-white text-gray-500 border border-gray-100"
                }`}
            >
                Todo
            </button>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap snap-start transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {cat.isFlag ? <span className={`${cat.icon} text-lg rounded-[2px] shadow-sm`}></span> : <span className="text-lg">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Grid de Productos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
            <p className="font-medium">Trayendo sabor venezolano...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 pb-20 animate-fade-in-up">
            {filteredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="cursor-pointer block">
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  cart={cart} // <--- Pasamos el carrito para controlar stock
                />
              </Link>
            ))}
          </section>
        ) : (
          <div className="text-center py-20 opacity-60">
            <span className="text-6xl block mb-4">🔍</span>
            <p className="text-xl font-bold text-slate-800">No encontramos ese producto</p>
            <button onClick={() => {setSearchTerm(''); setActiveCategory('todo')}} className="mt-4 text-blue-600 font-bold hover:underline">Ver todo el catálogo</button>
          </div>
        )}
      </main>

      <Footer />
      
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-4 z-30 p-3 bg-white text-slate-800 rounded-full shadow-lg border border-gray-100 transition-all duration-300 hover:bg-slate-50 active:scale-90 ${
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <ArrowUp size={20} />
      </button>
      
      {/* Resumen del Carrito y Modal */}
      <CartSummary
        count={totalItems}
        total={totalPrice}
        onClick={() => setIsModalOpen(true)}
      />
      <CartModal
        cart={cart}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onDelete={deleteFromCart}
      />
    </div>
  );
}

function InfoCard({ icon, title, desc }) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">{icon}</div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                <p className="text-gray-500 text-xs">{desc}</p>
            </div>
        </div>
    );
}