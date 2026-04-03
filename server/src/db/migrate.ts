/**
 * Database migration runner
 * Executes SQL migration files from the migrations directory
 * Tracks applied migrations in _migrations table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found: ${migrationsDir}`);
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct execution order
}

/**
 * Read a migration file
 */
function readMigrationFile(filename: string): string {
  const filepath = path.join(__dirname, 'migrations', filename);
  return fs.readFileSync(filepath, 'utf-8');
}

/**
 * Get list of already-applied migrations
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  try {
    const result = await pool.query(
      'SELECT name FROM _migrations ORDER BY executed_at'
    );
    return new Set(result.rows.map((row) => row.name));
  } catch (error: any) {
    if (error.code === '42P01') {
      // Table doesn't exist yet - this is normal on first run
      return new Set();
    }
    throw error;
  }
}

/**
 * Record a migration as applied
 */
async function recordMigration(name: string): Promise<void> {
  await pool.query(
    'INSERT INTO _migrations (name) VALUES ($1)',
    [name]
  );
}

/**
 * Execute a migration file
 */
async function executeMigration(filename: string): Promise<void> {
  console.log(`Executing migration: ${filename}`);

  const sql = readMigrationFile(filename);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`  ✓ Migration completed: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Migration failed: ${filename}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');

  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return;
  }

  const appliedMigrations = await getAppliedMigrations();
  let executedCount = 0;

  for (const filename of migrationFiles) {
    if (appliedMigrations.has(filename)) {
      console.log(`Skipping already-applied migration: ${filename}`);
      continue;
    }

    try {
      await executeMigration(filename);
      await recordMigration(filename);
      executedCount++;
    } catch (error) {
      console.error(`Failed to execute migration ${filename}:`, error);
      process.exit(1);
    }
  }

  console.log(
    `\nMigration complete. ${executedCount} new migration(s) executed.`
  );
}

/**
 * Rollback last migration (for development only)
 * Note: This is a simplified version. For production, implement proper rollbacks.
 */
export async function rollbackLastMigration(): Promise<void> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT name FROM _migrations ORDER BY executed_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].name;
    console.warn(`Rolling back migration: ${lastMigration}`);
    console.warn(
      'WARNING: Automatic rollback is not supported. Manual intervention may be required.'
    );

    await client.query(
      'DELETE FROM _migrations WHERE name = $1',
      [lastMigration]
    );

    console.log(`Rollback record removed for: ${lastMigration}`);
  } finally {
    client.release();
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<void> {
  const migrationFiles = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();

  console.log('\nMigration Status:');
  console.log('================');

  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return;
  }

  for (const filename of migrationFiles) {
    const status = appliedMigrations.has(filename) ? '✓ Applied' : '⏳ Pending';
    console.log(`${status}: ${filename}`);
  }

  console.log(`\nTotal: ${appliedMigrations.size}/${migrationFiles.length}`);
}

/**
 * CLI entry point for running migrations
 */
// ESM-compatible CLI entry point
const isCLI = process.argv[1] && (
  process.argv[1].endsWith('migrate.ts') ||
  process.argv[1].endsWith('migrate.js')
);

if (isCLI) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'status':
          await getMigrationStatus();
          break;
        case 'rollback':
          await rollbackLastMigration();
          break;
        case 'run':
        default:
          await runMigrations();
          break;
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}
