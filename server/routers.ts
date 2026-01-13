import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
      return await db.getAllDocuments();
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
  }),
});

export type AppRouter = typeof appRouter;
