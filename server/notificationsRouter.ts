import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { Notification } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const snapshot = await firestore.collection('notifications')
      .where('userId', '==', ctx.user.id)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => mapDoc<Notification>(doc));
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const snapshot = await firestore.collection('notifications')
      .where('userId', '==', ctx.user.id)
      .where('isRead', '==', false)
      .count()
      .get();

    return snapshot.data().count;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Security check: ensure notification belongs to user?
      // Drizzle query did: where(id=id, userId=userId).
      // Firestore: fetch, check, update.
      const ref = firestore.collection('notifications').doc(String(input.id));
      const doc = await ref.get();
      if (!doc.exists) return { success: false };
      const data = doc.data();
      if (data?.userId !== ctx.user.id) return { success: false };

      await ref.update({ isRead: true });
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const snapshot = await firestore.collection('notifications')
      .where('userId', '==', ctx.user.id)
      .where('isRead', '==', false)
      .get();

    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ref = firestore.collection('notifications').doc(String(input.id));
      const doc = await ref.get();
      if (!doc.exists) return { success: false };
      const data = doc.data();
      if (data?.userId !== ctx.user.id) return { success: false };

      await ref.delete();
      return { success: true };
    }),
});
