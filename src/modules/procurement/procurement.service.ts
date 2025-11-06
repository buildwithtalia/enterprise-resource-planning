import { AppDataSource } from '../../database/connection';
import { PurchaseOrder } from '../../database/entities/PurchaseOrder';
import { Vendor } from '../../database/entities/Vendor';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Procurement Service
 * Manages purchase orders, vendor relationships, and purchasing processes
 * DEMONSTRATES CROSS-COUPLING: Calls AccountingService to record purchases
 * DEMONSTRATES CROSS-COUPLING: Called by Inventory module for reordering
 */
export class ProcurementService {
  private purchaseOrderRepo = AppDataSource.getRepository(PurchaseOrder);
  private vendorRepo = AppDataSource.getRepository(Vendor);
  private accountingService = new AccountingService(); // Direct dependency on Accounting

  private generatePONumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PO-${timestamp}-${random}`;
  }

  async createVendor(data: {
    name: string;
    vendorCode: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    paymentTerms?: string;
    discountRate?: number;
  }): Promise<Vendor> {
    logger.info('Procurement: Creating vendor', { vendorCode: data.vendorCode });

    const existingVendor = await this.vendorRepo.findOne({
      where: { vendorCode: data.vendorCode },
    });

    if (existingVendor) {
      throw new AppError(400, 'Vendor with this code already exists');
    }

    const vendor = this.vendorRepo.create({
      ...data,
      status: 'active',
      discountRate: data.discountRate || 0,
    });

    await this.vendorRepo.save(vendor);
    logger.info('Procurement: Vendor created', { vendorId: vendor.id });

    return vendor;
  }

  async getVendorById(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
    });

    if (!vendor) {
      throw new AppError(404, 'Vendor not found');
    }

    return vendor;
  }

  async getAllVendors(status?: string): Promise<Vendor[]> {
    const where = status ? { status } : {};
    return this.vendorRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async createPurchaseOrder(data: {
    vendorId: string;
    expectedDeliveryDate?: Date;
    items: Array<{
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<PurchaseOrder> {
    logger.info('Procurement: Creating purchase order', { vendorId: data.vendorId });

    const vendor = await this.getVendorById(data.vendorId);

    // Calculate total amount
    let totalAmount = 0;
    for (const item of data.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // Apply vendor discount
    const discount = totalAmount * Number(vendor.discountRate);
    totalAmount = totalAmount - discount;

    const purchaseOrder = this.purchaseOrderRepo.create({
      poNumber: this.generatePONumber(),
      vendor,
      orderDate: new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate,
      totalAmount: Number(totalAmount.toFixed(2)),
      items: JSON.stringify(data.items),
      status: 'pending',
    });

    await this.purchaseOrderRepo.save(purchaseOrder);
    logger.info('Procurement: Purchase order created', {
      poId: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
    });

    return purchaseOrder;
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const po = await this.purchaseOrderRepo.findOne({
      where: { id },
      relations: ['vendor'],
    });

    if (!po) {
      throw new AppError(404, 'Purchase order not found');
    }

    return po;
  }

  async getAllPurchaseOrders(filters?: {
    status?: string;
    vendorId?: string;
  }): Promise<PurchaseOrder[]> {
    const queryBuilder = this.purchaseOrderRepo.createQueryBuilder('po')
      .leftJoinAndSelect('po.vendor', 'vendor');

    if (filters?.status) {
      queryBuilder.andWhere('po.status = :status', { status: filters.status });
    }

    if (filters?.vendorId) {
      queryBuilder.andWhere('po.vendor.id = :vendorId', {
        vendorId: filters.vendorId,
      });
    }

    return queryBuilder
      .orderBy('po.orderDate', 'DESC')
      .getMany();
  }

  async approvePurchaseOrder(id: string, approvedBy: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    if (po.status !== 'pending') {
      throw new AppError(400, 'Purchase order already processed');
    }

    po.status = 'approved';
    po.approvedBy = approvedBy;
    await this.purchaseOrderRepo.save(po);

    logger.info('Procurement: Purchase order approved', { poId: id, approvedBy });
    return po;
  }

  async placePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    if (po.status !== 'approved') {
      throw new AppError(400, 'Purchase order must be approved first');
    }

    po.status = 'ordered';
    await this.purchaseOrderRepo.save(po);

    // CROSS-COUPLING: Record purchase in Accounting module
    const transactions = await this.accountingService.recordPurchase({
      purchaseOrderId: po.id,
      amount: Number(po.totalAmount),
      date: new Date(),
      vendorName: po.vendor.name,
    });

    if (transactions.length > 0) {
      po.accountingTransactionId = transactions[0].id;
      await this.purchaseOrderRepo.save(po);
    }

    logger.info('Procurement: Purchase order placed and recorded in accounting', {
      poId: id,
      transactionId: transactions[0]?.id,
    });

    return po;
  }

  async receivePurchaseOrder(id: string, actualDeliveryDate: Date): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    if (po.status !== 'ordered') {
      throw new AppError(400, 'Purchase order not in ordered status');
    }

    po.status = 'received';
    po.actualDeliveryDate = actualDeliveryDate;
    await this.purchaseOrderRepo.save(po);

    logger.info('Procurement: Purchase order received', { poId: id });
    return po;
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id);

    if (po.status === 'received') {
      throw new AppError(400, 'Cannot cancel received purchase order');
    }

    po.status = 'cancelled';
    await this.purchaseOrderRepo.save(po);

    logger.info('Procurement: Purchase order cancelled', { poId: id });
    return po;
  }

  async getVendorPerformance(vendorId: string): Promise<{
    vendor: Vendor;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
  }> {
    const vendor = await this.getVendorById(vendorId);
    const orders = await this.getAllPurchaseOrders({ vendorId });

    const completedOrders = orders.filter(po => po.status === 'received');
    const totalSpent = completedOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);

    const onTimeOrders = completedOrders.filter(po => {
      if (!po.expectedDeliveryDate || !po.actualDeliveryDate) return false;
      return po.actualDeliveryDate <= po.expectedDeliveryDate;
    });

    const onTimeDeliveryRate = completedOrders.length > 0
      ? (onTimeOrders.length / completedOrders.length) * 100
      : 0;

    return {
      vendor,
      totalOrders: orders.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      averageOrderValue: orders.length > 0 ? Number((totalSpent / orders.length).toFixed(2)) : 0,
      onTimeDeliveryRate: Number(onTimeDeliveryRate.toFixed(2)),
    };
  }

  /**
   * CROSS-COUPLING EXAMPLE: Called by Inventory module for automatic reordering
   */
  async createReorderPurchaseOrder(data: {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    vendorId: string;
  }): Promise<PurchaseOrder> {
    logger.info('Procurement: Creating reorder purchase order from Inventory module', {
      sku: data.sku,
    });

    return this.createPurchaseOrder({
      vendorId: data.vendorId,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: [
        {
          sku: data.sku,
          name: data.name,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
        },
      ],
    });
  }
}
