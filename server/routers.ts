import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getDb } from "./db";
import * as clientAuth from "./clientAuth";
import { clientUsers, projectRequirements } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyDocumentCreated, notifyQuoteConverted, getClientLoginUrl } from "./emailNotifications";
import { stripeRouter } from "./stripeRouter";
import { uploadRouter } from "./uploadRouter";
import { messagesRouter } from "./messagesRouter";
import { calendarRouter } from "./calendarRouter";
import { projectVariablesRouter } from "./projectVariablesRouter";
import { projectNotesRouter } from "./projectNotesRouter";
import { notificationsRouter } from "./notificationsRouter";
import { documentTemplatesRouter } from "./documentTemplatesRouter";
import { timeEntriesRouter } from "./timeEntriesRouter";
import { timeInvoiceRouter } from "./timeInvoiceRouter";
import { leadsRouter, emailTemplatesRouter } from "./leadsRouter";
import { notesRouter } from "./notesRouter";
import { emailCampaignsRouter } from "./emailCampaignsRouter";
import { emailTrackingRouter } from "./emailTrackingRouter";
import { smtpRouter } from "./smtpRouter";
import { reviewsRouter } from "./reviewsRouter";
import { exportRouter } from "./exportRouter";
import { remindersRouter } from "./remindersRouter";
import { documentTrackingRouter, signatureRouter } from "./documentSignatureRouter";
import { projectSecretsRouter } from "./projectSecretsRouter";
import { audiencesRouter } from "./audiencesRouter";

// ============================================================================
// SCHEMAS
// ============================================================================

const clientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("France"),
  category: z.enum(["prospect", "active", "vip", "inactive"]).default("prospect"),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional().nullable(),
});

const projectSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["website", "app", "coaching", "ia_integration", "optimization", "other"]),
  status: z.enum(["draft", "active", "on_hold", "completed", "cancelled"]).default("draft"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  estimatedHours: z.string().optional().nullable(),
  budgetEstimate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const taskSchema = z.object({
  projectId: z.number().optional().nullable(),
  clientId: z.number().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).default("todo"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  estimatedHours: z.string().optional().nullable(),
  isBillable: z.boolean().default(true),
  hourlyRate: z.string().optional().nullable(),
});

const companySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  tvaNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("France"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  bic: z.string().optional().nullable(),
  defaultTvaRate: z.string().default("20.00"),
  defaultPaymentTerms: z.number().default(30),
  legalMentions: z.string().optional().nullable(),
});

