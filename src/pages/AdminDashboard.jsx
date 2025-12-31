import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { 
    LayoutDashboard, Package, DollarSign, Search, Edit, Plus, Trash2, 
    LogOut, X, Save, Filter, TrendingUp, AlertCircle 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- COMPONENTE PRINCIPAL ---
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'inventory'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Estados para el Modal de Edición/Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Modo Crear

  // 1. CARGA DE DATOS E INICIO DE SESIÓN
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin');
        return;
      }
      fetchProducts();
    };
    checkSessionAndFetch();
  }, [navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) {
        toast.error('Error cargando productos');
    } else {
        setProducts(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  // 2. LÓGICA CRUD (Crear, Leer, Actualizar, Borrar)
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error("Error al eliminar");
    else {
        toast.success("Producto eliminado");
        fetchProducts();
    }
  };

  const handleSaveProduct = async (formData) => {
    const toastId = toast.loading("Guardando...");
    
    try {
        if (editingProduct) {
            // MODO EDICIÓN (UPDATE)
            const { error } = await supabase
                .from('products')
                .update(formData)
                .eq('id', editingProduct.id);
            if (error) throw error;
        } else {
            // MODO CREACIÓN (INSERT)
            const { error } = await supabase
                .from('products')
                .insert([formData]);
            if (error) throw error;
        }
        
        toast.success("¡Guardado con éxito!", { id: toastId });
        setIsModalOpen(false);
        fetchProducts();

    } catch (error) {
        console.error(error);
        toast.error("Error al guardar: " + error.message, { id: toastId });
    }
  };

  const openModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // 3. CÁLCULOS Y FILTROS (Lógica de Negocio)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  // Datos para los Gráficos
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, curr) => acc + (curr.price * 10), 0); // Asumiendo stock ficticio de 10 si no hay columna stock
    const productsByCategory = products.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {});
    
    const chartData = Object.keys(productsByCategory).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        cantidad: productsByCategory[key]
    }));

    return { totalInventoryValue, chartData };
  }, [products]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
        <Toaster position="top-right" />
        
        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 bg-slate-900 text-white fixed h-full flex flex-col z-20 shadow-xl">
            <div className="p-6 font-bold text-xl hidden md:block tracking-wider">
                Venefoods <span className="text-yellow-400">Admin</span>
            </div>
            <div className="p-4 md:hidden text-center font-bold text-yellow-400">VF</div>

            <nav className="flex-1 mt-8 px-3 space-y-3">
                <SidebarBtn 
                    icon={<LayoutDashboard size={20} />} 
                    label="Panel General" 
                    active={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                />
                <SidebarBtn 
                    icon={<Package size={20} />} 
                    label="Inventario" 
                    active={activeTab === 'inventory'} 
                    onClick={() => setActiveTab('inventory')} 
                />
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-3 rounded-xl w-full transition-all">
                    <LogOut size={20} /> <span className="hidden md:block">Salir</span>
                </button>
            </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto">
            
            {/* VISTA 1: DASHBOARD (Gráficos) */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in space-y-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800">Bienvenido, Admin 👋</h1>
                        <p className="text-gray-500">Aquí tienes el pulso de tu negocio hoy.</p>
                    </header>

                    {/* Tarjetas de Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Total Productos" 
                            value={products.length} 
                            icon={<Package className="text-white" />} 
                            color="bg-blue-500" 
                        />
                        <StatCard 
                            title="Valor Inventario (Est.)" 
                            value={`R$ ${stats.totalInventoryValue.toLocaleString()}`} 
                            icon={<DollarSign className="text-white" />} 
                            color="bg-green-500" 
                        />
                        <StatCard 
                            title="Categorías Activas" 
                            value={stats.chartData.length} 
                            icon={<TrendingUp className="text-white" />} 
                            color="bg-purple-500" 
                        />
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-slate-700 mb-6">Distribución por Categoría</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-slate-700 mb-6">Peso del Catálogo</h3>
                            <div className="h-64 flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="cantidad"
                                        >
                                            {stats.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA 2: INVENTARIO (Tabla Robusta) */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package size={24} className="text-blue-600"/> Inventario
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            {/* Filtro Categoría */}
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-3 text-gray-400" />
                                <select 
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer hover:bg-gray-100 transition"
                                >
                                    <option value="all">Todas las Categorías</option>
                                    <option value="harinas">Harinas</option>
                                    <option value="quesos">Quesos</option>
                                    <option value="dulces">Dulces</option>
                                    <option value="bebidas">Bebidas</option>
                                    <option value="despensa">Despensa</option>
                                </select>
                            </div>

                            {/* Buscador */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar producto..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                />
                            </div>

                            {/* Botón Crear */}
                            <button 
                                onClick={() => openModal()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} /> <span className="hidden md:inline">Nuevo Producto</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Etiqueta</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 p-1 flex items-center justify-center shadow-sm">
                                                        <img src={product.image} alt="" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 block">{product.name}</span>
                                                        <span className="text-xs text-gray-400 line-clamp-1 max-w-[150px]">{product.description}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize
                                                    ${product.category === 'harinas' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                    ${product.category === 'quesos' ? 'bg-blue-100 text-blue-700' : ''}
                                                    ${product.category === 'dulces' ? 'bg-pink-100 text-pink-700' : ''}
                                                    ${product.category === 'bebidas' ? 'bg-orange-100 text-orange-700' : ''}
                                                    ${product.category === 'despensa' ? 'bg-gray-100 text-gray-700' : ''}
                                                `}>
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-slate-700">
                                                R$ {product.price.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                {product.badge_text ? (
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border 
                                                        ${product.badge_color === 'red' ? 'border-red-200 text-red-600 bg-red-50' : 
                                                          product.badge_color === 'blue' ? 'border-blue-200 text-blue-600 bg-blue-50' : 
                                                          product.badge_color === 'orange' ? 'border-orange-200 text-orange-600 bg-orange-50' : 
                                                          'border-gray-200 text-gray-600'
                                                        }`}>
                                                        {product.badge_text}
                                                    </span>
                                                ) : <span className="text-gray-300 text-xs">-</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(product)} className="p-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm transition-colors" title="Editar">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-white border border-gray-200 text-red-500 hover:bg-red-50 rounded-lg shadow-sm transition-colors" title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search size={24} />
                                    </div>
                                    <p>No se encontraron productos con ese filtro.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* MODAL DE EDICIÓN / CREACIÓN */}
        {isModalOpen && (
            <ProductFormModal 
                product={editingProduct} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveProduct} 
            />
        )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function SidebarBtn({ icon, label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium
            ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}
        >
            {icon}
            <span className="hidden md:block">{label}</span>
        </button>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            </div>
        </div>
    );
}

