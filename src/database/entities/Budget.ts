import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fiscalYear: number;

  @Column()
  department: string;

  @Column()
  category: string; // salaries, operations, capital_expenditure, etc.

  @Column('decimal', { precision: 12, scale: 2 })
  allocatedAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spentAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  committedAmount: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 'active' })
  status: string; // active, closed, exceeded

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
