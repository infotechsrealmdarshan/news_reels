import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import { randomUUID } from 'crypto';

export type SheetName = 'news' | 'reels' | 'categories';

export type SheetRow = Record<string, string | number | boolean | null | undefined>;

type GetRowsOptions = {
  /** If set, returns newest first based on this column (ISO date strings recommended). */
  orderBy?: { column: string; direction: 'asc' | 'desc' };
};

const SHEET_HEADERS: Record<SheetName, string[]> = {
  news: [
    'id',
    'title',
    'description',
    'imageLink',
    'imageLinks',
    'sourceUrl',
    'sourceName',
    'category',
    'language',
    'likes',
    'views',
    'publishedAt',
    'createdAt',
  ],
  reels: [
    'id',
    'reelUrl',
    'title',
    'category',
    'thumbnailUrl',
    'views',
    'likes',
    'createdAt',
  ],
  categories: ['id', 'name', 'type', 'createdAt'],
};

function toCellValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function fromCellValue(v: string): any {
  // Keep it conservative: parse JSON arrays/objects, else return string.
  const s = (v ?? '').trim();
  if (!s) return '';
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  }
  return s;
}

function parseNumberLoose(v: any): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class GoogleSheetService implements OnModuleInit {
  private readonly logger = new Logger(GoogleSheetService.name);
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  // Small in-memory cache to reduce calls for repeated lookups.
  private cache = new Map<SheetName, { loadedAt: number; rows: any[] }>();
  private readonly cacheTtlMs = 15_000; // keep short; cron writes frequently

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const spreadsheetId = this.config.get<string>('GOOGLE_SHEET_ID');
    const clientEmail = this.config.get<string>('GOOGLE_SERVICE_EMAIL');
    const privateKeyRaw = this.config.get<string>('GOOGLE_PRIVATE_KEY');

    if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
      this.logger.warn(
        'Google Sheets env vars missing. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_EMAIL, GOOGLE_PRIVATE_KEY.',
      );
      return;
    }

    this.spreadsheetId = spreadsheetId;
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });

    await this.ensureSheetsExist(['news', 'reels', 'categories']);
    await Promise.all([
      this.ensureHeaderRow('news'),
      this.ensureHeaderRow('reels'),
      this.ensureHeaderRow('categories'),
    ]);
  }

  newId(): string {
    return randomUUID();
  }

  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    const maxAttempts = 5;
    let attempt = 0;
    let lastErr: any;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const status = err?.code || err?.response?.status;
        const retryable =
          status === 429 ||
          status === 403 || // quota/limit sometimes surfaces as 403
          (typeof status === 'number' && status >= 500);

        if (!retryable || attempt >= maxAttempts) break;

        const base = 400;
        const backoff = Math.min(8000, base * 2 ** (attempt - 1));
        const jitter = Math.floor(Math.random() * 200);
        const waitMs = backoff + jitter;
        this.logger.warn(`${context} failed (attempt ${attempt}/${maxAttempts}, status=${status}). Retrying in ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
    this.logger.error(`${context} failed after retries: ${lastErr?.message || lastErr}`);
    throw lastErr;
  }

  private async ensureSheetsExist(names: SheetName[]) {
    const spreadsheet: any = await this.withRetry(
      () => this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId }),
      'spreadsheets.get',
    );
    const existing = new Set(
      ((spreadsheet.data?.sheets || []) as any[])
        .map((s: any) => s?.properties?.title)
        .filter(Boolean) as string[],
    );

    const missing = names.filter((n) => !existing.has(n));
    if (missing.length === 0) return;

    await this.withRetry(
      () =>
        this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: missing.map((title) => ({
              addSheet: { properties: { title } },
            })),
          },
        }),
      'spreadsheets.batchUpdate(addSheet)',
    );
  }

  private async ensureHeaderRow(sheet: SheetName) {
    const headers = SHEET_HEADERS[sheet];
    const range = `${sheet}!A1:Z1`;
    const res: any = await this.withRetry(
      () => this.sheets.spreadsheets.values.get({ spreadsheetId: this.spreadsheetId, range }),
      `values.get(${sheet} header)`,
    );
    const row = (res.data.values?.[0] || []) as string[];
    const matches =
      row.length >= headers.length && headers.every((h, i) => String(row[i] ?? '').trim() === h);
    if (matches) return;

    await this.withRetry(
      () =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headers] },
        }),
      `values.update(${sheet} header)`,
    );
    this.cache.delete(sheet);
  }

  private async readAll(sheet: SheetName): Promise<any[]> {
    const now = Date.now();
    const cached = this.cache.get(sheet);
    if (cached && now - cached.loadedAt < this.cacheTtlMs) return cached.rows;

    const headers = SHEET_HEADERS[sheet];
    const res: any = await this.withRetry(
      () => this.sheets.spreadsheets.values.get({ spreadsheetId: this.spreadsheetId, range: `${sheet}!A1:Z` }),
      `values.get(${sheet})`,
    );
    const values = (res.data.values || []) as string[][];
    if (values.length <= 1) {
      const empty: any[] = [];
      this.cache.set(sheet, { loadedAt: now, rows: empty });
      return empty;
    }

    const dataRows = values.slice(1);
    const rows = dataRows
      .map((cols, i) => {
        const obj: any = { __rowNumber: i + 2 }; // 1-based; + header row
        for (let c = 0; c < headers.length; c++) {
          obj[headers[c]] = fromCellValue(cols[c] ?? '');
        }
        return obj;
      })
      .filter((r) => String(r.id || '').trim().length > 0);

    this.cache.set(sheet, { loadedAt: now, rows });
    return rows;
  }

  async getRows(sheet: SheetName, opts?: GetRowsOptions): Promise<any[]> {
    const rows = await this.readAll(sheet);
    if (!opts?.orderBy) return [...rows];

    const { column, direction } = opts.orderBy;
    const sorted = [...rows].sort((a, b) => {
      const av = a?.[column] ?? '';
      const bv = b?.[column] ?? '';
      const ad = Date.parse(String(av));
      const bd = Date.parse(String(bv));
      const aNum = Number.isFinite(ad) ? ad : parseNumberLoose(av);
      const bNum = Number.isFinite(bd) ? bd : parseNumberLoose(bv);
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }

  async findById(sheet: SheetName, id: string): Promise<any | null> {
    const rows = await this.readAll(sheet);
    return rows.find((r) => String(r.id) === id) ?? null;
  }

  async findFirst(sheet: SheetName, predicate: (row: any) => boolean): Promise<any | null> {
    const rows = await this.readAll(sheet);
    return rows.find(predicate) ?? null;
  }

  async insertRow(sheet: SheetName, row: SheetRow): Promise<{ id: string; row: any }> {
    const headers = SHEET_HEADERS[sheet];
    const id = String(row.id || this.newId());
    const created = { ...row, id };
    const values = headers.map((h) => toCellValue((created as any)[h]));

    await this.withRetry(
      () =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [values] },
        }),
      `values.append(${sheet})`,
    );

    this.cache.delete(sheet);
    return { id, row: created };
  }

  async insertRowsBatch(sheet: SheetName, rows: SheetRow[]): Promise<{ ids: string[] }> {
    if (rows.length === 0) return { ids: [] };
    const headers = SHEET_HEADERS[sheet];
    const normalized = rows.map((r) => ({ ...r, id: String(r.id || this.newId()) }));
    const values = normalized.map((r) => headers.map((h) => toCellValue((r as any)[h])));

    await this.withRetry(
      () =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        }),
      `values.append(batch ${sheet})`,
    );

    this.cache.delete(sheet);
    return { ids: normalized.map((r) => String((r as any).id)) };
  }

  async updateRowById(sheet: SheetName, id: string, patch: SheetRow): Promise<any | null> {
    const existing = await this.findById(sheet, id);
    if (!existing) return null;

    const headers = SHEET_HEADERS[sheet];
    const merged = { ...existing, ...patch, id };
    const rowNumber = existing.__rowNumber as number;
    const range = `${sheet}!A${rowNumber}:${String.fromCharCode(64 + headers.length)}${rowNumber}`;
    const values = headers.map((h) => toCellValue((merged as any)[h]));

    await this.withRetry(
      () =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: { values: [values] },
        }),
      `values.update(${sheet} row ${rowNumber})`,
    );

    this.cache.delete(sheet);
    return merged;
  }

  async deleteRowById(sheet: SheetName, id: string): Promise<boolean> {
    const existing = await this.findById(sheet, id);
    if (!existing) return false;

    // NOTE: Row delete requires sheetId; instead of shifting rows (expensive + breaks caches),
    // we do a "soft delete" by clearing id so it won't be returned.
    const rowNumber = existing.__rowNumber as number;
    await this.withRetry(
      () =>
        this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheet}!A${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: { values: [['']] },
        }),
      `values.update(${sheet} soft-delete row ${rowNumber})`,
    );

    this.cache.delete(sheet);
    return true;
  }
}

