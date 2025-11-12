import { AppDataSource } from '../../database/connection';
import { PayrollRecord } from '../../database/entities/PayrollRecord';
import { Employee } from '../../database/entities/Employee';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { HRService } from '../human-resources/hr.service';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Payroll Service
 * DEMONSTRATES CROSS-COUPLING: Directly calls HRService to get employee data
 * DEMONSTRATES CROSS-COUPLING: Calls AccountingService to create journal entries
 */
export class PayrollService {
  private payrollRepo = AppDataSource.getRepository(PayrollRecord);
  private hrService = new HRService(); // Direct dependency on HR module
  private accountingService = new AccountingService(); // Direct dependency on Accounting module

  private calculateTaxes(grossPay: number): {
    federalTax: number;
    stateTax: number;
    socialSecurityTax: number;
    medicareTax: number;
  } {
    // Simplified tax calculations
    const federalTax = grossPay * 0.15;
    const stateTax = grossPay * 0.05;
    const socialSecurityTax = grossPay * 0.062;
    const medicareTax = grossPay * 0.0145;

    return {
      federalTax: Number(federalTax.toFixed(2)),
      stateTax: Number(stateTax.toFixed(2)),
      socialSecurityTax: Number(socialSecurityTax.toFixed(2)),
      medicareTax: Number(medicareTax.toFixed(2)),
    };
  }

  async processPayroll(data: {
    employeeId: string;
    payPeriodStart: Date;
    payPeriodEnd: Date;
    deductions?: number;
  }): Promise<PayrollRecord> {
    logger.info('Payroll: Processing payroll', { employeeId: data.employeeId });

    // CROSS-COUPLING: Direct call to HR service
    const employee = await this.hrService.getEmployeeById(data.employeeId);

    if (employee.status !== 'active') {
      throw new AppError(400, 'Cannot process payroll for inactive employee');
    }

    // Calculate gross pay (assuming bi-weekly payroll)
    const grossPay = Number((employee.salary / 26).toFixed(2));

    // Calculate taxes
    const taxes = this.calculateTaxes(grossPay);

    // Calculate net pay
    const deductions = data.deductions || 0;
    const totalTaxes = taxes.federalTax + taxes.stateTax + taxes.socialSecurityTax + taxes.medicareTax;
    const netPay = Number((grossPay - totalTaxes - deductions).toFixed(2));

    const payrollRecord = this.payrollRepo.create({
      employee,
      payPeriodStart: data.payPeriodStart,
      payPeriodEnd: data.payPeriodEnd,
      grossPay,
      ...taxes,
      deductions,
      netPay,
      status: 'pending',
    });

    await this.payrollRepo.save(payrollRecord);
    logger.info('Payroll: Payroll record created', { payrollId: payrollRecord.id });

    return payrollRecord;
  }

  async approvePayroll(payrollId: string): Promise<PayrollRecord> {
    const payroll = await this.payrollRepo.findOne({
      where: { id: payrollId },
      relations: ['employee'],
    });

    if (!payroll) {
      throw new AppError(404, 'Payroll record not found');
    }

    if (payroll.status !== 'pending') {
      throw new AppError(400, 'Payroll record already processed');
    }

    payroll.status = 'processed';
    await this.payrollRepo.save(payroll);

    logger.info('Payroll: Payroll approved', { payrollId });

    // CROSS-COUPLING: Direct call to Accounting service to create journal entries
    // This creates tight coupling between Payroll and Accounting modules
    const totalTaxes = payroll.federalTax + payroll.stateTax +
                       payroll.socialSecurityTax + payroll.medicareTax;

    const transactions = await this.accountingService.recordPayrollExpense({
      payrollId: payroll.id,
      grossPay: Number(payroll.grossPay),
      taxes: Number(totalTaxes),
      netPay: Number(payroll.netPay),
      deductions: Number(payroll.deductions),
      date: new Date(),
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
    });

    // Link the accounting transaction back to payroll
    if (transactions.length > 0) {
      payroll.accountingTransactionId = transactions[0].id;
      payroll.status = 'paid';
      await this.payrollRepo.save(payroll);
    }

    return payroll;
  }

  async markPayrollPaid(payrollId: string, transactionId: string): Promise<PayrollRecord> {
    const payroll = await this.payrollRepo.findOne({
      where: { id: payrollId },
      relations: ['employee'],
    });

    if (!payroll) {
      throw new AppError(404, 'Payroll record not found');
    }

    payroll.status = 'paid';
    payroll.accountingTransactionId = transactionId;
    await this.payrollRepo.save(payroll);

    logger.info('Payroll: Payroll marked as paid', { payrollId, transactionId });
    return payroll;
  }

  async getPayrollById(id: string): Promise<PayrollRecord> {
    const payroll = await this.payrollRepo.findOne({
      where: { id },
      relations: ['employee', 'employee.department'],
    });

    if (!payroll) {
      throw new AppError(404, 'Payroll record not found');
    }

    return payroll;
  }

  async getEmployeePayrollHistory(employeeId: string): Promise<PayrollRecord[]> {
    // CROSS-COUPLING: Verify employee exists through HR service
    await this.hrService.getEmployeeById(employeeId);

    return this.payrollRepo.find({
      where: { employee: { id: employeeId } },
      order: { payPeriodEnd: 'DESC' },
    });
  }

  async getAllPayrollRecords(status?: string): Promise<PayrollRecord[]> {
    const where = status ? { status } : {};
    return this.payrollRepo.find({
      where,
      relations: ['employee'],
      order: { payPeriodEnd: 'DESC' },
    });
  }

  async processPayrollForAllEmployees(
    payPeriodStart: Date,
    payPeriodEnd: Date
  ): Promise<PayrollRecord[]> {
    logger.info('Payroll: Processing payroll for all active employees');

    // CROSS-COUPLING: Get all active employees from HR service
    const employees = await this.hrService.getAllEmployees('active');

    const payrollRecords: PayrollRecord[] = [];

    for (const employee of employees) {
      try {
        const record = await this.processPayroll({
          employeeId: employee.id,
          payPeriodStart,
          payPeriodEnd,
        });
        payrollRecords.push(record);
      } catch (error) {
        logger.error('Payroll: Failed to process payroll for employee', {
          employeeId: employee.id,
          error,
        });
      }
    }

    logger.info('Payroll: Batch payroll processing complete', {
      totalRecords: payrollRecords.length,
    });

    return payrollRecords;
  }
}
