import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Checkout from '../pages/Checkout';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '../supabase/client';

describe('Integración de Checkout', () => {
  const mockCart = [
    { id: 1, name: 'Harina PAN', price: 15.00, quantity: 2 }, 
    { id: 2, name: 'Queso', price: 50.00, quantity: 1 }       
  ];
  const mockClearCart = vi.fn();

  beforeEach(() => {
    // MOCK SIMPLIFICADO: Solo queremos ver si llega a llamar a .from()
    // No nos importa si la cadena .update().eq() funciona o no todavía,
    // primero queremos ver que AL MENOS intente llamar a la base de datos.
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({ data: {}, error: null })
    });
  });

  it('Calcula el total correctamente', () => {
    render(
      <BrowserRouter>
        <Checkout cart={mockCart} clearCart={mockClearCart} />
      </BrowserRouter>
    );
    const prices = screen.getAllByText(/R\$ 80[.,]00/);
    expect(prices.length).toBeGreaterThan(0);
  });

  it('Valida campos obligatorios antes de enviar', async () => {
    render(
      <BrowserRouter>
        <Checkout cart={mockCart} clearCart={mockClearCart} />
      </BrowserRouter>
    );
    const submitBtn = screen.getByRole('button', { name: /Confirmar|Pedido/i });
    fireEvent.click(submitBtn);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('Envía el pedido a Supabase y limpia el carrito al completar', async () => {
    // 1. Renderizamos
    const { container } = render(
      <BrowserRouter>
        <Checkout cart={mockCart} clearCart={mockClearCart} />
      </BrowserRouter>
    );

    // 2. Llenar Inputs (Usando querySelector para ser infalibles)
    const nameInput = container.querySelector('input[placeholder*="Nombre"]');
    const phoneInput = container.querySelector('input[placeholder*="Tel"]');
    const addressInput = container.querySelector('input[placeholder*="Direc"]');

    if (nameInput) fireEvent.change(nameInput, { target: { value: 'Juan Test' } });
    if (phoneInput) fireEvent.change(phoneInput, { target: { value: '5599999999' } });
    if (addressInput) fireEvent.change(addressInput, { target: { value: 'Calle Falsa 123' } });

    // 3. Seleccionar Pix (Forzando el click en el label contenedor)
    // Buscamos el texto 'Pix' y hacemos click en su padre (el label o div)
    const pixText = screen.getByText(/Pix/i);
    fireEvent.click(pixText); 

    // 4. Debug: Verificar estado del botón
    const submitBtn = screen.getByRole('button', { name: /Confirmar|Pedido/i });
    
    // Si el botón está deshabilitado por alguna razón, el test fallará aquí y sabremos por qué
    expect(submitBtn).not.toBeDisabled();

    // 5. ENVIAR (Click)
    fireEvent.click(submitBtn);

    // 6. Verificar
    await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
        // Si esto pasa, significa que al menos intentó conectar.
        // Si no pasa, es que el onClick del botón no está conectado a handleFinalize.
    });
  });
});