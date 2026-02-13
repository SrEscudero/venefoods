import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- FIREBASE IMPORTS ---
import { auth } from '../firebase/client';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
// ------------------------
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Comprobar sesión existente con Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("¡Bienvenido Admin! 🚀");
        // La redirección la maneja el onAuthStateChanged automáticamente
    } catch (error) {
        console.error("Error login:", error.code);
        
        // Mensajes de error amigables en español
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            toast.error("Correo o contraseña incorrectos");
        } else if (error.code === 'auth/too-many-requests') {
            toast.error("Demasiados intentos fallidos. Espera un momento.");
        } else {
            toast.error("Error de acceso: " + error.message);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 antialiased">
      {/* Fondo con efecto de vidrio elegante */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIj4KPHBhdGggZD0iTTAgMGwxMDAgMTAwIiAvPjwvc3ZnPg==')] opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        {/* Efecto de tarjeta flotante estilo iOS */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
        
        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-9 shadow-2xl border border-white/20 animate-fade-in">
          
          {/* Cabecera con diseño Apple */}
          <div className="text-center mb-9">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-slate-900/20 transform transition-all hover:scale-105 duration-300">
              <Lock className="text-white" size={34} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
              Acceso Administrativo
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-12 h-[2px] bg-blue-600/30 rounded-full"></span>
              <p className="text-gray-500 text-sm font-medium">Venefoods</p>
              <span className="w-12 h-[2px] bg-blue-600/30 rounded-full"></span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <Mail size={20} strokeWidth={1.8} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50/80 border border-gray-200/80 rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400"
                    placeholder="admin@venefoods.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    <span className="text-2xl font-bold leading-none">•••</span>
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/80 border border-gray-200/80 rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 tracking-wider"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group mt-8"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Entrar al Panel</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col items-center gap-4">
              <a 
                href="/" 
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-slate-800 transition-all duration-200 group"
              >
                <span className="w-5 h-[2px] bg-gray-300 group-hover:w-8 group-hover:bg-slate-800 transition-all duration-300"></span>
                <span>Volver a la tienda</span>
                <span className="w-5 h-[2px] bg-gray-300 group-hover:w-8 group-hover:bg-slate-800 transition-all duration-300"></span>
              </a>
              
              {/* Elemento decorativo minimalista */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}