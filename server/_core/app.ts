import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerTrackingRoutes } from "../trackingRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";

export async function createApp() {
  const app = express();

  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  const { handleStripeWebhook } = await import("../stripeWebhook");
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Email tracking routes (public)
  registerTrackingRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
