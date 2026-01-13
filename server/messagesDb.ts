import { eq, and, or, desc } from "drizzle-orm";
import { getDb } from "./db";
import { messages, type InsertMessage } from "../drizzle/schema";

/**
 * Récupérer les messages pour un utilisateur (admin ou client)
 */
export async function getMessagesForUser(
  userId: number,
  userType: "admin" | "client"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(messages)
    .where(
      or(
        and(
          eq(messages.recipientId, userId),
          eq(messages.recipientType, userType)
        ),
        and(
          eq(messages.senderId, userId),
          eq(messages.senderType, userType)
        )
      )
    )
    .orderBy(desc(messages.createdAt));
}

/**
 * Récupérer la conversation entre deux utilisateurs
 */
export async function getConversation(
  user1Id: number,
  user1Type: "admin" | "client",
  user2Id: number,
  user2Type: "admin" | "client"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(messages)
    .where(
      or(
        and(
          eq(messages.senderId, user1Id),
          eq(messages.senderType, user1Type),
          eq(messages.recipientId, user2Id),
          eq(messages.recipientType, user2Type)
        ),
        and(
          eq(messages.senderId, user2Id),
          eq(messages.senderType, user2Type),
          eq(messages.recipientId, user1Id),
          eq(messages.recipientType, user1Type)
        )
      )
    )
    .orderBy(messages.createdAt);
}

/**
 * Créer un nouveau message
 */
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  return Number(result[0].insertId);
}

/**
 * Marquer un message comme lu
 */
export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(messages)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(messages.id, messageId));
}

/**
 * Marquer tous les messages d'une conversation comme lus
 */
export async function markConversationAsRead(
  recipientId: number,
  recipientType: "admin" | "client",
  senderId: number,
  senderType: "admin" | "client"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(messages)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(messages.recipientId, recipientId),
        eq(messages.recipientType, recipientType),
        eq(messages.senderId, senderId),
        eq(messages.senderType, senderType),
        eq(messages.isRead, false)
      )
    );
}

/**
 * Compter les messages non lus pour un utilisateur
 */
export async function countUnreadMessages(
  userId: number,
  userType: "admin" | "client"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.recipientId, userId),
        eq(messages.recipientType, userType),
        eq(messages.isRead, false)
      )
    );
  
  return result.length;
}

/**
 * Récupérer un message par ID
 */
export async function getMessageById(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  
  return result[0] || null;
}
