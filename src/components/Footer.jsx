import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-12 pb-32 rounded-t-[2.5rem] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Columna 1: Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🇻🇪</span>
                <span className="text-xl font-bold">Venefoods</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              La mejor selección de productos venezolanos en Passo Fundo. Calidad y sabor garantizado.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400">Explora</h3>
            <ul className="space-y-2 text-slate-300">
              <li><Link to="/" className="hover:text-white transition">Inicio</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Sobre Nosotros</Link></li>
              <li><Link to="/curiosities" className="hover:text-white transition">Curiosidades</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contacto y Horarios</Link></li>
            </ul>
          </div>

          {/* Columna 3: Redes y Ubicación */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400">Síguenos</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-blue-600 transition"><Facebook size={20} /></a>
              <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-pink-600 transition"><Instagram size={20} /></a>
            </div>
            <div className="flex items-start gap-2 text-slate-400 text-sm">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <p>Av. 7 de Setembro, 376, Centro<br/>Passo Fundo - RS, Brasil</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} Venefoods. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}