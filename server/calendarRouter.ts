import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as calendarDb from "./calendarDb";

export const calendarRouter = router({
  /**
   * Lister tous les événements
   */
  list: protectedProcedure.query(async () => {
    return await calendarDb.getAllEvents();
  }),

  /**
   * Récupérer les événements dans une plage de dates
   */
  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await calendarDb.getEventsByDateRange(input.startDate, input.endDate);
    }),

  /**
   * Récupérer les événements d'un client
   */
  getByClient: protectedProcedure
    .input(z.object({
      clientId: z.number(),
    }))
    .query(async ({ input }) => {
      return await calendarDb.getEventsByClient(input.clientId);
    }),

  /**
   * Récupérer les événements d'un projet
   */
  getByProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await calendarDb.getEventsByProject(input.projectId);
    }),

  /**
   * Récupérer un événement par ID
   */
  getById: protectedProcedure
    .input(z.object({
      eventId: z.number(),
    }))
    .query(async ({ input }) => {
      return await calendarDb.getEventById(input.eventId);
    }),

  /**
   * Créer un événement
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      taskId: z.number().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
      allDay: z.boolean().default(false),
      location: z.string().optional(),
      type: z.enum(["meeting", "call", "deadline", "reminder", "event", "other"]).default("event"),
      color: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const eventId = await calendarDb.createEvent({
        ...input,
        createdById: 1, // Admin ID
      });

      return { success: true, eventId };
    }),

  /**
   * Mettre à jour un événement
   */
  update: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      taskId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      allDay: z.boolean().optional(),
      location: z.string().optional(),
      type: z.enum(["meeting", "call", "deadline", "reminder", "event", "other"]).optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { eventId, ...data } = input;
      await calendarDb.updateEvent(eventId, data);
      return { success: true };
    }),

  /**
   * Supprimer un événement
   */
  delete: protectedProcedure
    .input(z.object({
      eventId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await calendarDb.deleteEvent(input.eventId);
      return { success: true };
    }),

  /**
   * Récupérer les prochaines échéances
   */
  getUpcomingDeadlines: protectedProcedure.query(async () => {
    return await calendarDb.getUpcomingDeadlines();
  }),
});
