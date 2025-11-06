import { AppDataSource } from '../../database/connection';
import { Shipment } from '../../database/entities/Shipment';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';

/**
 * Supply Chain Service
 * Manages shipments, logistics, distribution, and warehousing
 */
export class SupplyChainService {
  private shipmentRepo = AppDataSource.getRepository(Shipment);

  private generateTrackingNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TRK-${timestamp}-${random}`;
  }

  async createShipment(data: {
    orderId?: string;
    orderType: 'inbound' | 'outbound';
    carrier: string;
    estimatedDeliveryDate?: Date;
    originAddress: string;
    destinationAddress: string;
    shippingCost?: number;
    items: Array<{
      sku: string;
      name: string;
      quantity: number;
    }>;
  }): Promise<Shipment> {
    logger.info('SupplyChain: Creating shipment', {
      orderType: data.orderType,
      carrier: data.carrier,
    });

    const shipment = this.shipmentRepo.create({
      trackingNumber: this.generateTrackingNumber(),
      orderId: data.orderId,
      orderType: data.orderType,
      carrier: data.carrier,
      shipDate: new Date(),
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      originAddress: data.originAddress,
      destinationAddress: data.destinationAddress,
      shippingCost: data.shippingCost || 0,
      items: JSON.stringify(data.items),
      status: 'pending',
    });

    await this.shipmentRepo.save(shipment);
    logger.info('SupplyChain: Shipment created', {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
    });

    return shipment;
  }

  async getShipmentById(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id },
    });

    if (!shipment) {
      throw new AppError(404, 'Shipment not found');
    }

    return shipment;
  }

  async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber },
    });

    if (!shipment) {
      throw new AppError(404, 'Shipment not found');
    }

    return shipment;
  }

  async getAllShipments(filters?: {
    status?: string;
    orderType?: string;
    carrier?: string;
  }): Promise<Shipment[]> {
    const queryBuilder = this.shipmentRepo.createQueryBuilder('shipment');

    if (filters?.status) {
      queryBuilder.andWhere('shipment.status = :status', { status: filters.status });
    }

    if (filters?.orderType) {
      queryBuilder.andWhere('shipment.orderType = :orderType', {
        orderType: filters.orderType,
      });
    }

    if (filters?.carrier) {
      queryBuilder.andWhere('shipment.carrier = :carrier', {
        carrier: filters.carrier,
      });
    }

    return queryBuilder.orderBy('shipment.shipDate', 'DESC').getMany();
  }

  async dispatchShipment(id: string): Promise<Shipment> {
    const shipment = await this.getShipmentById(id);

    if (shipment.status !== 'pending') {
      throw new AppError(400, 'Shipment already dispatched or completed');
    }

    shipment.status = 'in_transit';
    await this.shipmentRepo.save(shipment);

    logger.info('SupplyChain: Shipment dispatched', {
      shipmentId: id,
      trackingNumber: shipment.trackingNumber,
    });

    return shipment;
  }

  async updateShipmentStatus(
    id: string,
    status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'
  ): Promise<Shipment> {
    const shipment = await this.getShipmentById(id);

    shipment.status = status;

    if (status === 'delivered' && !shipment.actualDeliveryDate) {
      shipment.actualDeliveryDate = new Date();
    }

    await this.shipmentRepo.save(shipment);

    logger.info('SupplyChain: Shipment status updated', {
      shipmentId: id,
      status,
    });

    return shipment;
  }

  async markShipmentDelivered(id: string, actualDeliveryDate: Date): Promise<Shipment> {
    const shipment = await this.getShipmentById(id);

    if (shipment.status === 'delivered') {
      throw new AppError(400, 'Shipment already delivered');
    }

    shipment.status = 'delivered';
    shipment.actualDeliveryDate = actualDeliveryDate;
    await this.shipmentRepo.save(shipment);

    logger.info('SupplyChain: Shipment delivered', {
      shipmentId: id,
      trackingNumber: shipment.trackingNumber,
    });

    return shipment;
  }

  async cancelShipment(id: string): Promise<Shipment> {
    const shipment = await this.getShipmentById(id);

    if (shipment.status === 'delivered') {
      throw new AppError(400, 'Cannot cancel delivered shipment');
    }

    shipment.status = 'cancelled';
    await this.shipmentRepo.save(shipment);

    logger.info('SupplyChain: Shipment cancelled', { shipmentId: id });
    return shipment;
  }

  async getShipmentsByOrder(orderId: string): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: { orderId },
      order: { shipDate: 'DESC' },
    });
  }

  async getCarrierPerformance(carrier: string): Promise<{
    carrier: string;
    totalShipments: number;
    deliveredShipments: number;
    delayedShipments: number;
    onTimeDeliveryRate: number;
    averageShippingCost: number;
  }> {
    const shipments = await this.getAllShipments({ carrier });
    const deliveredShipments = shipments.filter(s => s.status === 'delivered');
    const delayedShipments = shipments.filter(s => s.status === 'delayed');

    const onTimeShipments = deliveredShipments.filter(s => {
      if (!s.estimatedDeliveryDate || !s.actualDeliveryDate) return false;
      return s.actualDeliveryDate <= s.estimatedDeliveryDate;
    });

    const onTimeDeliveryRate = deliveredShipments.length > 0
      ? (onTimeShipments.length / deliveredShipments.length) * 100
      : 0;

    const totalShippingCost = shipments.reduce((sum, s) => sum + Number(s.shippingCost), 0);
    const averageShippingCost = shipments.length > 0
      ? totalShippingCost / shipments.length
      : 0;

    return {
      carrier,
      totalShipments: shipments.length,
      deliveredShipments: deliveredShipments.length,
      delayedShipments: delayedShipments.length,
      onTimeDeliveryRate: Number(onTimeDeliveryRate.toFixed(2)),
      averageShippingCost: Number(averageShippingCost.toFixed(2)),
    };
  }

  async getInboundShipmentsSummary(): Promise<{
    pending: number;
    inTransit: number;
    delivered: number;
    delayed: number;
  }> {
    const inboundShipments = await this.getAllShipments({ orderType: 'inbound' });

    return {
      pending: inboundShipments.filter(s => s.status === 'pending').length,
      inTransit: inboundShipments.filter(s => s.status === 'in_transit').length,
      delivered: inboundShipments.filter(s => s.status === 'delivered').length,
      delayed: inboundShipments.filter(s => s.status === 'delayed').length,
    };
  }

  async getOutboundShipmentsSummary(): Promise<{
    pending: number;
    inTransit: number;
    delivered: number;
    delayed: number;
  }> {
    const outboundShipments = await this.getAllShipments({ orderType: 'outbound' });

    return {
      pending: outboundShipments.filter(s => s.status === 'pending').length,
      inTransit: outboundShipments.filter(s => s.status === 'in_transit').length,
      delivered: outboundShipments.filter(s => s.status === 'delivered').length,
      delayed: outboundShipments.filter(s => s.status === 'delayed').length,
    };
  }
}
