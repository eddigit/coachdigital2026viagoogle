import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Création des tables...\n');

const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    loginMethod VARCHAR(64),
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS company (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legalName VARCHAR(255),
    siret VARCHAR(14),
    tvaNumber VARCHAR(20),
    address TEXT,
    postalCode VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'France',
    phone VARCHAR(20),
    email VARCHAR(320),
    website VARCHAR(255),
    logoUrl TEXT,
    bankName VARCHAR(255),
    iban VARCHAR(34),
    bic VARCHAR(11),
    defaultTvaRate DECIMAL(5,2) DEFAULT 20.00,
    defaultPaymentTerms INT DEFAULT 30,
    legalMentions TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(320),
    phone VARCHAR(20),
    company VARCHAR(255),
    position VARCHAR(100),
    address TEXT,
    postalCode VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'France',
    category ENUM('prospect', 'active', 'vip', 'inactive') NOT NULL DEFAULT 'prospect',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    notes TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('website', 'app', 'coaching', 'ia_integration', 'optimization', 'other') NOT NULL,
    status ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    startDate TIMESTAMP NULL,
    endDate TIMESTAMP NULL,
    estimatedHours DECIMAL(10,2),
    budgetEstimate DECIMAL(10,2),
    notes TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projectId INT,
    clientId INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') NOT NULL DEFAULT 'todo',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    dueDate TIMESTAMP NULL,
    completedAt TIMESTAMP NULL,
    estimatedHours DECIMAL(10,2),
    isBillable BOOLEAN DEFAULT TRUE,
    hourlyRate DECIMAL(10,2),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS timeEntries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    taskId INT,
    projectId INT,
    clientId INT,
    description TEXT,
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP NULL,
    duration INT,
    isBillable BOOLEAN DEFAULT TRUE,
    hourlyRate DECIMAL(10,2),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
    projectId INT,
    type ENUM('quote', 'invoice', 'credit_note') NOT NULL,
    number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
    date TIMESTAMP NOT NULL,
    dueDate TIMESTAMP NULL,
    validityDate TIMESTAMP NULL,
    subject VARCHAR(255),
    introduction TEXT,
    conclusion TEXT,
    notes TEXT,
    totalHt DECIMAL(10,2) NOT NULL,
    totalTva DECIMAL(10,2) NOT NULL,
    totalTtc DECIMAL(10,2) NOT NULL,
    discountAmount DECIMAL(10,2) DEFAULT 0.00,
    paymentTerms INT DEFAULT 30,
    paymentMethod ENUM('bank_transfer', 'check', 'card', 'cash', 'other'),
    isAcompteRequired BOOLEAN DEFAULT FALSE,
    acomptePercentage DECIMAL(5,2),
    acompteAmount DECIMAL(10,2),
    pdfUrl TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS documentLines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documentId INT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit VARCHAR(50) DEFAULT 'unité',
    unitPriceHt DECIMAL(10,2) NOT NULL,
    tvaRate DECIMAL(5,2) NOT NULL,
    totalHt DECIMAL(10,2) NOT NULL,
    totalTva DECIMAL(10,2) NOT NULL,
    totalTtc DECIMAL(10,2) NOT NULL,
    sortOrder INT DEFAULT 0,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

for (const sql of tables) {
  try {
    await connection.query(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    console.log(`✓ Table ${tableName} créée`);
  } catch (error) {
    console.error('✗ Erreur:', error.message);
  }
}

console.log('\n✅ Base de données initialisée avec succès !');
await connection.end();
process.exit(0);
