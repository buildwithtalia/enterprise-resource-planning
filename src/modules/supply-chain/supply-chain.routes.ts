import { Router } from 'express';
import * as supplyChainController from './supply-chain.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All supply chain routes require authentication
router.use(authenticate);

router.post('/shipments', authorize('warehouse_manager', 'admin'), supplyChainController.createShipment);
router.get('/shipments', supplyChainController.getAllShipments);
router.get('/shipments/:id', supplyChainController.getShipment);
router.get('/shipments/tracking/:trackingNumber', supplyChainController.getShipmentByTracking);
router.get('/shipments/order/:orderId', supplyChainController.getShipmentsByOrder);
router.post('/shipments/:id/dispatch', authorize('warehouse_manager', 'admin'), supplyChainController.dispatchShipment);
router.put('/shipments/:id/status', authorize('warehouse_manager', 'admin'), supplyChainController.updateShipmentStatus);
router.post('/shipments/:id/deliver', authorize('warehouse_manager', 'admin'), supplyChainController.markDelivered);
router.post('/shipments/:id/cancel', authorize('warehouse_manager', 'admin'), supplyChainController.cancelShipment);
router.get('/carriers/:carrier/performance', supplyChainController.getCarrierPerformance);
router.get('/summary/inbound', supplyChainController.getInboundSummary);
router.get('/summary/outbound', supplyChainController.getOutboundSummary);

export default router;
