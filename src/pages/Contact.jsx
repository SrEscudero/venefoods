import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
    MapPin, 
    Clock, 
    Phone, 
    MessageCircle, 
    Instagram, 
    Facebook, 
    Mail, 
    ChevronDown, 
    Navigation,
    Circle
} from 'lucide-react';

export default function Contact({ cart }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Lógica para saber si está ABIERTO ahora mismo
  const checkStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Lunes...
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const time = hour + (minutes / 60); // Hora en decimal (Ej: 9:30 = 9.5)

    // Domingo Cerrado
    if (day === 0) return false;
    // Sábado (09:30 - 17:00)
    if (day === 6) return time >= 9.5 && time < 17;
    // Lunes a Viernes (09:30 - 18:30)
    return time >= 9.5 && time < 18.5;
  };

  const isOpen = checkStatus();

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans flex flex-col">
      <Navbar cartCount={cart.length} isDetailPage={true} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-20">
        
        {/* 1. HEADER: Título y Redes */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Hablemos 💬
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
                ¿Tienes dudas sobre un producto o tu pedido? Estamos aquí para ayudarte con el mejor ánimo venezolano.
            </p>
            
            {/* Botones Redes Sociales */}
            <div className="flex justify-center gap-4">
                <SocialBtn icon={<Instagram size={20} />} href="#" color="hover:bg-pink-600 hover:text-white" label="@venefoods" />
                <SocialBtn icon={<Facebook size={20} />} href="#" color="hover:bg-blue-700 hover:text-white" label="/venefoods" />
                <SocialBtn icon={<Mail size={20} />} href="mailto:contacto@venefoods.com" color="hover:bg-slate-800 hover:text-white" label="Email" />
            </div>
        </div>

        {/* 2. GRID DE CONTACTO PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Tarjeta WHATSAPP (Llamada a la acción principal) */}
            <div className="bg-green-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                        <MessageCircle size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">WhatsApp</h3>
                    <p className="text-green-100 mb-6 text-sm">Respuesta rápida para pedidos y dudas.</p>
                    <a 
                        href="https://wa.me/5554993294396" 
                        target="_blank" 
                        className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors"
                    >
                        Iniciar Chat
                    </a>
                </div>
                {/* Decoración de fondo */}
                <MessageCircle size={150} className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            </div>

            {/* Tarjeta UBICACIÓN */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Ubicación</h3>
                <p className="text-gray-500 text-sm mb-6">
                    Av. 7 de Setembro, 376<br/>
                    Centro, Passo Fundo - RS
                </p>
                
                <div className="flex gap-2">
                    <a 
                        href="https://waze.com/ul?q=Av+7+de+Setembro+376+Passo+Fundo" 
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-colors"
                    >
                        <Navigation size={14} /> Waze
                    </a>
                    <a 
                        href="https://maps.google.com/?q=Av+7+de+Setembro+376+Passo+Fundo" 
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <MapPin size={14} /> Maps
                    </a>
                </div>
            </div>

            {/* Tarjeta HORARIOS (Dinámica) */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                        <Clock size={28} />
                    </div>
                    {/* INDICADOR DE ESTADO EN VIVO */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${isOpen ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                        <Circle size={8} fill="currentColor" className={isOpen ? 'animate-pulse' : ''} />
                        {isOpen ? 'ABIERTO AHORA' : 'CERRADO'}
                    </div>
                </div>
                
                <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex justify-between border-b border-white/10 pb-2">
                        <span>Lunes - Viernes</span>
                        <span className="font-bold text-white">09:30 - 18:30</span>
                    </li>
                    <li className="flex justify-between border-b border-white/10 pb-2">
                        <span>Sábado</span>
                        <span className="font-bold text-white">09:30 - 17:00</span>
                    </li>
                    <li className="flex justify-between text-red-400 font-medium">
                        <span>Domingo</span>
                        <span>Cerrado</span>
                    </li>
                </ul>
            </div>
        </div>

        {/* 3. MAPA EMBEBIDO (Estilizado) */}
        <div className="rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-200 h-80 w-full mb-16 grayscale hover:grayscale-0 transition-all duration-700">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3514.868777074786!2d-52.41113692367194!3d-28.266799349807534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e2bf80b0676b6f%3A0x6b3b555555555555!2sAv.%207%20de%20Setembro%2C%20376%20-%20Centro%2C%20Passo%20Fundo%20-%20RS%2C%2099010-120!5e0!3m2!1ses!2sbr!4v1703960000000!5m2!1ses!2sbr" 
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>

        {/* 4. PREGUNTAS FRECUENTES (FAQ) */}
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Preguntas Frecuentes 🤔</h2>
            
            <div className="space-y-4">
                <FaqItem 
                    question="¿Hacen envíos a domicilio?" 
                    answer="¡Sí! Entregamos en todo Passo Fundo. El costo depende de tu barrio, pero es gratis para compras mayores a R$ 100." 
                />
                <FaqItem 
                    question="¿Qué métodos de pago aceptan?" 
                    answer="Aceptamos PIX, Efectivo, Tarjeta de Crédito y Débito al momento de la entrega." 
                />
                <FaqItem 
                    question="¿Tienen tienda física?" 
                    answer="¡Claro! Puedes venir a visitarnos, tomarte una malta fría y ver todos los productos en persona. Mira la dirección arriba." 
                />
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

// Componente pequeño para los botones de redes sociales
function SocialBtn({ icon, href, color, label }) {
    return (
        <a 
            href={href} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 border border-gray-200 transition-all duration-300 ${color}`}
        >
            {icon}
            <span className="font-bold text-sm">{label}</span>
        </a>
    );
}

// Componente para las preguntas frecuentes (Acordeón simple)
function FaqItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 hover:bg-gray-50 transition-colors"
            >
                {question}
                <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} />
            </button>
            <div className={`bg-gray-50 px-5 text-gray-600 text-sm leading-relaxed transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 py-4 border-t border-gray-100' : 'max-h-0 py-0'}`}>
                {answer}
            </div>
        </div>
    );
}