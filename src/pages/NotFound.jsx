import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound({ cart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans flex flex-col">
      <Navbar cartCount={cart?.length || 0} isDetailPage={true} />

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-lg w-full transition-all hover:shadow-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertCircle size={40} />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Ups... 404</h1>
          <h2 className="text-xl font-semibold text-gray-600 mb-6">Página no encontrada</h2>

          <p className="text-gray-500 mb-8 leading-relaxed">
            Parece que te perdiste buscando arepas. <br />
            Esta página no existe o fue movida.
          </p>

          <Link
            to="/"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Home size={20} />
            Volver al Inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}