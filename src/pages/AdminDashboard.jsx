import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { 
    LayoutDashboard, Package, DollarSign, Search, Edit, Plus, Trash2, 
    LogOut, X, Save, TrendingUp, AlertCircle, ShoppingBag, 
    Clock, User, Phone, Store, Users, MessageCircle, Image as ImageIcon, Upload,
    Download, FileText, FileSpreadsheet
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

// Importamos nuestros nuevos helpers
import { exportToExcel, exportToCSV, exportToPDF, exportToTXT } from '../utils/exportHelper';
import TablePagination from '../components/TablePagination';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentBanner, setCurrentBanner] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Paginación (Estados)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Cantidad de filas por página

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [posModalOpen, setPosModalOpen] = useState(false);

  // Resetear página al cambiar de pestaña
  useEffect(() => { setCurrentPage(1); setSearchTerm(''); }, [activeTab]);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }
      await Promise.all([fetchProducts(), fetchOrders(), fetchBanner()]);
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

  const fetchBanner = async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'home_banner').single();
      if (data) setCurrentBanner(data.value);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/admin'); };

  // --- HANDLERS DE EXPORTACIÓN ---
  const handleExport = (type, format) => {
    let dataToExport = [];
    let fileName = `reporte_${type}`;
    let pdfColumns = [];

    if (type === 'ventas') {
        dataToExport = orders.map(o => ({
            ID: o.id,
            Fecha: new Date(o.created_at).toLocaleDateString(),
            Cliente: o.customer_name,
            Telefono: o.customer_phone || 'N/A',
            Total: `R$ ${o.total}`,
            Estado: o.status,
            Metodo: o.payment_method,
            Origen: o.origin
        }));
        pdfColumns = ['ID', 'Fecha', 'Cliente', 'Telefono', 'Total', 'Estado', 'Pago', 'Origen'];
    } else if (type === 'inventario') {
        dataToExport = products.map(p => ({
            ID: p.id,
            Producto: p.name,
            Categoria: p.category,
            Stock: p.stock,
            Costo: `R$ ${p.cost_price}`,
            Precio: `R$ ${p.price}`
        }));
        pdfColumns = ['ID', 'Producto', 'Categoria', 'Stock', 'Costo', 'Precio'];
    } else if (type === 'clientes') {
        dataToExport = stats.clientsList.map(c => ({
            Nombre: c.name,
            Telefono: c.phone,
            TotalGastado: `R$ ${c.totalSpent.toFixed(2)}`,
            Pedidos: c.ordersCount,
            UltimaCompra: new Date(c.lastOrder).toLocaleDateString()
        }));
        pdfColumns = ['Nombre', 'Telefono', 'Gastado', 'Pedidos', 'Ultima Compra'];
    }

    if (format === 'xlsx') exportToExcel(dataToExport, fileName);
    if (format === 'csv') exportToCSV(dataToExport, fileName);
    if (format === 'txt') exportToTXT(dataToExport, fileName);
    if (format === 'pdf') exportToPDF(`Reporte de ${type.toUpperCase()}`, pdfColumns, dataToExport, fileName);
    
    toast.success(`Reporte ${format.toUpperCase()} generado`);
  };

  // --- RESTO DE LÓGICA (Banners, Pedidos, Productos...) ---
  const handleUpdateBanner = async (e) => { /* ... Lógica existente ... */ 
      const file = e.target.files[0]; if (!file) return; const toastId = toast.loading("Subiendo imagen..."); try { const fileName = `banner-${Date.now()}`; const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file); if (uploadError) throw uploadError; const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName); const publicUrl = urlData.publicUrl; const { error: dbError } = await supabase.from('site_settings').upsert({ key: 'home_banner', value: publicUrl }); if (dbError) throw dbError; setCurrentBanner(publicUrl); toast.success("¡Banner actualizado!", { id: toastId }); } catch (error) { console.error(error); toast.error("Error al subir", { id: toastId }); }
  };

  const handleUpdateOrder = async (orderId, updates) => { /* ... Lógica existente ... */
      const originalOrder = orders.find(o => o.id === orderId); if (updates.status === 'cancelado' && originalOrder.status !== 'cancelado') { if (!window.confirm("⚠️ Al cancelar, se devolverá el stock. ¿Confirmar?")) return; const toastId = toast.loading("Restaurando inventario..."); try { for (const item of originalOrder.items) { const { data: currentProd } = await supabase.from('products').select('stock').eq('id', item.id).single(); if (currentProd) { await supabase.from('products').update({ stock: currentProd.stock + (item.quantity || 1) }).eq('id', item.id); } } toast.success("Stock restaurado", { id: toastId }); fetchProducts(); } catch (error) { toast.error("Error en stock", { id: toastId }); } } const { error } = await supabase.from('orders').update(updates).eq('id', orderId); if (!error) { toast.success(`Pedido ${updates.status}`); setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates } : o)); setOrderModalOpen(false); }
  };
  const handleDeleteOrder = async (orderId) => { /* ... Lógica existente ... */ if(!window.confirm("¿Borrar permanentemente?")) return; const { error } = await supabase.from('orders').delete().eq('id', orderId); if(!error) { toast.success("Eliminado"); setOrders(orders.filter(o => o.id !== orderId)); setOrderModalOpen(false); } };
  const handleDeleteProduct = async (id) => { /* ... Lógica existente ... */ if (!window.confirm("¿Eliminar producto?")) return; const { error } = await supabase.from('products').delete().eq('id', id); if (!error) { toast.success("Eliminado"); fetchProducts(); } };
  const handleSaveProduct = async (formData) => { /* ... Lógica existente ... */ const toastId = toast.loading("Guardando..."); try { if (editingProduct) await supabase.from('products').update(formData).eq('id', editingProduct.id); else await supabase.from('products').insert([formData]); toast.success("Guardado", { id: toastId }); setProductModalOpen(false); fetchProducts(); } catch (error) { toast.error("Error", { id: toastId }); } };

  // --- ESTADÍSTICAS Y DATA COMPUTADA ---
  const stats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelado');
    const totalRevenue = validOrders.reduce((acc, order) => acc + Number(order.total), 0);
    let totalCost = 0;
    validOrders.forEach(order => { if(order.items) order.items.forEach(item => { const p = products.find(prod => prod.id === item.id); if(p) totalCost += (p.cost_price || 0) * (item.quantity || 1); }); });
    const chartData = products.map(p => ({ name: p.name.substring(0, 10), stock: p.stock }));
    const lowStockProducts = products.filter(p => p.stock < 5);
    const clientsMap = {};
    validOrders.forEach(order => { const phone = order.customer_phone || 'S/T'; if (!clientsMap[phone]) { clientsMap[phone] = { name: order.customer_name, phone: phone, totalSpent: 0, ordersCount: 0, lastOrder: order.created_at }; } clientsMap[phone].totalSpent += Number(order.total); clientsMap[phone].ordersCount += 1; if (new Date(order.created_at) > new Date(clientsMap[phone].lastOrder)) { clientsMap[phone].lastOrder = order.created_at; } });
    const clientsList = Object.values(clientsMap).filter(c => c.phone !== 'N/A').sort((a, b) => b.totalSpent - a.totalSpent);
    return { totalRevenue, totalProfit: totalRevenue - totalCost, totalOrders: validOrders.length, chartData, lowStockProducts, clientsList };
  }, [products, orders]);

  // --- DATA PAGINADA ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterCategory === 'all' || p.category === filterCategory));
  
  // Helper para paginar cualquier array
  const paginate = (data) => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return data.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
        <Toaster position="top-right" />
        
        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 bg-slate-900 text-white fixed h-full flex flex-col z-20 shadow-xl">
            <div className="p-6 font-bold text-xl hidden md:block tracking-wider">Venefoods <span className="text-yellow-400">Admin</span></div>
            <div className="p-4 md:hidden text-center font-bold text-yellow-400">VF</div>
            <nav className="flex-1 mt-8 px-3 space-y-3">
                <SidebarBtn icon={<LayoutDashboard size={20} />} label="Panel General" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarBtn icon={<ShoppingBag size={20} />} label="Ventas" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
                <SidebarBtn icon={<Users size={20} />} label="Clientes VIP" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                <SidebarBtn icon={<Package size={20} />} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                <div className="border-t border-slate-700 my-2"></div>
                <SidebarBtn icon={<ImageIcon size={20} />} label="Configuración" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
            </nav>
            <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-3 rounded-xl w-full transition-all"><LogOut size={20}/> <span className="hidden md:block">Salir</span></button></div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto">
            
            {/* VISTA 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in space-y-8">
                    <header className="flex justify-between items-end">
                        <div><h1 className="text-3xl font-bold text-slate-800">Hola, Admin 👋</h1><p className="text-gray-500">Resumen de tu negocio.</p></div>
                        <button onClick={() => setPosModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex gap-2 items-center transition-transform active:scale-95"><Store size={20}/> Venta Rápida</button>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Ventas Totales" value={`R$ ${stats.totalRevenue.toFixed(2)}`} icon={<DollarSign className="text-white"/>} color="bg-blue-500" />
                        <StatCard title="Ganancia Neta" value={`R$ ${stats.totalProfit.toFixed(2)}`} icon={<TrendingUp className="text-white"/>} color="bg-green-500" />
                        <StatCard title="Clientes Únicos" value={stats.clientsList.length} icon={<Users className="text-white"/>} color="bg-purple-500" />
                    </div>
                    {/* Gráficos y Alertas (Igual que antes) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><h3 className="font-bold text-slate-700 mb-6">Niveles de Stock</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.chartData}><XAxis dataKey="name"/><Tooltip/><Bar dataKey="stock" fill="#8884d8" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div></div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-red-500"/> Reponer</h3><div className="space-y-3 overflow-y-auto max-h-60">{stats.lowStockProducts.length === 0 ? <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl">Todo bien.</p> : stats.lowStockProducts.map(p => (<div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100"><span className="text-sm font-bold text-red-800 truncate w-32">{p.name}</span><span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded-lg border border-red-200">{p.stock}</span></div>))}</div></div>
                    </div>
                </div>
            )}

            {/* VISTA 2: VENTAS (CON PAGINACIÓN Y EXPORTACIÓN) */}
            {activeTab === 'sales' && (
                 <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="text-green-600"/> Historial</h2>
                        <div className="flex gap-2">
                            <ExportMenu onExport={(format) => handleExport('ventas', format)} />
                            <button onClick={() => setPosModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex gap-2 shadow-lg"><Store size={16}/> POS</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {paginate(orders).map((order) => (
                            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => {setSelectedOrder(order); setOrderModalOpen(true)}}>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-slate-800">{order.customer_name}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.origin === 'fisica' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{order.origin}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'completado' ? 'bg-green-100 text-green-700' : order.status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex gap-4"><span className="flex items-center gap-1"><Clock size={12}/> {new Date(order.created_at).toLocaleDateString('pt-BR')}</span></div>
                                </div>
                                <div className="text-right"><span className="text-2xl font-bold text-slate-900">R$ {Number(order.total).toFixed(2)}</span></div>
                            </div>
                        ))}
                    </div>
                    {/* Componente de Paginación */}
                    <TablePagination currentPage={currentPage} totalItems={orders.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                 </div>
            )}

            {/* VISTA 3: CLIENTES VIP (CON PAGINACIÓN Y EXPORTACIÓN) */}
            {activeTab === 'customers' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-purple-600" /> Directorio Clientes</h2>
                        <ExportMenu onExport={(format) => handleExport('clientes', format)} />
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr><th className="p-5 text-xs font-bold text-gray-500 uppercase">Cliente</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Teléfono</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Total Gastado</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Pedidos</th><th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Contacto</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginate(stats.clientsList).map((client, idx) => {
                                    // Calculamos el rank real considerando la página
                                    const realIdx = (currentPage - 1) * itemsPerPage + idx;
                                    return (
                                    <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="p-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${realIdx < 3 ? 'bg-yellow-400 shadow-lg' : 'bg-gray-300'}`}>{realIdx + 1}</div><span className="font-bold text-slate-800">{client.name}</span></div></td>
                                        <td className="p-4 text-sm font-mono text-gray-600">{client.phone}</td>
                                        <td className="p-4 font-bold text-green-600">R$ {client.totalSpent.toFixed(2)}</td>
                                        <td className="p-4 text-sm"><span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{client.ordersCount}</span></td>
                                        <td className="p-4 text-right"><a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"><MessageCircle size={14}/> WhatsApp</a></td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination currentPage={currentPage} totalItems={stats.clientsList.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* VISTA 4: INVENTARIO (CON PAGINACIÓN Y EXPORTACIÓN) */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Package className="text-blue-600"/> Inventario</h2>
                        <div className="flex gap-3 items-center">
                            <ExportMenu onExport={(format) => handleExport('inventario', format)} />
                            <div className="flex gap-2">
                                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"/>
                                <button onClick={() => {setEditingProduct(null); setProductModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"><Plus size={18}/> Nuevo</button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-5 text-xs font-bold text-gray-500 uppercase">Producto</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Stock</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Costo</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Venta</th><th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th></tr></thead><tbody className="divide-y divide-gray-50">
                        {paginate(filteredProducts).map(p => (<tr key={p.id} className="hover:bg-blue-50/30 transition-colors"><td className="p-4 flex gap-3 items-center"><img src={p.image} className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-100"/><div><span className="font-bold text-slate-800 block">{p.name}</span><span className="text-[10px] text-gray-400 uppercase">{p.category}</span></div></td><td className="p-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td><td className="p-4 text-xs font-mono text-gray-500">R$ {p.cost_price || 0}</td><td className="p-4 font-mono font-bold text-slate-700">R$ {p.price.toFixed(2)}</td><td className="p-4 text-right"><button onClick={() => {setEditingProduct(p); setProductModalOpen(true)}} className="text-blue-600 mr-3"><Edit size={18}/></button><button onClick={() => handleDeleteProduct(p.id)} className="text-red-500"><Trash2 size={18}/></button></td></tr>))}
                    </tbody></table></div></div>
                    <TablePagination currentPage={currentPage} totalItems={filteredProducts.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                </div>
            )}

            {/* VISTA 5: CONFIGURACIÓN (BANNERS) */}
            {activeTab === 'config' && (
                <div className="animate-fade-in max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="text-pink-600"/> Personalización</h2>
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-slate-700 mb-4">Banner Principal (Inicio)</h3>
                        <div className="mb-6 relative group rounded-2xl overflow-hidden shadow-md bg-gray-100 h-64 md:h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                            {currentBanner ? <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" /> : <span className="text-gray-400 font-bold">Sin imagen</span>}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><ImageIcon size={48}/><span className="font-bold">Vista Previa</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-3 transition-transform active:scale-95"><Upload size={20} /> Subir Imagen <input type="file" hidden accept="image/*" onChange={handleUpdateBanner} /></label>
                            <span className="text-xs text-gray-400 font-medium">Recomendado: 1200x500px</span>
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* --- MODALES --- */}
        {posModalOpen && <POSModal products={products} onClose={() => setPosModalOpen(false)} onSuccess={() => { fetchOrders(); fetchProducts(); }} />}
        {orderModalOpen && selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setOrderModalOpen(false)} onUpdate={handleUpdateOrder} onDelete={handleDeleteOrder} />}
        {productModalOpen && <ProductFormModal product={editingProduct} onClose={() => setProductModalOpen(false)} onSave={handleSaveProduct} />}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function ExportMenu({ onExport }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm">
                <Download size={16}/> Exportar
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden" onMouseLeave={() => setOpen(false)}>
                    <button onClick={() => onExport('xlsx')} className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-medium flex items-center gap-2 text-green-700"><FileSpreadsheet size={16}/> Excel (.xlsx)</button>
                    <button onClick={() => onExport('csv')} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm font-medium flex items-center gap-2 text-blue-700"><FileText size={16}/> CSV</button>
                    <button onClick={() => onExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-medium flex items-center gap-2 text-red-700"><FileText size={16}/> PDF</button>
                    <button onClick={() => onExport('txt')} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium flex items-center gap-2 text-gray-700"><FileText size={16}/> Texto (.txt)</button>
                </div>
            )}
        </div>
    )
}

function SidebarBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>{icon} <span className="hidden md:block">{label}</span></button>; }
function StatCard({ title, value, icon, color }) { return <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>{icon}</div><div><p className="text-xs text-gray-400 font-bold uppercase">{title}</p><h3 className="text-3xl font-bold text-slate-800">{value}</h3></div></div>; }

// Modales POS, Pedidos y Productos (Mismo código de siempre, solo asegúrate que estén al final del archivo)
// ... (Aquí van POSModal, OrderDetailsModal, ProductFormModal que ya tenías en la versión anterior)
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
        if(existing) { if(existing.qty >= product.stock) return toast.error("Stock límite"); setCart(cart.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i)); } else setCart([...cart, {...product, qty: 1}]);
    };
    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
    const handleFinalize = async () => {
        if(cart.length === 0) return; setLoading(true);
        try {
            const { error: orderError } = await supabase.from('orders').insert([{ customer_name: 'Cliente Mostrador', customer_phone: 'N/A', address: 'Tienda Física', payment_method: paymentMethod, origin: 'fisica', status: 'completado', total: total, items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.qty, price: i.price })) }]);
            if(orderError) throw orderError;
            for (const item of cart) { const currentProduct = products.find(p => p.id === item.id); if(currentProduct) await supabase.from('products').update({ stock: currentProduct.stock - item.qty }).eq('id', item.id); }
            toast.success("Venta registrada"); onSuccess(); onClose();
        } catch (error) { toast.error("Error: " + error.message); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl">
                <div className="w-2/3 bg-gray-50 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-slate-800 flex gap-2"><Store/> Punto de Venta</h2><input autoFocus type="text" placeholder="Buscar..." className="bg-white border p-3 rounded-xl w-64 shadow-sm outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                    <div className="grid grid-cols-3 gap-4 overflow-y-auto content-start flex-1 pr-2">{filteredProducts.map(p => (<button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="bg-white p-4 rounded-xl border hover:border-blue-500 hover:shadow-md transition-all text-left group disabled:opacity-50 flex flex-col justify-between"><div><div className="flex justify-between items-start mb-2"><span className="font-bold text-slate-700 line-clamp-1 text-sm">{p.name}</span><span className={`text-[10px] font-bold px-2 rounded ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{p.stock}</span></div></div><div className="text-blue-600 font-bold text-lg mt-2">R$ {p.price.toFixed(2)}</div></button>))}</div>
                </div>
                <div className="w-1/3 bg-white p-6 border-l border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">Ticket</h3><button onClick={onClose}><X size={20}/></button></div>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">{cart.map(item => (<div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><div><p className="font-bold text-sm text-slate-700">{item.name}</p><p className="text-xs text-gray-500">{item.qty} x R$ {item.price.toFixed(2)}</p></div><div className="flex items-center gap-3"><span className="font-bold text-slate-800">R$ {(item.qty * item.price).toFixed(2)}</span><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div></div>))}</div>
                    <div className="border-t border-dashed border-gray-300 pt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2">{['efectivo', 'pix', 'tarjeta'].map(m => (<button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-lg text-xs font-bold uppercase border ${paymentMethod === m ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-200 text-gray-500'}`}>{m}</button>))}</div>
                        <div className="flex justify-between items-end"><span className="text-gray-500 font-bold">Total</span><span className="text-4xl font-black text-slate-900">R$ {total.toFixed(2)}</span></div>
                        <button onClick={handleFinalize} disabled={loading || cart.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg disabled:opacity-50">{loading ? '...' : 'COBRAR'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderDetailsModal({ order, onClose, onUpdate, onDelete }) {
    const [notes, setNotes] = useState(order.admin_notes || '');
    const [status, setStatus] = useState(order.status || 'pendiente');
    const handleSave = () => { onUpdate(order.id, { admin_notes: notes, status: status }); };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6">
                <div className="flex justify-between mb-6"><h2 className="text-xl font-bold flex gap-2"><User/> Cliente: {order.customer_name}</h2><button onClick={onClose}><X/></button></div>
                <div className="grid grid-cols-2 gap-4 mb-6"><div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400">Origen</p><p className="font-bold capitalize">{order.origin}</p></div><div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-gray-400">Pago</p><p className="font-bold capitalize">{order.payment_method}</p></div></div>
                <div className="bg-blue-50 p-4 rounded-xl mb-4"><label className="text-sm font-bold text-blue-800">Estado</label><div className="grid grid-cols-4 gap-2 mt-2">{['pendiente', 'preparando', 'completado', 'cancelado'].map(s => <button key={s} onClick={() => setStatus(s)} className={`py-1 text-xs rounded border ${status === s ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>{s}</button>)}</div></div>
                <div className="flex justify-between"><button onClick={() => onDelete(order.id)} className="text-red-500 font-bold">Eliminar</button><button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold">Guardar</button></div>
            </div>
        </div>
    )
}

function ProductFormModal({ product, onClose, onSave }) {
    const [formData, setFormData] = useState({ name: '', price: '', cost_price: '', stock: '', category: 'harinas', description: '', image: '', badge_text: '', badge_color: '' });
    const [uploading, setUploading] = useState(false);
    useEffect(() => { if (product) setFormData({ name: product.name, price: product.price, cost_price: product.cost_price || 0, stock: product.stock || 0, category: product.category, description: product.description || '', image: product.image || '', badge_text: product.badge_text || '', badge_color: product.badge_color || 'red' }); }, [product]);
    const handleImageUpload = async (e) => { try { setUploading(true); const file = e.target.files[0]; if(!file) return; const fileName = `${Math.random()}.${file.name.split('.').pop()}`; const {error} = await supabase.storage.from('images').upload(fileName, file); if(error) throw error; const {data} = supabase.storage.from('images').getPublicUrl(fileName); setFormData({...formData, image: data.publicUrl}); toast.success("Imagen ok"); } catch(e){toast.error("Error");} finally{setUploading(false);} };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between mb-6"><h2 className="text-xl font-bold">Gestión Producto</h2><button onClick={onClose}><X/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold">Nombre</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div><div><label className="text-xs font-bold">Categoría</label><select className="w-full border p-2 rounded-lg" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}><option value="harinas">Harinas</option><option value="quesos">Quesos</option><option value="dulces">Dulces</option><option value="bebidas">Bebidas</option><option value="despensa">Despensa</option></select></div></div>
                    <div className="grid grid-cols-3 gap-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100"><div><label className="font-bold text-sm text-yellow-800">Precio Venta</label><input required type="number" step="0.01" className="w-full border p-3 rounded-xl bg-white" value={formData.price} onChange={e=>setFormData({...formData, price:parseFloat(e.target.value)})}/></div><div><label className="font-bold text-sm text-yellow-800">Costo (Compra)</label><input type="number" step="0.01" className="w-full border p-3 rounded-xl bg-white" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price:parseFloat(e.target.value)})}/></div><div><label className="font-bold text-sm text-yellow-800">Stock Actual</label><input required type="number" className="w-full border p-3 rounded-xl bg-white" value={formData.stock} onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)})}/></div></div>
                    <div><label className="text-xs font-bold">Imagen URL</label><div className="flex gap-2"><input className="flex-1 border p-2 rounded-lg" value={formData.image} onChange={e=>setFormData({...formData, image:e.target.value})}/><label className="bg-blue-100 px-3 rounded-lg flex items-center cursor-pointer text-xs font-bold text-blue-700"><input type="file" hidden onChange={handleImageUpload}/>SUBIR</label></div></div>
                    <div><label className="font-bold text-sm">Descripción</label><textarea rows="2" className="w-full border p-3 rounded-xl bg-gray-50" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})}/></div>
                    <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Guardar</button></div>
                </form>
            </div>
        </div>
    );
}