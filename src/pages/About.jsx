import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Heart, Star, Users, MapPin, ArrowRight } from 'lucide-react';

export default function About({ cart }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const images = {
    hero: "/about/portada.jpg",
    story: "/about/historia.jpg",
    gallery: [
      "/about/galeria1.jpg",
      "/about/galeria2.jpg",
      "/about/galeria3.jpg",
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans flex flex-col">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="flex-1 animate-fade-in pb-12">
        {/* 1. HERO SECTION: Portada Impactante */}
        <section className="relative h-[40vh] md:h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-900">
            <img
              src={images.hero}
              onError={(e) => e.target.style.display = 'none'}
              alt="Portada Venefoods"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent"></div>
          </div>

          <div className="relative z-10 text-center px-4 max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-yellow-400/90 backdrop-blur-sm text-slate-900 font-bold text-xs uppercase tracking-wider mb-4 shadow-lg border border-white/20">
              Desde Venezuela
              <span className="fi fi-ve rounded-sm shadow-sm"></span>
              para Brasil
              <span className="fi fi-br rounded-sm shadow-sm"></span>
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              Más que productos, <br /> entregamos <span className="text-yellow-400">recuerdos</span>.
            </h1>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
          {/* 2. TARJETAS DE VALORES (Flotando sobre la portada) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            <ValueCard
              icon={<Star size={24} />}
              title="Calidad Premium"
              text="Seleccionamos solo las marcas originales que tú conoces y amas."
            />
            <ValueCard
              icon={<Heart size={24} />}
              title="Sabor a Casa"
              text="Sabemos lo que significa extrañar un sabor. Por eso te lo llevamos a tu puerta."
            />
            <ValueCard
              icon={<Users size={24} />}
              title="Atención Amiga"
              text="Te atendemos como paisanos. Con cariño, respeto y rapidez."
            />
          </div>

          {/* 3. NUESTRA HISTORIA (Texto + Foto) */}
          <section className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 mb-16 transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Nuestra Historia</h2>
                <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                  <p>
                    Todo comenzó con un antojo. Al llegar a <strong>Passo Fundo</strong>, buscábamos desesperadamente esa Harina P.A.N. para el desayuno o ese Chocolate Savoy para la tarde.
                  </p>
                  <p>
                    Nos dimos cuenta de que no éramos los únicos. Había una comunidad vibrante extrañando sus raíces. Así nació <strong>Venefoods</strong>.
                  </p>
                  <p>
                    Hoy, somos un pedacito de Venezuela en el sur de Brasil. No solo vendemos comida; conectamos culturas y curamos la "saudade" un bocado a la vez.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <div className="relative aspect-square md:aspect-video rounded-[2rem] overflow-hidden bg-gray-200 shadow-xl rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all duration-500">
                  <img
                    src={images.story}
                    alt="Fundadores"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold text-slate-800 shadow-sm flex items-center gap-2 border border-white/50">
                    <MapPin size={16} className="text-red-500" /> Passo Fundo, RS
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. GALERÍA DE MOMENTOS */}
          <section className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Momentos Venefoods</h2>
            <p className="text-gray-500 mb-8">Un vistazo a nuestro local y nuestros productos</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {images.gallery.map((imgSrc, index) => (
                <div
                  key={index}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <img
                    src={imgSrc}
                    alt={`Galería ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. CALL TO ACTION */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-12 text-center text-white shadow-xl shadow-blue-600/30 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4 tracking-tight">¿Te provocó algo?</h2>
              <p className="text-blue-100 mb-8 max-w-lg mx-auto">
                Revisa nuestro catálogo completo y recibe tu pedido hoy mismo.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Ver Productos <ArrowRight size={20} />
              </Link>
            </div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -mr-20 -mb-20"></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ValueCard({ icon, title, text }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md hover:bg-white transition-all duration-300 text-center md:text-left">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
    </div>
  );
}