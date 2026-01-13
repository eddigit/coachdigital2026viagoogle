import { drizzle } from 'drizzle-orm/mysql2';
import { readFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

const sql = readFileSync('drop_all_tables.sql', 'utf-8');
const statements = sql.split(';').filter(s => s.trim());

console.log('Suppression de toutes les tables...');

for (const statement of statements) {
  if (statement.trim()) {
    try {
      await db.execute(statement);
      console.log('✓', statement.trim().substring(0, 50) + '...');
    } catch (error) {
      console.log('✗', statement.trim().substring(0, 50), error.message);
    }
  }
}

console.log('Terminé !');
process.exit(0);
