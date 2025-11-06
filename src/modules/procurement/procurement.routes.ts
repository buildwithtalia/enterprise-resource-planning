import { Router } from 'express';
import * as procurementController from './procurement.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All procurement routes require authentication
router.use(authenticate);

// Vendor routes
router.post('/vendors', authorize('procurement_manager', 'admin'), procurementController.createVendor);
router.get('/vendors', procurementController.getAllVendors);
router.get('/vendors/:id', procurementController.getVendor);
router.get('/vendors/:id/performance', procurementController.getVendorPerformance);

// Purchase Order routes
router.post('/purchase-orders', authorize('procurement_manager', 'admin'), procurementController.createPurchaseOrder);
router.get('/purchase-orders', procurementController.getAllPurchaseOrders);
router.get('/purchase-orders/:id', procurementController.getPurchaseOrder);
router.post('/purchase-orders/:id/approve', authorize('procurement_manager', 'admin'), procurementController.approvePurchaseOrder);
router.post('/purchase-orders/:id/place', authorize('procurement_manager', 'admin'), procurementController.placePurchaseOrder);
router.post('/purchase-orders/:id/receive', authorize('warehouse_manager', 'admin'), procurementController.receivePurchaseOrder);
router.post('/purchase-orders/:id/cancel', authorize('procurement_manager', 'admin'), procurementController.cancelPurchaseOrder);

export default router;
