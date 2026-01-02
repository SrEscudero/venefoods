import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// --- GENERAR EXCEL (.xlsx) ---
export const exportToExcel = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString()}.xlsx`);
};

// --- GENERAR CSV (.csv) ---
export const exportToCSV = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${fileName}_${new Date().toLocaleDateString()}.csv`);
};

// --- GENERAR TEXTO (.txt) ---
export const exportToTXT = (data, fileName) => {
  let textContent = `REPORTE: ${fileName}\nFECHA: ${new Date().toLocaleString()}\n-----------------------------------\n\n`;
  
  data.forEach((item, index) => {
    textContent += `ITEM #${index + 1}:\n`;
    Object.keys(item).forEach(key => {
      textContent += `${key.toUpperCase()}: ${item[key]}\n`;
    });
    textContent += `-----------------------------------\n`;
  });

  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${fileName}_${new Date().toLocaleDateString()}.txt`);
};

// --- GENERAR PDF (.pdf) ---
export const exportToPDF = (title, columns, data, fileName) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // Tabla
  doc.autoTable({
    startY: 40,
    head: [columns],
    body: data.map(item => Object.values(item)),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 163, 74] } // Color verde estilo Venefoods
  });

  doc.save(`${fileName}_${new Date().toLocaleDateString()}.pdf`);
};