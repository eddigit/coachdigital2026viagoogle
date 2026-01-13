import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as messagesDb from "./messagesDb";
import * as db from "./db";

export const messagesRouter = router({
  /**
   * Lister les messages pour l'admin (coach)
   */
  listForAdmin: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    
    // L'admin a l'ID 1 par convention
    return await messagesDb.getMessagesForUser(1, "admin");
  }),

  /**
   * Lister les messages pour un client
   */
  listForClient: publicProcedure
    .input(z.object({
      clientUserId: z.number(),
    }))
    .query(async ({ input }) => {
      return await messagesDb.getMessagesForUser(input.clientUserId, "client");
    }),

  /**
   * Récupérer une conversation entre admin et client
   */
  getConversation: publicProcedure
    .input(z.object({
      clientUserId: z.number(),
    }))
    .query(async ({ input }) => {
      return await messagesDb.getConversation(
        1, // Admin ID
        "admin",
        input.clientUserId,
        "client"
      );
    }),

  /**
   * Envoyer un message (admin → client)
   */
  sendFromAdmin: protectedProcedure
    .input(z.object({
      clientUserId: z.number(),
      clientId: z.number(),
      projectId: z.number().optional(),
      subject: z.string().optional(),
      content: z.string(),
      attachmentUrl: z.string().optional(),
      attachmentName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const messageId = await messagesDb.createMessage({
        senderId: 1, // Admin ID
        senderType: "admin",
        recipientId: input.clientUserId,
        recipientType: "client",
        clientId: input.clientId,
        projectId: input.projectId,
        subject: input.subject,
        content: input.content,
        attachmentUrl: input.attachmentUrl,
        attachmentName: input.attachmentName,
        isRead: false,
      });

      return { success: true, messageId };
    }),

  /**
   * Envoyer un message (client → admin)
   */
  sendFromClient: publicProcedure
    .input(z.object({
      clientUserId: z.number(),
      clientId: z.number(),
      projectId: z.number().optional(),
      subject: z.string().optional(),
      content: z.string(),
      attachmentUrl: z.string().optional(),
      attachmentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const messageId = await messagesDb.createMessage({
        senderId: input.clientUserId,
        senderType: "client",
        recipientId: 1, // Admin ID
        recipientType: "admin",
        clientId: input.clientId,
        projectId: input.projectId,
        subject: input.subject,
        content: input.content,
        attachmentUrl: input.attachmentUrl,
        attachmentName: input.attachmentName,
        isRead: false,
      });

      return { success: true, messageId };
    }),

  /**
   * Marquer un message comme lu
   */
  markAsRead: publicProcedure
    .input(z.object({
      messageId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await messagesDb.markMessageAsRead(input.messageId);
      return { success: true };
    }),

  /**
   * Marquer une conversation comme lue
   */
  markConversationAsRead: publicProcedure
    .input(z.object({
      clientUserId: z.number(),
      userType: z.enum(["admin", "client"]),
    }))
    .mutation(async ({ input }) => {
      if (input.userType === "admin") {
        // Admin marque les messages du client comme lus
        await messagesDb.markConversationAsRead(
          1, // Admin ID
          "admin",
          input.clientUserId,
          "client"
        );
      } else {
        // Client marque les messages de l'admin comme lus
        await messagesDb.markConversationAsRead(
          input.clientUserId,
          "client",
          1, // Admin ID
          "admin"
        );
      }
      
      return { success: true };
    }),

  /**
   * Compter les messages non lus
   */
  countUnread: publicProcedure
    .input(z.object({
      userId: z.number(),
      userType: z.enum(["admin", "client"]),
    }))
    .query(async ({ input }) => {
      const count = await messagesDb.countUnreadMessages(
        input.userId,
        input.userType
      );
      return { count };
    }),
});
