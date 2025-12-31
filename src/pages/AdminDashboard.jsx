import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { 
    LayoutDashboard, Package, DollarSign, Search, Edit, Plus, Trash2, 
    LogOut, X, Save, Filter, TrendingUp, AlertCircle, ShoppingBag, 
    CheckCircle, Clock, MapPin, CreditCard, Eye, User, Phone, FileText, 
    Store, Calculator, Minus
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // NUEVO: Modal de Punto de Venta (Caja Física)
  const [posModalOpen, setPosModalOpen] = useState(false);

  // 1. CARGA INICIAL
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }
      await Promise.all([fetchProducts(), fetchOrders()]);
      setLoading(false);
    };
    checkSessionAndFetch();
  }, [navigate]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true });
    if(data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if(data) setOrders(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  // --- LÓGICA PEDIDOS (CRM) ---
  const handleUpdateOrder = async (orderId, updates) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (!error) {
        toast.success("Pedido actualizado");
        setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates } : o));
        setOrderModalOpen(false);
    } else toast.error("Error al actualizar");
  };

  const handleDeleteOrder = async (orderId) => {
    if(!window.confirm("¿Borrar pedido?")) return;
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if(!error) {
        toast.success("Eliminado");
        setOrders(orders.filter(o => o.id !== orderId));
        setOrderModalOpen(false);
    }
  };

  // --- LÓGICA PRODUCTOS (CRUD + STOCK) ---
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { toast.success("Producto eliminado"); fetchProducts(); }
  };

  const handleSaveProduct = async (formData) => {
    const toastId = toast.loading("Guardando...");
    try {
        if (editingProduct) await supabase.from('products').update(formData).eq('id', editingProduct.id);
        else await supabase.from('products').insert([formData]);
        
        toast.success("¡Guardado!", { id: toastId });
        setProductModalOpen(false);
        fetchProducts();
    } catch (error) { toast.error("Error: " + error.message, { id: toastId }); }
  };

  // --- ESTADÍSTICAS INTELIGENTES (CON COSTOS Y STOCK) ---
  const stats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelado');
    
    // 1. Finanzas
    const totalRevenue = validOrders.reduce((acc, order) => acc + Number(order.total), 0);
    
    // Calculo aproximado de ganancia (Revenue - Costos estimados basados en productos actuales)
    // Nota: Para ser exactos habría que guardar el costo histórico en la orden, pero esto es una buena aproximación.
    let totalCost = 0;
    validOrders.forEach(order => {
        if(order.items) order.items.forEach(item => {
            const productRef = products.find(p => p.id === item.id);
            if(productRef) totalCost += (productRef.cost_price || 0) * (item.quantity || 1);
        });
    });
    const totalProfit = totalRevenue - totalCost;

    // 2. Gráfico Inventario
    const chartData = products.map(p => ({ name: p.name.substring(0, 10), stock: p.stock }));

    // 3. Stock Bajo
    const lowStockProducts = products.filter(p => p.stock < 5);

    return { totalRevenue, totalProfit, totalOrders: validOrders.length, chartData, lowStockProducts };
  }, [products, orders]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterCategory === 'all' || p.category === filterCategory));

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
        <Toaster position="top-right" />
        
        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 bg-slate-900 text-white fixed h-full flex flex-col z-20 shadow-xl">
            <div className="p-6 font-bold text-xl hidden md:block tracking-wider">Venefoods <span className="text-yellow-400">Admin</span></div>
            <div className="p-4 md:hidden text-center font-bold text-yellow-400">VF</div>
            <nav className="flex-1 mt-8 px-3 space-y-3">
                <SidebarBtn icon={<LayoutDashboard size={20} />} label="Panel General" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarBtn icon={<ShoppingBag size={20} />} label="Ventas Web / Física" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
                <SidebarBtn icon={<Package size={20} />} label="Inventario y Costos" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            </nav>
            <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-3 rounded-xl w-full transition-all"><LogOut size={20}/> <span className="hidden md:block">Salir</span></button></div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto">
            
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in space-y-8">
                    <header className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Bienvenido, Admin 👋</h1>
                            <p className="text-gray-500">Resumen financiero y de stock.</p>
                        </div>
                        <button onClick={() => setPosModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-green-600/20 flex items-center gap-2 transition-transform active:scale-95">
                            <Store size={20}/> Nueva Venta Física
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Ventas Totales" value={`R$ ${stats.totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-white"/>} color="bg-blue-500" />
                        <StatCard title="Ganancia Neta (Est.)" value={`R$ ${stats.totalProfit.toFixed(2)}`} icon={<TrendingUp className="text-white"/>} color="bg-green-500" />
                        <StatCard title="Alerta Stock Bajo" value={stats.lowStockProducts.length} icon={<AlertCircle className="text-white"/>} color={stats.lowStockProducts.length > 0 ? "bg-red-500" : "bg-gray-400"} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-slate-700 mb-6">Niveles de Stock</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData}><XAxis dataKey="name"/><Tooltip/><Bar dataKey="stock" fill="#8884d8" radius={[4, 4, 0, 0]}/></BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-red-500"/> Reponer Urgente</h3>
                            <div className="space-y-3 overflow-y-auto max-h-60">
                                {stats.lowStockProducts.length === 0 ? (
                                    <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl">Todo el inventario está saludable.</p>
                                ) : (
                                    stats.lowStockProducts.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                                            <span className="text-sm font-bold text-red-800 truncate w-32">{p.name}</span>
                                            <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded-lg border border-red-200">{p.stock} unid.</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. VENTAS (WEB + FÍSICAS) */}
            {activeTab === 'sales' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="text-green-600"/> Historial de Ventas</h2>
                        <button onClick={() => setPosModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex gap-2"><Store size={16}/> Venta Manual</button>
                    </div>

                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between hover:border-blue-300 transition-colors cursor-pointer" onClick={() => {setSelectedOrder(order); setOrderModalOpen(true)}}>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-slate-800">{order.customer_name}</span>
                                        {order.origin === 'fisica' ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Store size={10}/> Tienda Física</span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><ShoppingCartIcon size={10}/> Web</span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'completado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex gap-4">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                        {order.customer_phone && <span className="flex items-center gap-1"><Phone size={12}/> {order.customer_phone}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-slate-900">R$ {Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {/* 3. INVENTARIO (CON STOCK Y COSTOS) */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package size={24} className="text-blue-600"/> Inventario</h2>
                        <div className="flex gap-3">
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                            <button onClick={() => {setEditingProduct(null); setProductModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"><Plus size={18}/> Nuevo</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase">Producto</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase">Stock</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase">Costo</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase">Venta</th>
                                        <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 flex gap-3 items-center">
                                                <img src={p.image} className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-100"/>
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{p.name}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">{p.category}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                                                    {p.stock} unid.
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-mono text-gray-500">R$ {p.cost_price || 0}</td>
                                            <td className="p-4 font-mono font-bold text-slate-700">R$ {p.price.toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => {setEditingProduct(p); setProductModalOpen(true)}} className="text-blue-600 mr-3"><Edit size={18}/></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* --- MODALES --- */}
        {/* 1. POS (CAJA REGISTRADORA) */}
        {posModalOpen && (
            <POSModal 
                products={products} 
                onClose={() => setPosModalOpen(false)} 
                onSuccess={() => { fetchOrders(); fetchProducts(); }} // Recarga productos para ver stock actualizado
            />
        )}

        {/* 2. PEDIDO DETALLE */}
        {orderModalOpen && selectedOrder && (
            <OrderDetailsModal order={selectedOrder} onClose={() => setOrderModalOpen(false)} onUpdate={handleUpdateOrder} onDelete={handleDeleteOrder} />
        )}

        {/* 3. PRODUCTO FORM */}
        {productModalOpen && (
            <ProductFormModal product={editingProduct} onClose={() => setProductModalOpen(false)} onSave={handleSaveProduct} />
        )}
    </div>
  );
}

// --- SUBCOMPONENTES ---
function SidebarBtn({ icon, label, active, onClick }) {
    return <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{icon} <span className="hidden md:block">{label}</span></button>;
}
function StatCard({ title, value, icon, color }) {
    return <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>{icon}</div><div><p className="text-xs text-gray-400 font-bold uppercase">{title}</p><h3 className="text-3xl font-bold text-slate-800">{value}</h3></div></div>;
}
const ShoppingCartIcon = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;

// --- 4. NUEVO: MODAL POS (CAJA FÍSICA) ---
function POSModal({ products, onClose, onSuccess }) {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [loading, setLoading] = useState(false);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const addToCart = (product) => {
        if(product.stock <= 0) return toast.error("Sin stock");
        const existing = cart.find(i => i.id === product.id);
        if(existing) {
            if(existing.qty >= product.stock) return toast.error("No hay más stock");
            setCart(cart.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i));
        } else {
            setCart([...cart, {...product, qty: 1}]);
        }
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const handleFinalize = async () => {
        if(cart.length === 0) return;
        setLoading(true);
        try {
            // 1. Guardar la orden
            const { error: orderError } = await supabase.from('orders').insert([{
                customer_name: 'Cliente Mostrador',
                customer_phone: 'N/A',
                address: 'Tienda Física',
                payment_method: paymentMethod,
                origin: 'fisica',
                status: 'completado',
                total: total,
                items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.qty, price: i.price }))
            }]);
            if(orderError) throw orderError;

            // 2. Descontar Stock (Uno por uno)
            for (const item of cart) {
                const currentProduct = products.find(p => p.id === item.id);
                if(currentProduct) {
                    await supabase.from('products')
                        .update({ stock: currentProduct.stock - item.qty })
                        .eq('id', item.id);
                }
            }

            toast.success("Venta registrada y stock actualizado");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl">
                {/* Lado Izquierdo: Productos */}
                <div className="w-2/3 bg-gray-50 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex gap-2"><Store/> Punto de Venta</h2>
                        <input autoFocus type="text" placeholder="Buscar producto..." className="bg-white border p-3 rounded-xl w-64 shadow-sm outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="grid grid-cols-3 gap-4 overflow-y-auto content-start flex-1 pr-2">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="bg-white p-4 rounded-xl border hover:border-blue-500 hover:shadow-md transition-all text-left group disabled:opacity-50">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-700 line-clamp-1">{p.name}</span>
                                    <span className={`text-[10px] font-bold px-2 rounded ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{p.stock}</span>
                                </div>
                                <div className="text-blue-600 font-bold text-lg">R$ {p.price.toFixed(2)}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lado Derecho: Ticket */}
                <div className="w-1/3 bg-white p-6 border-l border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Ticket de Venta</h3>
                        <button onClick={onClose}><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                        {cart.length === 0 ? <p className="text-center text-gray-400 mt-10">Escanea o selecciona productos</p> : 
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.qty} x R$ {item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800">R$ {(item.qty * item.price).toFixed(2)}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div className="border-t border-dashed border-gray-300 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {['efectivo', 'pix', 'tarjeta'].map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-lg text-xs font-bold uppercase border ${paymentMethod === m ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-200 text-gray-500'}`}>{m}</button>
                            ))}
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500 font-bold">Total a Cobrar</span>
                            <span className="text-4xl font-black text-slate-900">R$ {total.toFixed(2)}</span>
                        </div>
                        <button onClick={handleFinalize} disabled={loading || cart.length === 0} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg shadow-green-500/30 transition-transform active:scale-95 disabled:opacity-50">
                            {loading ? 'Procesando...' : 'CONFIRMAR VENTA'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MODAL DETALLE PEDIDO ---
function OrderDetailsModal({ order, onClose, onUpdate, onDelete }) {
    const [notes, setNotes] = useState(order.admin_notes || '');
    const [status, setStatus] = useState(order.status || 'pendiente');
    const handleSave = () => { onUpdate(order.id, { admin_notes: notes, status: status }); };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6">
                <div className="flex justify-between mb-6">
                    <h2 className="text-xl font-bold flex gap-2"><User/> Cliente: {order.customer_name}</h2>
                    <button onClick={onClose}><X/></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400">Origen</p><p className="font-bold capitalize">{order.origin}</p></div>
                    <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400">Pago</p><p className="font-bold capitalize">{order.payment_method}</p></div>
                </div>
                {/* ... Resto del modal igual que antes ... */}
                <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <label className="text-sm font-bold text-blue-800">Estado</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {['pendiente', 'preparando', 'completado', 'cancelado'].map(s => <button key={s} onClick={() => setStatus(s)} className={`py-1 text-xs rounded border ${status === s ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>{s}</button>)}
                    </div>
                </div>
                <div className="flex justify-between">
                    <button onClick={() => onDelete(order.id)} className="text-red-500 font-bold">Eliminar</button>
                    <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold">Guardar</button>
                </div>
            </div>
        </div>
    )
}

// --- MODAL PRODUCTO (CON STOCK Y COSTO) ---
function ProductFormModal({ product, onClose, onSave }) {
    const [formData, setFormData] = useState({ 
        name: '', price: '', cost_price: '', stock: '', category: 'harinas', description: '', image: '', badge_text: '', badge_color: '' 
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (product) setFormData({
            name: product.name, price: product.price, cost_price: product.cost_price || 0, stock: product.stock || 0,
            category: product.category, description: product.description || '', image: product.image || '',
            badge_text: product.badge_text || '', badge_color: product.badge_color || 'red'
        });
    }, [product]);

    const handleImageUpload = async (e) => { /* ... Logica de subida igual ... */ 
        try { setUploading(true); const file = e.target.files[0]; if(!file) return; const fileName = `${Math.random()}.${file.name.split('.').pop()}`; const {error} = await supabase.storage.from('images').upload(fileName, file); if(error) throw error; const {data} = supabase.storage.from('images').getPublicUrl(fileName); setFormData({...formData, image: data.publicUrl}); toast.success("Imagen ok"); } catch(e){toast.error("Error");} finally{setUploading(false);}
    };
    
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between mb-6"><h2 className="text-xl font-bold">Gestión Producto</h2><button onClick={onClose}><X/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold">Nombre</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                        <div><label className="text-xs font-bold">Categoría</label><select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}><option value="harinas">Harinas</option><option value="quesos">Quesos</option><option value="dulces">Dulces</option><option value="bebidas">Bebidas</option><option value="despensa">Despensa</option></select></div>
                    </div>
                    {/* NUEVA FILA DE STOCK Y COSTOS */}
                    <div className="grid grid-cols-3 gap-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                        <div><label className="text-xs font-bold text-yellow-800">Precio Venta</label><input required type="number" step="0.01" className="w-full border p-2 rounded-lg" value={formData.price} onChange={e=>setFormData({...formData, price:parseFloat(e.target.value)})}/></div>
                        <div><label className="text-xs font-bold text-yellow-800">Costo (Compra)</label><input type="number" step="0.01" className="w-full border p-2 rounded-lg" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price:parseFloat(e.target.value)})}/></div>
                        <div><label className="text-xs font-bold text-yellow-800">Stock Actual</label><input required type="number" className="w-full border p-2 rounded-lg" value={formData.stock} onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)})}/></div>
                    </div>
                    <div><label className="text-xs font-bold">Imagen URL</label><div className="flex gap-2"><input className="flex-1 border p-2 rounded-lg" value={formData.image} onChange={e=>setFormData({...formData, image:e.target.value})}/><label className="bg-blue-100 px-3 rounded-lg flex items-center cursor-pointer text-xs font-bold text-blue-700"><input type="file" hidden onChange={handleImageUpload}/>SUBIR</label></div></div>
                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}