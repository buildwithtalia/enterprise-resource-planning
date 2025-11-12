import { AppDataSource } from '../../database/connection';
import { AccountingTransaction } from '../../database/entities/AccountingTransaction';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';

/**
 * Accounting Service
 * DEMONSTRATES CROSS-COUPLING: Called by Payroll, Billing, and Procurement modules
 * Creates journal entries for financial transactions across the organization
 */
export class AccountingService {
  private transactionRepo = AppDataSource.getRepository(AccountingTransaction);

  async createJournalEntry(data: {
    transactionDate: Date;
    entries: Array<{
      accountCode: string;
      accountName: string;
      debitAmount?: number;
      creditAmount?: number;
    }>;
    description: string;
    transactionType: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<AccountingTransaction[]> {
    logger.info('Accounting: Creating journal entry', {
      transactionType: data.transactionType,
      referenceId: data.referenceId,
    });

    // Validate double-entry bookkeeping
    const totalDebits = data.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = data.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new AppError(400, 'Journal entry is not balanced. Debits must equal credits.');
    }

    const transactions: AccountingTransaction[] = [];

    for (const entry of data.entries) {
      const transaction = this.transactionRepo.create({
        transactionDate: data.transactionDate,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        description: data.description,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        transactionType: data.transactionType,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        status: 'posted',
      });

      await this.transactionRepo.save(transaction);
      transactions.push(transaction);
    }

    logger.info('Accounting: Journal entry created', {
      transactionCount: transactions.length,
      totalAmount: totalDebits,
    });

    return transactions;
  }

  /**
   * CROSS-COUPLING EXAMPLE: Called by Payroll module
   */
  async recordPayrollExpense(data: {
    payrollId: string;
    grossPay: number;
    taxes: number;
    netPay: number;
    deductions?: number;
    date: Date;
    employeeName: string;
  }): Promise<AccountingTransaction[]> {
    logger.info('Accounting: Recording payroll expense from Payroll module', {
      payrollId: data.payrollId,
    });

    const entries = [
      {
        accountCode: '5000',
        accountName: 'Payroll Expense',
        debitAmount: data.grossPay,
      },
      {
        accountCode: '2100',
        accountName: 'Payroll Taxes Payable',
        creditAmount: data.taxes,
      },
      {
        accountCode: '1000',
        accountName: 'Cash',
        creditAmount: data.netPay,
      },
    ];

    // Add deductions entry if present
    if (data.deductions && data.deductions > 0) {
      entries.push({
        accountCode: '2150',
        accountName: 'Other Deductions Payable',
        creditAmount: data.deductions,
      });
    }

    return this.createJournalEntry({
      transactionDate: data.date,
      entries,
      description: `Payroll for ${data.employeeName}`,
      transactionType: 'payroll',
      referenceId: data.payrollId,
      referenceType: 'payroll_record',
    });
  }

  /**
   * CROSS-COUPLING EXAMPLE: Called by Billing module
   */
  async recordRevenue(data: {
    invoiceId: string;
    amount: number;
    taxAmount: number;
    date: Date;
    customerName: string;
  }): Promise<AccountingTransaction[]> {
    logger.info('Accounting: Recording revenue from Billing module', {
      invoiceId: data.invoiceId,
    });

    return this.createJournalEntry({
      transactionDate: data.date,
      entries: [
        {
          accountCode: '1200',
          accountName: 'Accounts Receivable',
          debitAmount: data.amount + data.taxAmount,
        },
        {
          accountCode: '4000',
          accountName: 'Revenue',
          creditAmount: data.amount,
        },
        {
          accountCode: '2200',
          accountName: 'Sales Tax Payable',
          creditAmount: data.taxAmount,
        },
      ],
      description: `Revenue from ${data.customerName}`,
      transactionType: 'sale',
      referenceId: data.invoiceId,
      referenceType: 'invoice',
    });
  }

  /**
   * CROSS-COUPLING EXAMPLE: Called by Procurement module
   */
  async recordPurchase(data: {
    purchaseOrderId: string;
    amount: number;
    date: Date;
    vendorName: string;
  }): Promise<AccountingTransaction[]> {
    logger.info('Accounting: Recording purchase from Procurement module', {
      purchaseOrderId: data.purchaseOrderId,
    });

    return this.createJournalEntry({
      transactionDate: data.date,
      entries: [
        {
          accountCode: '1500',
          accountName: 'Inventory',
          debitAmount: data.amount,
        },
        {
          accountCode: '2300',
          accountName: 'Accounts Payable',
          creditAmount: data.amount,
        },
      ],
      description: `Purchase from ${data.vendorName}`,
      transactionType: 'purchase',
      referenceId: data.purchaseOrderId,
      referenceType: 'purchase_order',
    });
  }

  async getTransactionById(id: string): Promise<AccountingTransaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    return transaction;
  }

  async getAllTransactions(filters?: {
    accountCode?: string;
    transactionType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AccountingTransaction[]> {
    const queryBuilder = this.transactionRepo.createQueryBuilder('transaction');

    if (filters?.accountCode) {
      queryBuilder.andWhere('transaction.accountCode = :accountCode', {
        accountCode: filters.accountCode,
      });
    }

    if (filters?.transactionType) {
      queryBuilder.andWhere('transaction.transactionType = :transactionType', {
        transactionType: filters.transactionType,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('transaction.transactionDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('transaction.transactionDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.orderBy('transaction.transactionDate', 'DESC').getMany();
  }

  async getGeneralLedger(accountCode: string): Promise<AccountingTransaction[]> {
    return this.transactionRepo.find({
      where: { accountCode },
      order: { transactionDate: 'ASC' },
    });
  }

  async getTrialBalance(): Promise<
    Array<{
      accountCode: string;
      accountName: string;
      debitBalance: number;
      creditBalance: number;
    }>
  > {
    const transactions = await this.transactionRepo.find();

    const balances = new Map<
      string,
      { accountName: string; debitBalance: number; creditBalance: number }
    >();

    for (const transaction of transactions) {
      const key = transaction.accountCode;
      const existing = balances.get(key) || {
        accountName: transaction.accountName,
        debitBalance: 0,
        creditBalance: 0,
      };

      existing.debitBalance += Number(transaction.debitAmount);
      existing.creditBalance += Number(transaction.creditAmount);

      balances.set(key, existing);
    }

    return Array.from(balances.entries())
      .map(([accountCode, data]) => ({
        accountCode,
        ...data,
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }
}
