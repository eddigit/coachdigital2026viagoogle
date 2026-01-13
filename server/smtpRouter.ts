import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { testEmailConfiguration, isEmailServiceReady } from "./emailService";

/**
 * Router pour la gestion de la configuration SMTP
 */
export const smtpRouter = router({
  /**
   * Teste la configuration SMTP en envoyant un email de test
   */
  testConfiguration: protectedProcedure
    .input(
      z.object({
        testEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await testEmailConfiguration(input.testEmail);
      return result;
    }),

  /**
   * Vérifie si le service SMTP est configuré et opérationnel
   */
  checkStatus: protectedProcedure.query(async () => {
    const isReady = await isEmailServiceReady();
    
    const config = {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      user: process.env.SMTP_USER || null,
      from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
      hasPassword: !!process.env.SMTP_PASSWORD,
    };

    return {
      isReady,
      config,
    };
  }),
});
