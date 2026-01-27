import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { CalendarEvent, InsertCalendarEvent } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

/**
 * Récupérer tous les événements
 */
export async function getAllEvents() {
  const snapshot = await firestore.collection('calendarEvents').orderBy('startDate').get();
  return snapshot.docs.map(doc => mapDoc<CalendarEvent>(doc));
}

/**
 * Récupérer les événements dans une plage de dates
 */
export async function getEventsByDateRange(startDate: Date, endDate: Date) {
  const snapshot = await firestore.collection('calendarEvents')
    .where('startDate', '>=', startDate)
    .where('startDate', '<=', endDate)
    .orderBy('startDate')
    .get();
  return snapshot.docs.map(doc => mapDoc<CalendarEvent>(doc));
}

/**
 * Récupérer les événements d'un client
 */
export async function getEventsByClient(clientId: number) {
  const snapshot = await firestore.collection('calendarEvents')
    .where('clientId', '==', clientId)
    .orderBy('startDate')
    .get();
  return snapshot.docs.map(doc => mapDoc<CalendarEvent>(doc));
}

/**
 * Récupérer les événements d'un projet
 */
export async function getEventsByProject(projectId: number) {
  const snapshot = await firestore.collection('calendarEvents')
    .where('projectId', '==', projectId)
    .orderBy('startDate')
    .get();
  return snapshot.docs.map(doc => mapDoc<CalendarEvent>(doc));
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(eventId: number) {
  const doc = await firestore.collection('calendarEvents').doc(String(eventId)).get();
  if (!doc.exists) return null;
  return mapDoc<CalendarEvent>(doc);
}

/**
 * Créer un événement
 */
export async function createEvent(data: InsertCalendarEvent) {
  const id = await getNextId('calendarEvents');
  await firestore.collection('calendarEvents').doc(String(id)).set({
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return id;
}

/**
 * Mettre à jour un événement
 */
export async function updateEvent(eventId: number, data: Partial<InsertCalendarEvent>) {
  await firestore.collection('calendarEvents').doc(String(eventId)).update({
    ...data,
    updatedAt: new Date()
  });
}

/**
 * Supprimer un événement
 */
export async function deleteEvent(eventId: number) {
  await firestore.collection('calendarEvents').doc(String(eventId)).delete();
}

/**
 * Récupérer les prochaines échéances (factures + tâches)
 */
export async function getUpcomingDeadlines() {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const snapshot = await firestore.collection('calendarEvents')
    .where('type', '==', 'deadline')
    .where('startDate', '>=', now)
    .where('startDate', '<=', in30Days)
    .orderBy('startDate')
    .get();
  return snapshot.docs.map(doc => mapDoc<CalendarEvent>(doc));
}
