import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('accounting_transactions')
export class AccountingTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column()
  accountCode: string; // e.g., "5000" for Payroll Expense, "1000" for Cash

  @Column()
  accountName: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  debitAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  creditAmount: number;

  @Column()
  transactionType: string; // payroll, purchase, sale, adjustment

  @Column({ nullable: true })
  referenceId: string; // ID from source module (payroll, invoice, etc.)

  @Column({ nullable: true })
  referenceType: string; // payroll_record, invoice, purchase_order

  @Column({ default: 'posted' })
  status: string; // draft, posted, reconciled

  @CreateDateColumn()
  createdAt: Date;
}
