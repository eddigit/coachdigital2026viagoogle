import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const notesRouter = router({
  // Lister toutes les notes
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allNotes = await db
      .select()
      .from(schema.notes)
      .orderBy(desc(schema.notes.pinned), desc(schema.notes.createdAt));
    return allNotes;
  }),

  // Lister les notes par client
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }: { input: { clientId: number } }) => {
      const db = await getDb();
      if (!db) return [];
      const clientNotes = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.clientId, input.clientId))
        .orderBy(desc(schema.notes.pinned), desc(schema.notes.createdAt));
      return clientNotes;
    }),

  // Lister les notes par projet
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }: { input: { projectId: number } }) => {
      const db = await getDb();
      if (!db) return [];
      const projectNotes = await db
        .select()
        .from(schema.notes)
        .where(eq(schema.notes.projectId, input.projectId))
        .orderBy(desc(schema.notes.pinned), desc(schema.notes.createdAt));
      return projectNotes;
    }),

  // Créer une note
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        color: z.enum(["yellow", "blue", "green", "red", "purple", "orange"]).default("yellow"),
        pinned: z.boolean().default(false),
        isClientVisible: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(schema.notes).values(input);
      return { success: true, id: result[0].insertId };
    }),

  // Mettre à jour une note
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        color: z.enum(["yellow", "blue", "green", "red", "purple", "orange"]).optional(),
        pinned: z.boolean().optional(),
        isClientVisible: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }: { input: Partial<z.infer<typeof schema.notes.$inferSelect>> & { id: number } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updateData } = input;
      await db
        .update(schema.notes)
        .set(updateData)
        .where(eq(schema.notes.id, id));
      return { success: true };
    }),

  // Supprimer une note
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(schema.notes).where(eq(schema.notes.id, input.id));
      return { success: true };
    }),

  // Épingler/désépingler une note
  togglePin: protectedProcedure
    .input(z.object({ id: z.number(), pinned: z.boolean() }))
    .mutation(async ({ input }: { input: { id: number; pinned: boolean } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(schema.notes)
        .set({ pinned: input.pinned })
        .where(eq(schema.notes.id, input.id));
      return { success: true };
    }),
});
