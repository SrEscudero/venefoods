import '@testing-library/jest-dom';
import { afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Limpieza automática
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// 1. Mock de MatchMedia (Para react-hot-toast)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 2. Mock de Supabase (Definido INLINE para evitar problemas de hoisting)
const mockFrom = vi.fn();

// Configuramos el comportamiento por defecto del mock
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnValue({ data: {}, error: null }),
  insert: vi.fn().mockResolvedValue({ error: null }), // Simula éxito al insertar
  update: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock('../supabase/client', () => ({
  supabase: {
    from: mockFrom, // Usamos la variable local
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://fake-url.com/img.png' } }),
      })),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: 'admin@test.com' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

// 3. Mock de Navegación
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    useParams: () => ({ id: '123' }),
  };
});

// 4. Mock de Recharts
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div className="recharts-mock">{children}</div>,
  };
});

// 5. Mock de Scroll
beforeAll(() => {
  window.scrollTo = vi.fn();
});