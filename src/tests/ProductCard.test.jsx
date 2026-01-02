import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../components/ProductCard';
import { BrowserRouter } from 'react-router-dom';

describe('Componente ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Queso Llanero',
    price: 45.50,
    image: 'queso.jpg',
    category: 'quesos',
    stock: 10,
    badge: { text: 'Oferta', color: 'red' }, 
    badge_text: 'Oferta',
    badge_color: 'red'
  };

  const mockAddToCart = vi.fn();

  it('Renderiza la información del producto correctamente', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} cart={[]} onAdd={mockAddToCart} />
      </BrowserRouter>
    );

    expect(screen.getByText('Queso Llanero')).toBeInTheDocument();
    
    // CORRECCIÓN: Usamos una expresión regular que acepta coma O punto
    // El reporte mostró que sale como "45.50" en el entorno de test
    expect(screen.getByText(/45[.,]50/)).toBeInTheDocument();
    
    expect(screen.getByText('Oferta')).toBeInTheDocument();
  });

  it('Llama a la función addToCart al hacer click en el botón', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} cart={[]} onAdd={mockAddToCart} />
      </BrowserRouter>
    );

    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('Muestra botón deshabilitado si no hay stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(
      <BrowserRouter>
        <ProductCard product={outOfStockProduct} cart={[]} onAdd={mockAddToCart} />
      </BrowserRouter>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Agotado/i)).toBeInTheDocument();
  });
});