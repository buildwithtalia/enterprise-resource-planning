import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Department } from './Department';
import { PayrollRecord } from './PayrollRecord';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  jobTitle: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;

  @Column({ type: 'date' })
  hireDate: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate: Date | null;

  @Column({ default: 'active' })
  status: string; // active, on_leave, terminated

  @Column({ nullable: true })
  socialSecurityNumber: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @ManyToOne(() => Department, department => department.employees)
  department: Department;

  @OneToMany(() => PayrollRecord, payroll => payroll.employee)
  payrollRecords: PayrollRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
