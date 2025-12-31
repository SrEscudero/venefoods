import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../supabase/client'; // <--- Importamos la conexión

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // INTENTAMOS INICIAR SESIÓN EN SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // Si todo sale bien, Supabase guarda la sesión automáticamente
      console.log("Login exitoso:", data);
      navigate('/admin/dashboard');

    } catch (error) {
      setError('Email o contraseña incorrectos');
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Venefoods</h1>
            <p className="text-gray-500 text-sm">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <input 
                    type="email" 
                    placeholder="admin@venefoods.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                />
            </div>
            <div>
                <input 
                    type="password" 
                    placeholder="Contraseña..." 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                />
            </div>
            
            {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

            <button 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
        </form>
      </div>
    </div>
  );
}