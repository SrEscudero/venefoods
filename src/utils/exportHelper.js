import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <--- IMPORTACIÓN CORREGIDA
import * as XLSX from "xlsx";
import { saveAs } from 'file-saver';

// --- 1. EXPORTAR A EXCEL ---
export const exportToExcel = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// --- 2. EXPORTAR A CSV ---
export const exportToCSV = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${fileName}.csv`);
};

// --- 3. EXPORTAR A TXT ---
export const exportToTXT = (data, fileName) => {
  const textOutput = JSON.stringify(data, null, 2);
  const blob = new Blob([textOutput], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${fileName}.txt`);
};

// --- 4. EXPORTAR A PDF (REPORTE ADMINISTRATIVO) ---
export const exportToPDF = (title, columns, data, fileName) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

  // Preparar datos: Convertir objetos a array de arrays
  // Esto asume que las llaves del objeto coinciden con los nombres de las columnas
  // O simplemente toma los valores en orden
  const tableBody = data.map(row => Object.values(row));

  // Generar Tabla usando la función importada (CORRECCIÓN CLAVE)
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] }, // Color slate-800
    styles: { fontSize: 10, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] } // Color slate-50
  });

  doc.save(`${fileName}.pdf`);
};

// --- 5. IMPRIMIR TICKET TÉRMICO (COMANDA) ---
export const generateOrderReceipt = (order) => {
  // Configurado para papel térmico de 80mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Ancho 80mm, Alto dinámico (se ajusta al contenido visualmente)
  });

  let y = 10; // Cursor vertical inicial

  // --- Encabezado ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VENEFOODS", 40, y, { align: "center" });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Sabor Venezolano en Passo Fundo", 40, y, { align: "center" });
  y += 5;
  doc.text("------------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // --- Datos del Pedido ---
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
  // Ajuste texto largo dirección
  const addressLines = doc.splitTextToSize(`Dir: ${order.address || 'Retiro en tienda'}`, 70);
  doc.text(addressLines, 5, y);
  y += (addressLines.length * 4) + 2;
  
  doc.text("------------------------------------------------", 40, y, { align: "center" });
  y += 5;

  // --- Items ---
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

  // --- Totales ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Subtotal, Descuento, Envío (si existen en la orden)
  if (order.subtotal && order.total !== order.subtotal) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", 5, y);
      doc.text(`R$ ${Number(order.subtotal).toFixed(2)}`, 75, y, { align: "right" });
      y += 4;
      
      if (order.discount > 0) {
          doc.text("Descuento:", 5, y);
          doc.text(`- R$ ${Number(order.discount).toFixed(2)}`, 75, y, { align: "right" });
          y += 4;
      }
      
      if (order.shipping_cost > 0) {
          doc.text("Envío:", 5, y);
          doc.text(`+ R$ ${Number(order.shipping_cost).toFixed(2)}`, 75, y, { align: "right" });
          y += 4;
      }
      y += 2;
  }

  // Total Final
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 5, y);
  doc.text(`R$ ${Number(order.total).toFixed(2)}`, 75, y, { align: "right" });
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Método: ${order.payment_method ? order.payment_method.toUpperCase() : 'N/A'}`, 5, y);
  y += 8;

  // --- Notas y Pie ---
  if (order.customer_notes) {
      doc.text("Notas:", 5, y);
      y += 4;
      doc.setFont("helvetica", "italic");
      const splitNotes = doc.splitTextToSize(order.customer_notes, 70);
      doc.text(splitNotes, 5, y);
      y += (splitNotes.length * 4) + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.text("¡Gracias por tu compra!", 40, y, { align: "center" });

  // Abrir PDF para imprimir
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};