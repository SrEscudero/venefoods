import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Search,
  Edit,
  Plus,
  Trash2,
  LogOut,
  X,
  Save,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  Clock,
  User,
  Phone,
  Store,
  Users,
  MessageCircle,
  Image as ImageIcon,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  Settings,
  Truck,
  CreditCard,
  Megaphone,
  Lock,
  Unlock,
  Eye,
  Filter,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  exportToTXT,
  generateOrderReceipt,
} from "../utils/exportHelper";
import TablePagination from "../components/TablePagination";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuración Global
  const [config, setConfig] = useState({
    home_banner: "",
    whatsapp_number: "",
    pix_key: "",
    shipping_min_value: "100", // Valor por defecto
    top_bar_text: "🚀 Envío GRATIS en Passo Fundo por compras superiores a", // Texto por defecto
    top_bar_active: "true",
    store_status: "open",
    store_closed_message: "",
  });

  // Filtros y Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("todos");

  // Modales
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [clientHistoryModalOpen, setClientHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab, orderStatusFilter]);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }
      await Promise.all([fetchProducts(), fetchOrders(), fetchSettings()]);
      setLoading(false);
    };
    checkSessionAndFetch();
  }, [navigate]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const newConfig = { ...config };
      data.forEach((item) => (newConfig[item.key] = item.value));
      setConfig(newConfig);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  // --- LÓGICA DE ACTUALIZACIONES ---
  const handleUpdateOrder = async (orderId, updates) => {
    const originalOrder = orders.find((o) => o.id === orderId);
    if (
      updates.status === "cancelado" &&
      originalOrder.status !== "cancelado"
    ) {
      if (!window.confirm("⚠️ Al cancelar, se devolverá el stock. ¿Confirmar?"))
        return;
      const toastId = toast.loading("Restaurando inventario...");
      try {
        for (const item of originalOrder.items) {
          const { data: currentProd } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.id)
            .single();
          if (currentProd) {
            await supabase
              .from("products")
              .update({ stock: currentProd.stock + (item.quantity || 1) })
              .eq("id", item.id);
          }
        }
        toast.success("Stock restaurado", { id: toastId });
        fetchProducts();
      } catch (error) {
        toast.error("Error en stock", { id: toastId });
      }
    }
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);
    if (!error) {
      toast.success(`Pedido ${updates.status}`);
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );
      setOrderModalOpen(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "⚠️ ¿Estás seguro? Si borras el pedido, desaparecerá del historial del cliente.\n\nMejor usa la opción 'CANCELAR' para mantener el registro."
      )
    )
      return;
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (!error) {
      toast.success("Eliminado permanentemente");
      setOrders(orders.filter((o) => o.id !== orderId));
      setOrderModalOpen(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      toast.success("Eliminado");
      fetchProducts();
    }
  };

  const handleSaveProduct = async (formData) => {
    const toastId = toast.loading("Guardando...");
    try {
      if (editingProduct)
        await supabase
          .from("products")
          .update(formData)
          .eq("id", editingProduct.id);
      else await supabase.from("products").insert([formData]);
      toast.success("Guardado", { id: toastId });
      setProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error("Error", { id: toastId });
    }
  };

  const handleSaveConfig = async (key, value) => {
    try {
      await supabase
        .from("site_settings")
        .upsert({ key, value: String(value) });
      setConfig((prev) => ({ ...prev, [key]: String(value) }));
      toast.success("Guardado");
    } catch (error) {
      toast.error("Error");
    }
  };

  const handleUpdateBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading("Subiendo imagen...");
    try {
      const fileName = `banner-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);
      await handleSaveConfig("home_banner", urlData.publicUrl);
      toast.success("Banner actualizado!", { id: toastId });
    } catch (error) {
      toast.error("Error al subir", { id: toastId });
    }
  };

  const handleExport = (type, format) => {
    let dataToExport = [];
    let fileName = `reporte_${type}`;
    let pdfColumns = [];

    if (type === "ventas") {
      dataToExport = orders.map((o) => ({
        ID: o.id,
        Fecha: new Date(o.created_at).toLocaleDateString(),
        Cliente: o.customer_name,
        Total: `R$ ${o.total}`,
        Estado: o.status,
      }));
      pdfColumns = ["ID", "Fecha", "Cliente", "Total", "Estado"];
    } else if (type === "clientes") {
      dataToExport = stats.clientsList.map((c) => ({
        Nombre: c.name,
        Telefono: c.phone,
        Total: `R$ ${c.totalSpent.toFixed(2)}`,
        Pedidos: c.ordersCount,
      }));
      pdfColumns = ["Nombre", "Telefono", "Total", "Pedidos"];
    } else if (type === "inventario") {
      dataToExport = products.map((p) => ({
        ID: p.id,
        Producto: p.name,
        Stock: p.stock,
        Precio: `R$ ${p.price}`,
      }));
      pdfColumns = ["ID", "Producto", "Stock", "Precio"];
    }

    if (format === "xlsx") exportToExcel(dataToExport, fileName);
    if (format === "csv") exportToCSV(dataToExport, fileName);
    if (format === "txt") exportToTXT(dataToExport, fileName);
    if (format === "pdf")
      exportToPDF(`Reporte ${type}`, pdfColumns, dataToExport, fileName);

    toast.success(`Reporte ${format.toUpperCase()} generado`);
  };

  // --- ESTADÍSTICAS INTELIGENTES Y CLIENTES ---
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelado");
    const totalRevenue = validOrders.reduce(
      (acc, order) => acc + Number(order.total),
      0
    );

    // Generar Lista de Clientes Únicos basada en el historial
    const clientsMap = {};
    orders.forEach((order) => {
      const phone = order.customer_phone
        ? order.customer_phone.replace(/\D/g, "")
        : "S/T";
      const key = phone === "S/T" ? `ST-${order.id}` : phone;

      if (!clientsMap[key]) {
        clientsMap[key] = {
          id: key,
          name: order.customer_name,
          phone: order.customer_phone || "Sin teléfono",
          totalSpent: 0,
          ordersCount: 0,
          lastOrder: order.created_at,
          history: [],
        };
      }

      if (order.status !== "cancelado") {
        clientsMap[key].totalSpent += Number(order.total);
        clientsMap[key].ordersCount += 1;
      }
      clientsMap[key].history.push(order);

      if (new Date(order.created_at) > new Date(clientsMap[key].lastOrder)) {
        clientsMap[key].lastOrder = order.created_at;
      }
    });

    const clientsList = Object.values(clientsMap)
      .filter((c) => !c.id.startsWith("ST-"))
      .map((client) => ({
        ...client,
        isVip: client.ordersCount >= 3 || client.totalSpent >= 200,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const chartData = products.map((p) => ({
      name: p.name.substring(0, 10),
      stock: p.stock,
    }));
    const lowStockProducts = products.filter((p) => p.stock < 5);

    return {
      totalRevenue,
      totalOrders: validOrders.length,
      chartData,
      lowStockProducts,
      clientsList,
    };
  }, [products, orders]);

  // Filtrado de Pedidos
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter === "todos") return true;
    return order.status === orderStatusFilter;
  });

  const paginate = (data) =>
    data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      <Toaster position="top-right" />

      <aside className="w-20 md:w-64 bg-slate-900 text-white fixed h-full flex flex-col z-20 shadow-xl">
        <div className="p-6 font-bold text-xl hidden md:block tracking-wider">
          Venefoods <span className="text-yellow-400">Admin</span>
        </div>
        <nav className="flex-1 mt-8 px-3 space-y-3">
          <SidebarBtn
            icon={<LayoutDashboard size={20} />}
            label="Panel General"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarBtn
            icon={<ShoppingBag size={20} />}
            label="Ventas"
            active={activeTab === "sales"}
            onClick={() => setActiveTab("sales")}
          />
          <SidebarBtn
            icon={<Users size={20} />}
            label="Clientes"
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
          />
          <SidebarBtn
            icon={<Package size={20} />}
            label="Inventario"
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
          />
          <div className="border-t border-slate-700 my-2"></div>
          <SidebarBtn
            icon={<Settings size={20} />}
            label="Configuración"
            active={activeTab === "config"}
            onClick={() => setActiveTab("config")}
          />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-3 rounded-xl w-full transition-all"
          >
            <LogOut size={20} /> <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {/* VISTA 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Hola, Admin 👋
                </h1>
                <p className="text-gray-500">Resumen de tu negocio.</p>
              </div>
              <button
                onClick={() => setPosModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex gap-2 items-center transition-transform active:scale-95"
              >
                <Store size={20} /> Venta Rápida
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Ventas Totales"
                value={`R$ ${stats.totalRevenue.toFixed(2)}`}
                icon={<DollarSign className="text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Pedidos"
                value={stats.totalOrders}
                icon={<ShoppingBag className="text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Clientes VIP"
                value={stats.clientsList.filter((c) => c.isVip).length}
                icon={<Users className="text-white" />}
                color="bg-purple-500"
              />
            </div>
            <div className="bg-white p-6 rounded-3xl h-64 shadow-sm border border-gray-100">
              <ResponsiveContainer>
                <BarChart data={stats.chartData}>
                  <XAxis dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VISTA 2: VENTAS */}
        {activeTab === "sales" && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="text-green-600" /> Gestión de Ventas
              </h2>
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
                {[
                  { id: "todos", label: "Todos", icon: <Filter size={14} /> },
                  {
                    id: "pendiente",
                    label: "Pendientes",
                    icon: <Clock3 size={14} />,
                  },
                  {
                    id: "preparando",
                    label: "En Proceso",
                    icon: <Package size={14} />,
                  },
                  {
                    id: "completado",
                    label: "Listos",
                    icon: <CheckCircle size={14} />,
                  },
                  {
                    id: "cancelado",
                    label: "Cancelados",
                    icon: <XCircle size={14} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                      orderStatusFilter === tab.id
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                  <ShoppingBag size={40} className="mx-auto mb-2 opacity-20" />{" "}
                  No hay pedidos en esta categoría
                </div>
              ) : (
                paginate(filteredOrders).map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedOrder(order);
                      setOrderModalOpen(true);
                    }}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                          #{order.id} - {order.customer_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-4">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {new Date(order.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck size={12} /> {order.origin}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold ${
                          order.status === "cancelado"
                            ? "text-gray-400 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        R$ {Number(order.total).toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-400 uppercase font-bold">
                        {order.payment_method}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* VISTA 3: CLIENTES */}
        {activeTab === "customers" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-purple-600" /> Cartera de Clientes
              </h2>
              <ExportMenu
                onExport={(format) => handleExport("clientes", format)}
              />
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                      Teléfono
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                      Histórico
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                      Nivel
                    </th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginate(stats.clientsList).map((client, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              client.isVip
                                ? "bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg"
                                : "bg-gray-300"
                            }`}
                          >
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {client.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              Última:{" "}
                              {new Date(client.lastOrder).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-600">
                        {client.phone}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="font-bold text-green-600 block">
                            R$ {client.totalSpent.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {client.ordersCount} pedidos
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {client.isVip ? (
                          <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-yellow-200">
                            VIP 👑
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setClientHistoryModalOpen(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Ver Historial"
                          >
                            <Eye size={16} />
                          </button>
                          <a
                            href={`https://wa.me/${client.phone.replace(
                              /\D/g,
                              ""
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <MessageCircle size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={stats.clientsList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* VISTA 4: INVENTARIO */}
        {activeTab === "inventory" && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-blue-600" /> Inventario
              </h2>
              <div className="flex gap-3 items-center">
                <ExportMenu
                  onExport={(format) => handleExport("inventario", format)}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
                  >
                    <Plus size={18} /> Nuevo
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="p-5 text-xs font-bold text-gray-500 uppercase">
                        Precio
                      </th>
                      <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products
                      .filter((p) =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="p-4 flex gap-3 items-center">
                            <img
                              src={p.image}
                              className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-100"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-gray-400 uppercase">
                                {p.category}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                p.stock < 5
                                  ? "bg-red-100 text-red-700 animate-pulse"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">
                            R$ {p.price.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductModalOpen(true);
                              }}
                              className="text-blue-600 mr-3"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-500"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 5: CONFIGURACIÓN */}
        {activeTab === "config" && (
          <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Settings className="text-gray-600" /> Configuración de la Tienda
            </h2>

            {/* PANEL DE ESTADO TIENDA */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div
                className={`absolute top-0 right-0 p-4 ${
                  config.store_status === "open"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                } rounded-bl-3xl font-bold uppercase text-xs tracking-wider`}
              >
                {config.store_status === "open"
                  ? "Tienda Online"
                  : "Tienda Cerrada"}
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <Store size={20} /> Estado Operativo
              </h3>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">
                    Controla si los clientes pueden realizar pedidos.
                  </p>
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl inline-flex">
                    <button
                      onClick={() => handleSaveConfig("store_status", "open")}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                        config.store_status === "open"
                          ? "bg-white text-green-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Unlock size={16} /> ABIERTA
                    </button>
                    <button
                      onClick={() => handleSaveConfig("store_status", "closed")}
                      className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                        config.store_status === "closed"
                          ? "bg-white text-red-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Lock size={16} /> CERRADA
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Mensaje de Cierre
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      value={config.store_closed_message}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          store_closed_message: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl text-sm"
                      placeholder="Ej: Volvemos el Lunes a las 8am"
                    />
                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "store_closed_message",
                          config.store_closed_message
                        )
                      }
                      className="bg-slate-800 text-white p-3 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* PANEL BANNER */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <ImageIcon size={20} /> Portada Web
                </h3>
                <div className="mb-4 relative group rounded-2xl overflow-hidden shadow-md bg-gray-100 h-48 flex items-center justify-center border-2 border-dashed border-gray-300">
                  {config.home_banner ? (
                    <img
                      src={config.home_banner}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 font-bold">Sin imagen</span>
                  )}
                </div>
                <label className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                  <Upload size={18} /> Subir Nueva Imagen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleUpdateBanner}
                  />
                </label>
              </div>

              {/* PANEL BARRA DE ANUNCIOS (RESTAURADO) */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Megaphone size={20} className="text-pink-500" /> Barra de
                  Anuncios
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Texto del Anuncio
                    </label>
                    <input
                      value={config.top_bar_text}
                      onChange={(e) =>
                        setConfig({ ...config, top_bar_text: e.target.value })
                      }
                      className="w-full border p-3 rounded-xl mt-1 bg-gray-50"
                      placeholder="Ej: 🚀 Envío GRATIS en Passo Fundo..."
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">
                      Mostrar Barra
                    </span>
                    <input
                      type="checkbox"
                      checked={config.top_bar_active === "true"}
                      onChange={(e) => {
                        const newVal = e.target.checked ? "true" : "false";
                        setConfig({ ...config, top_bar_active: newVal });
                        handleSaveConfig("top_bar_active", newVal);
                      }}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveConfig("top_bar_text", config.top_bar_text)
                    }
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-2"
                  >
                    Guardar Texto
                  </button>
                </div>
              </div>
            </div>

            {/* PANEL DATOS OPERATIVOS */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Store size={20} /> Datos Operativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={config.whatsapp_number}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          whatsapp_number: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl bg-gray-50"
                    />
                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "whatsapp_number",
                          config.whatsapp_number
                        )
                      }
                      className="bg-green-100 text-green-700 p-3 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Envío Gratis Mínimo (R$)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={config.shipping_min_value}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          shipping_min_value: e.target.value,
                        })
                      }
                      className="w-full border p-3 rounded-xl bg-gray-50"
                    />
                    <button
                      onClick={() =>
                        handleSaveConfig(
                          "shipping_min_value",
                          config.shipping_min_value
                        )
                      }
                      className="bg-yellow-100 text-yellow-700 p-3 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Llave Pix
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={config.pix_key}
                      onChange={(e) =>
                        setConfig({ ...config, pix_key: e.target.value })
                      }
                      className="w-full border p-3 rounded-xl bg-gray-50"
                    />
                    <button
                      onClick={() =>
                        handleSaveConfig("pix_key", config.pix_key)
                      }
                      className="bg-blue-100 text-blue-700 p-3 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {posModalOpen && (
        <POSModal
          products={products}
          onClose={() => setPosModalOpen(false)}
          onSuccess={() => {
            fetchOrders();
            fetchProducts();
          }}
        />
      )}
      {orderModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setOrderModalOpen(false)}
          onUpdate={handleUpdateOrder}
          onDelete={handleDeleteOrder}
        />
      )}
      {productModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setProductModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}
      {clientHistoryModalOpen && selectedClient && (
        <ClientHistoryModal
          client={selectedClient}
          onClose={() => setClientHistoryModalOpen(false)}
        />
      )}
    </div>
  );
}

// --- HELPERS ---
function getStatusColor(status) {
  return (
    {
      pendiente: "bg-yellow-100 text-yellow-700",
      preparando: "bg-blue-100 text-blue-700",
      completado: "bg-green-100 text-green-700",
      cancelado: "bg-red-100 text-red-700",
    }[status] || "bg-gray-100 text-gray-700"
  );
}

// --- SUBCOMPONENTES ---
function SidebarBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium ${
        active
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {icon} <span className="hidden md:block">{label}</span>
    </button>
  );
}
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
      <div
        className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );
}
function ExportMenu({ onExport }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm"
      >
        <Download size={16} /> Exportar
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => onExport("xlsx")}
            className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-medium flex items-center gap-2 text-green-700"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => onExport("pdf")}
            className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-medium flex items-center gap-2 text-red-700"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      )}
    </div>
  );
}

// --- MODALES (POS, PRODUCTO, DETALLE PEDIDO, HISTORIAL CLIENTE) ---

function POSModal({ products, onClose, onSuccess }) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error("Sin stock");
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return toast.error("Stock límite");
      setCart(
        cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      );
    } else setCart([...cart, { ...product, qty: 1 }]);
  };
  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));
  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const { error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: "Cliente Mostrador",
            customer_phone: "N/A",
            address: "Tienda Física",
            payment_method: paymentMethod,
            origin: "fisica",
            status: "completado",
            total: total,
            items: cart.map((i) => ({
              id: i.id,
              name: i.name,
              quantity: i.qty,
              price: i.price,
            })),
          },
        ]);
      if (orderError) throw orderError;
      for (const item of cart) {
        const currentProduct = products.find((p) => p.id === item.id);
        if (currentProduct)
          await supabase
            .from("products")
            .update({ stock: currentProduct.stock - item.qty })
            .eq("id", item.id);
      }
      toast.success("Venta registrada");
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
        <div className="w-2/3 bg-gray-50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex gap-2">
              <Store /> Punto de Venta
            </h2>
            <input
              autoFocus
              type="text"
              placeholder="Buscar..."
              className="bg-white border p-3 rounded-xl w-64 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 overflow-y-auto content-start flex-1 pr-2">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="bg-white p-4 rounded-xl border hover:border-blue-500 hover:shadow-md transition-all text-left group disabled:opacity-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700 line-clamp-1 text-sm">
                      {p.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 rounded ${
                        p.stock < 5
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </div>
                </div>
                <div className="text-blue-600 font-bold text-lg mt-2">
                  R$ {p.price.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="w-1/3 bg-white p-6 border-l border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Ticket</h3>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
              >
                <div>
                  <p className="font-bold text-sm text-slate-700">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.qty} x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">
                    R$ {(item.qty * item.price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-300 pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {["efectivo", "pix", "tarjeta"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-lg text-xs font-bold uppercase border ${
                    paymentMethod === m
                      ? "bg-slate-800 text-white border-slate-800"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex justify-between items-end">
              <span className="text-gray-500 font-bold">Total</span>
              <span className="text-4xl font-black text-slate-900">
                R$ {total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleFinalize}
              disabled={loading || cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg disabled:opacity-50"
            >
              {loading ? "..." : "COBRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(order.admin_notes || "");
  const [status, setStatus] = useState(order.status || "pendiente");
  const handleSave = () => {
    onUpdate(order.id, { admin_notes: notes, status: status });
  };
  const sendWhatsAppUpdate = () => {
    if (!order.customer_phone) return toast.error("Sin teléfono");
    let message = `Hola *${order.customer_name}*! 👋 Soy de Venefoods. `;
    switch (status) {
      case "preparando":
        message += `Tu pedido #${order.id} ya se está *PREPARANDO* 👨‍🍳.`;
        break;
      case "completado":
        message += `¡Tu pedido #${order.id} ha sido *ENTREGADO*! 🎉 Gracias por tu compra.`;
        break;
      case "cancelado":
        message += `Tu pedido #${order.id} ha sido cancelado.`;
        break;
      default:
        message += `Te contactamos respecto a tu pedido #${order.id}.`;
    }
    window.open(
      `https://wa.me/${order.customer_phone.replace(
        /\D/g,
        ""
      )}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" /> Pedido #{order.id}
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-1">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-blue-50 rounded-2xl">
              <h3 className="font-bold text-blue-800 text-sm mb-2">Cliente</h3>
              <p className="font-bold">{order.customer_name}</p>
              <p className="text-sm">{order.customer_phone}</p>
            </div>
            <div className="flex-1 p-4 bg-purple-50 rounded-2xl">
              <h3 className="font-bold text-purple-800 text-sm mb-2">Envío</h3>
              <p className="text-sm font-medium">{order.address}</p>
            </div>
          </div>
          <div className="border rounded-2xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3">Cant</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="p-3 font-bold text-center bg-gray-50/50">
                      {item.quantity}
                    </td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-right font-mono">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800 text-white">
                <tr>
                  <td
                    colSpan="2"
                    className="p-3 text-right font-bold uppercase text-xs"
                  >
                    Total ({order.payment_method}):
                  </td>
                  <td className="p-3 text-right font-bold text-lg">
                    R$ {Number(order.total).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => generateOrderReceipt(order)}
              className="flex items-center justify-center gap-2 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={sendWhatsAppUpdate}
              className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200"
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-500">
              Estado
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["pendiente", "preparando", "completado", "cancelado"].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`py-2 px-1 text-xs font-bold uppercase rounded-lg border-2 transition-all ${
                      status === s
                        ? s === "cancelado"
                          ? "bg-red-100 border-red-500 text-red-700"
                          : "bg-blue-100 border-blue-500 text-blue-700"
                        : "border-gray-100 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">
              Notas Privadas
            </label>
            <textarea
              className="w-full border p-3 rounded-xl bg-yellow-50/50 mt-1 text-sm outline-none"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => onDelete(order.id)}
            className="text-red-400 hover:text-red-600 font-bold text-sm px-4"
          >
            Eliminar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientHistoryModal({ client, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User /> Historial de Cliente
            </h2>
            <p className="opacity-80 text-sm">
              {client.name} - {client.phone}
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-2xl text-center">
              <span className="text-xs text-blue-600 font-bold uppercase">
                Total Gastado
              </span>
              <p className="text-2xl font-black text-blue-900">
                R$ {client.totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-2xl text-center">
              <span className="text-xs text-purple-600 font-bold uppercase">
                Pedidos Totales
              </span>
              <p className="text-2xl font-black text-purple-900">
                {client.ordersCount}
              </p>
            </div>
          </div>
          <h3 className="font-bold text-gray-700 mb-3">Últimos Pedidos</h3>
          <div className="space-y-3">
            {client.history
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        Pedido #{order.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 rounded-full uppercase font-bold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()} -{" "}
                      {order.payment_method}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      order.status === "cancelado"
                        ? "text-gray-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    cost_price: "",
    stock: "",
    category: "harinas",
    description: "",
    image: "",
    badge_text: "",
    badge_color: "",
  });
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (product)
      setFormData({
        name: product.name,
        price: product.price,
        cost_price: product.cost_price || 0,
        stock: product.stock || 0,
        category: product.category,
        description: product.description || "",
        image: product.image || "",
        badge_text: product.badge_text || "",
        badge_color: product.badge_color || "red",
      });
  }, [product]);
  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      setFormData({ ...formData, image: data.publicUrl });
      toast.success("Imagen ok");
    } catch (e) {
      toast.error("Error");
    } finally {
      setUploading(false);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Gestión Producto</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold">Nombre</label>
              <input
                required
                className="w-full border p-2 rounded-lg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold">Categoría</label>
              <select
                className="w-full border p-2 rounded-lg"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="harinas">Harinas</option>
                <option value="quesos">Quesos</option>
                <option value="dulces">Dulces</option>
                <option value="bebidas">Bebidas</option>
                <option value="despensa">Despensa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
            <div>
              <label className="font-bold text-sm text-yellow-800">
                Precio Venta
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border p-3 rounded-xl bg-white"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-sm text-yellow-800">
                Costo (Compra)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border p-3 rounded-xl bg-white"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cost_price: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-sm text-yellow-800">
                Stock Actual
              </label>
              <input
                required
                type="number"
                className="w-full border p-3 rounded-xl bg-white"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold">Imagen URL</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border p-2 rounded-lg"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
              />
              <label className="bg-blue-100 px-3 rounded-lg flex items-center cursor-pointer text-xs font-bold text-blue-700">
                <input type="file" hidden onChange={handleImageUpload} />
                SUBIR
              </label>
            </div>
          </div>
          <div>
            <label className="font-bold text-sm">Descripción</label>
            <textarea
              rows="2"
              className="w-full border p-3 rounded-xl bg-gray-50"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
