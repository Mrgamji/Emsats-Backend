import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the database path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

// Connect to SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ SQLite Connection Error:', err.message);
  else console.log('✅ Connected to SQLite database');
});

// Create all tables
db.serialize(() => {
  console.log('🛠️ Creating database schema...');

  // --- USERS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      email_verified_at DATETIME,
      password TEXT NOT NULL,
      remember_token TEXT,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- OTP CACHE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      otp TEXT,
      expires_at DATETIME
    );
  `);

  // --- PASSWORD RESETS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      token TEXT,
      created_at DATETIME
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      created_at DATETIME
    );
  `);

  // --- EMPLOYEES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      photo TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      manager_id INTEGER,
      employment_type TEXT NOT NULL,
      date_of_joining DATE,
      employee_code TEXT UNIQUE NOT NULL,
      age INTEGER,
      date_of_birth DATE,
      role TEXT NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (manager_id) REFERENCES employees(id)
    );
  `);

  // --- SHIFTS ---
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
      method TEXT DEFAULT 'facial_recognition',
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

  // --- WEEKLY ATTENDANCE LOGS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      week INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_minutes INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- MONTHLY ATTENDANCE LOGS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_minutes INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- SALARY COMPONENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_taxable INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- EMPLOYEE SALARIES ---
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
      name TEXT NOT NULL,
      description TEXT,
      max_days_per_year INTEGER NOT NULL,
      requires_approval INTEGER DEFAULT 1,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- LEAVE BALANCES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS leave_balances (
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
      status TEXT DEFAULT 'pending',
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
      payroll_month TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- PAYSLIPS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS payslips (
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
      tax_code TEXT,
      statement_date DATE NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (payroll_id) REFERENCES payrolls(id)
    );
  `);

  // --- PERFORMANCE GOALS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS performance_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      goal_title TEXT NOT NULL,
      description TEXT,
      kpi_metric TEXT,
      status TEXT DEFAULT 'pending',
      start_date DATE,
      due_date DATE,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- PERFORMANCE REVIEWS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS performance_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      rating INTEGER,
      comments TEXT,
      review_date DATE,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (reviewer_id) REFERENCES employees(id)
    );
  `);

  // --- PROMOTION RECOMMENDATIONS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS promotion_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      recommended_by INTEGER,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (recommended_by) REFERENCES employees(id)
    );
  `);

  // --- REPORTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type TEXT NOT NULL,
      generated_by INTEGER,
      filters TEXT,
      generated_at DATETIME NOT NULL,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (generated_by) REFERENCES employees(id)
    );
  `);

  // --- ANNOUNCEMENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      published_at DATETIME,
      priority TEXT DEFAULT 'normal',
      announcer_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (announcer_id) REFERENCES employees(id)
    );
  `);

  // --- AUDIT TRAILS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_trails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      action TEXT NOT NULL,
      target_table TEXT,
      target_id TEXT,
      ip_address TEXT,
      details TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- ANALYTICS LOGS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_by INTEGER,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (created_by) REFERENCES employees(id)
    );
  `);

  // --- COURSES ---
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      created_at DATETIME,
      updated_at DATETIME
    );
  `);

  // --- COURSE ASSIGNMENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS course_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT DEFAULT 'assigned',
      assigned_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );
  `);

  // --- CERTIFICATIONS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      certificate_name TEXT NOT NULL,
      file_path TEXT,
      issued_date DATE NOT NULL,
      course_id INTEGER,
      created_at DATETIME,
      updated_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );
  `);

  // --- DOCUMENTS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // --- CACHE ---
  db.run(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expiration INTEGER NOT NULL
    );
  `);

  // --- CACHE LOCKS ---
  db.run(`
    CREATE TABLE IF NOT EXISTS cache_locks (
      key TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      expiration INTEGER NOT NULL
    );
  `);

  console.log('✅ All tables created successfully!');
});

export { db };
