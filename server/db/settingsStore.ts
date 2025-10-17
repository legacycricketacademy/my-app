import { Pool } from 'pg';

export class SettingsStore {
  constructor(private pool: Pool) {}

  async get(key: string): Promise<any> {
    try {
      const { rows } = await this.pool.query(
        'SELECT value FROM settings WHERE key = $1',
        [key]
      );
      return rows[0]?.value ?? null;
    } catch (error) {
      console.error('SettingsStore.get error:', error);
      throw error;
    }
  }

  async upsert(key: string, value: any): Promise<any> {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO settings(key, value) 
         VALUES($1, $2)
         ON CONFLICT(key) DO UPDATE 
         SET value = EXCLUDED.value, updated_at = now()
         RETURNING value`,
        [key, value]
      );
      return rows[0].value;
    } catch (error) {
      console.error('SettingsStore.upsert error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const { rowCount } = await this.pool.query(
        'DELETE FROM settings WHERE key = $1',
        [key]
      );
      return (rowCount ?? 0) > 0;
    } catch (error) {
      console.error('SettingsStore.delete error:', error);
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const { rowCount } = await this.pool.query(
        'DELETE FROM settings WHERE key LIKE $1',
        [pattern]
      );
      return rowCount ?? 0;
    } catch (error) {
      console.error('SettingsStore.deletePattern error:', error);
      throw error;
    }
  }
}
