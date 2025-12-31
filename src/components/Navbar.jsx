import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import logoVenefoods from '../assets/images/logo.jpg';

export default function Navbar({ cartCount, onSearch, isDetailPage = false }) {
  const location = useLocation();

  // Estilos para resaltar el link de la página actual
  const linkClass = (path) => `
    text-sm font-bold transition-colors duration-200
    ${location.pathname === path ? 'text-blue-600' : 'text-gray-500 hover:text-slate-900'}
  `;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isDetailPage
        ? "bg-white/90 md:bg-white/80 border-b md:border-b-0 backdrop-blur-xl"
        : "bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
    }`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">

        {/* 1. ZONA IZQUIERDA: Logo o Volver */}
        <div className="flex items-center gap-3 min-w-max">
          {isDetailPage ? (
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium p-2 hover:bg-gray-100 rounded-xl"
            >
              <ArrowLeft size={20} /> Volver al menú
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-3">
              {/* LOGO LIMPIO: Sin fondo amarillo, solo la imagen */}
              <img
                src={logoVenefoods}
                alt="Logo Venefoods"
                className="w-10 h-10 rounded-xl object-cover border border-gray-100"
              />

              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  Venefoods
                </h1>
                <p className="text-[11px] text-gray-500 font-medium tracking-wide">
                  Sabor Criollo
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* 2. ZONA CENTRAL: Navegación (Solo PC/Tablet) */}
        <nav className="hidden md:flex items-center gap-6 mx-4">
          <Link to="/" className={linkClass("/")}>Inicio</Link>
          <Link to="/about" className={linkClass("/about")}>Nosotros</Link>
          <Link to="/contact" className={linkClass("/contact")}>Contacto</Link>
        </nav>

        {/* 3. ZONA DERECHA: Buscador y Carrito */}
        <div className="flex items-center gap-3 flex-1 justify-end max-w-xl">

          {/* Buscador */}
          {!isDetailPage && (
            <div className="relative group w-full max-w-[200px] sm:max-w-xs lg:max-w-md transition-all duration-300">
              <Search
                className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-600 transition-colors"
                size={18}
              />
              <input
                type="text"
                onChange={(e) => onSearch && onSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-gray-100/80 focus:bg-white text-gray-900 rounded-xl pl-9 pr-4 py-2 outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all text-sm font-medium shadow-sm"
              />
            </div>
          )}

          {/* Botón Carrito */}
          <Link
            to="/checkout"
            className="relative p-2.5 bg-gray-100 rounded-full text-blue-600 hover:bg-blue-50 transition active:scale-90 hover:shadow-md flex-shrink-0"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  );
}