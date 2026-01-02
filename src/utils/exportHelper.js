import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- FUNCIONES EXISTENTES (Excel, CSV, TXT) ---
export const exportToExcel = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToCSV = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${fileName}.csv`);
};

export const exportToTXT = (data, fileName) => {
  const textOutput = JSON.stringify(data, null, 2);
  const blob = new Blob([textOutput], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${fileName}.txt`);
};

export const exportToPDF = (title, columns, data, fileName) => {
  const doc = new jsPDF();
  doc.text(title, 20, 10);
  
  const tableRows = data.map(item => Object.values(item));
  
  doc.autoTable({
    head: [columns],
    body: tableRows,
    startY: 20,
  });
  
  doc.save(`${fileName}.pdf`);
};

// --- NUEVA FUNCIÓN: IMPRIMIR COMANDA TÉRMICA ---
export const generateOrderReceipt = (order) => {
  // Configurado para papel térmico de 80mm (aprox 226px de ancho en PDF units) o A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Ancho 80mm, Alto variable (ajustable)
  });

  let y = 10; // Cursor vertical

  // 1. Encabezado
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("VENEFOODS", 40, y, { align: "center" });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Sabor Venezolano en Passo Fundo", 40, y, { align: "center" });
  y += 5;
  doc.text("------------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // 2. Datos del Pedido
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Pedido #${order.id}`, 5, y);
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 5, y);
  y += 4;
  doc.text(`Cliente: ${order.customer_name}`, 5, y);
  y += 4;
  doc.text(`Tel: ${order.customer_phone || 'N/A'}`, 5, y);
  y += 4;
  doc.text(`Dir: ${order.address || 'Retiro en tienda'}`, 5, y);
  y += 5;
  doc.text("------------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // 3. Items
  doc.setFont("helvetica", "bold");
  doc.text("CANT  PRODUCTO", 5, y);
  doc.text("TOTAL", 75, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal");

  order.items.forEach((item) => {
    const name = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
    const lineTotal = (item.price * item.quantity).toFixed(2);
    
    doc.text(`${item.quantity} x`, 5, y);
    doc.text(`${name}`, 15, y);
    doc.text(`R$ ${lineTotal}`, 75, y, { align: "right" });
    y += 4;
  });

  y += 2;
  doc.text("------------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // 4. Totales
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL A PAGAR:", 5, y);
  doc.text(`R$ ${Number(order.total).toFixed(2)}`, 75, y, { align: "right" });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Método: ${order.payment_method.toUpperCase()}`, 5, y);
  y += 8;

  // 5. Notas y Pie
  if (order.customer_notes) {
      doc.text("Notas:", 5, y);
      y += 4;
      doc.setFont("helvetica", "italic");
      // Dividir texto largo
      const splitNotes = doc.splitTextToSize(order.customer_notes, 70);
      doc.text(splitNotes, 5, y);
      y += (splitNotes.length * 4) + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.text("¡Gracias por tu compra!", 40, y, { align: "center" });

  // Guardar/Abrir
  doc.autoPrint(); // Intenta abrir diálogo de impresión
  window.open(doc.output('bloburl'), '_blank');
};