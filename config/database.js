import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the database path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

// Open a connection to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      email_verified_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otp_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      otp TEXT,
      expires_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      token TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      phone TEXT,
      first_name TEXT,
      last_name TEXT,
      photo TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      designation TEXT,
      department TEXT,
      manager_id INTEGER,
      employment_type TEXT,
      date_of_joining TEXT,
      employee_code TEXT,
      gender TEXT,
      date_of_birth TEXT,
      role TEXT
    )
  `);

  console.log('✅ Tables verified/created successfully');
});

export { db };
