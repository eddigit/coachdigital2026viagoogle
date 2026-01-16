import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { projectSecrets } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// Clé de chiffrement (en production, utiliser une variable d'environnement)
const ENCRYPTION_KEY = process.env.SECRETS_ENCRYPTION_KEY || "coach-digital-secrets-key-32ch";
const IV_LENGTH = 16;

// Fonctions de chiffrement/déchiffrement
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  try {
    const parts = text.split(":");
    if (parts.length !== 2) return text; // Non chiffré
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text; // Retourner tel quel si erreur
  }
}

/**
 * Router pour la gestion des secrets/variables d'environnement des projets
 */
export const projectSecretsRouter = router({
  // Lister les secrets d'un projet
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const secrets = await db
        .select()
        .from(projectSecrets)
        .where(eq(projectSecrets.projectId, input.projectId))
        .orderBy(desc(projectSecrets.createdAt));

      // Masquer les valeurs par défaut (retourner ●●●●●●)
      return secrets.map((secret) => ({
        ...secret,
        value: "••••••••••••",
        hasValue: true,
      }));
    }),

  // Révéler la valeur d'un secret (déchiffrer)
  reveal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [secret] = await db
        .select()
        .from(projectSecrets)
        .where(eq(projectSecrets.id, input.id));

      if (!secret) throw new Error("Secret not found");

      return {
        ...secret,
        value: decrypt(secret.value),
      };
    }),

  // Créer un nouveau secret
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(["database", "hosting", "smtp", "api", "ftp", "other"]),
        name: z.string().min(1),
        value: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const encryptedValue = encrypt(input.value);

      const [result] = await db.insert(projectSecrets).values({
        projectId: input.projectId,
        category: input.category,
        name: input.name,
        value: encryptedValue,
        description: input.description || null,
      });

      return { id: result.insertId, success: true };
    }),

  // Mettre à jour un secret
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.enum(["database", "hosting", "smtp", "api", "ftp", "other"]).optional(),
        name: z.string().min(1).optional(),
        value: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.category) updateData.category = input.category;
      if (input.name) updateData.name = input.name;
      if (input.value) updateData.value = encrypt(input.value);
      if (input.description !== undefined) updateData.description = input.description;

      await db
        .update(projectSecrets)
        .set(updateData)
        .where(eq(projectSecrets.id, input.id));

      return { success: true };
    }),

  // Supprimer un secret
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(projectSecrets).where(eq(projectSecrets.id, input.id));

      return { success: true };
    }),

  // Exporter tous les secrets d'un projet en format .env
  export: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const secrets = await db
        .select()
        .from(projectSecrets)
        .where(eq(projectSecrets.projectId, input.projectId))
        .orderBy(projectSecrets.category, projectSecrets.name);

      // Générer le contenu du fichier .env
      let envContent = "# Variables d'environnement générées par Coach Digital\n";
      envContent += `# Projet ID: ${input.projectId}\n`;
      envContent += `# Date: ${new Date().toISOString()}\n\n`;

      let currentCategory = "";
      for (const secret of secrets) {
        if (secret.category !== currentCategory) {
          currentCategory = secret.category;
          const categoryLabels: Record<string, string> = {
            database: "Base de données",
            hosting: "Hébergement",
            smtp: "SMTP / Email",
            api: "API Keys",
            ftp: "FTP / SFTP",
            other: "Autres",
          };
          envContent += `\n# === ${categoryLabels[currentCategory] || currentCategory} ===\n`;
        }
        const decryptedValue = decrypt(secret.value);
        if (secret.description) {
          envContent += `# ${secret.description}\n`;
        }
        envContent += `${secret.name}=${decryptedValue}\n`;
      }

      return { content: envContent, filename: `project_${input.projectId}.env` };
    }),

  // Importer des secrets depuis un fichier .env
  import: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        content: z.string(),
        category: z.enum(["database", "hosting", "smtp", "api", "ftp", "other"]).default("other"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const lines = input.content.split("\n");
      let imported = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        // Ignorer les commentaires et lignes vides
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
        if (match) {
          const [, name, value] = match;
          const encryptedValue = encrypt(value);

          await db.insert(projectSecrets).values({
            projectId: input.projectId,
            category: input.category,
            name: name,
            value: encryptedValue,
          });
          imported++;
        }
      }

      return { imported, success: true };
    }),
});
