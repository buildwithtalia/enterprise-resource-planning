import { Router } from 'express';
import * as inventoryController from './inventory.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

router.post('/items', authorize('warehouse_manager', 'admin'), inventoryController.createInventoryItem);
router.get('/items', inventoryController.getAllInventoryItems);
router.get('/items/:id', inventoryController.getInventoryItem);
router.get('/items/sku/:sku', inventoryController.getInventoryItemBySku);
router.put('/items/:id', authorize('warehouse_manager', 'admin'), inventoryController.updateInventoryItem);
router.post('/items/:id/adjust', authorize('warehouse_manager', 'admin'), inventoryController.adjustStock);
router.post('/items/:id/reserve', authorize('warehouse_manager', 'admin'), inventoryController.reserveStock);
router.post('/items/:id/release', authorize('warehouse_manager', 'admin'), inventoryController.releaseReservedStock);
router.post('/items/:id/fulfill', authorize('warehouse_manager', 'admin'), inventoryController.fulfillReservation);
router.post('/items/:id/receive', authorize('warehouse_manager', 'admin'), inventoryController.receiveStock);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/valuation', inventoryController.getInventoryValuation);
router.get('/category-breakdown', inventoryController.getCategoryBreakdown);

export default router;
