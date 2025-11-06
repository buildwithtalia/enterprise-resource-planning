import { Router } from 'express';
import * as accountingController from './accounting.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All accounting routes require authentication
router.use(authenticate);

router.post('/journal-entries', authorize('accountant', 'admin'), accountingController.createJournalEntry);
router.get('/transactions', accountingController.getAllTransactions);
router.get('/transactions/:id', accountingController.getTransaction);
router.get('/ledger/:accountCode', accountingController.getGeneralLedger);
router.get('/trial-balance', accountingController.getTrialBalance);

export default router;
