import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CompanyInfo {
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  siret: string | null;
  tvaNumber: string | null;
  iban: string | null;
  bic: string | null;
}

interface ClientInfo {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  company: string | null;
}

interface DocumentLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface DocumentData {
  type: "quote" | "invoice";
  number: string;
  date: Date;
  dueDate?: Date;
  company: CompanyInfo;
  client: ClientInfo;
  lines: DocumentLine[];
  notes?: string;
  legalMentions?: string;
}

export function generateDocumentPDF(data: DocumentData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Couleur orange Coach Digital
  const primaryColor: [number, number, number] = [230, 126, 80]; // #E67E50
  const darkBg: [number, number, number] = [15, 23, 42];
  const textColor: [number, number, number] = [51, 51, 51];

  let yPos = margin;

  // Logo et en-tête
  doc.setFillColor(...primaryColor);
  doc.rect(margin, yPos, 15, 15, "F");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("G", margin + 5, yPos + 10);

  doc.setTextColor(...textColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.company.name || "COACH DIGITAL", margin + 20, yPos + 10);

  yPos += 25;

  // Informations entreprise
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.company.address) doc.text(data.company.address, margin, yPos);
  yPos += 5;
  if (data.company.postalCode && data.company.city) {
    doc.text(`${data.company.postalCode} ${data.company.city}`, margin, yPos);
    yPos += 5;
  }
  if (data.company.phone) doc.text(`Tél: ${data.company.phone}`, margin, yPos);
  yPos += 5;
  if (data.company.email) doc.text(`Email: ${data.company.email}`, margin, yPos);
  yPos += 5;
  if (data.company.siret) doc.text(`SIRET: ${data.company.siret}`, margin, yPos);
  yPos += 5;
  if (data.company.tvaNumber) doc.text(`TVA: ${data.company.tvaNumber}`, margin, yPos);

  // Type de document
  yPos = margin + 20;
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  const docTitle = data.type === "quote" ? "DEVIS" : "FACTURE";
  doc.text(docTitle, pageWidth - margin, yPos, { align: "right" });

  yPos += 10;
  doc.setFontSize(11);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.number}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;
  doc.text(`Date: ${data.date.toLocaleDateString("fr-FR")}`, pageWidth - margin, yPos, { align: "right" });
  
  if (data.dueDate && data.type === "invoice") {
    yPos += 6;
    doc.text(`Échéance: ${data.dueDate.toLocaleDateString("fr-FR")}`, pageWidth - margin, yPos, { align: "right" });
  }

  // Informations client
  yPos += 20;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT", margin, yPos);
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  if (data.client.company) {
    doc.text(data.client.company, margin, yPos);
    yPos += 5;
  }
  doc.text(data.client.name, margin, yPos);
  yPos += 5;
  if (data.client.address) {
    doc.text(data.client.address, margin, yPos);
    yPos += 5;
  }
  if (data.client.postalCode && data.client.city) {
    doc.text(`${data.client.postalCode} ${data.client.city}`, margin, yPos);
    yPos += 5;
  }
  if (data.client.email) {
    doc.text(data.client.email, margin, yPos);
    yPos += 5;
  }
  if (data.client.phone) {
    doc.text(data.client.phone, margin, yPos);
  }

  // Tableau des lignes
  yPos += 15;

  const tableData = data.lines.map((line) => {
    const totalHT = line.quantity * line.unitPrice;
    const totalTTC = totalHT * (1 + line.vatRate / 100);
    return [
      line.description,
      line.quantity.toString(),
      `${line.unitPrice.toFixed(2)} €`,
      `${line.vatRate}%`,
      `${totalHT.toFixed(2)} €`,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Description", "Qté", "Prix Unit. HT", "TVA", "Total HT"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // Calculs totaux
  const totalHT = data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const totalTVA = data.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice * (line.vatRate / 100),
    0
  );
  const totalTTC = totalHT + totalTVA;

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totaux à droite
  const totalsX = pageWidth - margin - 60;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total HT:", totalsX, yPos);
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });
  yPos += 7;
  doc.text("Total TVA:", totalsX, yPos);
  doc.text(`${totalTVA.toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC:", totalsX, yPos);
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - margin, yPos, { align: "right" });

  // Notes
  if (data.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5;
  }

  // Mentions légales en bas de page
  const pageHeight = doc.internal.pageSize.getHeight();
  yPos = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  if (data.legalMentions) {
    const legalLines = doc.splitTextToSize(data.legalMentions, pageWidth - 2 * margin);
    doc.text(legalLines, margin, yPos);
  }

  // Informations bancaires pour factures
  if (data.type === "invoice" && data.company.iban) {
    yPos += 10;
    doc.text(`IBAN: ${data.company.iban}`, margin, yPos);
    if (data.company.bic) {
      yPos += 4;
      doc.text(`BIC: ${data.company.bic}`, margin, yPos);
    }
  }

  return doc;
}

export function downloadDocumentPDF(data: DocumentData, filename?: string) {
  const doc = generateDocumentPDF(data);
  const defaultFilename = `${data.type === "quote" ? "devis" : "facture"}_${data.number}.pdf`;
  doc.save(filename || defaultFilename);
}
