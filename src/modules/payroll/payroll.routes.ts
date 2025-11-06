import { Router } from 'express';
import * as payrollController from './payroll.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All payroll routes require authentication
router.use(authenticate);

router.post('/process', authorize('payroll_manager', 'admin'), payrollController.processPayroll);
router.post('/batch-process', authorize('payroll_manager', 'admin'), payrollController.processBatchPayroll);
router.post('/:id/approve', authorize('payroll_manager', 'admin'), payrollController.approvePayroll);
router.get('/', payrollController.getAllPayroll);
router.get('/:id', payrollController.getPayroll);
router.get('/employee/:employeeId/history', payrollController.getEmployeePayrollHistory);

export default router;
