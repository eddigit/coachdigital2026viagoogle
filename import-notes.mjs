import fs from "fs";
import { drizzle } from "drizzle-orm/mysql2";
import { notes } from "./drizzle/schema.js";

// Connexion à la base de données
const db = drizzle(process.env.DATABASE_URL);

// Lire le fichier JSON
const data = JSON.parse(fs.readFileSync("/home/ubuntu/upload/GKAC_Export_2026-01-09(2).json", "utf8"));

console.log("🔍 Import des notes de l'ancien système...\n");

let imported = 0;
let errors = 0;

// Mapper les couleurs de l'ancien système vers le nouveau
const colorMap = {
  "jaune": "yellow",
  "bleu": "blue",
  "vert": "green",
  "rouge": "red",
  "violet": "purple",
  "orange": "orange",
};

for (const oldNote of data.notes || []) {
  try {
    const newNote = {
      title: oldNote.title || "Note sans titre",
      content: oldNote.content || "",
      color: colorMap[oldNote.color?.toLowerCase()] || "yellow",
      pinned: oldNote.pinned || false,
      isClientVisible: oldNote.isClientVisible || false,
      clientId: oldNote.clientId || null,
      projectId: oldNote.projectId || null,
      taskId: oldNote.taskId || null,
    };

    await db.insert(notes).values(newNote);
    imported++;
    console.log(`✅ Note importée: ${newNote.title}`);
  } catch (error) {
    errors++;
    console.error(`❌ Erreur lors de l'import de la note "${oldNote.title}":`, error.message);
  }
}

console.log(`\n📊 Résumé de l'import:`);
console.log(`   ✅ ${imported} notes importées`);
console.log(`   ❌ ${errors} erreurs`);
