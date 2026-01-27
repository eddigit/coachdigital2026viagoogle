import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { Message, InsertMessage } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

/**
 * Récupérer les messages pour un utilisateur (admin ou client)
 */
export async function getMessagesForUser(
  userId: number,
  userType: "admin" | "client"
) {
  // Firestore OR query simulation
  const received = await firestore.collection('messages')
    .where('recipientId', '==', userId)
    .where('recipientType', '==', userType)
    .get();

  const sent = await firestore.collection('messages')
    .where('senderId', '==', userId)
    .where('senderType', '==', userType)
    .get();

  const allDocs = [...received.docs, ...sent.docs];
  // Deduplicate by ID just in case (though logic shouldn't overlap usually unless self-message)
  const uniqueDocs = Array.from(new Map(allDocs.map(d => [d.id, d])).values());

  const messages = uniqueDocs.map(doc => mapDoc<Message>(doc));

  // Sort descending
  return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
  const q1 = await firestore.collection('messages')
    .where('senderId', '==', user1Id)
    .where('senderType', '==', user1Type)
    .where('recipientId', '==', user2Id)
    .where('recipientType', '==', user2Type)
    .get();

  const q2 = await firestore.collection('messages')
    .where('senderId', '==', user2Id)
    .where('senderType', '==', user2Type)
    .where('recipientId', '==', user1Id)
    .where('recipientType', '==', user1Type)
    .get();

  const allDocs = [...q1.docs, ...q2.docs];
  const uniqueDocs = Array.from(new Map(allDocs.map(d => [d.id, d])).values());
  const messages = uniqueDocs.map(doc => mapDoc<Message>(doc));

  // Sort ascending for conversation
  return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Créer un nouveau message
 */
export async function createMessage(data: InsertMessage) {
  const id = await getNextId('messages');
  await firestore.collection('messages').doc(String(id)).set({
    ...data,
    id,
    createdAt: new Date(),
    isRead: false
  });
  return id;
}

/**
 * Marquer un message comme lu
 */
export async function markMessageAsRead(messageId: number) {
  await firestore.collection('messages').doc(String(messageId)).update({
    isRead: true,
    readAt: new Date(),
  });
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
  // Query messages where I am recipient and sender is other, and isRead is false
  const snapshot = await firestore.collection('messages')
    .where('recipientId', '==', recipientId)
    .where('recipientType', '==', recipientType)
    .where('senderId', '==', senderId)
    .where('senderType', '==', senderType)
    .where('isRead', '==', false)
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isRead: true, readAt: new Date() });
  });
  await batch.commit();
}

/**
 * Compter les messages non lus pour un utilisateur
 */
export async function countUnreadMessages(
  userId: number,
  userType: "admin" | "client"
) {
  // Usually this needs a count aggregation
  const snapshot = await firestore.collection('messages')
    .where('recipientId', '==', userId)
    .where('recipientType', '==', userType)
    .where('isRead', '==', false)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Récupérer un message par ID
 */
export async function getMessageById(messageId: number) {
  const doc = await firestore.collection('messages').doc(String(messageId)).get();
  if (!doc.exists) return null;
  return mapDoc<Message>(doc);
}
