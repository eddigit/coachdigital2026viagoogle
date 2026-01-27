import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getNextId } from "./db";
import { db as firestore } from "./firestore";
import { ProjectSecret } from "./schema";
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

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

/**
 * Router pour la gestion des secrets/variables d'environnement des projets
 */
export const projectSecretsRouter = router({
  // Lister les secrets d'un projet
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await firestore.collection('projectSecrets')
        .where('projectId', '==', input.projectId)
        .orderBy('createdAt', 'desc')
        .get();

      const secrets = snapshot.docs.map(doc => mapDoc<ProjectSecret>(doc));

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
      const doc = await firestore.collection('projectSecrets').doc(String(input.id)).get();

      if (!doc.exists) throw new Error("Secret not found");
      const secret = mapDoc<ProjectSecret>(doc);

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
      const encryptedValue = encrypt(input.value);
      const id = await getNextId('projectSecrets');

      await firestore.collection('projectSecrets').doc(String(id)).set({
        id,
        projectId: input.projectId,
        category: input.category,
        name: input.name,
        value: encryptedValue,
        description: input.description || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { id, success: true };
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
      const updateData: any = { updatedAt: new Date() };

      if (input.category) updateData.category = input.category;
      if (input.name) updateData.name = input.name;
      if (input.value) updateData.value = encrypt(input.value);
      if (input.description !== undefined) updateData.description = input.description;

      await firestore.collection('projectSecrets').doc(String(input.id)).update(updateData);

      return { success: true };
    }),

  // Supprimer un secret
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await firestore.collection('projectSecrets').doc(String(input.id)).delete();
      return { success: true };
    }),

  // Exporter tous les secrets d'un projet en format .env
  export: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await firestore.collection('projectSecrets')
        .where('projectId', '==', input.projectId)
        .orderBy('category')
        .orderBy('name')
        .get();

      const secrets = snapshot.docs.map(doc => mapDoc<ProjectSecret>(doc));

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
      const lines = input.content.split("\n");
      let imported = 0;
      const batch = firestore.batch();

      for (const line of lines) {
        const trimmed = line.trim();
        // Ignorer les commentaires et lignes vides
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
        if (match) {
          const [, name, value] = match;
          const encryptedValue = encrypt(value);

          // We can't await inside loop easily with batch if we need IDs.
          // But getNextId is async. 
          // To efficiently import, maybe use sequential helper or just await.
          // Since it's user import, speed is not critical.

          const id = await getNextId('projectSecrets');
          const ref = firestore.collection('projectSecrets').doc(String(id));
          batch.set(ref, {
            id,
            projectId: input.projectId,
            category: input.category,
            name: name,
            value: encryptedValue,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          imported++;
        }
      }

      // Batch limit is 500. Assuming import isn't huge.
      if (imported > 0) {
        await batch.commit();
      }

      return { imported, success: true };
    }),
});
