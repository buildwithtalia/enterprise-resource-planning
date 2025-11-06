import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Customer } from './Customer';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Customer)
  customer: Customer;

  @Column({ type: 'date' })
  invoiceDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ default: 'pending' })
  status: string; // pending, sent, paid, overdue, cancelled

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  accountingTransactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
