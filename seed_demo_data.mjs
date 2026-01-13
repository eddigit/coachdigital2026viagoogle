import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function seed() {
  console.log("🌱 Ajout de données de démonstration...");

  // Ajouter infos entreprise
  await connection.execute(`
    INSERT INTO company (name, legalName, siret, tvaNumber, address, postalCode, city, country, phone, email, website, bankName, iban, bic, defaultTvaRate, defaultPaymentTerms)
    VALUES ('Coach Digital', 'Coach Digital SASU', '12345678900012', 'FR12345678900', '123 Avenue des Champs-Élysées', '75008', 'Paris', 'France', '+33 1 23 45 67 89', 'contact@coachdigital.fr', 'https://coachdigital.fr', 'BNP Paribas', 'FR76 1234 5678 9012 3456 7890 123', 'BNPAFRPPXXX', 20.00, 30)
    ON DUPLICATE KEY UPDATE name = 'Coach Digital'
  `);

  // Ajouter clients
  const [client1] = await connection.execute(`
    INSERT INTO clients (firstName, lastName, email, phone, company, position, address, postalCode, city, category, status)
    VALUES ('Marie', 'Dupont', 'marie.dupont@avocat-paris.fr', '+33 6 12 34 56 78', 'Cabinet Dupont & Associés', 'Avocate', '45 Rue du Faubourg Saint-Honoré', '75008', 'Paris', 'vip', 'active')
  `);

  const [client2] = await connection.execute(`
    INSERT INTO clients (firstName, lastName, email, phone, company, position, address, postalCode, city, category, status)
    VALUES ('Jean', 'Martin', 'jean.martin@entreprise.fr', '+33 6 98 76 54 32', 'Martin Consulting', 'CEO', '12 Boulevard Haussmann', '75009', 'Paris', 'active', 'active')
  `);

  const [client3] = await connection.execute(`
    INSERT INTO clients (firstName, lastName, email, phone, company, position, address, postalCode, city, category, status)
    VALUES ('Sophie', 'Bernard', 'sophie.bernard@avocat.fr', '+33 6 11 22 33 44', 'Bernard Avocats', 'Avocate', '78 Rue de Rivoli', '75004', 'Paris', 'active', 'active')
  `);

  const clientId1 = client1.insertId;
  const clientId2 = client2.insertId;
  const clientId3 = client3.insertId;

  // Ajouter projets
  const [project1] = await connection.execute(`
    INSERT INTO projects (clientId, name, description, type, status, priority, budgetEstimate, estimatedHours)
    VALUES (?, 'Site web cabinet d\\'avocats', 'Création d\\'un site web moderne pour le cabinet', 'website', 'active', 'high', 5000.00, 40.00)
  `, [clientId1]);

  const [project2] = await connection.execute(`
    INSERT INTO projects (clientId, name, description, type, status, priority, budgetEstimate, estimatedHours)
    VALUES (?, 'Intégration IA - Analyse juridique', 'Mise en place d\\'outils IA pour l\\'analyse de documents juridiques', 'ia_integration', 'active', 'urgent', 8000.00, 60.00)
  `, [clientId1]);

  const [project3] = await connection.execute(`
    INSERT INTO projects (clientId, name, description, type, status, priority, budgetEstimate, estimatedHours)
    VALUES (?, 'Application métier CRM', 'Développement d\\'une application CRM sur mesure', 'app', 'active', 'normal', 12000.00, 100.00)
  `, [clientId2]);

  const [project4] = await connection.execute(`
    INSERT INTO projects (clientId, name, description, type, status, priority, budgetEstimate, estimatedHours)
    VALUES (?, 'Coaching IA mensuel', 'Accompagnement mensuel sur l\\'utilisation des outils IA', 'coaching', 'active', 'normal', 1500.00, 10.00)
  `, [clientId3]);

  // Ajouter tâches
  await connection.execute(`
    INSERT INTO tasks (projectId, clientId, title, description, status, priority, estimatedHours, isBillable, hourlyRate)
    VALUES (?, ?, 'Maquettes site web', 'Créer les maquettes Figma du site', 'done', 'high', 8.00, 1, 80.00)
  `, [project1.insertId, clientId1]);

  await connection.execute(`
    INSERT INTO tasks (projectId, clientId, title, description, status, priority, estimatedHours, isBillable, hourlyRate)
    VALUES (?, ?, 'Développement frontend', 'Développer le frontend React du site', 'in_progress', 'high', 20.00, 1, 80.00)
  `, [project1.insertId, clientId1]);

  await connection.execute(`
    INSERT INTO tasks (projectId, clientId, title, description, status, priority, estimatedHours, isBillable, hourlyRate)
    VALUES (?, ?, 'Analyse des besoins IA', 'Identifier les cas d\\'usage IA pertinents', 'done', 'urgent', 4.00, 1, 100.00)
  `, [project2.insertId, clientId1]);

  await connection.execute(`
    INSERT INTO tasks (projectId, clientId, title, description, status, priority, estimatedHours, isBillable, hourlyRate)
    VALUES (?, ?, 'Cahier des charges CRM', 'Rédiger le cahier des charges détaillé', 'in_progress', 'normal', 12.00, 1, 80.00)
  `, [project3.insertId, clientId2]);

  // Ajouter documents
  await connection.execute(`
    INSERT INTO documents (clientId, projectId, type, number, status, date, validityDate, subject, introduction, totalHt, totalTva, totalTtc, paymentTerms)
    VALUES (?, ?, 'quote', 'DEV-2025-001', 'accepted', '2025-01-01', '2025-02-01', 'Devis - Site web cabinet d\\'avocats', 'Suite à notre entretien, voici notre proposition pour la création de votre site web.', 5000.00, 1000.00, 6000.00, 30)
  `, [clientId1, project1.insertId]);

  await connection.execute(`
    INSERT INTO documents (clientId, projectId, type, number, status, date, validityDate, subject, introduction, totalHt, totalTva, totalTtc, paymentTerms)
    VALUES (?, ?, 'quote', 'DEV-2025-002', 'sent', '2025-01-10', '2025-02-10', 'Devis - Application CRM sur mesure', 'Nous vous proposons le développement d\\'une application CRM adaptée à vos besoins.', 12000.00, 2400.00, 14400.00, 30)
  `, [clientId2, project3.insertId]);

  console.log("✅ Données de démonstration ajoutées avec succès !");
  console.log("   - 3 clients");
  console.log("   - 4 projets");
  console.log("   - 4 tâches");
  console.log("   - 2 documents");
}

seed().catch(console.error).finally(() => {
  connection.end();
  process.exit(0);
});
