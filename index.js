import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import leaveTypeRoutes from './routes/leaveTypes.js';
import leaveBalanceRoutes from './routes/leaveBalances.js';
import leaveRequestRoutes from './routes/leaveRequests.js';
import salaryComponentRoutes from './routes/salaryComponents.js';
import employeeSalaryRoutes from './routes/employeeSalaries.js';
import payrollRoutes from './routes/payrolls.js';
import payslipRoutes from './routes/payslips.js';
import taxStatementRoutes from './routes/taxStatements.js';
import documentRoutes from './routes/documents.js';
import performanceGoalRoutes from './routes/performanceGoals.js';
import performanceReviewRoutes from './routes/performanceReviews.js';
import feedbackRoutes from './routes/feedback.js';
import promotionRecommendationRoutes from './routes/promotionRecommendations.js';
import courseRoutes from './routes/courses.js';
import courseAssignmentRoutes from './routes/courseAssignments.js';
import certificationRoutes from './routes/certifications.js';
import announcementRoutes from './routes/announcements.js';
import analyticsLogRoutes from './routes/analyticsLogs.js';
import reportRoutes from './routes/reports.js';
import auditTrailRoutes from './routes/auditTrails.js';
import attendanceRoutes from './routes/attendances.js';
import weeklyAttendanceLogRoutes from './routes/weeklyAttendanceLogs.js';
import monthlyAttendanceLogRoutes from './routes/monthlyAttendanceLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leave-balances', leaveBalanceRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/salary-components', salaryComponentRoutes);
app.use('/api/employee-salaries', employeeSalaryRoutes);
app.use('/api/payrolls', payrollRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/tax-statements', taxStatementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/performance-goals', performanceGoalRoutes);
app.use('/api/performance-reviews', performanceReviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/promotion-recommendations', promotionRecommendationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics-logs', analyticsLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-trails', auditTrailRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/weekly-attendance-logs', weeklyAttendanceLogRoutes);
app.use('/api/monthly-attendance-logs', monthlyAttendanceLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
