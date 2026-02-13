import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Lightbulb, ChefHat, BookOpen, Camera, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Curiosities({ cart }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const images = {
    hero: "/curiosities/paisaje.jpg",
    arepa: "/curiosities/arepa.jpg",
    gallery: [
      "/curiosities/cultura1.jpg",
      "/curiosities/cultura2.jpg",
      "/curiosities/cultura3.jpg"
    ]
  };

  const CURIOSIDADES = [
    { title: "Harina P.A.N.", text: "Inventada en los años 50, cambió la historia. Antes, había que moler el maíz a mano (pilado) durante horas.", icon: "🌽", color: "bg-yellow-100 text-yellow-600" },
    { title: "El Cacao", text: "Venezuela tiene la denominación de origen del mejor cacao del mundo (Chuao). Es el 'oro negro' dulce.", icon: "🍫", color: "bg-orange-100 text-orange-800" },
    { title: "Queso Telita", text: "Un queso artesanal que se conserva en su suero. Es tan suave que se derrite solo con mirarlo.", icon: "🧀", color: "bg-blue-100 text-blue-600" },
    { title: "La Malta", text: "No es cerveza, ¡es energía! Bebida de cebada dulce que todo niño venezolano toma en el desayuno.", icon: "🥤", color: "bg-amber-900/10 text-amber-900" },
    { title: "Salto Ángel", text: "Tenemos la caída de agua más alta del mundo (979m). ¡Inspiró la película 'Up' de Disney!", icon: "🏞️", color: "bg-green-100 text-green-600" },
    { title: "Navidad = Hallaca", text: "En diciembre no comemos pavo, comemos Hallacas: un tamal multisápido envuelto en hoja de plátano.", icon: "🎄", color: "bg-red-100 text-red-600" },
  ];

  const RECETA_AREPA = [
    "2 tazas de agua",
    "1 cucharadita de sal",
    "2 tazas de Harina P.A.N.",
    "Amor y paciencia (amasar bien)"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans flex flex-col">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="flex-1 animate-fade-in pb-16">
        {/* 1. HERO SECTION: Portada */}
        <section className="relative h-[40vh] md:h-[400px] flex items-center justify-center overflow-hidden mb-12">
          <div className="absolute inset-0 bg-slate-900">
            <img
              src={images.hero}
              onError={(e) => e.target.style.display = 'none'}
              alt="Venezuela Paisaje"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent"></div>
          </div>
          <div className="relative z-10 text-center px-4">
            <span className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm uppercase tracking-wider mb-4">
              <Lightbulb size={16} className="text-yellow-300" /> Cultura & Sabor
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-2xl">
              Sabías que...
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-xl mx-auto drop-shadow-md">
              Pequeños datos de nuestra gran tierra para que conozcas lo que comes.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 space-y-16">
          {/* 2. LA REINA AREPA (Sección Destacada) */}
          <section className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row transition-all hover:shadow-md">
            <div className="w-full md:w-1/2 bg-yellow-400 relative min-h-[300px] group">
              <img
                src={images.arepa}
                alt="Arepa Reina Pepiada"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity mix-blend-multiply md:mix-blend-normal"
                onError={(e) => e.target.src = "https://tucacas.com/wp-content/uploads/2020/04/arepa-venezolana.jpg"}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white md:hidden">
                <h3 className="text-2xl font-bold">La Arepa</h3>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <ChefHat size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">El Secreto de la Arepa</h2>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                La arepa es nuestro pan de cada día. Se come asada, frita, sola o rellena.
                No tiene gluten y es el desayuno perfecto. ¿Quieres hacer una?
              </p>

              <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">Ingredientes Básicos</h4>
                <ul className="space-y-3">
                  {RECETA_AREPA.map((ing, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. GRID DE CURIOSIDADES */}
          <section>
            <div className="flex items-center gap-2 mb-8 justify-center">
              <BookOpen className="text-blue-600" size={28} />
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Datos Curiosos</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CURIOSIDADES.map((c, i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-white transition-all duration-300"
                >
                  <div className={`w-14 h-14 ${c.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm`}>
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-3">{c.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. DICCIONARIO RÁPIDO (Tips) */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-600/30">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-3xl font-bold mb-2 tracking-tight">Diccionario Pana 🇻🇪</h3>
                <p className="text-blue-100">Para que pidas como un experto:</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shadow-lg">
                  <span className="block font-bold text-yellow-300">Chévere</span>
                  <span className="text-xs text-white/80">Excelente, muy bien.</span>
                </div>
                <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shadow-lg">
                  <span className="block font-bold text-yellow-300">Pana</span>
                  <span className="text-xs text-white/80">Amigo, parcero.</span>
                </div>
                <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shadow-lg">
                  <span className="block font-bold text-yellow-300">Con todo</span>
                  <span className="text-xs text-white/80">Con todas las salsas.</span>
                </div>
                <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shadow-lg">
                  <span className="block font-bold text-yellow-300">Vaina</span>
                  <span className="text-xs text-white/80">Cosa (sirve para todo).</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          </section>

          {/* 5. GALERÍA DE IMÁGENES */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <Camera className="text-slate-900" size={24} />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Un vistazo a nuestra tierra</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-auto md:h-64">
              {images.gallery.map((img, index) => (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden bg-gray-200 relative group shadow-sm hover:shadow-xl transition-all duration-300 ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                >
                  <img
                    src={img}
                    alt="Galería"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <Camera size={32} className="text-white drop-shadow-lg" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTÓN FINAL */}
          <div className="text-center pt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-6 py-3 rounded-full shadow-md hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95"
            >
              Ir a comprar Harina P.A.N. <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}