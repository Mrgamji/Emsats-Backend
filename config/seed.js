import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('❌ Error connecting to SQLite:', err.message);
  else console.log('✅ Connected to SQLite database');
});

// Helper: Run SQL with Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Wipe in order of foreign key dependencies (child first)
    const tableWipeOrder = [
      'employee_salaries',
      'salary_components',
      'payroll_details',
      'payrolls',
      'tax_statements',
      'audit_trails',
      'analytics_logs',
      'performance_goals',
      'announcements',
      'leave_requests',
      'employee_leave_balances',
      'leave_types',
      'attendance',
      'employees',
      'users'
    ];
    // Some tables may not exist yet, so ignore errors when deleting
    for (const table of tableWipeOrder) {
      try {
        await run(`DELETE FROM ${table}`);
      } catch(e) {}
    }

    // --- USERS ---
    await run(`
      INSERT INTO users (name, email, phone, password)
      VALUES 
        ('Admin User', 'admin@company.com', '+2348012345678', '$2a$10$nACL1hQ/8W6iECMStBKnqO2zn6m.7trvIN/6G8kAVAcgDzByA8USC'),
        ('HR Manager', 'hr@company.com', '+2348098765432', '$2a$10$nACL1hQ/8W6iECMStBKnqO2zn6m.7trvIN/6G8kAVAcgDzByA8USC')
    `);

    // --- EMPLOYEES ---
    await run(`
      INSERT INTO employees 
        (first_name, last_name, email, phone, designation, department, employment_type, employee_code, role, date_of_joining, created_at, updated_at)
      VALUES
        ('Abdul', 'Shakur', 'abdul@company.com', '+2348011111111', 'Software Engineer', 'IT', 'Full-time', 'EMP001', 'employee', '2023-01-10', datetime('now'), datetime('now')),
        ('Maryam', 'Adamu', 'maryam@company.com', '+2348022222222', 'HR Manager', 'Human Resources', 'Full-time', 'EMP002', 'hr', '2022-03-15', datetime('now'), datetime('now')),
        ('John', 'Okafor', 'john@company.com', '+2348033333333', 'Accountant', 'Finance', 'Full-time', 'EMP003', 'employee', '2021-07-01', datetime('now'), datetime('now'));
    `);

    // --- SALARY COMPONENTS ---
    await run(`
      INSERT INTO salary_components (name, type, is_taxable, created_at, updated_at)
      VALUES
        ('Basic Salary', 'earning', 1, datetime('now'), datetime('now')),
        ('Housing Allowance', 'earning', 1, datetime('now'), datetime('now')),
        ('Transport Allowance', 'earning', 1, datetime('now'), datetime('now')),
        ('Tax', 'deduction', 1, datetime('now'), datetime('now'));
    `);

    // --- EMPLOYEE SALARIES ---
    await run(`
      INSERT INTO employee_salaries (employee_id, component_id, amount, created_at, updated_at)
      VALUES
        (1, 1, 200000, datetime('now'), datetime('now')),
        (1, 2, 50000, datetime('now'), datetime('now')),
        (1, 3, 30000, datetime('now'), datetime('now')),
        (1, 4, 15000, datetime('now'), datetime('now')),
        (2, 1, 250000, datetime('now'), datetime('now')),
        (2, 4, 20000, datetime('now'), datetime('now'));
    `);

    // --- LEAVE TYPES ---
    await run(`
      INSERT INTO leave_types (name, description, max_days_per_year, requires_approval, created_at, updated_at)
      VALUES
        ('Annual Leave', 'Paid yearly vacation leave', 21, 1, datetime('now'), datetime('now')),
        ('Sick Leave', 'Leave for illness or medical reasons', 10, 1, datetime('now'), datetime('now')),
        ('Maternity Leave', 'For expecting mothers', 90, 1, datetime('now'), datetime('now'));
    `);

    // --- EMPLOYEE LEAVE BALANCES ---
    await run(`
      INSERT INTO employee_leave_balances (employee_id, leave_type_id, total_entitled, used, remaining, created_at, updated_at)
      VALUES
        (1, 1, 21, 5, 16, datetime('now'), datetime('now')),
        (2, 1, 21, 10, 11, datetime('now'), datetime('now'));
    `);

    // --- PAYROLLS ---
    await run(`
      INSERT INTO payrolls (start_date, end_date, payroll_month, status, created_at, updated_at)
      VALUES
        ('2025-09-01', '2025-09-30', 'September 2025', 'completed', datetime('now'), datetime('now'));
    `);

    // --- PAYROLL DETAILS ---
    await run(`
      INSERT INTO payroll_details (payroll_id, employee_id, total_earnings, total_deductions, net_pay, remarks, created_at, updated_at)
      VALUES
        (1, 1, 280000, 15000, 265000, 'On time', datetime('now'), datetime('now')),
        (1, 2, 270000, 20000, 250000, 'On time', datetime('now'), datetime('now'));
    `);

    // --- TAX STATEMENTS ---
    await run(`
      INSERT INTO tax_statements (employee_id, payroll_id, gross_income, taxable_income, tax_deducted, tax_code, statement_date, created_at, updated_at)
      VALUES
        (1, 1, 300000, 285000, 15000, 'TX1', '2025-09-30', datetime('now'), datetime('now')),
        (2, 1, 290000, 270000, 20000, 'TX2', '2025-09-30', datetime('now'), datetime('now'));
    `);

    // --- PERFORMANCE GOALS ---
    await run(`
      INSERT INTO performance_goals (employee_id, goal_title, description, kpi_metric, status, start_date, due_date, created_at, updated_at)
      VALUES
        (1, 'Improve API response speed', 'Optimize database queries to reduce load time by 20%', 'Response Time', 'in_progress', '2025-09-01', '2025-12-01', datetime('now'), datetime('now')),
        (2, 'Enhance employee engagement', 'Launch new HR feedback platform', 'Engagement Rate', 'pending', '2025-10-01', '2025-12-31', datetime('now'), datetime('now'));
    `);

    // --- ANNOUNCEMENTS ---
    await run(`
      INSERT INTO announcements (title, body, published_at, priority, announcer_id, is_active, created_at, updated_at)
      VALUES
        ('Company Town Hall', 'Monthly all-hands meeting on Friday', datetime('now'), 'high', 2, 1, datetime('now'), datetime('now')),
        ('Holiday Notice', 'Office closed for Eid celebration', datetime('now'), 'normal', 2, 1, datetime('now'), datetime('now'));
    `);

    // --- AUDIT TRAILS ---
    await run(`
      INSERT INTO audit_trails (employee_id, action, target_table, target_id, ip_address, details, created_at, updated_at)
      VALUES
        (1, 'UPDATE', 'employees', '1', '192.168.1.10', 'Updated contact info', datetime('now'), datetime('now')),
        (2, 'INSERT', 'announcements', '1', '192.168.1.12', 'Created new announcement', datetime('now'), datetime('now'));
    `);

    // --- ANALYTICS LOGS ---
    await run(`
      INSERT INTO analytics_logs (name, description, data, created_by, created_at, updated_at)
      VALUES
        ('Login Activity', 'Tracks user login frequency', '{"logins": [10, 12, 9]}', 2, datetime('now'), datetime('now')),
        ('Leave Summary', 'Monthly leave usage report', '{"used": 5, "remaining": 16}', 2, datetime('now'), datetime('now'));
    `);

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeder error:', err);
  } finally {
    db.close();
  }
}

seed();
