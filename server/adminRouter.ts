import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  users, clients, clientUsers, projects, tasks, documents, documentLines,
  company, emailTemplates, leads, audiences, emailCampaigns, projectRequirements,
  projectCredentials, messages, calendarEvents, notifications, documentTemplates,
  projectVariables, timeEntries
} from "../drizzle/schema";

export const adminRouter = router({
  exportDatabase: protectedProcedure.query(async ({ ctx }) => {
    // Vérifier que l'utilisateur est admin
    if (ctx.user.role !== "admin") {
      throw new Error("Accès refusé : admin uniquement");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Base de données non disponible");
    }

    // Exporter toutes les tables
    const [
      usersData,
      clientsData,
      clientUsersData,
      projectsData,
      tasksData,
      documentsData,
      documentLinesData,
      companyData,
      emailTemplatesData,
      leadsData,
      audiencesData,
      emailCampaignsData,
      projectRequirementsData,
      projectCredentialsData,
      messagesData,
      calendarEventsData,
      notificationsData,
      documentTemplatesData,
      projectVariablesData,
      timeEntriesData
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(clients),
      db.select().from(clientUsers),
      db.select().from(projects),
      db.select().from(tasks),
      db.select().from(documents),
      db.select().from(documentLines),
      db.select().from(company),
      db.select().from(emailTemplates),
      db.select().from(leads),
      db.select().from(audiences),
      db.select().from(emailCampaigns),
      db.select().from(projectRequirements),
      db.select().from(projectCredentials),
      db.select().from(messages),
      db.select().from(calendarEvents),
      db.select().from(notifications),
      db.select().from(documentTemplates),
      db.select().from(projectVariables),
      db.select().from(timeEntries)
    ]);

    return {
      exportDate: new Date().toISOString(),
      version: "1.0",
      tables: {
        users: usersData,
        clients: clientsData,
        clientUsers: clientUsersData,
        projects: projectsData,
        tasks: tasksData,
        documents: documentsData,
        documentLines: documentLinesData,
        company: companyData,
        emailTemplates: emailTemplatesData,
        leads: leadsData,
        audiences: audiencesData,
        emailCampaigns: emailCampaignsData,
        projectRequirements: projectRequirementsData,
        projectCredentials: projectCredentialsData,
        messages: messagesData,
        calendarEvents: calendarEventsData,
        notifications: notificationsData,
        documentTemplates: documentTemplatesData,
        projectVariables: projectVariablesData,
        timeEntries: timeEntriesData
      }
    };
  })
});
