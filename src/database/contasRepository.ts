import type { SQLiteDatabase } from 'expo-sqlite';
import type { Conta, SummaryPayload } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function addConta(
  db: SQLiteDatabase,
  data: Omit<Conta, 'id' | 'pago' | 'criado_em'>
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO contas (descricao, valor, vencimento, categoria, recorrente, nota, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [data.descricao, data.valor, data.vencimento, data.categoria, data.recorrente ?? 0, data.nota ?? null, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function updateConta(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Omit<Conta, 'id' | 'criado_em'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (data.descricao !== undefined) { fields.push('descricao = ?'); values.push(data.descricao); }
  if (data.valor !== undefined) { fields.push('valor = ?'); values.push(data.valor); }
  if (data.vencimento !== undefined) { fields.push('vencimento = ?'); values.push(data.vencimento); }
  if (data.categoria !== undefined) { fields.push('categoria = ?'); values.push(data.categoria); }
  if (data.pago !== undefined) { fields.push('pago = ?'); values.push(data.pago); }
  if (data.recorrente !== undefined) { fields.push('recorrente = ?'); values.push(data.recorrente); }
  if (data.nota !== undefined) { fields.push('nota = ?'); values.push(data.nota ?? null); }
  if (!fields.length) return;
  values.push(id);
  await db.runAsync(`UPDATE contas SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function getAllContas(
  db: SQLiteDatabase,
  filtro: 'pendentes' | 'pagas' | 'todas' = 'todas'
): Promise<Conta[]> {
  if (filtro === 'pendentes') {
    return db.getAllAsync<Conta>(
      'SELECT * FROM contas WHERE pago = 0 ORDER BY vencimento ASC'
    );
  }
  if (filtro === 'pagas') {
    return db.getAllAsync<Conta>(
      'SELECT * FROM contas WHERE pago = 1 ORDER BY vencimento DESC'
    );
  }
  return db.getAllAsync<Conta>('SELECT * FROM contas ORDER BY vencimento ASC');
}

export async function searchContas(
  db: SQLiteDatabase,
  query: string
): Promise<Conta[]> {
  return db.getAllAsync<Conta>(
    "SELECT * FROM contas WHERE LOWER(descricao) LIKE '%' || LOWER(?) || '%' AND pago = 0 ORDER BY vencimento ASC",
    [query]
  );
}

export async function markAsPaid(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE contas SET pago = 1 WHERE id = ?', [id]);
}

export async function deleteConta(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM contas WHERE id = ?', [id]);
}

export async function getUpcomingContas(db: SQLiteDatabase, days = 7): Promise<Conta[]> {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);
  return db.getAllAsync<Conta>(
    'SELECT * FROM contas WHERE pago = 0 AND vencimento BETWEEN ? AND ? ORDER BY vencimento ASC',
    [todayStr, futureStr]
  );
}

export async function getOverdueContas(db: SQLiteDatabase): Promise<Conta[]> {
  const todayStr = new Date().toISOString().slice(0, 10);
  return db.getAllAsync<Conta>(
    'SELECT * FROM contas WHERE pago = 0 AND vencimento < ? ORDER BY vencimento ASC',
    [todayStr]
  );
}

export async function payAllPending(db: SQLiteDatabase): Promise<number> {
  const result = await db.runAsync('UPDATE contas SET pago = 1 WHERE pago = 0');
  return result.changes;
}

export async function getMonthlySummary(
  db: SQLiteDatabase,
  yearMonth: string
): Promise<SummaryPayload> {
  const pattern = yearMonth + '%';

  const totals = await db.getFirstAsync<{
    total: number;
    totalPago: number;
    count: number;
    countPago: number;
  }>(
    `SELECT
      COALESCE(SUM(valor), 0) AS total,
      COALESCE(SUM(CASE WHEN pago = 1 THEN valor ELSE 0 END), 0) AS totalPago,
      COUNT(*) AS count,
      SUM(CASE WHEN pago = 1 THEN 1 ELSE 0 END) AS countPago
    FROM contas WHERE vencimento LIKE ?`,
    [pattern]
  );

  const categorias = await db.getAllAsync<{ categoria: string; total: number }>(
    `SELECT categoria, SUM(valor) AS total
     FROM contas WHERE vencimento LIKE ?
     GROUP BY categoria
     ORDER BY total DESC`,
    [pattern]
  );

  const total = totals?.total ?? 0;
  const totalPago = totals?.totalPago ?? 0;
  const count = totals?.count ?? 0;
  const countPago = totals?.countPago ?? 0;

  // Build month label: "Abril 2026"
  const [year, month] = yearMonth.split('-');
  const dateForLabel = new Date(parseInt(year), parseInt(month) - 1, 1);
  const mes = format(dateForLabel, 'MMMM yyyy', { locale: ptBR });
  const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);

  return {
    mes: mesCapitalized,
    yearMonth,
    total,
    totalPago,
    totalPendente: total - totalPago,
    count,
    countPago,
    porCategoria: categorias,
  };
}
