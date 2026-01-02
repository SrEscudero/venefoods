import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, mandar directo al Dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/admin/dashboard');
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("¡Bienvenido Kelvis!");
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error("Credenciales incorrectas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in">
        
        <div className="text-center mb-8">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-slate-900" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso Administrativo</h1>
          <p className="text-gray-500 text-sm mt-2">Solo personal autorizado de Venefoods</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Correo Electrónico</label>
            <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="admin@venefoods.com"
                    required
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Contraseña</label>
            <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400">
                    <span className="text-lg font-bold">***</span>
                </div>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={20}/></>}
          </button>
        </form>

        <div className="mt-8 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-slate-800 transition-colors">← Volver a la tienda</a>
        </div>
      </div>
    </div>
  );
}