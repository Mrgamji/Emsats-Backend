import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the database path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

// Open connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // --- USERS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      email_verified_at TEXT
    );
  `);

  // --- OTP CACHE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      otp TEXT,
      expires_at TEXT
    );
  `);

  // --- PASSWORD RESET TOKENS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      token TEXT,
      created_at TEXT
    );
  `);

  // --- EMPLOYEES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      photo TEXT,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      manager_id INTEGER,
      employment_type TEXT NOT NULL,
      date_of_joining DATE,
      employee_code TEXT NOT NULL,
      age INTEGER,
      date_of_birth DATE,
      role TEXT NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (manager_id) REFERENCES employees(id)
    );
  `);

  // --- SHIFTS (needed by attendance) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- ATTENDANCE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      attendance_date DATE NOT NULL,
      clock_in TIME,
      clock_out TIME,
      method VARCHAR DEFAULT 'facial_recognition',
      shift_id INTEGER,
      total_hours NUMERIC,
      is_late INTEGER DEFAULT 0,
      is_absent INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (shift_id) REFERENCES shifts(id)
    );
  `);

  // --- SALARY COMPONENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      is_taxable INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- EMPLOYEE SALARIES (Links Employee to Components) ---
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      component_id INTEGER NOT NULL,
      amount NUMERIC NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (component_id) REFERENCES salary_components(id)
    );
  `);

  // --- LEAVE TYPES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS leave_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR NOT NULL,
      description TEXT,
      max_days_per_year INTEGER NOT NULL,
      requires_approval INTEGER DEFAULT 1,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- EMPLOYEE LEAVE BALANCES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_leave_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type_id INTEGER NOT NULL,
      total_entitled INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      remaining INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
    );
  `);

  // --- LEAVE REQUESTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INTEGER NOT NULL,
      reason TEXT,
      rejection_reason TEXT,
      status VARCHAR DEFAULT 'pending',
      approved_by INTEGER,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
      FOREIGN KEY (approved_by) REFERENCES employees(id)
    );
  `);

  // --- PAYROLLS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS payrolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      payroll_month VARCHAR NOT NULL,
      status VARCHAR DEFAULT 'pending',
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- PAYROLL DETAILS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      total_earnings NUMERIC NOT NULL,
      total_deductions NUMERIC NOT NULL,
      net_pay NUMERIC NOT NULL,
      remarks TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (payroll_id) REFERENCES payrolls(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- TAX STATEMENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS tax_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      payroll_id INTEGER NOT NULL,
      gross_income NUMERIC NOT NULL,
      taxable_income NUMERIC NOT NULL,
      tax_deducted NUMERIC NOT NULL,
      tax_code VARCHAR,
      statement_date DATE NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (payroll_id) REFERENCES payrolls(id)
    );
  `);

  console.log('✅ All tables verified/created successfully');
});

export { db };
