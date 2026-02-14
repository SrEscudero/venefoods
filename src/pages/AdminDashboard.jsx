import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/client";
import {
  collection, getDocs, doc, deleteDoc, updateDoc, addDoc, setDoc, runTransaction, limit,
  onSnapshot, query, orderBy
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, Package, DollarSign, Search, Edit, Plus, Trash2, LogOut,
  X, Save, AlertCircle, ShoppingBag, Clock, User, Phone, Store, Users,
  MessageCircle, Image as ImageIcon, Upload, Download, FileText,
  FileSpreadsheet, Settings, Truck, CreditCard, Megaphone, Lock, Unlock,
  Eye, Filter, CheckCircle, XCircle, Clock3, TrendingUp, History, Tags,
  ChevronRight, ChevronLeft, Printer
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  exportToExcel, exportToCSV, exportToPDF, exportToTXT, generateOrderReceipt,
} from "../utils/exportHelper";
import TablePagination from "../components/TablePagination";
import { printOrderTicket } from "../utils/printTicket";

// ============================================
// FUNCIÓN DE COMPRESIÓN AGRESIVA (ANTI-ERROR FIREBASE)
// ============================================
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Reducimos a 600px para asegurar que el Base64 sea ligero (< 300kb)
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;

        let width = img.width;
        let height = img.height;

        // Redimensionar proporcionalmente
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        // 1. Pintar fondo BLANCO (Para evitar fondo negro en PNGs transparentes)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Dibujar imagen
        ctx.drawImage(img, 0, 0, width, height);

        // 3. FORZAR JPEG a calidad 0.6 (Garantiza tamaño pequeño)
        // Esto reduce un archivo de 800kb a unos 50-80kb en Base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

        resolve(dataUrl);
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
};

// Función auxiliar para reproducir sonido
const playNotificationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.m4a");
  audio.play().catch(error => console.log("Error al reproducir sonido (interacción requerida):", error));
};

