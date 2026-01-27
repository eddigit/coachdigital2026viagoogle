import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { TimeEntry } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const timeEntriesRouter = router({
  // Lister les entrées de temps pour une date donnée
  listByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      // Input date is YYYY-MM-DD string
      const start = new Date(input.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.date);
      end.setHours(23, 59, 59, 999);

      const snapshot = await firestore.collection('timeEntries')
        .where('userId', '==', ctx.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get(); // OrderBy needs index with filter, might fail if not indexed.
      // We sort in memory for safety

      const entries = snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));
      return entries.sort((a, b) => {
        // Sort by period, then createdAt
        const pOrder = { morning: 1, afternoon: 2, evening: 3 };
        if (pOrder[a.period] !== pOrder[b.period]) return pOrder[a.period] - pOrder[b.period];
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }),

  // Lister les entrées de temps pour une période donnée
  listByPeriod: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

      const snapshot = await firestore.collection('timeEntries')
        .where('userId', '==', ctx.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      const entries = snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));
      // Sort by date then period
      return entries.sort((a, b) => {
        const dDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dDiff !== 0) return dDiff;
        const pOrder = { morning: 1, afternoon: 2, evening: 3 };
        return pOrder[a.period] - pOrder[b.period];
      });
    }),

  // Créer une entrée de temps
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.string(),
        period: z.enum(["morning", "afternoon", "evening"]),
        type: z.enum(["billable", "non_billable"]),
        duration: z.number().optional(),
        hourlyRate: z.string().optional(),
        priority: z.number().min(1).max(5).default(3),
        status: z.enum(["planned", "in_progress", "completed"]).default("planned"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { date, hourlyRate, ...rest } = input;

      const insertData: any = {
        userId: ctx.user.id,
        date: new Date(date),
        hourlyRate: hourlyRate || null,
        ...rest,
      };

      const id = await getNextId('timeEntries');
      await firestore.collection('timeEntries').doc(String(id)).set({
        ...insertData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, id };
    }),

  // Mettre à jour une entrée de temps
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        period: z.enum(["morning", "afternoon", "evening"]).optional(),
        type: z.enum(["billable", "non_billable"]).optional(),
        duration: z.number().optional(),
        hourlyRate: z.string().optional(),
        priority: z.number().min(1).max(5).optional(),
        status: z.enum(["planned", "in_progress", "completed", "archived"]).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Convert dates
      const cleanUpdates: any = { ...updates };
      if (cleanUpdates.date) cleanUpdates.date = new Date(cleanUpdates.date);
      if (cleanUpdates.startTime) cleanUpdates.startTime = new Date(cleanUpdates.startTime);
      if (cleanUpdates.endTime) cleanUpdates.endTime = new Date(cleanUpdates.endTime);

      cleanUpdates.updatedAt = new Date();

      await firestore.collection('timeEntries').doc(String(id)).update(cleanUpdates);

      return { success: true };
    }),

  // Supprimer une entrée de temps
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await firestore.collection('timeEntries').doc(String(input.id)).delete();
      return { success: true };
    }),

  // Démarrer le chronomètre
  startTimer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await firestore.collection('timeEntries').doc(String(input.id)).update({
        startTime: new Date(),
        status: "in_progress",
        updatedAt: new Date()
      });
      return { success: true };
    }),

  // Arrêter le chronomètre
  stopTimer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await firestore.collection('timeEntries').doc(String(input.id)).get();
      if (!doc.exists) throw new Error("Entry not found");
      const entry = mapDoc<TimeEntry>(doc);

      if (!entry.startTime) throw new Error("Timer not started");

      const startTime = entry.startTime instanceof Date ? entry.startTime : new Date(entry.startTime as any); // Handle Firestore timestamp
      // Usually mapDoc converts Timestamp to Date if we had a converter, but here mapDoc casts data().
      // Firestore data() returns Timestamp objects. We need to convert them.
      // My mapDoc is simple cast. It doesn't convert Timestamps.
      // I should assume they might be Timestamps and convert if needed, or rely on JS Date compatible methods if Firestore SDK provides them (toDate()).
      // Firestore Timestamp has toDate().

      const startMs = (startTime as any).toDate ? (startTime as any).toDate().getTime() : new Date(startTime).getTime();

      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startMs) / 60000);

      await firestore.collection('timeEntries').doc(String(input.id)).update({
        endTime: endTime,
        duration: durationMinutes,
        status: "completed",
        updatedAt: new Date()
      });

      return { success: true, duration: durationMinutes };
    }),

  // Statistiques temps passé par client
  statsByClient: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

      const snapshot = await firestore.collection('timeEntries')
        .where('userId', '==', ctx.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();

      const entries = snapshot.docs.map(doc => mapDoc<TimeEntry>(doc));

      const stats = entries.reduce((acc: any, entry) => {
        const clientId = Number(entry.clientId || 0);
        if (!acc[clientId]) {
          acc[clientId] = {
            clientId,
            totalMinutes: 0,
            billableMinutes: 0,
            nonBillableMinutes: 0,
            entries: 0,
          };
        }
        acc[clientId].totalMinutes += entry.duration || 0;
        if (entry.type === "billable") {
          acc[clientId].billableMinutes += entry.duration || 0;
        } else {
          acc[clientId].nonBillableMinutes += entry.duration || 0;
        }
        acc[clientId].entries += 1;
        return acc;
      }, {});

      return Object.values(stats);
    }),
});
