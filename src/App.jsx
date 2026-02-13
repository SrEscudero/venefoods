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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("venefoods_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("venefoods_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    let errorOccurred = false;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const stock = product.stock || 0;
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (stock > 0 && (currentQty + qty) > stock) {
        errorOccurred = true;
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: qty }];
      }
    });

    if (errorOccurred) {
      toast.error(`¡Stock insuficiente!`);
    } else {
      toast.success(`Agregado al carrito`);
    }
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
      {/* Toaster con estilo Apple - glassmorphism */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#1e293b',
            borderRadius: '9999px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />

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

        {/* Login */}
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