// ============================================================================
// APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  stripe: stripeRouter,
  upload: uploadRouter,
  messages: messagesRouter,
  calendar: calendarRouter,
  timeEntries: timeEntriesRouter,
  timeInvoice: timeInvoiceRouter,
  leads: leadsRouter,
  emailTemplates: emailTemplatesRouter,
  emailCampaigns: emailCampaignsRouter,
  emailTracking: emailTrackingRouter,
  notes: notesRouter,
  reviews: reviewsRouter,
  export: exportRouter,
  reminders: remindersRouter,
  documentTracking: documentTrackingRouter,
  signatures: signatureRouter,
  projectSecrets: projectSecretsRouter,
  audiences: audiencesRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // STATS
  // ==========================================================================
  
  stats: router({
    get: protectedProcedure.query(async () => {
      return await db.getStats();
    }),
  }),

  // ==========================================================================
  // COMPANY
  // ==========================================================================
  
  company: router({
    get: protectedProcedure.query(async () => {
      return await db.getCompany();
    }),
    
    upsert: protectedProcedure
      .input(companySchema)
      .mutation(async ({ input }) => {
        const id = await db.upsertCompany(input);
        return { id };
      }),
  }),

  // ==========================================================================
  // CLIENTS
  // ==========================================================================
  
  clients: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllClients();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchClients(input.query);
      }),
    
    create: protectedProcedure
      .input(clientSchema)
      .mutation(async ({ input }) => {
        const id = await db.createClient(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: clientSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        await db.updateClient(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
  }),
  
  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================

  // ==========================================================================
  // PROJECTS
  // ==========================================================================
  
  projects: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProjects();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),
    
    byClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectsByClientId(input.clientId);
      }),
    
    create: protectedProcedure
      .input(projectSchema)
      .mutation(async ({ input }) => {
        const id = await db.createProject(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: projectSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        await db.updateProject(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // TASKS
  // ==========================================================================
  
  tasks: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTasks();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),
    
    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProjectId(input.projectId);
      }),
    
    byClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByClientId(input.clientId);
      }),
    
    create: protectedProcedure
      .input(taskSchema)
      .mutation(async ({ input }) => {
        const id = await db.createTask(input);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: taskSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTask(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================
  
  documents: router({
    list: protectedProcedure.query(async () => {
      const docs = await db.getAllDocuments();
      // Récupérer les lignes pour chaque document
      const docsWithLines = await Promise.all(
        docs.map(async (doc) => {
          const lines = await db.getDocumentLinesByDocumentId(doc.id);
          return { ...doc, lines };
        })
      );
      return docsWithLines;
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const document = await db.getDocumentById(input.id);
        if (!document) return null;
        
        const lines = await db.getDocumentLinesByDocumentId(input.id);
        return { ...document, lines };
      }),
    
    byClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByClientId(input.clientId);
      }),
    
    listByClientUser: publicProcedure
      .input(z.object({ clientUserId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        // Trouver le client associé au clientUser
        const result = await database
          .select()
          .from(clientUsers)
          .where(eq(clientUsers.id, input.clientUserId))
          .limit(1);
        
        if (result.length === 0) return [];
        
        // Récupérer tous les documents du client
        return await db.getDocumentsByClientId(result[0].clientId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        projectId: z.number().optional().nullable(),
        type: z.enum(["quote", "invoice", "credit_note"]),
        date: z.date(),
        dueDate: z.date().optional().nullable(),
        validityDate: z.date().optional().nullable(),
        subject: z.string().optional().nullable(),
        introduction: z.string().optional().nullable(),
        conclusion: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        paymentTerms: z.number().default(30),
        paymentMethod: z.enum(["bank_transfer", "check", "card", "cash", "other"]).optional().nullable(),
        isAcompteRequired: z.boolean().default(false),
        acomptePercentage: z.string().optional().nullable(),
        lines: z.array(z.object({
          description: z.string(),
          quantity: z.string(),
          unit: z.string().default("unité"),
          unitPriceHt: z.string(),
          tvaRate: z.string().default("20.00"),
        })),
      }))
      .mutation(async ({ input }) => {
        const documentId = await db.createDocument(input);
        
        // Les notifications automatiques sont désactivées
        // L'envoi d'emails se fait manuellement via le bouton "Envoyer par email"
        
        return documentId;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "paid", "cancelled"]).optional(),
        subject: z.string().optional().nullable(),
        introduction: z.string().optional().nullable(),
        conclusion: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        pdfUrl: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateDocument(input.id, input);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDocument(input.id);
      }),
    
    convertToInvoice: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .mutation(async ({ input }) => {
        // Récupérer le devis avec ses lignes
        const quote = await db.getDocumentById(input.quoteId);
        if (!quote) {
          throw new Error("Devis introuvable");
        }
        
        if (quote.type !== "quote") {
          throw new Error("Ce document n'est pas un devis");
        }
        
        const lines = await db.getDocumentLinesByDocumentId(input.quoteId);
        
        // Créer la facture avec les mêmes données
        const invoiceId = await db.createDocument({
          clientId: quote.clientId,
          projectId: quote.projectId,
          type: "invoice",
          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          validityDate: null,
          subject: quote.subject,
          introduction: quote.introduction,
          conclusion: quote.conclusion,
          notes: `Facture générée depuis le devis ${quote.number}`,
          paymentTerms: quote.paymentTerms,
          paymentMethod: quote.paymentMethod,
          isAcompteRequired: quote.isAcompteRequired,
          acomptePercentage: quote.acomptePercentage,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: line.quantity || "1",
            unit: line.unit || "unité",
            unitPriceHt: line.unitPriceHt,
            tvaRate: line.tvaRate,
          })),
        });
        
        // Les notifications automatiques sont désactivées
        // L'envoi d'emails se fait manuellement via le bouton "Envoyer par email"
        
        return { success: true, invoiceId };
      }),
    
    getNextNumber: protectedProcedure
      .input(z.object({ type: z.enum(["quote", "invoice", "credit_note"]) }))
      .query(async ({ input }) => {
        return await db.getNextDocumentNumber(input.type);
      }),
    
    sendByEmail: protectedProcedure
      .input(z.object({ 
        documentId: z.number(),
        pdfBase64: z.string(),
        customMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Récupérer le document
        const document = await db.getDocumentById(input.documentId);
        if (!document) {
          throw new Error("Document introuvable");
        }
        
        // Récupérer le client
        const client = await db.getClientById(document.clientId);
        if (!client || !client.email) {
          throw new Error("Client introuvable ou sans email");
        }
        
        const docType = document.type === "quote" ? "Devis" : "Facture";
        const subject = `${docType} ${document.number} - Coach Digital`;
        
        const defaultMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E67E50;">Votre ${docType.toLowerCase()}</h2>
            <p>Bonjour ${client.firstName},</p>
            <p>Veuillez trouver ci-joint votre ${docType.toLowerCase()} n° ${document.number}.</p>
            <p><strong>Montant total TTC :</strong> ${parseFloat(document.totalTtc || "0").toFixed(2)} €</p>
            ${document.dueDate ? `<p><strong>Échéance :</strong> ${new Date(document.dueDate).toLocaleDateString("fr-FR")}</p>` : ""}
            <p>Pour accéder à votre espace client et consulter vos documents, cliquez sur le lien ci-dessous :</p>
            <p><a href="https://coachdigital.biz/client" style="color: #E67E50;">Accéder à mon espace client</a></p>
            <p>Cordialement,<br/>Coach Digital Paris</p>
          </div>
        `;
        
        const { sendEmail } = await import("./emailService");
        const sent = await sendEmail({
          to: client.email,
          subject,
          html: input.customMessage || defaultMessage,
          attachments: [{
            filename: `${docType.toLowerCase()}_${document.number}.pdf`,
            content: Buffer.from(input.pdfBase64, "base64"),
            contentType: "application/pdf",
          }],
        });
        
        if (!sent) {
          throw new Error("Erreur lors de l'envoi de l'email");
        }
        
        // Mettre à jour le statut du document à "sent" s'il était en brouillon
        if (document.status === "draft") {
          await db.updateDocument(input.documentId, { status: "sent" });
        }
        
        return { success: true, sentTo: client.email };
      }),
  }),

  // ==========================================================================
  // CLIENT REQUESTS (Demandes clients)
  // ==========================================================================
  
  clientRequests: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["coaching_ia", "site_web", "application", "optimisation", "autre"]),
        title: z.string().min(1),
        description: z.string().min(1),
        context: z.string().optional(),
        budget: z.number(),
        deadline: z.string(),
        priority: z.enum(["basse", "moyenne", "haute", "urgente"]),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createClientRequest(input);
        
        // Envoyer notification email au coach
        try {
          const { sendEmail } = await import("./emailService");
          const ownerEmail = process.env.SMTP_USER || "coachdigitalparis@gmail.com";
          await sendEmail({
            to: ownerEmail,
            subject: `Nouvelle demande client : ${input.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #E67E50;">Nouvelle demande client</h2>
                <p><strong>Type:</strong> ${input.type}</p>
                <p><strong>Budget:</strong> ${input.budget}€</p>
                <p><strong>Délai:</strong> ${input.deadline}</p>
                <p><strong>Priorité:</strong> ${input.priority}</p>
                <h3>Description</h3>
                <p style="white-space: pre-wrap;">${input.description}</p>
                ${input.context ? `<h3>Contexte</h3><p style="white-space: pre-wrap;">${input.context}</p>` : ""}
              </div>
            `,
            text: `Type: ${input.type}\nBudget: ${input.budget}€\nDélai: ${input.deadline}\nPriorité: ${input.priority}\n\nDescription:\n${input.description}${input.context ? `\n\nContexte:\n${input.context}` : ""}`,
          });
        } catch (error) {
          console.error("Erreur notification email:", error);
        }
        
        return { success: true, id };
      }),
    
    list: protectedProcedure.query(async () => {
      return await db.getAllClientRequests();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientRequestById(input.id);
      }),
  }),

  // ==========================================================================
  // CLIENT AUTH (Authentification espace client séparé)
  // ==========================================================================
  
  clientAuth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await clientAuth.authenticateClientUser(input.email, input.password);
        if (result.success && result.user) {
          // Générer un token simple (dans un vrai projet, utiliser JWT)
          const token = `client_${result.user.id}_${Date.now()}`;
          return { success: true, token, user: result.user };
        }
        return { success: false, error: result.error };
      }),
    
    createClientUser: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        return await clientAuth.createClientUser(input);
      }),
    
    generateInvitation: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const token = await clientAuth.generateInvitationToken(input.clientId, input.email);
        const invitationUrl = `${process.env.VITE_APP_URL || 'https://coachdigital.biz'}/client/invitation/${token}`;
        
        // Envoyer l'email d'invitation
        const { sendEmail } = await import("./emailService");
        await sendEmail({
          to: input.email,
          subject: "Invitation à votre espace client - Coach Digital",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #E67E50;">Bienvenue sur votre espace client</h2>
              <p>Bonjour,</p>
              <p>Vous avez été invité à accéder à votre espace client sécurisé.</p>
              <p>Cliquez sur le lien ci-dessous pour créer votre compte :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="background-color: #E67E50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Créer mon compte</a>
              </p>
              <p style="color: #6b7280; font-size: 12px;">Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">Coach Digital - Accompagnement numérique et intégration IA</p>
            </div>
          `,
          text: `Bienvenue sur votre espace client\n\nVous avez été invité à accéder à votre espace client sécurisé.\n\nCliquez sur le lien ci-dessous pour créer votre compte :\n${invitationUrl}\n\nCoach Digital - Accompagnement numérique et intégration IA`,
        });
        
        return { success: true, token, invitationUrl };
      }),
    
    acceptInvitation: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        return await clientAuth.acceptInvitation(input.token, input.password);
      }),
  }),

  // ==========================================================================
  // PROJECT CREDENTIALS (Coffre-fort RGPD)
  // ==========================================================================
  
  vault: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectCredentials(input.projectId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const credential = await db.getProjectCredentialById(input.id);
        if (!credential) throw new Error("Credential not found");
        
        // Logger l'accès
        await db.logCredentialAccess({
          credentialId: input.id,
          accessedBy: ctx.user!.id,
          accessType: "view",
        });
        
        return credential;
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.enum(["hosting", "api", "smtp", "domain", "cms", "database", "other"]),
        label: z.string().min(1),
        description: z.string().optional().nullable(),
        credentialData: z.record(z.string(), z.any()), // Données à chiffrer
        url: z.string().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { encryptCredentials } = await import("./encryption");
        const encryptedData = encryptCredentials(input.credentialData);
        
        const id = await db.createProjectCredential({
          projectId: input.projectId,
          category: input.category,
          label: input.label,
          description: input.description,
          encryptedData,
          url: input.url,
          expiresAt: input.expiresAt,
          notes: input.notes,
        });
        
        return { success: true, id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        credentialData: z.record(z.string(), z.any()).optional(),
        url: z.string().optional().nullable(),
        expiresAt: z.date().optional().nullable(),
        notes: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, credentialData, ...rest } = input;
        
        let encryptedData: string | undefined;
        if (credentialData) {
          const { encryptCredentials } = await import("./encryption");
          encryptedData = encryptCredentials(credentialData);
        }
        
        await db.updateProjectCredential(id, {
          ...rest,
          encryptedData,
        });
        
        // Logger l'accès
        await db.logCredentialAccess({
          credentialId: id,
          accessedBy: ctx.user!.id,
          accessType: "edit",
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Logger l'accès avant suppression
        await db.logCredentialAccess({
          credentialId: input.id,
          accessedBy: ctx.user!.id,
          accessType: "delete",
        });
        
        await db.deleteProjectCredential(input.id);
        return { success: true };
      }),
    
    decrypt: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const credential = await db.getProjectCredentialById(input.id);
        if (!credential) throw new Error("Credential not found");
        
        const { decryptCredentials } = await import("./encryption");
        const decryptedData = decryptCredentials(credential.encryptedData);
        
        // Logger l'accès
        await db.logCredentialAccess({
          credentialId: input.id,
          accessedBy: ctx.user!.id,
          accessType: "view",
        });
        
        return { ...credential, decryptedData };
      }),
    
    logs: protectedProcedure
      .input(z.object({ credentialId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCredentialAccessLogs(input.credentialId);
      }),
  }),

  // ==========================================================================
  // PROJECT REQUIREMENTS (Cahier des charges)
  // ==========================================================================
  
  requirements: router({
    listAll: protectedProcedure
      .query(async () => {
        // Récupérer tous les requirements
        const db_inst = await db.getDb();
        if (!db_inst) throw new Error("Database not available");
        return await db_inst.select().from(projectRequirements);
      }),
    
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectRequirements(input.projectId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectRequirementById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        objectives: z.string().optional().nullable(),
        scope: z.string().optional().nullable(),
        constraints: z.string().optional().nullable(),
        deliverables: z.string().optional().nullable(),
        timeline: z.string().optional().nullable(),
        budget: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createProjectRequirement({
          ...input,
          createdBy: ctx.user!.id,
        });
        return { success: true, id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        objectives: z.string().optional().nullable(),
        scope: z.string().optional().nullable(),
        constraints: z.string().optional().nullable(),
        deliverables: z.string().optional().nullable(),
        timeline: z.string().optional().nullable(),
        budget: z.string().optional().nullable(),
        status: z.enum(["draft", "review", "approved", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProjectRequirement(id, data);
        return { success: true };
      }),
    
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.approveProjectRequirement(input.id, ctx.user!.id);
        return { success: true };
      }),
  }),
  
  // ==========================================================================
  // PROJECT VARIABLES & NOTES
  // ==========================================================================
  
  projectVariables: projectVariablesRouter,
  projectNotes: projectNotesRouter,
  
  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================
  
  notifications: notificationsRouter,
  
  // ==========================================================================
  // DOCUMENT TEMPLATES
  // ==========================================================================
  
  documentTemplates: documentTemplatesRouter,
  
  // ==========================================================================
  // SMTP CONFIGURATION
  // ==========================================================================
  
  smtp: smtpRouter,
});

export type AppRouter = typeof appRouter;