// --- FUNCIÓN DE AUDITORÍA ---
const logAction = async (action, details, userEmail) => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      action,        // Ej: "Eliminar Pedido"
      details,       // Ej: "Pedido #123 eliminado"
      user: userEmail || "desconocido",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error guardando log:", error);
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const isOwner = user?.email === "admin@venefoods.com";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dateFilter, setDateFilter] = useState("all");

  // Datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", discount: "", type: "percent" });
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState([]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false); 

  // Configuración Global
  const [config, setConfig] = useState({
    home_banner: "", // (Mantener por compatibilidad o borrar si ya no se usa)
    banners: [],     // <--- NUEVO: Para el carrusel
    shipping_zones: [], // <--- NUEVO: Para las zonas
    whatsapp_number: "",
    pix_key: "",
    shipping_min_value: "100",
    top_bar_text: "🚀 Envío GRATIS...",
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
  const [globalHistoryOpen, setGlobalHistoryOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [clientHistoryModalOpen, setClientHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab, orderStatusFilter]);

  // --- 1. AUTENTICACIÓN Y CARGA DE DATOS ESTÁTICOS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin");
      } else {
        // NOTA: Quitamos fetchOrders() de aquí porque ahora va por separado
        Promise.all([fetchProducts(), fetchSettings(), fetchCategories(), fetchCoupons(), fetchExpenses()])
          .then(() => {
            // No ponemos setLoading(false) aquí todavía para esperar a los pedidos
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

// --- REFERENCIAS PARA CONTROL DE NOTIFICACIONES ---
  const prevOrdersRef = useRef([]); // Guarda la lista anterior sin causar re-render
  const isFirstLoad = useRef(true); // Candado para la primera carga

  // --- 2. LISTENER EN TIEMPO REAL BLINDADO ---
  useEffect(() => {
    // Consulta: Ordenar por fecha descendente (el más nuevo primero)
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Si es la PRIMERA vez que carga la página (F5 o entrar):
      if (isFirstLoad.current) {
        // Solo guardamos los datos, NO notificamos
        prevOrdersRef.current = ordersData;
        setOrders(ordersData);
        setLoading(false);
        isFirstLoad.current = false; // Quitamos el candado para la próxima
        return;
      }

      // Si NO es la primera vez, verificamos si hay cambios reales
      const prevOrders = prevOrdersRef.current;
      
      // Verificamos si llegó un pedido NUEVO (comparamos el ID del más reciente)
      if (ordersData.length > 0) {
        const latestNew = ordersData[0];
        const latestOld = prevOrders.length > 0 ? prevOrders[0] : null;

        // Si el ID del más nuevo es diferente al que teníamos antes...
        if (!latestOld || latestNew.id !== latestOld.id) {
          // 🔔 SONIDO Y ALERTA
          playNotificationSound();
          
          // TRUCO FINAL: Usamos el ID del pedido como ID del toast.
          // Esto impide físicamente que salgan dos notificaciones iguales.
          toast.success(`🔔 Nuevo Pedido: ${latestNew.customer_name}`, {
            id: `order-notif-${latestNew.id}`, // <--- LA CLAVE MÁGICA
            duration: 6000,
            position: "top-center",
            style: { 
              background: '#10B981', 
              color: 'white', 
              fontWeight: 'bold', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          });
        }
      }

      // Actualizamos estado y referencia
      prevOrdersRef.current = ordersData;
      setOrders(ordersData);
      setLoading(false);

    }, (error) => {
      console.error("Error suscribiendo a pedidos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. FUNCIONES DE LECTURA (FIREBASE) ---
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        price: Number(doc.data().price),
        stock: Number(doc.data().stock),
        cost_price: Number(doc.data().cost_price || 0)
      }));
      data.sort((a, b) => a.id.localeCompare(b.id));
      setProducts(data);
    } catch (error) {
      console.error("Error products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(data);
    } catch (error) {
      console.error("Error orders:", error);
    }
  };

  // --- GESTIÓN DE GASTOS ---
  const fetchExpenses = async () => {
    try {
      const q = query(collection(db, "expenses"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    } catch (error) {
      console.error("Error gastos:", error);
    }
  };

  // --- GESTIÓN DE GASTOS ---
  const handleSaveExpense = async (expenseData) => {
    try {
      // Nota: Asegúrate de importar 'addDoc' y 'collection' de firebase/firestore
      await addDoc(collection(db, "expenses"), { ...expenseData, user: user?.email });
      toast.success(`Gasto de R$ ${expenseData.amount} registrado`);
      setExpenseModalOpen(false);
      // fetchExpenses(); // Si tienes esta función, descoméntala para actualizar al instante
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar gasto");
    }
  };

  const fetchSettings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "site_settings"));
      if (!querySnapshot.empty) {
        const newConfig = { ...config };
        querySnapshot.docs.forEach((doc) => {
          try {
            newConfig[doc.id] = JSON.parse(doc.data().value);
          } catch (e) {
            newConfig[doc.id] = doc.data().value;
          }
        });
        setConfig((prev) => ({ ...prev, ...newConfig }));
      }
    } catch (error) {
      console.error("Error settings:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  // --- GESTIÓN DE CUPONES ---
  const fetchCoupons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(data);
    } catch (error) {
      console.error("Error coupons:", error);
    }
  };

  const handleSaveCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) return toast.error("Completa los datos");
    try {
      await addDoc(collection(db, "coupons"), {
        code: newCoupon.code.toUpperCase().trim(),
        discount: Number(newCoupon.discount),
        type: newCoupon.type, // 'percent' o 'fixed'
        active: true
      });
      toast.success("Cupón creado");
      setNewCoupon({ code: "", discount: "", type: "percent" });
      fetchCoupons();
    } catch (error) {
      toast.error("Error al crear cupón");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm("¿Borrar cupón?")) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      toast.success("Cupón eliminado");
      fetchCoupons();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  // --- GESTIÓN DE CATEGORÍAS ---
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    } catch (error) {
      console.error("Error categories:", error);
    }
  };

  const handleSaveCategory = async (formData) => {
    const toastId = toast.loading("Guardando categoría...");
    try {
      const cleanId = formData.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      await setDoc(doc(db, "categories", cleanId), { name: formData.name });
      toast.success("Categoría guardada", { id: toastId });
      setCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar", { id: toastId });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar esta categoría?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Categoría eliminada");
      fetchCategories();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  // --- LÓGICA DE ACTUALIZACIONES (FIREBASE) ---
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
          const currentProd = products.find(p => p.id === item.id);
          if (currentProd) {
            const prodRef = doc(db, "products", item.id);
            await updateDoc(prodRef, {
              stock: Number(currentProd.stock) + (Number(item.quantity) || 1)
            });
          }
        }
        toast.success("Stock restaurado", { id: toastId });
        fetchProducts();
      } catch (error) {
        toast.error("Error en stock", { id: toastId });
      }
    }

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, updates);
      await logAction(
        "Actualizar Pedido",
        `Pedido #${orderId} cambió a estado: ${updates.status}`,
        user?.email
      );
      toast.success(`Pedido ${updates.status}`);
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );
      setOrderModalOpen(false);
    } catch (error) {
      toast.error("Error al actualizar orden");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("⚠️ ¿Estás seguro?...")) return; // (Tu confirmación actual)

    try {
      await deleteDoc(doc(db, "orders", orderId));

      // 👇 AGREGAR ESTO:
      await logAction("Eliminar Pedido", `Pedido #${orderId} eliminado permanentemente`, user?.email);

      toast.success("Eliminado permanentemente");
      setOrders(orders.filter((o) => o.id !== orderId));
      setOrderModalOpen(false);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Eliminado");
      fetchProducts();
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  // --- GUARDADO DE PRODUCTOS CON KARDEX (HISTORIAL) ---
  const handleSaveProduct = async (formData) => {
    const toastId = toast.loading("Guardando...");
    try {
      let productId = "";
      let changeType = "";
      let stockDiff = 0;

      if (editingProduct) {
        productId = editingProduct.id;
        const prodRef = doc(db, "products", productId);

        const oldStock = Number(editingProduct.stock);
        const newStock = Number(formData.stock);
        stockDiff = newStock - oldStock;

        if (stockDiff !== 0) {
          changeType = "ajuste_manual";
        }

        await updateDoc(prodRef, formData);
        toast.success("Producto actualizado", { id: toastId });
      } else {
        const cleanId = formData.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        productId = `${cleanId}-${Math.floor(Math.random() * 1000)}`;

        await setDoc(doc(db, "products", productId), formData);

        stockDiff = Number(formData.stock);
        changeType = "creacion";

        toast.success(`Creado: ${productId}`, { id: toastId });
      }

      if (stockDiff !== 0) {
        await addDoc(collection(db, "inventory_logs"), {
          product_id: productId,
          product_name: formData.name,
          type: changeType,
          quantity_change: stockDiff,
          final_stock: Number(formData.stock),
          user: "admin",
          date: new Date().toISOString()
        });
      }

      setProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Error: " + error.message, { id: toastId });
    }
  };

  const handleSaveConfig = async (key, value) => {
    try {
      await setDoc(doc(db, "site_settings", key), { value: String(value) });
      setConfig((prev) => ({ ...prev, [key]: String(value) }));
      toast.success("Guardado");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar configuración");
    }
  };

  // --- SUBIDA DE BANNER OPTIMIZADA (usa la nueva compressImage) ---
  const handleUpdateBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error("Solo se permiten imágenes");
    }

    const toastId = toast.loading("Optimizando y subiendo...");

    try {
      const compressedBase64 = await compressImage(file);
      await handleSaveConfig("home_banner", compressedBase64);
      toast.success("Banner actualizado (Optimizado)!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar imagen", { id: toastId });
    }
  };

  // --- LÓGICA DE BANNERS (CARRUSEL) ---
  const handleAddBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading("Procesando imagen...");
    try {
      const base64 = await compressImage(file);
      const currentBanners = Array.isArray(config.banners) ? config.banners : [];
      const newBanners = [...currentBanners, base64];

      // Guardamos como JSON string
      await handleSaveConfig("banners", JSON.stringify(newBanners));
      setConfig(prev => ({ ...prev, banners: newBanners }));
      toast.success("Banner agregado", { id: toastId });
    } catch (error) {
      toast.error("Error al subir", { id: toastId });
    }
  };

  const handleRemoveBanner = async (index) => {
    const newBanners = config.banners.filter((_, i) => i !== index);
    await handleSaveConfig("banners", JSON.stringify(newBanners));
    setConfig(prev => ({ ...prev, banners: newBanners }));
    toast.success("Banner eliminado");
  };

  // --- LÓGICA DE ZONAS DE ENVÍO ---
  const [newZone, setNewZone] = useState({ name: "", price: "" });

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.price) return toast.error("Completa los datos de la zona");
    const currentZones = Array.isArray(config.shipping_zones) ? config.shipping_zones : [];
    const newZones = [...currentZones, { name: newZone.name, price: Number(newZone.price) }];

    await handleSaveConfig("shipping_zones", JSON.stringify(newZones));
    setConfig(prev => ({ ...prev, shipping_zones: newZones }));
    setNewZone({ name: "", price: "" });
    toast.success("Zona agregada");
  };

  const handleRemoveZone = async (index) => {
    const newZones = config.shipping_zones.filter((_, i) => i !== index);
    await handleSaveConfig("shipping_zones", JSON.stringify(newZones));
    setConfig(prev => ({ ...prev, shipping_zones: newZones }));
  };

  // --- FUNCIÓN DE EXPORTACIÓN (REEMPLAZAR ESTA FUNCIÓN ENTERA) ---
  const handleExport = (type, format) => {
    console.log("Intentando exportar:", type, format); // Debug para ver si entra

    let dataToExport = [];
    let fileName = `reporte_${type}_${new Date().toISOString().split('T')[0]}`;
    let pdfColumns = [];
    let title = "";

    try {
      if (type === "ventas") {
        title = "Reporte de Ventas";
        dataToExport = orders.map((o) => ({
          ID: o.id,
          Fecha: new Date(o.created_at).toLocaleDateString(),
          Cliente: o.customer_name,
          Total: `R$ ${Number(o.total).toFixed(2)}`, // Aseguramos que sea número
          Estado: o.status,
        }));
        pdfColumns = ["ID", "Fecha", "Cliente", "Total", "Estado"];
      } 
      else if (type === "clientes") {
        title = "Reporte de Clientes";
        dataToExport = stats.clientsList.map((c) => ({
          Nombre: c.name,
          Telefono: c.phone,
          Total: `R$ ${Number(c.totalSpent).toFixed(2)}`,
          Pedidos: c.ordersCount,
        }));
        pdfColumns = ["Nombre", "Telefono", "Total", "Pedidos"];
      } 
      else if (type === "inventario") {
        title = "Inventario Actual";
        dataToExport = products.map((p) => ({
          ID: p.id,
          Producto: p.name,
          Stock: p.stock,
          Precio: `R$ ${Number(p.price).toFixed(2)}`,
        }));
        pdfColumns = ["ID", "Producto", "Stock", "Precio"];
      }
      // --- LÓGICA DEL CIERRE DE CAJA (Z-CUT) ---
      else if (type === "cierre_caja") {
        title = `CIERRE DE CAJA - ${new Date().toLocaleDateString()}`;
        
        // Verificamos que stats existan para evitar errores
        const totalRevenue = stats?.totalRevenue || 0;
        const totalExpenses = stats?.totalExpenses || 0;
        const totalProfit = stats?.totalProfit || 0;

        // 1. Resumen General
        dataToExport.push({ Concepto: "----------------", Valor: "----------" });
        dataToExport.push({ Concepto: "VENTAS BRUTAS", Valor: `R$ ${totalRevenue.toFixed(2)}` });
        dataToExport.push({ Concepto: "GASTOS OPERATIVOS", Valor: `- R$ ${totalExpenses.toFixed(2)}` });
        dataToExport.push({ Concepto: "GANANCIA NETA", Valor: `R$ ${totalProfit.toFixed(2)}` });
        dataToExport.push({ Concepto: "----------------", Valor: "----------" });
        
        // 2. Desglose por Método de Pago
        const pagos = { efectivo: 0, pix: 0, tarjeta: 0, whatsapp: 0 };
        
        // Filtramos solo ordenes válidas (no canceladas)
        orders.filter(o => o.status !== 'cancelado').forEach(o => {
          // Normalizar el método de pago a minúsculas para evitar duplicados
          const metodo = o.payment_method ? o.payment_method.toLowerCase() : 'otros';
          
          if (pagos[metodo] !== undefined) {
            pagos[metodo] += Number(o.total);
          } else {
            pagos[metodo] = Number(o.total); // Si es un método nuevo, lo inicializamos
          }
        });

        dataToExport.push({ Concepto: "Efectivo en Caja", Valor: `R$ ${(pagos.efectivo || 0).toFixed(2)}` });
        dataToExport.push({ Concepto: "Pix Recibido", Valor: `R$ ${(pagos.pix || 0).toFixed(2)}` });
        dataToExport.push({ Concepto: "Tarjetas", Valor: `R$ ${(pagos.tarjeta || 0).toFixed(2)}` });
        
        pdfColumns = ["Concepto", "Valor"];
      }

      // Ejecutar la exportación según el formato
      if (format === "xlsx") exportToExcel(dataToExport, fileName);
      else if (format === "csv") exportToCSV(dataToExport, fileName);
      else if (format === "txt") exportToTXT(dataToExport, fileName);
      else if (format === "pdf") {
        // Verificamos si hay datos antes de llamar al PDF
        if (dataToExport.length === 0) {
          toast.error("No hay datos para exportar");
          return;
        }
        exportToPDF(title, pdfColumns, dataToExport, fileName);
      }

      toast.success(`Reporte generado: ${fileName}`);
    
    } catch (error) {
      console.error("Error exportando:", error);
      toast.error("Error al generar el reporte. Revisa la consola.");
    }
  };

  const stats = useMemo(() => {
    // 1. Definir fechas para filtros
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Helper para verificar fecha (Evita repetir código para pedidos y gastos)
    const checkDateFilter = (dateStr) => {
      const date = new Date(dateStr);
      if (dateFilter === "today") return date >= startOfDay;
      if (dateFilter === "week") return date >= oneWeekAgo;
      if (dateFilter === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true; 
    };

    // 2. Filtrar Pedidos Validos (No cancelados y dentro de la fecha)
    let validOrders = orders.filter((o) => o.status !== "cancelado" && checkDateFilter(o.created_at));

    // 3. Calcular Ingresos y Ganancia Bruta (Ventas - Costos)
    let totalRevenue = 0;
    let grossProfit = 0;

    validOrders.forEach((order) => {
      totalRevenue += Number(order.total);

      order.items.forEach((item) => {
        const productData = products.find(p => p.id === item.id);
        const cost = productData ? (Number(productData.cost_price) || 0) : 0;
        const price = Number(item.price);
        const qty = Number(item.quantity);
        grossProfit += (price - cost) * qty;
      });
    });

    // 4. Calcular Gastos Operativos (NUEVO)
    let totalExpenses = 0;
    const safeExpenses = Array.isArray(expenses) ? expenses : []; // Protección si expenses es undefined
    
    safeExpenses.forEach((exp) => {
      if (checkDateFilter(exp.date)) {
        totalExpenses += Number(exp.amount);
      }
    });

    // 5. Ganancia Neta Real = Bruta - Gastos
    const netProfit = grossProfit - totalExpenses;

    // 6. Lógica de Clientes (Se mantiene igual, procesa todo el historial)
    const clientsMap = {};
    orders.forEach((order) => {
      const cpfRaw = order.customer_cpf || "";
      const cpfClean = cpfRaw.replace(/\D/g, "");
      const phoneClean = order.customer_phone ? order.customer_phone.replace(/\D/g, "") : "";

      let uniqueKey = "";
      if (cpfClean.length > 5) uniqueKey = "CPF-" + cpfClean;
      else if (phoneClean.length > 5) uniqueKey = "PHONE-" + phoneClean;
      else uniqueKey = (order.customer_name === "Cliente Mostrador") ? "MOSTRADOR" : "ID-" + order.id;

      if (!clientsMap[uniqueKey]) {
        clientsMap[uniqueKey] = {
          id: uniqueKey,
          name: order.customer_name,
          phone: order.customer_phone || "S/T",
          cpf: order.customer_cpf || "---",
          totalSpent: 0,
          ordersCount: 0,
          lastOrder: order.created_at,
          history: [],
        };
      }

      if (order.status !== "cancelado") {
        clientsMap[uniqueKey].totalSpent += Number(order.total);
        clientsMap[uniqueKey].ordersCount += 1;
      }
      clientsMap[uniqueKey].history.push(order);

      if (new Date(order.created_at) > new Date(clientsMap[uniqueKey].lastOrder)) {
        clientsMap[uniqueKey].lastOrder = order.created_at;
        clientsMap[uniqueKey].name = order.customer_name;
        clientsMap[uniqueKey].phone = order.customer_phone;
        if (order.customer_cpf) clientsMap[uniqueKey].cpf = order.customer_cpf;
      }
    });

    const clientsList = Object.values(clientsMap)
      .filter((c) => c.id !== "MOSTRADOR" && !c.id.startsWith("ID-"))
      .map((client) => ({ ...client, isVip: client.ordersCount >= 3 || client.totalSpent >= 200 }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const chartData = products.map((p) => ({ name: p.name.substring(0, 10), stock: p.stock }));
    const lowStockProducts = products.filter((p) => p.stock < 5);

    return {
      totalRevenue,
      totalProfit: netProfit, 
      totalExpenses,          
      totalOrders: validOrders.length,
      chartData,
      lowStockProducts,
      clientsList
    };
  }, [products, orders, dateFilter, expenses])

  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter === "todos") return true;
    return order.status === orderStatusFilter;
  });

  const paginate = (data) =>
    data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando panel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 font-sans flex">
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: 'white', borderRadius: '16px' } }} />

      {/* SIDEBAR MODERNO - EFECTO VIDRIO */}
      <aside className="hidden md:flex w-72 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-md fixed h-full flex flex-col z-30 shadow-2xl border-r border-white/10">
        <div className="p-6 md:px-8 md:py-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl hidden md:block text-white tracking-tight">Venefoods<span className="text-blue-400 ml-1">Admin</span></span>
          </div>
        </div>

        <nav className="flex-1 mt-2 px-3 md:px-5 space-y-2">
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
          {/* SOLO DUEÑO VE ESTO */}
          {isOwner && (
            <>
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
              <div className="border-t border-white/10 my-4"></div>
              <SidebarBtn
                icon={<Tags size={20} />}
                label="Categorías"
                active={activeTab === "categories"}
                onClick={() => setActiveTab("categories")}
              />
              <SidebarBtn
                icon={<Settings size={20} />}
                label="Configuración"
                active={activeTab === "config"}
                onClick={() => setActiveTab("config")}
              />
            </>
          )}
        </nav>

        <div className="p-4 md:p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-300/90 hover:text-white hover:bg-white/10 p-3 rounded-2xl w-full transition-all duration-200 font-medium"
          >
            <LogOut size={20} /> <span className="hidden md:block">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-8 lg:p-10 pb-24 md:pb-8 overflow-y-auto transition-all duration-300">
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                  Hola, Admin 👋
                </h1>
                <p className="text-gray-500 mt-1 text-lg">Resumen financiero de tu negocio.</p>
              </div>

              <div className="flex flex-wrap gap-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-200/60">
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: '7 Días' },
                  { id: 'month', label: 'Mes' },
                  { id: 'all', label: 'Histórico' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setDateFilter(f.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${dateFilter === f.id
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-200/50'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                  onClick={() => handleExport("cierre_caja", "pdf")}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all"
                  title="Generar reporte Z del día"
                >
                  <Printer size={18} /> <span className="hidden md:inline">Cierre Caja</span>
                </button>

              {/* Botones de Acción */}
              <div className="flex gap-2">
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-4 py-3.5 rounded-2xl font-bold shadow-sm flex gap-2 items-center transition-all"
                >
                  <DollarSign size={20} /> Gasto
                </button>
                <button
                  onClick={() => setPosModalOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg flex gap-2 items-center transition-all duration-200 active:scale-95"
                >
                  <Store size={20} /> Venta Rápida
                </button>
              </div>
              
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 1. VENTAS (Ingreso Bruto) */}
              <StatCard
                title={dateFilter === 'today' ? "Ventas Hoy" : "Ventas Totales"}
                value={`R$ ${stats.totalRevenue.toFixed(2)}`}
                icon={<DollarSign className="text-white" />}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />

              {/* 2. GASTOS (NUEVO - Salidas) */}
              <StatCard
                title="Gastos Operativos"
                value={`- R$ ${stats.totalExpenses.toFixed(2)}`} // Signo negativo visual
                icon={<DollarSign className="text-white" />}
                color="bg-gradient-to-br from-red-500 to-red-600" // Rojo de alerta
              />

              {/* 3. GANANCIA NETA (Real) */}
              {isOwner ? (
                <StatCard
                  title="Ganancia Neta Real"
                  value={`R$ ${stats.totalProfit.toFixed(2)}`}
                  icon={<TrendingUp className="text-white" />}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
              ) : (
                // Si es empleado, ve Pedidos aquí
                <StatCard
                  title="Pedidos Completados"
                  value={stats.totalOrders}
                  icon={<ShoppingBag className="text-white" />}
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
              )}

              {/* 4. CLIENTES / PEDIDOS */}
              <StatCard
                title="Clientes VIP"
                value={stats.clientsList.filter((c) => c.isVip).length}
                icon={<Users className="text-white" />}
                color="bg-gradient-to-br from-orange-500 to-amber-600"
              />
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 h-80 w-full transition-all hover:shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="stock" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VENTAS */}
        {activeTab === "sales" && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-green-100 rounded-2xl">
                  <ShoppingBag className="text-green-600" size={28} />
                </div>
                Gestión de Ventas
              </h2>
              <div className="flex flex-wrap gap-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-200/60">
                {[
                  { id: "todos", label: "Todos", icon: <Filter size={14} /> },
                  { id: "pendiente", label: "Pendientes", icon: <Clock3 size={14} /> },
                  { id: "preparando", label: "En Proceso", icon: <Package size={14} /> },
                  { id: "completado", label: "Listos", icon: <CheckCircle size={14} /> },
                  { id: "cancelado", label: "Cancelados", icon: <XCircle size={14} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${orderStatusFilter === tab.id
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-200/50"
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white/80 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200">
                  <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No hay pedidos en esta categoría</p>
                </div>
              ) : (
                paginate(filteredOrders).map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      setSelectedOrder(order);
                      setOrderModalOpen(true);
                    }}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                          #{order.id} - {order.customer_name}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} /> {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Truck size={14} /> {order.origin === "fisica" ? "Tienda física" : "Delivery"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CreditCard size={14} /> {order.payment_method}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold ${order.status === "cancelado"
                          ? "text-gray-400 line-through"
                          : "text-slate-900"
                          }`}
                      >
                        R$ {Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8">
              <TablePagination
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === "customers" && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-purple-100 rounded-2xl">
                  <Users className="text-purple-600" size={28} />
                </div>
                Cartera de Clientes
              </h2>
              <ExportMenu onExport={(format) => handleExport("clientes", format)} />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Histórico</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginate(stats.clientsList).map((client, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-md ${client.isVip ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-gray-400 to-gray-500"}`}>
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block">{client.name}</span>
                              {client.cpf !== "---" && <span className="text-[10px] text-blue-600 font-mono block">{client.cpf}</span>}
                              <span className="text-xs text-gray-400">Última: {new Date(client.lastOrder).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-sm text-slate-700">{client.phone}</span>
                          </div>
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
                            <span className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-yellow-200 shadow-sm">
                              VIP 👑
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
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
                              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                              title="Ver Historial"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
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
            </div>

            <div className="mt-8">
              <TablePagination
                currentPage={currentPage}
                totalItems={stats.clientsList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}

        {/* INVENTARIO */}
        {activeTab === "inventory" && (
          <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-blue-100 rounded-2xl">
                  <Package className="text-blue-600" size={28} />
                </div>
                Inventario
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <ExportMenu onExport={(format) => handleExport("inventario", format)} />
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all w-full md:w-64"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-semibold shadow-md transition-all active:scale-95"
                  >
                    <Plus size={18} /> Nuevo
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <div className="flex gap-4 items-center">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12 object-contain bg-white rounded-xl border border-gray-100 shadow-sm p-1"
                              />
                              <div>
                                <span className="font-semibold text-slate-800 block">{p.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                                  {p.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${p.stock < 5
                                ? "bg-red-100 text-red-700 animate-pulse"
                                : "bg-green-100 text-green-700"
                                }`}
                            >
                              {p.stock} {p.stock === 1 ? 'unidad' : 'unidades'}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">
                            R$ {p.price.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProductHistory(p);
                                  setHistoryModalOpen(true);
                                }}
                                className="p-2.5 text-slate-500 hover:text-slate-800 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                title="Ver Movimientos"
                              >
                                <History size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductModalOpen(true);
                                }}
                                className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight mb-6">
              <div className="p-2 bg-gray-200 rounded-2xl">
                <Settings className="text-gray-700" size={28} />
              </div>
              Configuración de la Tienda
            </h2>

            {/* Botón de Auditoría (Solo Dueño) */}
            {isOwner && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setGlobalHistoryOpen(true)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white border border-gray-200 px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <History size={18} /> Ver Registro de Actividad
                </button>
              </div>
            )}

            {/* 1. ESTADO OPERATIVO */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
              <div
                className={`absolute top-0 right-0 p-4 rounded-bl-3xl font-bold uppercase text-xs tracking-wider ${config.store_status === "open"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {config.store_status === "open" ? "Tienda Online" : "Tienda Cerrada"}
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 rounded-lg">
                  <Store size={18} className="text-slate-600" />
                </div>
                Estado Operativo
              </h3>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-4">Controla si los clientes pueden realizar pedidos.</p>
                  <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl inline-flex">
                    <button
                      onClick={() => handleSaveConfig("store_status", "open")}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${config.store_status === "open"
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      <Unlock size={16} /> ABIERTA
                    </button>
                    <button
                      onClick={() => handleSaveConfig("store_status", "closed")}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${config.store_status === "closed"
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      <Lock size={16} /> CERRADA
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mensaje de Cierre</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={config.store_closed_message}
                      onChange={(e) =>
                        setConfig({ ...config, store_closed_message: e.target.value })
                      }
                      className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej: Volvemos el Lunes a las 8am"
                    />
                    <button
                      onClick={() => handleSaveConfig("store_closed_message", config.store_closed_message)}
                      className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors shadow-md"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. BANNERS DEL CARRUSEL (MEJORA: REEMPLAZA PORTADA ÚNICA) */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <ImageIcon size={18} className="text-blue-600" />
                  </div>
                  Banners del Carrusel
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Array.isArray(config.banners) && config.banners.map((banner, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-video">
                      <img src={banner} alt={`Banner ${index}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveBanner(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Eliminar Banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 aspect-video transition-colors group">
                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">Agregar Banner</span>
                    <input type="file" hidden accept="image/*" onChange={handleAddBanner} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 text-center">Recomendado: Imágenes horizontales (16:9). Se mostrarán rotando en el inicio.</p>
              </div>

              {/* 3. BARRA DE ANUNCIOS */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-pink-100 rounded-lg">
                    <Megaphone size={18} className="text-pink-600" />
                  </div>
                  Barra de Anuncios
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Texto del Anuncio</label>
                    <input
                      value={config.top_bar_text}
                      onChange={(e) => setConfig({ ...config, top_bar_text: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej: 🚀 Envío GRATIS en Passo Fundo..."
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Mostrar Barra</span>
                    <input
                      type="checkbox"
                      checked={config.top_bar_active === "true"}
                      onChange={(e) => {
                        const newVal = e.target.checked ? "true" : "false";
                        setConfig({ ...config, top_bar_active: newVal });
                        handleSaveConfig("top_bar_active", newVal);
                      }}
                      className="w-5 h-5 accent-blue-600 rounded-md"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveConfig("top_bar_text", config.top_bar_text)}
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md"
                  >
                    Guardar Texto
                  </button>
                </div>
              </div>
            </div>

            {/* 4. TARIFAS DE ENVÍO POR ZONA (MEJORA: NUEVA SECCIÓN) */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Truck size={18} className="text-green-600" />
                </div>
                Tarifas de Envío por Zona
              </h3>

              <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Zona</label>
                  <input
                    placeholder="Ej: Centro, Barrios Lejanos..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                    value={newZone.name}
                    onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-xs font-bold text-gray-500 uppercase">Precio (R$)</label>
                  <input
                    type="number"
                    placeholder="5.00"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none"
                    value={newZone.price}
                    onChange={e => setNewZone({ ...newZone, price: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleAddZone}
                  className="bg-slate-800 text-white p-3.5 rounded-xl hover:bg-slate-700 transition-colors shadow-md"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(config.shipping_zones) && config.shipping_zones.map((zone, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <span className="font-medium text-slate-700">{zone.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">R$ {Number(zone.price).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveZone(idx)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!config.shipping_zones || config.shipping_zones.length === 0) && (
                  <div className="col-span-full text-center py-6 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hay zonas configuradas. Se usará la configuración general.
                  </div>
                )}
              </div>
            </div>

            {/* 5. DATOS OPERATIVOS */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Store size={18} className="text-emerald-600" />
                </div>
                Datos Operativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</label>
                  <div className="flex gap-2">
                    <input
                      value={config.whatsapp_number}
                      onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none transition-all"
                    />
                    <button
                      onClick={() => handleSaveConfig("whatsapp_number", config.whatsapp_number)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-3 rounded-xl transition-colors"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Envío Gratis Mínimo (R$)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={config.shipping_min_value}
                      onChange={(e) => setConfig({ ...config, shipping_min_value: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all"
                    />
                    <button
                      onClick={() => handleSaveConfig("shipping_min_value", config.shipping_min_value)}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-3 rounded-xl transition-colors"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Llave Pix</label>
                  <div className="flex gap-2">
                    <input
                      value={config.pix_key}
                      onChange={(e) => setConfig({ ...config, pix_key: e.target.value })}
                      className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      onClick={() => handleSaveConfig("pix_key", config.pix_key)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-3 rounded-xl transition-colors"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. GESTIÓN DE CUPONES */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Tags size={18} className="text-yellow-600" />
                </div>
                Cupones de Descuento
              </h3>

              {/* Formulario Crear */}
              <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</label>
                  <input
                    placeholder="Ej: NAVIDAD10"
                    className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all uppercase font-bold text-slate-700"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</label>
                  <input
                    type="number"
                    placeholder="10"
                    className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all"
                    value={newCoupon.discount}
                    onChange={e => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                  />
                </div>
                <div className="w-40">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</label>
                  <select
                    className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all"
                    value={newCoupon.type}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                  >
                    <option value="percent">% Porcentaje</option>
                    <option value="fixed">R$ Fijo</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveCoupon}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Lista de Cupones */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-white hover:border-yellow-200 transition-all shadow-sm">
                    <div>
                      <span className="font-bold text-slate-800 block text-lg tracking-tight">{c.code}</span>
                      <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md mt-1 inline-block">
                        {c.type === 'percent' ? `${c.discount}% OFF` : `R$ ${c.discount} OFF`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Tags size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No hay cupones activos actualmente.</p>
                  </div>
                )}
              </div>


            </div>
          </div>
        )}

        {/* CATEGORÍAS */}
        {activeTab === "categories" && (
          <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-orange-100 rounded-2xl">
                  <Tags className="text-orange-600" size={28} />
                </div>
                Gestión de Categorías
              </h2>
              <button
                onClick={() => { setEditingCategory(null); setCategoryModalOpen(true); }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg transition-all active:scale-95"
              >
                <Plus size={18} /> Nueva Categoría
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{cat.name}</h3>
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                      ID: {cat.id}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-20 text-gray-400 bg-white/80 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200">
                <Tags size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No hay categorías creadas. ¡Crea la primera!</p>
              </div>
            )}
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
          categories={categories}
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
      {historyModalOpen && selectedProductHistory && (
        <ProductHistoryModal
          product={selectedProductHistory}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}
      {categoryModalOpen && (
        <CategoryFormModal
          onClose={() => setCategoryModalOpen(false)}
          onSave={handleSaveCategory}
        />
      )}
      {globalHistoryOpen && (
        <GlobalHistoryModal onClose={() => setGlobalHistoryOpen(false)} />
      )}
      {expenseModalOpen && (
        <ExpenseModal 
          onClose={() => setExpenseModalOpen(false)} 
          onSave={handleSaveExpense} 
        />
      )}
      {/* --- BARRA DE NAVEGACIÓN MÓVIL (SOLO CELULAR) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-6 py-2 flex justify-between items-end z-40 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavBtn 
          icon={<LayoutDashboard size={24} />} 
          label="Inicio" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <MobileNavBtn 
          icon={<ShoppingBag size={24} />} 
          label="Ventas" 
          active={activeTab === 'sales'} 
          onClick={() => setActiveTab('sales')} 
        />
        
        {/* Botón Flotante Central (Venta Rápida) */}
        <div className="relative -top-5">
          <button 
            onClick={() => setPosModalOpen(true)}
            className="bg-slate-900 text-white p-4 rounded-full shadow-xl shadow-slate-900/40 active:scale-90 transition-transform border-4 border-gray-50"
          >
            <Plus size={28} />
          </button>
        </div>

        <MobileNavBtn 
          icon={<Package size={24} />} 
          label="Stock" 
          active={activeTab === 'inventory'} 
          onClick={() => setActiveTab('inventory')} 
        />
        <MobileNavBtn 
          icon={<Settings size={24} />} 
          label="Config" 
          active={activeTab === 'config'} 
          onClick={() => setActiveTab('config')} 
        />
      </div>
    </div>
  );
}

// --- HELPERS ---
function getStatusColor(status) {
  return (
    {
      pendiente: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      preparando: "bg-blue-100 text-blue-700 border border-blue-200",
      completado: "bg-green-100 text-green-700 border border-green-200",
      cancelado: "bg-red-100 text-red-700 border border-red-200",
    }[status] || "bg-gray-100 text-gray-700 border border-gray-200"
  );
}

// --- SUBCOMPONENTES ESTILIZADOS ---
function SidebarBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 md:p-4 rounded-2xl transition-all duration-200 font-medium group
        ${active
          ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
          : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{icon}</span>
      <span className="hidden md:block text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto hidden md:block text-white/70" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:scale-[1.02] duration-200">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
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
        className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 px-5 py-2.5 rounded-2xl font-semibold flex items-center gap-2 hover:bg-white hover:shadow-md transition-all"
      >
        <Download size={16} /> Exportar
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden backdrop-blur-md"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => onExport("xlsx")}
            className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-medium flex items-center gap-2 text-green-700 transition-colors"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => onExport("pdf")}
            className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-medium flex items-center gap-2 text-red-700 transition-colors"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      )}
    </div>
  );
}

// --- MODALES (POS, PRODUCTO, DETALLE PEDIDO, HISTORIAL CLIENTE, KARDEX, CATEGORÍA) ---

function POSModal({ products, onClose, onSuccess }) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  
  // ESTADO PARA MÓVIL: Controla qué pantalla vemos ('products' o 'ticket')
  const [mobileView, setMobileView] = useState("products"); 

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const addToCart = (product) => {
    if (product.stock <= 0) return toast.error("Sin stock");
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return toast.error("Stock límite");
      setCart(
        cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      );
    } else setCart([...cart, { ...product, qty: 1 }]);
    toast.success("Agregado", { duration: 1000, position: 'bottom-center' });
  };

  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "orders");
        const counterDoc = await transaction.get(counterRef);
        let nextSeq = 1;
        if (counterDoc.exists()) {
          nextSeq = counterDoc.data().count + 1;
        }

        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const sequence = String(nextSeq).padStart(4, '0');
        const customId = `VF-${year}${month}${day}-${sequence}`;
        const newOrderRef = doc(db, "orders", customId);

        transaction.set(newOrderRef, {
          id: customId,
          customer_name: "Cliente Mostrador",
          customer_phone: "N/A",
          address: "Tienda Física",
          payment_method: paymentMethod,
          origin: "fisica",
          status: "completado",
          total: total,
          created_at: now.toISOString(),
          items: cart.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.qty,
            price: i.price
          }))
        });

        transaction.set(counterRef, { count: nextSeq });

        for (const item of cart) {
          const prodRef = doc(db, "products", item.id);
          transaction.update(prodRef, {
            stock: Number(item.stock) - Number(item.qty)
          });
        }
      });

      toast.success("Venta registrada");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white md:rounded-3xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        
        {/* --- COLUMNA IZQUIERDA: PRODUCTOS --- */}
        {/* En móvil: Solo visible si mobileView === 'products' */}
        <div className={`w-full md:w-2/3 bg-gray-50 flex flex-col h-full ${mobileView === 'products' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Header Productos */}
          <div className="p-4 md:p-6 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex gap-2 items-center">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Store className="text-green-600" size={24} />
                </div>
                Punto de Venta
              </h2>
              {/* Botón Cerrar (Solo visible en Desktop aquí) */}
              <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full">
                <X size={24} className="text-gray-500" />
              </button>
               {/* Botón Cerrar (Móvil) */}
               <button onClick={onClose} className="md:hidden p-2 bg-gray-100 rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar producto..."
                className="pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Productos */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0}
                  className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left flex flex-col justify-between h-full active:scale-95"
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.stock < 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {p.stock}
                      </span>
                    </div>
                    {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-20 object-contain mb-2 mix-blend-multiply" />
                    ) : (
                        <div className="w-full h-20 bg-gray-50 rounded-lg mb-2 flex items-center justify-center text-gray-300"><Package size={24}/></div>
                    )}
                    <span className="font-semibold text-slate-700 text-xs md:text-sm line-clamp-2 leading-tight">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-blue-600 font-bold text-sm md:text-base mt-2">
                    R$ {p.price.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* BOTÓN FLOTANTE MÓVIL (IR AL TICKET) */}
          <div className="md:hidden absolute bottom-4 left-4 right-4">
            <button 
                onClick={() => setMobileView("ticket")}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-xl flex justify-between items-center animate-bounce-in"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 px-2 py-1 rounded-lg text-xs">{totalItems} ítems</div>
                    <span>Ver Ticket</span>
                </div>
                <div className="text-xl">R$ {total.toFixed(2)}</div>
            </button>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: TICKET --- */}
        {/* En móvil: Solo visible si mobileView === 'ticket' */}
        <div className={`w-full md:w-1/3 bg-white flex-col h-full border-l border-gray-200 shadow-xl z-20 ${mobileView === 'ticket' ? 'flex fixed inset-0 md:static' : 'hidden md:flex'}`}>
          
          {/* Header Ticket */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 md:bg-white">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" /> Ticket de Venta
            </h3>
            
            {/* Botón Volver (Solo Móvil) */}
            <button onClick={() => setMobileView("products")} className="md:hidden text-sm font-bold text-blue-600 flex items-center gap-1">
                <ChevronLeft size={16} /> Volver
            </button>

            {/* Botón Cerrar (Solo Desktop) */}
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-red-500">
              <X size={20} />
            </button>
          </div>

          {/* Lista Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                    <ShoppingBag size={64} className="opacity-20" />
                    <p className="text-sm font-medium">Carrito vacío</p>
                    <button onClick={() => setMobileView("products")} className="md:hidden text-blue-500 text-sm font-bold">Agregar productos</button>
                </div>
            ) : (
                cart.map((item) => (
                <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-2 border-b border-gray-50 last:border-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded-lg text-xs">
                            x{item.qty}
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-700 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-400">Unit: R$ {item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 text-sm">
                            R$ {(item.qty * item.price).toFixed(2)}
                        </span>
                        <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                ))
            )}
          </div>

          {/* Footer Cobro */}
          <div className="p-5 border-t border-gray-100 bg-gray-50 md:bg-white pb-safe">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["efectivo", "pix", "tarjeta"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === m
                    ? "bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                >
                  {m === 'efectivo' && <DollarSign size={14}/>}
                  {m === 'tarjeta' && <CreditCard size={14}/>}
                  {m === 'pix' && <ZapIcon size={14}/>} 
                  {m}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 font-semibold text-sm">Total a cobrar</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                <span className="text-lg text-gray-400 font-normal mr-1">R$</span>
                {total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleFinalize}
              disabled={loading || cart.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Procesando...</> 
              ) : (
                <>
                    <CheckCircle size={24} /> COBRAR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icono auxiliar para Pix (si no tienes Lucide Zap, usa CreditCard o similar)
function ZapIcon({size}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
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
      `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag size={20} /> Pedido #{order.id}
            </h2>
            <p className="text-xs text-gray-300 font-mono mt-1">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
                <User size={14} /> Cliente
              </h3>
              <p className="font-semibold">{order.customer_name}</p>
              <p className="text-sm flex items-center gap-1 mt-1">
                <Phone size={12} /> {order.customer_phone}
              </p>
            </div>
            <div className="flex-1 p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
              <h3 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-1">
                <Truck size={14} /> Envío
              </h3>
              <p className="text-sm font-medium">{order.address}</p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/80 text-gray-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Cant</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="p-4 font-bold text-center bg-gray-50/30">{item.quantity}</td>
                    <td className="p-4">{item.name}</td>
                    <td className="p-4 text-right font-mono font-semibold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800 text-white">
                <tr>
                  <td colSpan="2" className="p-4 text-right font-bold uppercase text-xs">
                    Total ({order.payment_method}):
                  </td>
                  <td className="p-4 text-right font-bold text-lg">
                    R$ {Number(order.total).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => printOrderTicket(order)}
              className="flex items-center justify-center gap-2 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer size={20} /> Imprimir Ticket
            </button>
            <button
              onClick={sendWhatsAppUpdate}
              className="flex items-center justify-center gap-2 py-3 bg-green-100 text-green-700 rounded-xl font-semibold hover:bg-green-200 transition-colors"
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Estado</label>
            <div className="grid grid-cols-4 gap-2">
              {["pendiente", "preparando", "completado", "cancelado"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2.5 px-1 text-xs font-bold uppercase rounded-xl border-2 transition-all ${status === s
                    ? s === "cancelado"
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "bg-blue-100 border-blue-500 text-blue-700"
                    : "border-gray-100 text-gray-400 hover:border-gray-300"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Notas Privadas</label>
            <textarea
              className="w-full border border-gray-200 p-3 rounded-xl bg-yellow-50/30 mt-1.5 text-sm outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 transition-all"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
          <button
            onClick={() => onDelete(order.id)}
            className="text-red-400 hover:text-red-600 font-semibold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
          >
            Eliminar
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-slate-800 shadow-md transition-all"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-white/20">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={20} /> Historial de Cliente
            </h2>
            <p className="opacity-90 text-sm mt-1">
              {client.name} • {client.phone}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-100 text-center">
              <span className="text-xs text-blue-600 font-bold uppercase">Total Gastado</span>
              <p className="text-2xl font-black text-blue-900 mt-1">
                R$ {client.totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50/80 p-5 rounded-2xl border border-purple-100 text-center">
              <span className="text-xs text-purple-600 font-bold uppercase">Pedidos Totales</span>
              <p className="text-2xl font-black text-purple-900 mt-1">
                {client.ordersCount}
              </p>
            </div>
          </div>
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} /> Últimos Pedidos
          </h3>
          <div className="space-y-3">
            {client.history
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        Pedido #{order.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {new Date(order.created_at).toLocaleDateString()} • {order.payment_method}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${order.status === "cancelado"
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

function ProductFormModal({ product, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    category: product?.category || "",
    image: product?.image || "",
    isFeatured: product?.isFeatured || false,
    active: product?.active !== undefined ? product.active : true,
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
        badge_text: product.badge?.text || "",
        badge_color: product.badge?.color || "red",
      });
  }, [product]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Asume que la función compressImage está definida en el scope del archivo padre
      const compressedBase64 = await compressImage(file);
      setFormData({ ...formData, image: compressedBase64 });
      toast.success("Imagen procesada y ligera");
    } catch (error) {
      console.error("Error: ", error);
      toast.error("Error al procesar la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (formData.badge_text) {
      dataToSave.badge = { text: formData.badge_text, color: formData.badge_color };
    }
    delete dataToSave.badge_text;
    delete dataToSave.badge_color;
    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh] border border-white/20">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {product ? <Edit size={24} className="text-blue-600" /> : <Plus size={24} className="text-green-600" />}
            {product ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</label>
              <input
                required
                className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</label>
              <select
                className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {/* AQUI ESTÁ EL CAMBIO: Mapeo dinámico de categorías */}
                {categories && categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5 bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-2xl border border-yellow-200">
            <div>
              <label className="font-semibold text-sm text-yellow-800">Precio Venta</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full border border-yellow-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all mt-1.5"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-semibold text-sm text-yellow-800">Costo (Compra)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-yellow-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all mt-1.5"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-semibold text-sm text-yellow-800">Stock Actual</label>
              <input
                required
                type="number"
                className="w-full border border-yellow-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none transition-all mt-1.5"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Imagen</label>
            <div className="flex gap-3 mt-1.5">
              <input
                className="flex-1 border border-gray-200 p-3 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="URL de imagen"
              />
              <label className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 rounded-xl flex items-center cursor-pointer text-xs font-semibold shadow-md transition-all">
                <input type="file" hidden onChange={handleImageUpload} />
                {uploading ? "..." : "SUBIR"}
              </label>
            </div>
            {formData.image && (
              <img src={formData.image} alt="Vista previa" className="mt-3 h-16 w-16 object-contain rounded-xl border border-gray-200 p-1" />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</label>
            <textarea
              rows="3"
              className="w-full border border-gray-200 p-3 rounded-xl bg-white/50 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all mt-1.5"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-4 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductHistoryModal({ product, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = collection(db, "inventory_logs");
        const querySnapshot = await getDocs(q);
        const productLogs = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(log => log.product_id === product.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setLogs(productLogs);
      } catch (error) {
        console.error(error);
        toast.error("Error cargando historial");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [product]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-white/20">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History size={20} /> Kardex del Producto
            </h2>
            <p className="opacity-90 text-sm mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Cargando movimientos...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
              <History size={48} className="mb-3 opacity-20" />
              <p className="text-lg font-medium">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">Stock Actual</span>
                <span className="text-2xl font-black text-blue-600">{product.stock} u.</span>
              </div>

              <div className="relative border-l-2 border-gray-200 ml-5 pl-6 space-y-5 py-2">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${log.quantity_change > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${log.type === 'creacion' ? 'bg-blue-100 text-blue-700' :
                          log.type === 'venta' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {log.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-medium">
                          {log.quantity_change > 0 ? 'Entrada / Ajuste' : 'Salida / Ajuste'}
                        </span>
                        <span className={`font-mono font-bold text-lg ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400 text-right">
                        Stock resultante: {log.final_stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryFormModal({ onClose, onSave }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-sm shadow-2xl p-8 border border-white/20">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tags size={24} className="text-orange-600" />
            Nueva Categoría
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-600">Nombre</label>
            <input
              autoFocus
              className="w-full border border-gray-200 p-3 rounded-xl mt-1.5 bg-white/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition-all"
              placeholder="Ej: Salsas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GlobalHistoryModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Traemos los últimos 50 registros
        const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
        toast.error("Error cargando logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-white/20">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History size={20} /> Registro de Actividad (Audit Log)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          {loading ? <p className="text-center py-10">Cargando...</p> : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{log.user}</span>
                    </div>
                    <p className="text-xs text-gray-600">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap ml-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-center text-gray-400">No hay actividad registrada.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE MODAL DE GASTOS ---
function ExpenseModal({ onClose, onSave }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("operativo");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    onSave({ 
      description: desc, 
      amount: Number(amount), 
      category, 
      date: new Date().toISOString() 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-xl"><DollarSign className="text-red-600" size={20} /></div>
            Registrar Gasto
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Motivo</label>
            <input autoFocus className="w-full border p-3 rounded-xl mt-1 outline-none focus:border-red-500" placeholder="Ej: Pago de Luz" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Monto (R$)</label>
              <input type="number" step="0.01" className="w-full border p-3 rounded-xl mt-1 outline-none focus:border-red-500 font-bold text-red-600" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
              <select className="w-full border p-3 rounded-xl mt-1 bg-white" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="operativo">Operativo</option>
                <option value="proveedor">Proveedor</option>
                <option value="personal">Personal</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95">
            Registrar Salida
          </button>
        </form>
      </div>
    </div>
  );
}

function MobileNavBtn({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 w-14 transition-all duration-300 ${
        active ? 'text-slate-900 -translate-y-1' : 'text-gray-400'
      }`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-slate-100' : 'bg-transparent'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        {label}
      </span>
    </button>
  );
}