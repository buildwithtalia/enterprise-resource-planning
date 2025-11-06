import { Router } from 'express';
import * as billingController from './billing.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All billing routes require authentication
router.use(authenticate);

// Customer routes
router.post('/customers', authorize('billing_manager', 'admin'), billingController.createCustomer);
router.get('/customers', billingController.getAllCustomers);
router.get('/customers/:id', billingController.getCustomer);
router.get('/customers/:id/balance', billingController.getCustomerBalance);

// Invoice routes
router.post('/invoices', authorize('billing_manager', 'admin'), billingController.createInvoice);
router.get('/invoices', billingController.getAllInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.post('/invoices/:id/send', authorize('billing_manager', 'admin'), billingController.sendInvoice);
router.post('/invoices/:id/payment', authorize('billing_manager', 'admin'), billingController.recordPayment);
router.post('/invoices/:id/cancel', authorize('billing_manager', 'admin'), billingController.cancelInvoice);
router.get('/invoices/overdue/check', authorize('billing_manager', 'admin'), billingController.checkOverdueInvoices);

export default router;
