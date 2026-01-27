import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { db as firestore } from "./firestore";
import { Lead, Task, Document, CalendarEvent } from "./schema";

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export const remindersRouter = router({
  getAll: protectedProcedure.query(async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Overdue Leads
    const leadsSnapshot = await firestore.collection('leads')
      // .where('nextFollowUpDate', '<', now) // Requires index on nextFollowUpDate
      // .where('nextFollowUpDate', '!=', null) 
      .get();

    // Memory filter for simplicity if index missing
    const overdueLeads = leadsSnapshot.docs.map(d => mapDoc<Lead>(d))
      .filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) < now)
      .filter(l => !["conclusion", "ordre"].includes(l.status));

    // Overdue Tasks
    const tasksSnapshot = await firestore.collection('tasks')
      .get();
    const overdueTasks = tasksSnapshot.docs.map(d => mapDoc<Task>(d))
      .filter(t => t.dueDate && new Date(t.dueDate) < now)
      .filter(t => !["done", "cancelled"].includes(t.status));

    // Unpaid Invoices
    const docsSnapshot = await firestore.collection('documents')
      .where('type', '==', 'invoice')
      .where('status', '==', 'sent')
      .get();

    const unpaidInvoices = docsSnapshot.docs.map(d => mapDoc<Document>(d))
      .filter(d => d.dueDate && new Date(d.dueDate) < now);

    // Upcoming Events (Today)
    const eventsSnapshot = await firestore.collection('calendarEvents')
      .where('startDate', '>=', now) // Future including now
      .where('startDate', '<', tomorrow)
      .get();

    const upcomingEvents = eventsSnapshot.docs.map(d => mapDoc<CalendarEvent>(d));

    return {
      overdueLeads: overdueLeads.map(l => ({
        id: Number(l.id),
        type: "lead" as const,
        title: `${l.firstName} ${l.lastName}`,
        subtitle: l.company || l.email || "",
        dueDate: l.nextFollowUpDate,
        status: l.status,
      })),
      overdueTasks: overdueTasks.map(t => ({
        id: Number(t.id),
        type: "task" as const,
        title: t.title,
        subtitle: t.description || "",
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
      })),
      unpaidInvoices: unpaidInvoices.map(d => ({
        id: Number(d.id),
        type: "invoice" as const,
        title: `Facture ${d.number}`,
        subtitle: `${d.totalTtc} €`,
        dueDate: d.dueDate,
        status: d.status,
      })),
      upcomingEvents: upcomingEvents.map(e => ({
        id: Number(e.id),
        type: "event" as const,
        title: e.title,
        subtitle: e.description || "",
        dueDate: e.startDate,
        eventType: e.type,
      })),
    };
  }),

  getCounts: protectedProcedure.query(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Same logic but just counts
    // We can't easily count with complex filters without reading docs unless we use dedicated counters or queries.
    // Reading docs is acceptable for moderate dataset.

    // Leads
    const leadsSnap = await firestore.collection('leads').get();
    const overdueLeadsCount = leadsSnap.docs.map(d => d.data())
      .filter(l => l.nextFollowUpDate && (l.nextFollowUpDate.toDate ? l.nextFollowUpDate.toDate() : new Date(l.nextFollowUpDate)) < now)
      .filter(l => !["conclusion", "ordre"].includes(l.status))
      .length;

    // Tasks
    const tasksSnap = await firestore.collection('tasks').get();
    const overdueTasksCount = tasksSnap.docs.map(d => d.data())
      .filter(t => t.dueDate && (t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate)) < now)
      .filter(t => !["done", "cancelled"].includes(t.status))
      .length;

    // Invoices
    const invSnap = await firestore.collection('documents')
      .where('type', '==', 'invoice')
      .where('status', '==', 'sent')
      .get();
    const unpaidInvoicesCount = invSnap.docs.map(d => d.data())
      .filter(d => d.dueDate && (d.dueDate.toDate ? d.dueDate.toDate() : new Date(d.dueDate)) < now)
      .length;

    // Events
    const eventsSnap = await firestore.collection('calendarEvents')
      .where('startDate', '>=', todayStart)
      .where('startDate', '<', todayEnd)
      .get();

    return {
      overdueLeads: overdueLeadsCount,
      overdueTasks: overdueTasksCount,
      unpaidInvoices: unpaidInvoicesCount,
      todayEvents: eventsSnap.size,
      total: overdueLeadsCount + overdueTasksCount + unpaidInvoicesCount,
    };
  }),
});
