import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { leads, tasks, documents, calendarEvents } from "../drizzle/schema";
import { eq, lt, and, or, isNotNull, not, inArray } from "drizzle-orm";

export const remindersRouter = router({
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { overdueLeads: [], overdueTasks: [], unpaidInvoices: [], upcomingEvents: [] };

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const overdueLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          isNotNull(leads.nextFollowUpDate),
          lt(leads.nextFollowUpDate, now),
          not(inArray(leads.status, ["conclusion", "ordre"]))
        )
      );

    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, now),
          not(inArray(tasks.status, ["done", "cancelled"]))
        )
      );

    const unpaidInvoices = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.type, "invoice"),
          eq(documents.status, "sent"),
          isNotNull(documents.dueDate),
          lt(documents.dueDate, now)
        )
      );

    const upcomingEvents = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          lt(calendarEvents.startDate, tomorrow),
          not(lt(calendarEvents.startDate, now))
        )
      );

    return {
      overdueLeads: overdueLeads.map(l => ({
        id: l.id,
        type: "lead" as const,
        title: `${l.firstName} ${l.lastName}`,
        subtitle: l.company || l.email || "",
        dueDate: l.nextFollowUpDate,
        status: l.status,
      })),
      overdueTasks: overdueTasks.map(t => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        subtitle: t.description || "",
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
      })),
      unpaidInvoices: unpaidInvoices.map(d => ({
        id: d.id,
        type: "invoice" as const,
        title: `Facture ${d.number}`,
        subtitle: `${d.totalTtc} €`,
        dueDate: d.dueDate,
        status: d.status,
      })),
      upcomingEvents: upcomingEvents.map(e => ({
        id: e.id,
        type: "event" as const,
        title: e.title,
        subtitle: e.description || "",
        dueDate: e.startDate,
        eventType: e.type,
      })),
    };
  }),

  getCounts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { overdueLeads: 0, overdueTasks: 0, unpaidInvoices: 0, todayEvents: 0, total: 0 };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const overdueLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          isNotNull(leads.nextFollowUpDate),
          lt(leads.nextFollowUpDate, now),
          not(inArray(leads.status, ["conclusion", "ordre"]))
        )
      );

    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, now),
          not(inArray(tasks.status, ["done", "cancelled"]))
        )
      );

    const unpaidInvoices = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.type, "invoice"),
          eq(documents.status, "sent"),
          isNotNull(documents.dueDate),
          lt(documents.dueDate, now)
        )
      );

    const todayEvents = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          lt(calendarEvents.startDate, todayEnd),
          not(lt(calendarEvents.startDate, todayStart))
        )
      );

    return {
      overdueLeads: overdueLeads.length,
      overdueTasks: overdueTasks.length,
      unpaidInvoices: unpaidInvoices.length,
      todayEvents: todayEvents.length,
      total: overdueLeads.length + overdueTasks.length + unpaidInvoices.length,
    };
  }),
});
