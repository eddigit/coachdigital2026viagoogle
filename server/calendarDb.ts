import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "./db";
import { calendarEvents, type InsertCalendarEvent } from "../drizzle/schema";

/**
 * Récupérer tous les événements
 */
export async function getAllEvents() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(calendarEvents)
    .orderBy(calendarEvents.startDate);
}

/**
 * Récupérer les événements dans une plage de dates
 */
export async function getEventsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.startDate, endDate)
      )
    )
    .orderBy(calendarEvents.startDate);
}

/**
 * Récupérer les événements d'un client
 */
export async function getEventsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.clientId, clientId))
    .orderBy(calendarEvents.startDate);
}

/**
 * Récupérer les événements d'un projet
 */
export async function getEventsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.projectId, projectId))
    .orderBy(calendarEvents.startDate);
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, eventId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Créer un événement
 */
export async function createEvent(data: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(calendarEvents).values(data);
  return Number(result[0].insertId);
}

/**
 * Mettre à jour un événement
 */
export async function updateEvent(eventId: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(calendarEvents)
    .set(data)
    .where(eq(calendarEvents.id, eventId));
}

/**
 * Supprimer un événement
 */
export async function deleteEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.id, eventId));
}

/**
 * Récupérer les prochaines échéances (factures + tâches)
 */
export async function getUpcomingDeadlines() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  
  return await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.type, "deadline"),
        gte(calendarEvents.startDate, now),
        lte(calendarEvents.startDate, in30Days)
      )
    )
    .orderBy(calendarEvents.startDate);
}
