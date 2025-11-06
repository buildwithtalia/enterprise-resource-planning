import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column({ nullable: true })
  orderId: string; // Reference to sales order or purchase order

  @Column()
  orderType: string; // inbound, outbound

  @Column()
  carrier: string;

  @Column({ type: 'date' })
  shipDate: Date;

  @Column({ type: 'date', nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  @Column({ nullable: true })
  originAddress: string;

  @Column({ nullable: true })
  destinationAddress: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ default: 'pending' })
  status: string; // pending, in_transit, delivered, delayed, cancelled

  @Column('text', { nullable: true })
  items: string; // JSON string of items

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
