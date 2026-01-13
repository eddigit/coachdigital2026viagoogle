import jsPDF from "jspdf";

interface RequirementData {
  title: string;
  version: number;
  status: string;
  projectName: string;
  clientName: string;
  description?: string;
  objectives?: string;
  scope?: string;
  constraints?: string;
  deliverables?: string;
  timeline?: string;
  budget?: string;
  createdAt: Date;
  companyName: string;
}

export function generateRequirementPDF(data: RequirementData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Couleur orange Coach Digital
  const primaryColor: [number, number, number] = [230, 126, 80]; // #E67E50
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
  doc.text(data.companyName, margin + 20, yPos + 10);

  yPos += 30;

  // Titre du document
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("CAHIER DES CHARGES", margin, yPos);

  yPos += 15;

  // Titre du projet
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(data.title, contentWidth);
  doc.text(titleLines, margin, yPos);
  yPos += titleLines.length * 7 + 5;

  // Informations du document
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const infoLines = [
    `Projet: ${data.projectName}`,
    `Client: ${data.clientName}`,
    `Version: ${data.version}`,
    `Statut: ${getStatusLabel(data.status)}`,
    `Date: ${data.createdAt.toLocaleDateString("fr-FR")}`,
  ];

  infoLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Ligne de séparation
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Sections du cahier des charges
  const sections = [
    { title: "Description générale", content: data.description },
    { title: "Objectifs", content: data.objectives },
    { title: "Périmètre / Fonctionnalités", content: data.scope },
    { title: "Contraintes", content: data.constraints },
    { title: "Livrables", content: data.deliverables },
    { title: "Planning", content: data.timeline },
  ];

  sections.forEach((section) => {
    if (section.content) {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      // Titre de la section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text(section.title, margin, yPos);
      yPos += 8;

      // Contenu de la section
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      const contentLines = doc.splitTextToSize(section.content, contentWidth);
      
      contentLines.forEach((line: string) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 5;
      });

      yPos += 10;
    }
  });

  // Budget
  if (data.budget) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Budget estimé", margin, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(`${parseFloat(data.budget).toFixed(2)} €`, margin, yPos);
    yPos += 15;
  }

  // Pied de page sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${data.companyName} - Cahier des charges - Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
}

export function downloadRequirementPDF(data: RequirementData, filename?: string) {
  const doc = generateRequirementPDF(data);
  const defaultFilename = `cahier_des_charges_${data.projectName.replace(/\s+/g, "_")}_v${data.version}.pdf`;
  doc.save(filename || defaultFilename);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Brouillon",
    review: "En révision",
    approved: "Approuvé",
    archived: "Archivé",
  };
  return labels[status] || status;
}
