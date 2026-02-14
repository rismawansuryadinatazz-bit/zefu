
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface PdfReportOptions {
  title: string;
  subtitle?: string;
  userName: string;
  headers: string[];
  data: any[][];
  fileName: string;
}

export const generatePdfReport = ({ 
  title, 
  subtitle, 
  userName, 
  headers, 
  data, 
  fileName 
}: PdfReportOptions) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // Branding & Header
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text("STOCK LAUNDRY", 14, 20);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("© COPYRIGHT SURYADINATA 2026", 14, 25);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 35);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 42);
  }

  // Metadata
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dihasilkan oleh: ${userName}`, 14, doc.internal.pageSize.height - 15);
  doc.text(`Tanggal Cetak: ${timestamp}`, 14, doc.internal.pageSize.height - 10);
  doc.text(`Halaman: 1`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);

  // Table
  (doc as any).autoTable({
    startY: subtitle ? 48 : 40,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { 
      fillColor: [79, 70, 229], 
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 40 }
  });

  doc.save(`${fileName}_${new Date().getTime()}.pdf`);
};
