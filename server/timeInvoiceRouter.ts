import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { db as firestore } from "./firestore";
import { TimeEntry, Client, Project } from "./schema";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

/**
 * Router pour la génération de factures de temps
 */
export const timeInvoiceRouter = router({
  // Générer une facture de temps en PDF
  generate: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        hourlyRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { clientId, projectId, startDate, endDate, hourlyRate } = input;
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Fetch entries by range
      const snapshot = await firestore.collection('timeEntries')
        .where('userId', '==', ctx.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      let entries = snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));

      // Filter in memory
      entries = entries.filter(e => e.type === "billable");
      if (clientId) entries = entries.filter(e => e.clientId == clientId);
      if (projectId) entries = entries.filter(e => e.projectId == projectId);

      if (entries.length === 0) {
        throw new Error("Aucune entrée facturable trouvée pour cette période");
      }

      // Informations client
      let client: Client | null = null;
      if (clientId) {
        const clientDoc = await firestore.collection('clients').doc(String(clientId)).get();
        if (clientDoc.exists) client = mapDoc<Client>(clientDoc);
      }

      // Informations projet
      let project: Project | null = null;
      if (projectId) {
        const projectDoc = await firestore.collection('projects').doc(String(projectId)).get();
        if (projectDoc.exists) project = mapDoc<Project>(projectDoc);
      }

      // Calculer les totaux
      const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const totalHours = totalMinutes / 60;

      // Utiliser le taux horaire fourni ou celui de la première entrée
      const rate = hourlyRate || parseFloat(String(entries[0].hourlyRate || "0"));
      const totalAmount = totalHours * rate;

      // Grouper par date et période
      // Helper for date string
      const toDateStr = (d: any) => {
        if (d && d.toDate) return d.toDate().toISOString().split('T')[0];
        if (d instanceof Date) return d.toISOString().split('T')[0];
        return String(d).split('T')[0];
      };

      const groupedEntries = entries.reduce((acc, entry) => {
        const dateKey = toDateStr(entry.date);
        if (!acc[dateKey]) {
          acc[dateKey] = {
            morning: [],
            afternoon: [],
            evening: [],
          };
        }
        if (acc[dateKey][entry.period]) {
          acc[dateKey][entry.period].push(entry);
        }
        return acc;
      }, {} as Record<string, Record<string, any[]>>);

      // Générer le PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let yPosition = height - 50;

      // En-tête
      page.drawText("FACTURE DE TEMPS", {
        x: 50,
        y: yPosition,
        size: 20,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;

      // Informations coach
      page.drawText("Coach Digital", {
        x: 50,
        y: yPosition,
        size: 12,
        font: fontBold,
      });
      yPosition -= 15;
      page.drawText("coachdigitalparis@gmail.com", {
        x: 50,
        y: yPosition,
        size: 10,
        font,
      });

      yPosition -= 30;

      // Informations client
      if (client) {
        page.drawText("Client:", {
          x: 50,
          y: yPosition,
          size: 12,
          font: fontBold,
        });
        yPosition -= 15;
        page.drawText(`${client.firstName} ${client.lastName}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font,
        });
        if (client.email) {
          yPosition -= 15;
          page.drawText(client.email, {
            x: 50,
            y: yPosition,
            size: 10,
            font,
          });
        }
        if (client.company) {
          yPosition -= 15;
          page.drawText(client.company, {
            x: 50,
            y: yPosition,
            size: 10,
            font,
          });
        }
      }

      yPosition -= 30;

      // Projet
      if (project) {
        page.drawText(`Projet: ${project.name}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: fontBold,
        });
        yPosition -= 20;
      }

      // Période
      page.drawText(`Période: ${startDate} au ${endDate}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
      });

      yPosition -= 30;

      // Ligne de séparation
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 20;

      // En-tête du tableau
      page.drawText("Date", { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText("Période", { x: 150, y: yPosition, size: 10, font: fontBold });
      page.drawText("Description", { x: 250, y: yPosition, size: 10, font: fontBold });
      page.drawText("Durée", { x: 450, y: yPosition, size: 10, font: fontBold });

      yPosition -= 15;

      // Ligne de séparation
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPosition -= 15;

      // Détail des entrées
      const sortedDates = Object.keys(groupedEntries).sort();

      for (const date of sortedDates) {
        const periods = groupedEntries[date];

        for (const [periodKey, periodEntries] of Object.entries(periods)) {
          if (periodEntries.length === 0) continue;

          const periodLabel =
            periodKey === "morning"
              ? "Matinée"
              : periodKey === "afternoon"
                ? "Après-midi"
                : "Soirée";

          for (const entry of periodEntries) {
            // Vérifier si on a besoin d'une nouvelle page
            if (yPosition < 100) {
              const newPage = pdfDoc.addPage([595, 842]);
              yPosition = height - 50;
            }

            const hours = Math.floor((entry.duration || 0) / 60);
            const minutes = (entry.duration || 0) % 60;
            const durationText = `${hours}h ${minutes}m`;

            page.drawText(date, { x: 50, y: yPosition, size: 9, font });
            page.drawText(periodLabel, { x: 150, y: yPosition, size: 9, font });

            // Tronquer la description si trop longue
            const description = entry.title.length > 30
              ? entry.title.substring(0, 27) + "..."
              : entry.title;
            page.drawText(description, { x: 250, y: yPosition, size: 9, font });
            page.drawText(durationText, { x: 450, y: yPosition, size: 9, font });

            yPosition -= 15;
          }
        }
      }

      yPosition -= 10;

      // Ligne de séparation
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 20;

      // Totaux
      page.drawText("TOTAL", {
        x: 50,
        y: yPosition,
        size: 12,
        font: fontBold,
      });

      page.drawText(`${totalHours.toFixed(2)} heures`, {
        x: 450,
        y: yPosition,
        size: 12,
        font: fontBold,
      });

      yPosition -= 20;

      page.drawText(`Taux horaire: ${rate.toFixed(2)} €`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
      });

      yPosition -= 20;

      page.drawText(`MONTANT TOTAL: ${totalAmount.toFixed(2)} € HT`, {
        x: 50,
        y: yPosition,
        size: 14,
        font: fontBold,
        color: rgb(0, 0.4, 0.8),
      });

      // Sauvegarder le PDF
      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString("base64");

      return {
        success: true,
        pdf: base64Pdf,
        totalHours: totalHours.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        entriesCount: entries.length,
      };
    }),

  // Obtenir un aperçu des données avant génération
  preview: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { clientId, projectId, startDate, endDate } = input;
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const snapshot = await firestore.collection('timeEntries')
        .where('userId', '==', ctx.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      let entries = snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));
      entries = entries.filter(e => e.type === "billable");
      if (clientId) entries = entries.filter(e => e.clientId == clientId);
      if (projectId) entries = entries.filter(e => e.projectId == projectId);

      const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const totalHours = totalMinutes / 60;

      // Calculer le taux horaire moyen
      const entriesWithRate = entries.filter((e) => e.hourlyRate && parseFloat(String(e.hourlyRate)) > 0);
      const averageRate =
        entriesWithRate.length > 0
          ? entriesWithRate.reduce((sum, e) => sum + parseFloat(String(e.hourlyRate || "0")), 0) /
          entriesWithRate.length
          : 0;

      return {
        entriesCount: entries.length,
        totalHours: totalHours.toFixed(2),
        averageRate: averageRate.toFixed(2),
        estimatedAmount: (totalHours * averageRate).toFixed(2),
      };
    }),
});
