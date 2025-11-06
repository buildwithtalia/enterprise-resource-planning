import { AppDataSource } from '../../database/connection';
import { Budget } from '../../database/entities/Budget';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Finance Service
 * Manages budgets, financial planning, and financial reporting
 * DEMONSTRATES CROSS-COUPLING: Uses AccountingService for financial data
 */
export class FinanceService {
  private budgetRepo = AppDataSource.getRepository(Budget);
  private accountingService = new AccountingService(); // Direct dependency on Accounting

  async createBudget(data: {
    fiscalYear: number;
    department: string;
    category: string;
    allocatedAmount: number;
    startDate: Date;
    endDate: Date;
  }): Promise<Budget> {
    logger.info('Finance: Creating budget', {
      department: data.department,
      fiscalYear: data.fiscalYear,
    });

    const budget = this.budgetRepo.create({
      ...data,
      spentAmount: 0,
      committedAmount: 0,
      status: 'active',
    });

    await this.budgetRepo.save(budget);
    logger.info('Finance: Budget created', { budgetId: budget.id });

    return budget;
  }

  async getBudgetById(id: string): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({
      where: { id },
    });

    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }

    return budget;
  }

  async getAllBudgets(filters?: {
    fiscalYear?: number;
    department?: string;
    status?: string;
  }): Promise<Budget[]> {
    const queryBuilder = this.budgetRepo.createQueryBuilder('budget');

    if (filters?.fiscalYear) {
      queryBuilder.andWhere('budget.fiscalYear = :fiscalYear', {
        fiscalYear: filters.fiscalYear,
      });
    }

    if (filters?.department) {
      queryBuilder.andWhere('budget.department = :department', {
        department: filters.department,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('budget.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.orderBy('budget.fiscalYear', 'DESC').getMany();
  }

  async updateBudgetSpent(id: string, amount: number): Promise<Budget> {
    const budget = await this.getBudgetById(id);

    budget.spentAmount = Number(budget.spentAmount) + amount;

    // Check if budget is exceeded
    if (budget.spentAmount > budget.allocatedAmount) {
      budget.status = 'exceeded';
      logger.warn('Finance: Budget exceeded', {
        budgetId: id,
        allocated: budget.allocatedAmount,
        spent: budget.spentAmount,
      });
    }

    await this.budgetRepo.save(budget);
    return budget;
  }

  async updateBudgetCommitted(id: string, amount: number): Promise<Budget> {
    const budget = await this.getBudgetById(id);

    budget.committedAmount = Number(budget.committedAmount) + amount;
    await this.budgetRepo.save(budget);

    return budget;
  }

  async closeBudget(id: string): Promise<Budget> {
    const budget = await this.getBudgetById(id);

    budget.status = 'closed';
    await this.budgetRepo.save(budget);

    logger.info('Finance: Budget closed', { budgetId: id });
    return budget;
  }

  async getBudgetUtilization(id: string): Promise<{
    budget: Budget;
    utilizationPercentage: number;
    remainingAmount: number;
    overBudget: boolean;
  }> {
    const budget = await this.getBudgetById(id);

    const totalSpent = Number(budget.spentAmount) + Number(budget.committedAmount);
    const remainingAmount = Number(budget.allocatedAmount) - totalSpent;
    const utilizationPercentage = (totalSpent / Number(budget.allocatedAmount)) * 100;

    return {
      budget,
      utilizationPercentage: Number(utilizationPercentage.toFixed(2)),
      remainingAmount: Number(remainingAmount.toFixed(2)),
      overBudget: remainingAmount < 0,
    };
  }

  async getDepartmentBudgetSummary(department: string, fiscalYear: number): Promise<{
    department: string;
    fiscalYear: number;
    totalAllocated: number;
    totalSpent: number;
    totalCommitted: number;
    totalRemaining: number;
    budgets: Budget[];
  }> {
    const budgets = await this.getAllBudgets({ department, fiscalYear });

    const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spentAmount), 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.committedAmount), 0);
    const totalRemaining = totalAllocated - totalSpent - totalCommitted;

    return {
      department,
      fiscalYear,
      totalAllocated: Number(totalAllocated.toFixed(2)),
      totalSpent: Number(totalSpent.toFixed(2)),
      totalCommitted: Number(totalCommitted.toFixed(2)),
      totalRemaining: Number(totalRemaining.toFixed(2)),
      budgets,
    };
  }

  /**
   * CROSS-COUPLING: Uses AccountingService to generate financial reports
   */
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date };
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    transactionsByType: Record<string, number>;
  }> {
    logger.info('Finance: Generating financial report', { startDate, endDate });

    // CROSS-COUPLING: Get transactions from Accounting module
    const transactions = await this.accountingService.getAllTransactions({
      startDate,
      endDate,
    });

    let totalRevenue = 0;
    let totalExpenses = 0;
    const transactionsByType: Record<string, number> = {};

    for (const transaction of transactions) {
      const amount = Number(transaction.creditAmount) || Number(transaction.debitAmount);

      // Revenue accounts (4000s)
      if (transaction.accountCode.startsWith('4')) {
        totalRevenue += Number(transaction.creditAmount);
      }

      // Expense accounts (5000s)
      if (transaction.accountCode.startsWith('5')) {
        totalExpenses += Number(transaction.debitAmount);
      }

      // Group by transaction type
      if (!transactionsByType[transaction.transactionType]) {
        transactionsByType[transaction.transactionType] = 0;
      }
      transactionsByType[transaction.transactionType] += amount;
    }

    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { start: startDate, end: endDate },
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netIncome: Number(netIncome.toFixed(2)),
      transactionsByType,
    };
  }
}
