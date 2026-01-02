import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-12 pb-32 rounded-t-[2.5rem] mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Columna 1: Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
                <span className="fi fi-ve rounded-sm shadow-sm"></span>
                <span className="text-xl font-bold tracking-tight">Venefoods</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              La mejor selección de productos venezolanos en Passo Fundo. Calidad y sabor garantizado directo a tu mesa.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400">Explora</h3>
            <ul className="space-y-3 text-slate-400 text-sm font-medium">
              <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/curiosities" className="hover:text-white transition-colors">Curiosidades</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contacto y Horarios</Link></li>
            </ul>
          </div>

          {/* Columna 3: Redes y Ubicación */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400">Síguenos</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="p-3 bg-slate-800 rounded-2xl hover:bg-blue-600 hover:scale-110 transition-all duration-300 group">
                <Facebook size={20} className="text-slate-400 group-hover:text-white"/>
              </a>
              <a href="#" className="p-3 bg-slate-800 rounded-2xl hover:bg-pink-600 hover:scale-110 transition-all duration-300 group">
                <Instagram size={20} className="text-slate-400 group-hover:text-white"/>
              </a>
            </div>
            <div className="flex items-start gap-3 text-slate-400 text-sm">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                    <MapPin size={18} className="text-blue-500" />
                </div>
                <p className="mt-1">Av. 7 de Setembro, 376, Centro<br/>Passo Fundo - RS, Brasil</p>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN INFERIOR CON LOGIN OCULTO --- */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-xs">
          
          <p>© {new Date().getFullYear()} Venefoods. Todos los derechos reservados.</p>
          
          <div className="flex items-center gap-4">            
            {/* EL BOTÓN SECRETO (Casi invisible) */}
            <Link 
                to="/admin" 
                className="text-slate-800 hover:text-blue-500 transition-colors p-2"
                title="Acceso Administrativo"
            >
                <Lock size={14} />
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}