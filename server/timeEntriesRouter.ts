import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { timeEntries } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export const timeEntriesRouter = router({
  // Lister les entrées de temps pour une date donnée
  listByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, ctx.user.id),
            sql`DATE(${timeEntries.date}) = DATE(${input.date})`
          )
        )
        .orderBy(timeEntries.period, timeEntries.createdAt);

      return entries;
    }),

  // Lister les entrées de temps pour une période donnée
  listByPeriod: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, ctx.user.id),
            sql`DATE(${timeEntries.date}) >= DATE(${input.startDate})`,
            sql`DATE(${timeEntries.date}) <= DATE(${input.endDate})`
          )
        )
        .orderBy(timeEntries.date, timeEntries.period);

      return entries;
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
        status: z.enum(["planned", "in_progress", "completed"]).default("planned"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { date, hourlyRate, ...rest } = input;
      
      // Préparer les données pour l'insertion
      const insertData: any = {
        userId: ctx.user.id,
        date: new Date(date),
        ...rest,
      };
      
      // Ajouter hourlyRate seulement s'il est défini
      if (hourlyRate) {
        insertData.hourlyRate = hourlyRate;
      }
      
      const result = await db.insert(timeEntries).values(insertData);

      // Récupérer l'ID inséré
      const insertId = result[0]?.insertId;
      if (!insertId) {
        throw new Error("Failed to get insert ID");
      }

      return { success: true, id: Number(insertId) };
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
        status: z.enum(["planned", "in_progress", "completed"]).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      // Convertir les dates string en Date
      const cleanUpdates: any = { ...updates };
      if (cleanUpdates.date) {
        cleanUpdates.date = new Date(cleanUpdates.date);
      }
      if (cleanUpdates.startTime) {
        cleanUpdates.startTime = new Date(cleanUpdates.startTime);
      }
      if (cleanUpdates.endTime) {
        cleanUpdates.endTime = new Date(cleanUpdates.endTime);
      }

      await db
        .update(timeEntries)
        .set(cleanUpdates)
        .where(
          and(
            eq(timeEntries.id, id),
            eq(timeEntries.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Supprimer une entrée de temps
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(timeEntries)
        .where(
          and(
            eq(timeEntries.id, input.id),
            eq(timeEntries.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Démarrer le chronomètre pour une entrée
  startTimer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(timeEntries)
        .set({
          startTime: new Date(),
          status: "in_progress",
        })
        .where(
          and(
            eq(timeEntries.id, input.id),
            eq(timeEntries.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Arrêter le chronomètre et calculer la durée
  stopTimer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer l'entrée pour calculer la durée
      const [entry] = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.id, input.id),
            eq(timeEntries.userId, ctx.user.id)
          )
        );

      if (!entry || !entry.startTime) {
        throw new Error("Entry not found or timer not started");
      }

      const endTime = new Date();
      const startTime = new Date(entry.startTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      await db
        .update(timeEntries)
        .set({
          endTime: endTime,
          duration: durationMinutes,
          status: "completed",
        })
        .where(
          and(
            eq(timeEntries.id, input.id),
            eq(timeEntries.userId, ctx.user.id)
          )
        );

      return { success: true, duration: durationMinutes };
    }),

  // Statistiques temps passé par client
  statsByClient: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Cette requête nécessiterait un JOIN avec la table clients
      // Pour l'instant, on retourne les entrées groupées par clientId
      const entries = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, ctx.user.id),
            sql`DATE(${timeEntries.date}) >= DATE(${input.startDate})`,
            sql`DATE(${timeEntries.date}) <= DATE(${input.endDate})`
          )
        );

      // Grouper par clientId et calculer les totaux
      const stats = entries.reduce((acc: any, entry) => {
        const clientId = entry.clientId || 0;
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
