import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import logoVenefoods from '../assets/images/logo.jpg';

export default function Navbar({ cartCount, onSearch, isDetailPage }) {
  const location = useLocation();

  const linkClass = (path) => `
    text-sm font-semibold transition-all duration-300 px-5 py-2.5 rounded-full
    ${
      location.pathname === path
        ? 'text-slate-900 bg-white shadow-md'
        : 'text-slate-500 hover:text-slate-900 hover:bg-white/70'
    }
  `;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isDetailPage
          ? 'bg-white/80 border-b border-white/20 backdrop-blur-xl shadow-sm'
          : 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* 1. ZONA IZQUIERDA: Logo o Volver */}
        <div className="flex items-center gap-4 min-w-max">
          {isDetailPage ? (
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition font-bold text-sm bg-white/50 px-5 py-2.5 rounded-full hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md"
            >
              <ArrowLeft size={18} />
              <span className="hidden md:inline">Volver al menú</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src={logoVenefoods}
                  alt="Logo Venefoods"
                  className="relative w-10 h-10 rounded-2xl object-cover shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                  Venefoods
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                  Sabor Criollo
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* 2. ZONA CENTRAL: Navegación (Píldoras Flotantes) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-white/30 backdrop-blur-md shadow-sm">
          <Link to="/" className={linkClass('/')}>
            Inicio
          </Link>
          <Link to="/about" className={linkClass('/about')}>
            Nosotros
          </Link>
          <Link to="/contact" className={linkClass('/contact')}>
            Contacto
          </Link>
        </nav>

        {/* 3. ZONA DERECHA: Buscador y Carrito */}
        <div className="flex items-center gap-3 flex-1 justify-end max-w-xl">
          {/* Buscador iOS Style */}
          {!isDetailPage && (
            <div className="relative group w-full max-w-[180px] sm:max-w-xs transition-all duration-300 focus-within:max-w-sm">
              <Search
                className="absolute left-3.5 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                onChange={(e) => onSearch && onSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-blue-500/20 focus:shadow-lg transition-all text-sm font-medium placeholder:text-slate-400 border border-transparent focus:border-blue-200"
              />
            </div>
          )}

          {/* Botón Carrito (Círculo Oscuro) */}
          <Link
            to="/checkout"
            className="relative p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all active:scale-90 hover:shadow-lg hover:shadow-slate-900/20 flex-shrink-0"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}