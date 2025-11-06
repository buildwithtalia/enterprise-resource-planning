import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Vendor } from './Vendor';

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  poNumber: string;

  @ManyToOne(() => Vendor)
  vendor: Vendor;

  @Column({ type: 'date' })
  orderDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ default: 'pending' })
  status: string; // pending, approved, ordered, received, cancelled

  @Column('text', { nullable: true })
  items: string; // JSON string of items

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  accountingTransactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
