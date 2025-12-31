// src/data/products.js

export const CATEGORIAS = [
    { id: 'todo', name: 'Todo', icon: 'fi fi-ve', isFlag: true }, 
    { id: 'harinas', name: 'Harinas', icon: '🌽', isFlag: false },
    { id: 'quesos', name: 'Quesos', icon: '🧀', isFlag: false },
    { id: 'dulces', name: 'Dulces', icon: '🍫', isFlag: false },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤', isFlag: false },
    { id: 'despensa', name: 'Despensa', icon: '🥫', isFlag: false },
];
  
export const PRODUCTOS = [
    // --- PRODUCTOS ANTERIORES (Rutas corregidas) ---
    { 
      id: 1, 
      name: 'Harina P.A.N.', 
      price: 18.50, 
      category: 'harinas', 
      description: 'Harina de maíz blanco precocida. El alma de la arepa.',
      image: '/products/harina-pan.png',
      badge: { text: 'MÁS VENDIDO', color: 'orange' }
    },
   //{ 
   //  id: 2, 
   //  name: 'Queso Telita', 
   //  price: 45.00, 
   //  category: 'quesos', 
   //  description: 'Queso de mano venezolano, suave y jugoso.',
   //  image: 'https://tucacas.com/wp-content/uploads/2020/06/queso-telita.jpg' 
   //},
    { 
      id: 3, 
      name: 'Pirulin (Lata)', 
      price: 35.00, 
      category: 'dulces', 
      description: 'Barquillas rellenas de chocolate y avellanas.',
      image: '/products/pirulin.png' 
    },
    { 
      id: 4, 
      name: 'Maltín Polar', 
      price: 12.00, 
      category: 'bebidas', 
      description: 'La bebida de campeones. Malta venezolana original.',
      image: '/products/maltin.png' 
    },
    { 
      id: 5, 
      name: 'Cocosette', 
      price: 8.00, 
      category: 'dulces', 
      description: 'Galleta tipo wafer con crema de coco real.',
      image: '/products/cocosette.png' 
    },
    {
      id: 6,
      name: 'Diablitos Underwood',
      price: 22.00,
      category: 'despensa', 
      description: 'Jamón endiablado para untar. La mejor forma de comer jamón.',
      image: '/products/diablitos.png'
    },
    {
      id: 7,
      name: 'Rikesa Cheddar',
      price: 24.00,
      category: 'despensa',
      description: 'Queso fundido tipo Cheddar. Ideal para untar o cocinar.',
      image: '/products/rikesa.png',
      badge: { text: 'MÁS VENDIDO', color: 'orange' }
    },
    {
      id: 8,
      name: 'Flips (Chocolate)',
      price: 38.00,
      category: 'dulces',
      description: 'Cereal relleno de chocolate. El snack más adictivo.',
      image: '/products/flips.png',
      badge: { text: 'MÁS VENDIDO', color: 'orange' }
    },
    {
      id: 9,
      name: 'Chimó El Tigrito',
      price: 15.00,
      category: 'despensa',
      description: 'Extracto de tabaco tradicional venezolano.',
      image: '/products/chimo.png'
    },
    {
      id: 10,
      name: 'Adobo La Comadre',
      price: 18.00,
      category: 'despensa',
      description: 'Condimento completo con pimienta y orégano.',
      image: '/products/adobo.png'
    },
    {
      id: 11,
      name: 'Samba de Fresa',
      price: 6.00,
      category: 'dulces',
      description: 'Galleta cubierta de chocolate con relleno sabor a fresa.',
      image: '/products/samba.png',
      badge: { text: 'MÁS VENDIDO', color: 'orange' },
    },
    {
      id: 12,
      name: 'Rica Chicha',
      price: 20.00,
      category: 'bebidas',
      description: 'Mezcla en polvo para preparar chicha de arroz y pasta.',
      image: '/products/ricachicha.png'
    },
    {
      id: 13,
      name: 'Bon Bon Bum',
      price: 2.50,
      category: 'dulces',
      description: 'Chupeta con centro de chicle. Sabores variados.',
      image: '/products/bonbonbum.png'
    }
];