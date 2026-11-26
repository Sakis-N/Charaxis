import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
export const FILES_DIR = path.join(DATA_DIR, "files");
export const DB_PATH = path.join(DATA_DIR, "ergon.db");

import { SCHEMA } from "./schema.mjs";

declare global {
  // eslint-disable-next-line no-var
  var __ergonDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(FILES_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export function db(): Database.Database {
  if (!global.__ergonDb) global.__ergonDb = open();
  return global.__ergonDb;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

export function all<T = Row>(sql: string, ...params: any[]): T[] {
  return db().prepare(sql).all(...params) as T[];
}
export function get<T = Row>(sql: string, ...params: any[]): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, ...params: any[]) {
  return db().prepare(sql).run(...params);
}

/** Insert from an object; returns new id */
export function insert(table: string, data: Row): number {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`;
  return Number(run(sql, ...keys.map((k) => data[k])).lastInsertRowid);
}
export function update(table: string, id: number, data: Row) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  const sql = `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`;
  run(sql, ...keys.map((k) => data[k]), id);
}

export function getSetting(key: string, fallback = ""): string {
  const r = get<{ value: string }>("SELECT value FROM settings WHERE key=?", key);
  return r?.value ?? fallback;
}
export function getSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export function setSetting(key: string, value: string) {
  run("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, value);
}

/** Normalise a phone number to its last 10 digits for matching (Greek numbers). */
export function normPhone(p?: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  if (!d) return null;
  return d.length > 10 ? d.slice(-10) : d;
}
