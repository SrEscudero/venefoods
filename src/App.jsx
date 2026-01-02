import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

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
import ProtectedRoute from './components/ProtectedRoute'; // <--- ¡NO OLVIDES IMPORTAR ESTO!

function App() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("venefoods_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("venefoods_cart", JSON.stringify(cart));
  }, [cart]);

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const stock = product.stock || 0; 
      
      if (existingItem && stock > 0 && existingItem.quantity >= stock) {
         toast.error(`¡Solo quedan ${stock} unidades!`);
         return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success("Agregado al carrito");
  };

  const removeFromCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem?.quantity === 1) {
        return prevCart.filter((item) => item.id !== product.id);
      }
      return prevCart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const deleteFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.success("Producto eliminado");
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* Rutas Públicas */}
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

        <Route
          path="/product/:id"
          element={<ProductDetail cart={cart} addToCart={addToCart} />}
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
            />
          }
        />

        <Route path="/about" element={<About cart={cart} />} />
        <Route path="/contact" element={<Contact cart={cart} />} />
        <Route path="/curiosities" element={<Curiosities cart={cart} />} />
        
        {/* Login es público, Dashboard es privado */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* 🔒 ZONA SEGURA 🔒 */}
        <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
        
        <Route path="*" element={<NotFound cart={cart} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;