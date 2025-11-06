import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  category: string;

  @Column('int', { default: 0 })
  quantityOnHand: number;

  @Column('int', { default: 0 })
  quantityReserved: number;

  @Column('int', { default: 0 })
  quantityOnOrder: number;

  @Column('int')
  reorderPoint: number;

  @Column('int')
  reorderQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ nullable: true })
  warehouseLocation: string;

  @Column({ nullable: true })
  preferredVendorId: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
