import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  try {
    _db = await SQLite.openDatabaseAsync('contas.db');
  } catch (error: any) {
    console.warn('Banco de dados em uso ou travado (OPFS lock). Utilizando banco em memoria para esta sessao.', error);
    _db = await SQLite.openDatabaseAsync(':memory:');
  }
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS contas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao  TEXT    NOT NULL,
      valor      REAL    NOT NULL,
      vencimento TEXT    NOT NULL,
      categoria  TEXT    NOT NULL DEFAULT 'outros',
      pago       INTEGER NOT NULL DEFAULT 0,
      recorrente INTEGER NOT NULL DEFAULT 0,
      nota       TEXT,
      criado_em  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      role      TEXT NOT NULL,
      content   TEXT NOT NULL,
      tipo      TEXT NOT NULL DEFAULT 'text',
      payload   TEXT,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Add columns if missing (safe for existing DBs)
  try { await db.execAsync(`ALTER TABLE contas ADD COLUMN recorrente INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { await db.execAsync(`ALTER TABLE contas ADD COLUMN nota TEXT`); } catch {}

  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, 'default_due_day', '5');
  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, 'gemini_api_key', '');
  await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, 'user_name', '');
}
