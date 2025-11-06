import { AppDataSource } from '../../database/connection';
import { InventoryItem } from '../../database/entities/InventoryItem';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { ProcurementService } from '../procurement/procurement.service';

/**
 * Inventory Service
 * Manages stock levels, inventory movements, and automatic reordering
 * DEMONSTRATES CROSS-COUPLING: Calls ProcurementService for automatic reordering
 */
export class InventoryService {
  private inventoryRepo = AppDataSource.getRepository(InventoryItem);
  private procurementService = new ProcurementService(); // Direct dependency on Procurement

  async createInventoryItem(data: {
    sku: string;
    name: string;
    description?: string;
    category: string;
    quantityOnHand: number;
    reorderPoint: number;
    reorderQuantity: number;
    unitCost: number;
    unitPrice: number;
    warehouseLocation?: string;
    preferredVendorId?: string;
  }): Promise<InventoryItem> {
    logger.info('Inventory: Creating inventory item', { sku: data.sku });

    const existingItem = await this.inventoryRepo.findOne({
      where: { sku: data.sku },
    });

    if (existingItem) {
      throw new AppError(400, 'Item with this SKU already exists');
    }

    const item = this.inventoryRepo.create({
      ...data,
      quantityReserved: 0,
      quantityOnOrder: 0,
      status: 'active',
    });

    await this.inventoryRepo.save(item);
    logger.info('Inventory: Item created', { itemId: item.id, sku: item.sku });

    return item;
  }

  async getInventoryItemById(id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findOne({
      where: { id },
    });

    if (!item) {
      throw new AppError(404, 'Inventory item not found');
    }

    return item;
  }

  async getInventoryItemBySku(sku: string): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findOne({
      where: { sku },
    });

    if (!item) {
      throw new AppError(404, 'Inventory item not found');
    }

