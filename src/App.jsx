import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importación de Páginas
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Curiosities from "./pages/Curiosities";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from './pages/AdminLogin';

// Importación de Componentes
import Toast from "./components/Toast";

function App() {
  // 1. Estado del Carrito (Inicializado desde LocalStorage)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("venefoods_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Estado de la Notificación (Toast)
  const [toast, setToast] = useState(null);

  // 3. Persistencia: Guardar cambios automáticamente
  useEffect(() => {
    localStorage.setItem("venefoods_cart", JSON.stringify(cart));
  }, [cart]);

  // --- FUNCIONES AUXILIARES ---

  // Definición de showToast (Faltaba en tu código anterior)
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // --- LÓGICA DEL CARRITO ---

  // Agregar producto
  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    
    // Vibración para móviles (Feedback táctil)
    if (navigator.vibrate) navigator.vibrate(50);

    // Feedback visual
    showToast(`Se agregó ${product.name}`, "success");
  };

  // Quitar un solo item (disminuir cantidad)
  const removeFromCart = (productId) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === productId);
      if (index !== -1) {
        const newCart = [...prev];
        newCart.splice(index, 1);
        return newCart;
      }
      return prev;
    });
  };

  // Eliminar producto completo (papelera)
  const deleteFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast("Producto eliminado", "error");
  };

  // Objeto de props para pasar limpio al Home
  const cartProps = {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
  };

  return (
    <BrowserRouter>
      {/* Componente de Notificación Flotante */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Rutas de la Aplicación */}
      <Routes>
        {/* Principal */}
        <Route path="/" element={<Home {...cartProps} />} />
        
        {/* Detalle */}
        <Route
          path="/product/:id"
          element={<ProductDetail cart={cart} addToCart={addToCart} />}
        />
        
        {/* Finalizar Compra */}
        <Route path="/checkout" element={<Checkout cart={cart} />} />

        {/* Páginas Informativas */}
        <Route path="/about" element={<About cart={cart} />} />
        <Route path="/contact" element={<Contact cart={cart} />} />
        <Route path="/curiosities" element={<Curiosities cart={cart} />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound cart={cart} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;