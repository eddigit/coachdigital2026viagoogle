import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Webhook Stripe pour gérer les événements de paiement
 * Route: POST /api/stripe/webhook
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements de test
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    // Gérer les différents types d'événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment intent succeeded: ${paymentIntent.id}`);
        // Le paiement est déjà géré dans checkout.session.completed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment intent failed: ${paymentIntent.id}`);
        // Optionnel : gérer les échecs de paiement
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Répondre rapidement à Stripe
    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event: ${error.message}`);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Gérer l'événement checkout.session.completed
 * Met à jour la facture avec le statut "paid" et les infos de paiement
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Processing checkout session: ${session.id}`);

  // Récupérer l'invoice_id depuis les metadata
  const invoiceId = session.metadata?.invoice_id;
  
  if (!invoiceId) {
    console.error("[Stripe Webhook] Missing invoice_id in session metadata");
    return;
  }

  const invoiceIdNum = parseInt(invoiceId, 10);
  
  if (isNaN(invoiceIdNum)) {
    console.error(`[Stripe Webhook] Invalid invoice_id: ${invoiceId}`);
    return;
  }

  // Vérifier que la facture existe
  const invoice = await db.getDocumentById(invoiceIdNum);
  
  if (!invoice) {
    console.error(`[Stripe Webhook] Invoice not found: ${invoiceIdNum}`);
    return;
  }

  if (invoice.type !== "invoice") {
    console.error(`[Stripe Webhook] Document ${invoiceIdNum} is not an invoice`);
    return;
  }

  // Vérifier le statut du paiement
  if (session.payment_status !== "paid") {
    console.log(`[Stripe Webhook] Payment not completed yet: ${session.payment_status}`);
    return;
  }

  // Mettre à jour la facture
  try {
    await db.updateDocument(invoiceIdNum, {
      status: "paid",
      stripePaymentIntentId: session.payment_intent as string,
      stripeCheckoutSessionId: session.id,
      paidAt: new Date(),
    });

    console.log(`[Stripe Webhook] Invoice ${invoice.number} marked as paid`);

    // Optionnel : envoyer une notification au propriétaire
    const client = await db.getClientById(invoice.clientId);
    if (client) {
      const { sendEmail } = await import("./emailService");
      const ownerEmail = process.env.SMTP_USER || "coachdigitalparis@gmail.com";
      await sendEmail({
        to: ownerEmail,
        subject: `💰 Paiement reçu - Facture ${invoice.number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E67E50;">💰 Paiement reçu</h2>
            <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
            <p><strong>Facture:</strong> ${invoice.number}</p>
            <p><strong>Montant:</strong> ${parseFloat(invoice.totalTtc || "0").toFixed(2)} €</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
            <p>Le paiement a été effectué via Stripe et la facture a été automatiquement marquée comme payée.</p>
          </div>
        `,
        text: `💰 Paiement reçu\n\nClient: ${client.firstName} ${client.lastName}\nFacture: ${invoice.number}\nMontant: ${parseFloat(invoice.totalTtc || "0").toFixed(2)} €\nDate: ${new Date().toLocaleDateString("fr-FR")}\n\nLe paiement a été effectué via Stripe et la facture a été automatiquement marquée comme payée.`,
      });
    }
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error updating invoice: ${error.message}`);
    throw error;
  }
}