    return item;
  }

  async getAllInventoryItems(filters?: {
    category?: string;
    status?: string;
    lowStock?: boolean;
  }): Promise<InventoryItem[]> {
    const queryBuilder = this.inventoryRepo.createQueryBuilder('item');

    if (filters?.category) {
      queryBuilder.andWhere('item.category = :category', { category: filters.category });
    }

    if (filters?.status) {
      queryBuilder.andWhere('item.status = :status', { status: filters.status });
    }

    if (filters?.lowStock) {
      queryBuilder.andWhere('item.quantityOnHand <= item.reorderPoint');
    }

    return queryBuilder.orderBy('item.name', 'ASC').getMany();
  }

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    Object.assign(item, data);
    await this.inventoryRepo.save(item);

    logger.info('Inventory: Item updated', { itemId: id });
    return item;
  }

  async adjustStock(
    id: string,
    adjustment: number,
    reason: string
  ): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    const newQuantity = item.quantityOnHand + adjustment;

    if (newQuantity < 0) {
      throw new AppError(400, 'Adjustment would result in negative stock');
    }

    item.quantityOnHand = newQuantity;
    await this.inventoryRepo.save(item);

    logger.info('Inventory: Stock adjusted', {
      itemId: id,
      adjustment,
      newQuantity,
      reason,
    });

    // CROSS-COUPLING: Check if reorder is needed and call Procurement
    await this.checkAndReorder(item);

    return item;
  }

  async reserveStock(id: string, quantity: number): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    const availableQuantity = item.quantityOnHand - item.quantityReserved;

    if (availableQuantity < quantity) {
      throw new AppError(400, 'Insufficient stock available to reserve');
    }

    item.quantityReserved += quantity;
    await this.inventoryRepo.save(item);

    logger.info('Inventory: Stock reserved', { itemId: id, quantity });
    return item;
  }

  async releaseReservedStock(id: string, quantity: number): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    if (item.quantityReserved < quantity) {
      throw new AppError(400, 'Cannot release more than reserved quantity');
    }

    item.quantityReserved -= quantity;
    await this.inventoryRepo.save(item);

    logger.info('Inventory: Reserved stock released', { itemId: id, quantity });
    return item;
  }

  async fulfillReservation(id: string, quantity: number): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    if (item.quantityReserved < quantity) {
      throw new AppError(400, 'Cannot fulfill more than reserved quantity');
    }

    item.quantityReserved -= quantity;
    item.quantityOnHand -= quantity;
    await this.inventoryRepo.save(item);

    logger.info('Inventory: Reservation fulfilled', { itemId: id, quantity });

    // CROSS-COUPLING: Check if reorder is needed and call Procurement
    await this.checkAndReorder(item);

    return item;
  }

  /**
   * CROSS-COUPLING: Automatically creates purchase order via Procurement service
   */
  private async checkAndReorder(item: InventoryItem): Promise<void> {
    const availableQuantity = item.quantityOnHand - item.quantityReserved;

    if (availableQuantity <= item.reorderPoint && item.quantityOnOrder === 0) {
      logger.info('Inventory: Reorder point reached, creating purchase order', {
        itemId: item.id,
        sku: item.sku,
        availableQuantity,
        reorderPoint: item.reorderPoint,
      });

      if (!item.preferredVendorId) {
        logger.warn('Inventory: Cannot auto-reorder, no preferred vendor set', {
          itemId: item.id,
        });
        return;
      }

      try {
        // CROSS-COUPLING: Direct call to Procurement service
        const purchaseOrder = await this.procurementService.createReorderPurchaseOrder({
          sku: item.sku,
          name: item.name,
          quantity: item.reorderQuantity,
          unitPrice: Number(item.unitCost),
          vendorId: item.preferredVendorId,
        });

        item.quantityOnOrder = item.reorderQuantity;
        await this.inventoryRepo.save(item);

        logger.info('Inventory: Automatic reorder purchase order created', {
          itemId: item.id,
          purchaseOrderId: purchaseOrder.id,
          quantity: item.reorderQuantity,
        });
      } catch (error) {
        logger.error('Inventory: Failed to create automatic reorder', {
          itemId: item.id,
          error,
        });
      }
    }
  }

  async receiveStock(id: string, quantity: number): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(id);

    item.quantityOnHand += quantity;

    if (item.quantityOnOrder >= quantity) {
      item.quantityOnOrder -= quantity;
    } else {
      item.quantityOnOrder = 0;
    }

    await this.inventoryRepo.save(item);

    logger.info('Inventory: Stock received', { itemId: id, quantity });
    return item;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return this.inventoryRepo
      .createQueryBuilder('item')
      .where('item.quantityOnHand - item.quantityReserved <= item.reorderPoint')
      .andWhere('item.status = :status', { status: 'active' })
      .orderBy('(item.quantityOnHand - item.quantityReserved) - item.reorderPoint', 'ASC')
      .getMany();
  }

  async getInventoryValuation(): Promise<{
    totalItems: number;
    totalQuantity: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialProfit: number;
  }> {
    const items = await this.getAllInventoryItems({ status: 'active' });

    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantityOnHand, 0);
    const totalCostValue = items.reduce(
      (sum, item) => sum + item.quantityOnHand * Number(item.unitCost),
      0
    );
    const totalRetailValue = items.reduce(
      (sum, item) => sum + item.quantityOnHand * Number(item.unitPrice),
      0
    );
    const potentialProfit = totalRetailValue - totalCostValue;

    return {
      totalItems,
      totalQuantity,
      totalCostValue: Number(totalCostValue.toFixed(2)),
      totalRetailValue: Number(totalRetailValue.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
    };
  }

  async getCategoryBreakdown(): Promise<
    Array<{
      category: string;
      itemCount: number;
      totalQuantity: number;
      totalValue: number;
    }>
  > {
    const items = await this.getAllInventoryItems({ status: 'active' });

    const categoryMap = new Map<
      string,
      { itemCount: number; totalQuantity: number; totalValue: number }
    >();

    for (const item of items) {
      const existing = categoryMap.get(item.category) || {
        itemCount: 0,
        totalQuantity: 0,
        totalValue: 0,
      };

      existing.itemCount++;
      existing.totalQuantity += item.quantityOnHand;
      existing.totalValue += item.quantityOnHand * Number(item.unitCost);

      categoryMap.set(item.category, existing);
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
      totalValue: Number(data.totalValue.toFixed(2)),
    }));
  }
}
