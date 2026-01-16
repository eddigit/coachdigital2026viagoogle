import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { audiences, leads } from "../drizzle/schema";
import { eq, sql, inArray } from "drizzle-orm";

export const audiencesRouter = router({
  // Liste toutes les audiences
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(audiences)
      .where(eq(audiences.isActive, true))
      .orderBy(audiences.name);
    return result;
  }),

  // Récupère une audience par ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [audience] = await db
        .select()
        .from(audiences)
        .where(eq(audiences.id, input.id));
      return audience;
    }),

  // Crée une nouvelle audience
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366F1"),
      icon: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(audiences).values({
        name: input.name,
        description: input.description || null,
        color: input.color,
        icon: input.icon || null,
      });
      const insertId = typeof result === 'object' && 'insertId' in result ? result.insertId : result[0];
      return { id: insertId, ...input };
    }),

  // Met à jour une audience
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      icon: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      await db.update(audiences).set(data).where(eq(audiences.id, id));
      return { success: true };
    }),

  // Supprime une audience (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Réassigner les leads de cette audience à "Général"
      const generalAudienceResult = await db
        .select()
        .from(audiences)
        .where(eq(audiences.name, "Général"));
      
      if (generalAudienceResult.length > 0) {
        // Récupérer le nom de l'audience à supprimer
        const audienceToDeleteResult = await db
          .select()
          .from(audiences)
          .where(eq(audiences.id, input.id));
        
        if (audienceToDeleteResult.length > 0) {
          await db
            .update(leads)
            .set({ audience: "Général" })
            .where(eq(leads.audience, audienceToDeleteResult[0].name));
        }
      }
      
      // Soft delete
      await db.update(audiences).set({ isActive: false }).where(eq(audiences.id, input.id));
      return { success: true };
    }),

  // Statistiques par audience
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const audiencesList = await db
      .select()
      .from(audiences)
      .where(eq(audiences.isActive, true));
    
    const stats = await Promise.all(
      audiencesList.map(async (audience) => {
        const leadStatsResult = await db
          .select({
            count: sql<number>`COUNT(*)`,
            totalPotential: sql<number>`COALESCE(SUM(${leads.potentialAmount}), 0)`,
            converted: sql<number>`SUM(CASE WHEN ${leads.convertedToClientId} IS NOT NULL THEN 1 ELSE 0 END)`,
          })
          .from(leads)
          .where(eq(leads.audience, audience.name));
        
        const leadStats = leadStatsResult[0];
        
        return {
          ...audience,
          leadsCount: leadStats?.count || 0,
          totalPotential: leadStats?.totalPotential || 0,
          convertedCount: leadStats?.converted || 0,
        };
      })
    );
    
    return stats;
  }),

  // Assigner une audience à plusieurs leads
  assignToLeads: protectedProcedure
    .input(z.object({
      audienceName: z.string(),
      leadIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(leads)
        .set({ audience: input.audienceName })
        .where(inArray(leads.id, input.leadIds));
      return { success: true, count: input.leadIds.length };
    }),

  // Changer la phase de plusieurs leads
  changePhaseForLeads: protectedProcedure
    .input(z.object({
      status: z.enum(["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"]),
      leadIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(leads)
        .set({ status: input.status })
        .where(inArray(leads.id, input.leadIds));
      return { success: true, count: input.leadIds.length };
    }),
});
