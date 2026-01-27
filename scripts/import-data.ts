/**
 * Script d'import des données MySQL vers Firestore
 * Usage: npx tsx scripts/import-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import 'dotenv/config';

// Configuration Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Chemin vers le fichier d'export
const EXPORT_FILE = process.argv[2] || 'C:/Users/clari/Downloads/coach-digital-export-2026-01-27.json';

interface ExportData {
    exportDate: string;
    version: string;
    tables: Record<string, any[]>;
}

// Convertir les dates string en Timestamp Firestore
function convertDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        // Check if it looks like an ISO date
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
            return Timestamp.fromDate(new Date(obj));
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(convertDates);
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = convertDates(obj[key]);
        }
        return result;
    }

    return obj;
}

// Import par batch (max 500 par batch Firestore)
async function importCollection(collectionName: string, data: any[]) {
    if (!data || data.length === 0) {
        console.log(`  ⏭️  ${collectionName}: vide, skip`);
        return 0;
    }

    const batchSize = 400; // Un peu moins de 500 pour sécurité
    let imported = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, i + batchSize);

        for (const item of chunk) {
            const docId = String(item.id);
            const docRef = db.collection(collectionName).doc(docId);
            const convertedItem = convertDates(item);
            batch.set(docRef, convertedItem);
        }

        await batch.commit();
        imported += chunk.length;
        console.log(`  📦 ${collectionName}: ${imported}/${data.length}`);
    }

    return imported;
}

async function main() {
    console.log('🚀 Démarrage de l\'import vers Firestore...\n');

    // Vérifier que le fichier existe
    if (!fs.existsSync(EXPORT_FILE)) {
        console.error(`❌ Fichier non trouvé: ${EXPORT_FILE}`);
        process.exit(1);
    }

    // Charger les données
    console.log(`📂 Lecture de ${EXPORT_FILE}...`);
    const exportData: ExportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
    console.log(`📅 Export du: ${exportData.exportDate}\n`);

    // Ordre d'import (respect des dépendances)
    const importOrder = [
        'users',
        'audiences',
        'clients',
        'projects',
        'tasks',
        'documents',
        'documentItems',
        'documentSignatures',
        'leads',
        'emailTemplates',
        'notes',
        'emailCampaigns',
        'clientUsers',
        'company',
        // Tables potentiellement vides
        'projectRequirements',
        'projectCredentials',
        'messages',
        'calendarEvents',
        'notifications',
        'documentTemplates',
        'projectVariables',
        'timeEntries',
        'reviews',
        'reminders',
    ];

    const stats: Record<string, number> = {};

    for (const tableName of importOrder) {
        const data = exportData.tables[tableName];
        if (data !== undefined) {
            const count = await importCollection(tableName, data);
            stats[tableName] = count;
        }
    }

    // Résumé
    console.log('\n✅ Import terminé!\n');
    console.log('📊 Statistiques:');
    console.log('─'.repeat(40));

    let total = 0;
    for (const [table, count] of Object.entries(stats)) {
        if (count > 0) {
            console.log(`  ${table}: ${count} documents`);
            total += count;
        }
    }

    console.log('─'.repeat(40));
    console.log(`  TOTAL: ${total} documents importés`);
}

main().catch(console.error);
