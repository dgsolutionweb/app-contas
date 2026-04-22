import type { SQLiteDatabase } from 'expo-sqlite';
import type { ChatMessage } from '../types';

interface RawMessage {
  id: number;
  role: string;
  content: string;
  tipo: string;
  payload: string | null;
  criado_em: string;
}

export async function saveMessage(
  db: SQLiteDatabase,
  message: Omit<ChatMessage, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO messages (role, content, tipo, payload, criado_em) VALUES (?, ?, ?, ?, ?)',
    [
      message.role,
      message.content,
      message.tipo,
      message.payload ? JSON.stringify(message.payload) : null,
      message.criado_em,
    ]
  );
  return result.lastInsertRowId;
}

export async function getAllMessages(db: SQLiteDatabase): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<RawMessage>(
    'SELECT * FROM messages ORDER BY criado_em ASC'
  );
  return rows.map((row) => ({
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    tipo: row.tipo as ChatMessage['tipo'],
    payload: row.payload ? JSON.parse(row.payload) : undefined,
    criado_em: row.criado_em,
  }));
}

export async function countMessages(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM messages'
  );
  return result?.count ?? 0;
}

export async function clearHistory(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM messages');
}