// --- MODAL DE FORMULARIO (ROBUSTO) ---
function ProductFormModal({ product, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '', price: '', category: 'harinas', description: '', image: '', badge_text: '', badge_color: ''
    });
    const [uploading, setUploading] = useState(false); // Estado para saber si está subiendo

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description || '',
                image: product.image || '',
                badge_text: product.badge_text || '',
                badge_color: product.badge_color || 'red'
            });
        }
    }, [product]);

    // LÓGICA PARA SUBIR IMAGEN A SUPABASE
    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            // 1. Crear un nombre único para el archivo (ej: harina-12345.png)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Subir a Supabase Storage (bucket 'images')
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Obtener la URL pública para guardarla en la base de datos
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            
            // 4. Poner esa URL en el formulario automáticamente
            setFormData({ ...formData, image: data.publicUrl });
            toast.success("Imagen subida correctamente");

        } catch (error) {
            console.error(error);
            toast.error("Error subiendo imagen: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Modal */}
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {product ? <Edit size={20}/> : <Plus size={20}/>}
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-6">
                    
                    {/* Fila 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre del Producto</label>
                            <input 
                                required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Harina P.A.N."
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Precio (R$)</label>
                            <input 
                                required type="number" step="0.01" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00"
                                value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Fila 2: Categoría y GESTIÓN DE IMAGEN MEJORADA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Categoría</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="harinas">Harinas</option>
                                <option value="quesos">Quesos</option>
                                <option value="dulces">Dulces</option>
                                <option value="bebidas">Bebidas</option>
                                <option value="despensa">Despensa</option>
                            </select>
                        </div>

                        {/* SECCIÓN DE IMAGEN */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex justify-between">
                                Imagen del Producto
                                {uploading && <span className="text-blue-600 text-xs animate-pulse">Subiendo...</span>}
                            </label>
                            
                            <div className="flex gap-2">
                                {/* Opción 1: Input URL */}
                                <input 
                                    type="text" 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                                    placeholder="Pegar URL o subir ->"
                                    value={formData.image} 
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    disabled={uploading}
                                />
                                
                                {/* Opción 2: Botón Subir */}
                                <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl px-4 flex items-center justify-center transition-colors">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    <span className="text-xs font-bold">Subir PC</span>
                                </label>
                            </div>

                            {/* Previsualización */}
                            {formData.image && (
                                <div className="mt-2 p-2 border border-gray-100 rounded-lg bg-gray-50 flex items-center gap-3">
                                    <img src={formData.image} alt="Vista previa" className="w-10 h-10 object-contain bg-white rounded-md border" />
                                    <span className="text-xs text-gray-500 truncate flex-1">{formData.image}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Descripción</label>
                        <textarea 
                            rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Descripción atractiva del producto..."
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                    {/* Etiquetas */}
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 text-sm mb-3 flex items-center gap-2"><AlertCircle size={16}/> Etiquetas de Marketing (Opcional)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="text" placeholder="Texto (ej: OFERTA)" className="bg-white border border-yellow-200 rounded-lg p-2 text-sm"
                                value={formData.badge_text} onChange={e => setFormData({...formData, badge_text: e.target.value})}
                            />
                            <select 
                                className="bg-white border border-yellow-200 rounded-lg p-2 text-sm"
                                value={formData.badge_color} onChange={e => setFormData({...formData, badge_color: e.target.value})}
                            >
                                <option value="">Sin color</option>
                                <option value="red">Rojo (Oferta)</option>
                                <option value="blue">Azul (Nuevo)</option>
                                <option value="orange">Naranja (Popular)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancelar</button>
                        <button type="submit" disabled={uploading} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50">
                            <Save size={18} /> {uploading ? 'Subiendo...' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}