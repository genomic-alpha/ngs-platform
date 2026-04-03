import { Pool } from 'pg';

/**
 * Log an audit trail entry for database changes.
 * Silent failures - catches errors and logs them without throwing.
 * This ensures audit failures don't disrupt the operation.
 *
 * @param pool - PostgreSQL connection pool
 * @param userId - ID of user making the change (undefined for system actions)
 * @param tableName - Name of the table being modified
 * @param recordId - ID of the record being modified
 * @param action - Type of action: insert, update, or delete
 * @param oldValue - Previous value of the record (for updates/deletes)
 * @param newValue - New value of the record (for inserts/updates)
 */
export async function logAudit(
  pool: Pool,
  userId: string | undefined,
  tableName: string,
  recordId: string,
  action: 'insert' | 'update' | 'delete',
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, table_name, record_id, action, old_value, new_value, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId || null,
        tableName,
        recordId,
        action,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    );
  } catch (error) {
    console.error('Audit logging failed:', {
      userId,
      tableName,
      recordId,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
    // Silent failure - don't throw, don't disrupt the operation
  }
}
