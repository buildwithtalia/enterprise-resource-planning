import { AppDataSource } from '../../database/connection';
import { Invoice } from '../../database/entities/Invoice';
import { Customer } from '../../database/entities/Customer';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Billing Service
 * Manages invoices, customer billing, and payment tracking
 * DEMONSTRATES CROSS-COUPLING: Calls AccountingService to record revenue
 */
export class BillingService {
  private invoiceRepo = AppDataSource.getRepository(Invoice);
  private customerRepo = AppDataSource.getRepository(Customer);
  private accountingService = new AccountingService(); // Direct dependency on Accounting

  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    creditLimit?: number;
  }): Promise<Customer> {
    logger.info('Billing: Creating customer', { email: data.email });

    const existingCustomer = await this.customerRepo.findOne({
      where: { email: data.email },
    });

    if (existingCustomer) {
      throw new AppError(400, 'Customer with this email already exists');
    }

    const customer = this.customerRepo.create({
      ...data,
      status: 'active',
      creditLimit: data.creditLimit || 0,
    });

    await this.customerRepo.save(customer);
    logger.info('Billing: Customer created', { customerId: customer.id });

    return customer;
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer;
  }

  async getAllCustomers(status?: string): Promise<Customer[]> {
    const where = status ? { status } : {};
    return this.customerRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async createInvoice(data: {
    customerId: string;
    dueDate: Date;
    subtotal: number;
    taxRate?: number;
    notes?: string;
  }): Promise<Invoice> {
    logger.info('Billing: Creating invoice', { customerId: data.customerId });

    const customer = await this.getCustomerById(data.customerId);

    const taxRate = data.taxRate || 0.08; // Default 8% tax
    const taxAmount = Number((data.subtotal * taxRate).toFixed(2));
    const totalAmount = Number((data.subtotal + taxAmount).toFixed(2));

    const invoice = this.invoiceRepo.create({
      invoiceNumber: this.generateInvoiceNumber(),
      customer,
      invoiceDate: new Date(),
      dueDate: data.dueDate,
      subtotal: data.subtotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      status: 'pending',
      notes: data.notes,
    });

    await this.invoiceRepo.save(invoice);
    logger.info('Billing: Invoice created', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    });

    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    return invoice;
  }

  async getAllInvoices(filters?: {
    status?: string;
    customerId?: string;
  }): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepo.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer');

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('invoice.customer.id = :customerId', {
        customerId: filters.customerId,
      });
    }

    return queryBuilder
      .orderBy('invoice.invoiceDate', 'DESC')
      .getMany();
  }

  async sendInvoice(id: string): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id);

    if (invoice.status !== 'pending') {
      throw new AppError(400, 'Invoice already sent or completed');
    }

    invoice.status = 'sent';
    await this.invoiceRepo.save(invoice);

    // CROSS-COUPLING: Record revenue in Accounting module
    const transactions = await this.accountingService.recordRevenue({
      invoiceId: invoice.id,
      amount: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      date: invoice.invoiceDate,
      customerName: invoice.customer.name,
    });

    if (transactions.length > 0) {
      invoice.accountingTransactionId = transactions[0].id;
      await this.invoiceRepo.save(invoice);
    }

    logger.info('Billing: Invoice sent and revenue recorded', {
      invoiceId: id,
      transactionId: transactions[0]?.id,
    });

    return invoice;
  }

  async recordPayment(id: string, amount: number): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id);

    if (invoice.status === 'paid') {
      throw new AppError(400, 'Invoice already fully paid');
    }

    const newPaidAmount = Number(invoice.paidAmount) + amount;

    if (newPaidAmount > Number(invoice.totalAmount)) {
      throw new AppError(400, 'Payment amount exceeds invoice total');
    }

    invoice.paidAmount = newPaidAmount;

    if (Math.abs(newPaidAmount - Number(invoice.totalAmount)) < 0.01) {
      invoice.status = 'paid';
    }

    await this.invoiceRepo.save(invoice);

    logger.info('Billing: Payment recorded', {
      invoiceId: id,
      amount,
      totalPaid: invoice.paidAmount,
    });

    return invoice;
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id);

    if (invoice.status === 'paid') {
      throw new AppError(400, 'Cannot cancel paid invoice');
    }

    invoice.status = 'cancelled';
    await this.invoiceRepo.save(invoice);

    logger.info('Billing: Invoice cancelled', { invoiceId: id });
    return invoice;
  }

  async checkOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date();

    const overdueInvoices = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .where('invoice.dueDate < :today', { today })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['sent', 'pending'] })
      .getMany();

    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue';
      await this.invoiceRepo.save(invoice);
    }

    logger.info('Billing: Overdue invoices updated', {
      count: overdueInvoices.length,
    });

    return overdueInvoices;
  }

  async getCustomerBalance(customerId: string): Promise<{
    customer: Customer;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
  }> {
    const customer = await this.getCustomerById(customerId);
    const invoices = await this.getAllInvoices({ customerId });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalOutstanding = totalInvoiced - totalPaid;

    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);

    return {
      customer,
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
    };
  }
}
