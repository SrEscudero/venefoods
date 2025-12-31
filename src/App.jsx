import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast'; // Librería profesional de notificaciones

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

function App() {
  // 1. Estado del Carrito (Inicializado desde LocalStorage)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("venefoods_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Persistencia: Guardar cambios automáticamente
  useEffect(() => {
    localStorage.setItem("venefoods_cart", JSON.stringify(cart));
  }, [cart]);

  // --- LÓGICA DEL CARRITO ---

  // Agregar producto (Corrección: Suma cantidad en vez de duplicar)
  const addToCart = (product) => {
    setCart((prevCart) => {
      // A. Buscamos si ya existe
      const existingItem = prevCart.find((item) => item.id === product.id);

      // B. Verificamos Stock (Opcional, protección extra)
      const stock = product.stock || 0; 
      // Si existe y ya tienes el máximo, no deja agregar (excepto si stock es 0 que lo maneja la UI)
      if (existingItem && stock > 0 && existingItem.quantity >= stock) {
         toast.error(`¡Solo quedan ${stock} unidades!`);
         return prevCart;
      }

      if (existingItem) {
        // C. Si existe, actualizamos la cantidad
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        // D. Si no existe, lo agregamos con cantidad 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success("Agregado al carrito");
  };

  const removeFromCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      // Si la cantidad es 1, lo eliminamos del todo
      if (existingItem?.quantity === 1) {
        return prevCart.filter((item) => item.id !== product.id);
      }

      // Si es mayor a 1, restamos una unidad
      return prevCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  // Eliminar producto completo (papelera)
  const deleteFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.success("Producto eliminado");
  };

  // Vaciar carrito (después de comprar)
  const clearCart = () => {
    setCart([]);
  };

  return (
    <BrowserRouter>
      {/* Componente visual de las notificaciones */}
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* Principal */}
        <Route 
            path="/" 
            element={
                <Home 
                    cart={cart} 
                    addToCart={addToCart} 
                    removeFromCart={removeFromCart} 
                    deleteFromCart={deleteFromCart} 
                />
            } 
        />

        {/* Detalle */}
        <Route
          path="/product/:id"
          element={<ProductDetail cart={cart} addToCart={addToCart} />}
        />

        {/* Finalizar Compra (Con props corregidas para editar cantidad) */}
        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              addToCart={addToCart}       // Necesario para botón +
              removeFromCart={removeFromCart} // Necesario para botón -
              clearCart={clearCart}
            />
          }
        />

        {/* Páginas Informativas y Admin */}
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