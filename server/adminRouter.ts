import { router, protectedProcedure } from "./_core/trpc";
import { db as firestore } from "./firestore";

const fetchCollection = async (collectionName: string) => {
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const adminRouter = router({
  exportDatabase: protectedProcedure.query(async ({ ctx }) => {
    // Vérifier que l'utilisateur est admin
    if (ctx.user.role !== "admin") {
      throw new Error("Accès refusé : admin uniquement");
    }

    const collections = [
      "users",
      "clients",
      "clientUsers",
      "projects",
      "tasks",
      "documents",
      // "documentLines" embedded
      "company",
      "emailTemplates",
      "leads",
      "audiences",
      "emailCampaigns",
      "emailQueue", // Added
      "projectRequirements",
      "projectCredentials",
      "messages",
      "calendarEvents",
      "notifications",
      "documentTemplates",
      "projectVariables",
      "timeEntries",
      "notes",
      "projectNotes",
      "documentSignatures",
      "documentTracking",
      "documentViews",
      "emailTracking",
      "emailBlacklist"
    ];

    const results = await Promise.all(collections.map(fetchCollection));

    // Convert to object
    const tables: Record<string, any> = {};
    collections.forEach((name, index) => {
      tables[name] = results[index];
    });

    return {
      exportDate: new Date().toISOString(),
      version: "2.0",
      tables
    };
  })
});
