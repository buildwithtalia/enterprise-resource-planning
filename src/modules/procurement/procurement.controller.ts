import { Request, Response } from 'express';
import { ProcurementService } from './procurement.service';
import { asyncHandler } from '../../middleware/errorHandler';

const procurementService = new ProcurementService();

// Vendor endpoints
export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await procurementService.createVendor(req.body);
  res.status(201).json(vendor);
});

export const getVendor = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await procurementService.getVendorById(req.params.id);
  res.json(vendor);
});

export const getAllVendors = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const vendors = await procurementService.getAllVendors(status);
  res.json(vendors);
});

export const getVendorPerformance = asyncHandler(async (req: Request, res: Response) => {
  const performance = await procurementService.getVendorPerformance(req.params.id);
  res.json(performance);
});

// Purchase Order endpoints
export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const po = await procurementService.createPurchaseOrder(req.body);
  res.status(201).json(po);
});

export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const po = await procurementService.getPurchaseOrderById(req.params.id);
  res.json(po);
});

export const getAllPurchaseOrders = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    vendorId: req.query.vendorId as string | undefined,
  };
  const orders = await procurementService.getAllPurchaseOrders(filters);
  res.json(orders);
});

export const approvePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { approvedBy } = req.body;
  const po = await procurementService.approvePurchaseOrder(req.params.id, approvedBy);
  res.json(po);
});

export const placePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const po = await procurementService.placePurchaseOrder(req.params.id);
  res.json(po);
});

export const receivePurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { actualDeliveryDate } = req.body;
  const po = await procurementService.receivePurchaseOrder(
    req.params.id,
    new Date(actualDeliveryDate)
  );
  res.json(po);
});

export const cancelPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const po = await procurementService.cancelPurchaseOrder(req.params.id);
  res.json(po);
});
