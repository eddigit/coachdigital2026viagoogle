import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { ProjectVariable } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const projectVariablesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const snapshot = await firestore.collection('projectVariables')
        .where('projectId', '==', input.projectId)
        .get();
      return snapshot.docs.map(doc => mapDoc<ProjectVariable>(doc));
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string(),
        value: z.string(),
        type: z.string(),
        description: z.string().optional(),
        isSecret: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const id = await getNextId('projectVariables');
      await firestore.collection('projectVariables').doc(String(id)).set({
        ...input,
        id
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        value: z.string().optional(),
        type: z.string().optional(),
        description: z.string().optional().nullable(),
        isSecret: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await firestore.collection('projectVariables').doc(String(id)).update(data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await firestore.collection('projectVariables').doc(String(input.id)).delete();
      return { success: true };
    }),
});
