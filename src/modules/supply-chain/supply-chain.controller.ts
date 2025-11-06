import { Request, Response } from 'express';
import { SupplyChainService } from './supply-chain.service';
import { asyncHandler } from '../../middleware/errorHandler';

const supplyChainService = new SupplyChainService();

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await supplyChainService.createShipment(req.body);
  res.status(201).json(shipment);
});

export const getShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await supplyChainService.getShipmentById(req.params.id);
  res.json(shipment);
});

export const getShipmentByTracking = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await supplyChainService.getShipmentByTrackingNumber(
    req.params.trackingNumber
  );
  res.json(shipment);
});

export const getAllShipments = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    orderType: req.query.orderType as string | undefined,
    carrier: req.query.carrier as string | undefined,
  };
  const shipments = await supplyChainService.getAllShipments(filters);
  res.json(shipments);
});

export const dispatchShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await supplyChainService.dispatchShipment(req.params.id);
  res.json(shipment);
});

export const updateShipmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const shipment = await supplyChainService.updateShipmentStatus(req.params.id, status);
  res.json(shipment);
});

export const markDelivered = asyncHandler(async (req: Request, res: Response) => {
  const { actualDeliveryDate } = req.body;
  const shipment = await supplyChainService.markShipmentDelivered(
    req.params.id,
    new Date(actualDeliveryDate)
  );
  res.json(shipment);
});

export const cancelShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await supplyChainService.cancelShipment(req.params.id);
  res.json(shipment);
});

export const getShipmentsByOrder = asyncHandler(async (req: Request, res: Response) => {
  const shipments = await supplyChainService.getShipmentsByOrder(req.params.orderId);
  res.json(shipments);
});

export const getCarrierPerformance = asyncHandler(async (req: Request, res: Response) => {
  const performance = await supplyChainService.getCarrierPerformance(req.params.carrier);
  res.json(performance);
});

export const getInboundSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await supplyChainService.getInboundShipmentsSummary();
  res.json(summary);
});

export const getOutboundSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await supplyChainService.getOutboundShipmentsSummary();
  res.json(summary);
});
