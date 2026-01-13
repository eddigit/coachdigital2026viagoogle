import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import Stripe from "stripe";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export const stripeRouter = router({
  /**
   * Créer une session de paiement Stripe pour une facture
   */
  createCheckoutSession: publicProcedure
    .input(z.object({
      invoiceId: z.number(),
      clientUserId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Récupérer la facture
      const invoice = await db.getDocumentById(input.invoiceId);
      if (!invoice) {
        throw new Error("Facture introuvable");
      }

      if (invoice.type !== "invoice") {
        throw new Error("Ce document n'est pas une facture");
      }

      if (invoice.status === "paid") {
        throw new Error("Cette facture est déjà payée");
      }

      // Récupérer le client
      const client = await db.getClientById(invoice.clientId);
      if (!client) {
        throw new Error("Client introuvable");
      }

      // Récupérer les lignes de la facture
      const lines = await db.getDocumentLinesByDocumentId(input.invoiceId);

      // Créer la session Checkout Stripe
      const origin = process.env.VITE_APP_URL || "https://coachdigital.biz";
      
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: client.email || undefined,
        client_reference_id: input.clientUserId.toString(),
        metadata: {
          invoice_id: input.invoiceId.toString(),
          client_user_id: input.clientUserId.toString(),
          client_name: `${client.firstName} ${client.lastName}`,
        },
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Facture ${invoice.number}`,
                description: invoice.subject || undefined,
                metadata: {
                  invoice_number: invoice.number,
                },
              },
              unit_amount: Math.round(parseFloat(invoice.totalTtc) * 100), // Convertir en centimes
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/client/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/client/dashboard?payment=cancelled`,
        allow_promotion_codes: true,
      });

      // Sauvegarder le session ID dans la facture
      await db.updateDocument(input.invoiceId, {
        stripeCheckoutSessionId: session.id,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Vérifier le statut d'un paiement
   */
  checkPaymentStatus: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      
      return {
        status: session.payment_status,
        paymentIntentId: session.payment_intent as string,
        amountTotal: session.amount_total,
      };
    }),
});
