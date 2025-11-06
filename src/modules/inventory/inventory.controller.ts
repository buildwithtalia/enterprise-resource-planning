import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { asyncHandler } from '../../middleware/errorHandler';

const inventoryService = new InventoryService();

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.createInventoryItem(req.body);
  res.status(201).json(item);
});

export const getInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.getInventoryItemById(req.params.id);
  res.json(item);
});

export const getInventoryItemBySku = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.getInventoryItemBySku(req.params.sku);
  res.json(item);
});

export const getAllInventoryItems = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    category: req.query.category as string | undefined,
    status: req.query.status as string | undefined,
    lowStock: req.query.lowStock === 'true',
  };
  const items = await inventoryService.getAllInventoryItems(filters);
  res.json(items);
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.updateInventoryItem(req.params.id, req.body);
  res.json(item);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { adjustment, reason } = req.body;
  const item = await inventoryService.adjustStock(req.params.id, adjustment, reason);
  res.json(item);
});

export const reserveStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const item = await inventoryService.reserveStock(req.params.id, quantity);
  res.json(item);
});

export const releaseReservedStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const item = await inventoryService.releaseReservedStock(req.params.id, quantity);
  res.json(item);
});

export const fulfillReservation = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const item = await inventoryService.fulfillReservation(req.params.id, quantity);
  res.json(item);
});

export const receiveStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantity } = req.body;
  const item = await inventoryService.receiveStock(req.params.id, quantity);
  res.json(item);
});

export const getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await inventoryService.getLowStockItems();
  res.json(items);
});

export const getInventoryValuation = asyncHandler(async (req: Request, res: Response) => {
  const valuation = await inventoryService.getInventoryValuation();
  res.json(valuation);
});

export const getCategoryBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await inventoryService.getCategoryBreakdown();
  res.json(breakdown);
});
