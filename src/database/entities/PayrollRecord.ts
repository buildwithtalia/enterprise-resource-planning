import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity('payroll_records')
export class PayrollRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, employee => employee.payrollRecords)
  employee: Employee;

  @Column({ type: 'date' })
  payPeriodStart: Date;

  @Column({ type: 'date' })
  payPeriodEnd: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  grossPay: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  federalTax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stateTax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  socialSecurityTax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  medicareTax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column('decimal', { precision: 10, scale: 2 })
  netPay: number;

  @Column({ default: 'pending' })
  status: string; // pending, processed, paid

  @Column({ nullable: true })
  accountingTransactionId: string; // Reference to accounting journal entry

  @CreateDateColumn()
  createdAt: Date;
}
