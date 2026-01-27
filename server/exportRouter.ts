import { router, protectedProcedure } from "./_core/trpc";
import { getAllClients, getAllDocuments } from "./db";
import { db as firestore } from "./firestore";
import { Lead } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const exportRouter = router({
  clients: protectedProcedure.query(async () => {
    const allClients = await getAllClients();

    const headers = [
      "ID", "Prénom", "Nom", "Email", "Téléphone", "Entreprise", "Poste",
      "Adresse", "Code Postal", "Ville", "Pays", "Catégorie", "Statut", "Notes", "Créé le"
    ];

    const rows = allClients.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.email || "",
      c.phone || "",
      c.company || "",
      c.position || "",
      c.address || "",
      c.postalCode || "",
      c.city || "",
      c.country || "",
      c.category,
      c.status,
      (c.notes || "").replace(/[\n\r]/g, " "),
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "",
    ]);

    return { headers, rows };
  }),

  leads: protectedProcedure.query(async () => {
    const snapshot = await firestore.collection('leads').get();
    const allLeads = snapshot.docs.map(doc => mapDoc<Lead>(doc));

    const headers = [
      "ID", "Prénom", "Nom", "Email", "Téléphone", "Entreprise", "Poste",
      "Statut", "Montant Potentiel", "Probabilité", "Score", "Source",
      "Prochaine Relance", "Notes", "Créé le"
    ];

    const rows = allLeads.map(l => [
      l.id,
      l.firstName,
      l.lastName,
      l.email || "",
      l.phone || "",
      l.company || "",
      l.position || "",
      l.status,
      l.potentialAmount || "0",
      l.probability || 0,
      l.score || 0,
      l.source || "",
      l.nextFollowUpDate ? new Date(l.nextFollowUpDate).toLocaleDateString("fr-FR") : "",
      (l.notes || "").replace(/[\n\r]/g, " "),
      l.createdAt ? new Date(l.createdAt).toLocaleDateString("fr-FR") : "",
    ]);

    return { headers, rows };
  }),

  documents: protectedProcedure.query(async () => {
    const allDocuments = await getAllDocuments();

    const headers = [
      "ID", "Numéro", "Type", "Client", "Statut", "Date",
      "Date Échéance", "Total HT", "Total TVA", "Total TTC", "Objet", "Créé le"
    ];

    const rows = allDocuments.map((d: any) => [
      d.id,
      d.number,
      d.type === "quote" ? "Devis" : d.type === "invoice" ? "Facture" : "Avoir",
      d.clientId,
      d.status,
      d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "",
      d.dueDate ? new Date(d.dueDate).toLocaleDateString("fr-FR") : "",
      d.totalHt || "0",
      d.totalTva || "0",
      d.totalTtc || "0",
      (d.subject || "").replace(/[\n\r]/g, " "),
      d.createdAt ? new Date(d.createdAt).toLocaleDateString("fr-FR") : "",
    ]);

    return { headers, rows };
  }),

  invoicesDetailed: protectedProcedure.query(async () => {
    const allDocuments = await getAllDocuments();
    const allClients = await getAllClients();

    const clientMap = new Map(allClients.map((c: any) => [c.id, `${c.firstName} ${c.lastName}`]));

    const invoices = allDocuments.filter((d: any) => d.type === "invoice");

    const headers = [
      "Numéro", "Client", "Date", "Échéance", "Statut",
      "Total HT", "Total TVA", "Total TTC", "Payé le"
    ];

    const rows = invoices.map((d: any) => [
      d.number,
      clientMap.get(d.clientId) || `Client #${d.clientId}`,
      d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "",
      d.dueDate ? new Date(d.dueDate).toLocaleDateString("fr-FR") : "",
      d.status === "paid" ? "Payée" : d.status === "sent" ? "Envoyée" : d.status,
      d.totalHt || "0",
      d.totalTva || "0",
      d.totalTtc || "0",
      d.paidAt ? new Date(d.paidAt).toLocaleDateString("fr-FR") : "",
    ]);

    return { headers, rows };
  }),
});
