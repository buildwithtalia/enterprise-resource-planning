import { Router } from 'express';
import * as financeController from './finance.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All finance routes require authentication
router.use(authenticate);

router.post('/budgets', authorize('finance_manager', 'admin'), financeController.createBudget);
router.get('/budgets', financeController.getAllBudgets);
router.get('/budgets/:id', financeController.getBudget);
router.post('/budgets/:id/close', authorize('finance_manager', 'admin'), financeController.closeBudget);
router.get('/budgets/:id/utilization', financeController.getBudgetUtilization);
router.get('/department/:department/fiscal-year/:fiscalYear', financeController.getDepartmentBudgetSummary);
router.get('/reports/financial', financeController.generateFinancialReport);

export default router;
