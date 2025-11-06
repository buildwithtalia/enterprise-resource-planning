import { Request, Response } from 'express';
import { FinanceService } from './finance.service';
import { asyncHandler } from '../../middleware/errorHandler';

const financeService = new FinanceService();

export const createBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await financeService.createBudget(req.body);
  res.status(201).json(budget);
});

export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await financeService.getBudgetById(req.params.id);
  res.json(budget);
});

export const getAllBudgets = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    fiscalYear: req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : undefined,
    department: req.query.department as string | undefined,
    status: req.query.status as string | undefined,
  };

  const budgets = await financeService.getAllBudgets(filters);
  res.json(budgets);
});

export const closeBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await financeService.closeBudget(req.params.id);
  res.json(budget);
});

export const getBudgetUtilization = asyncHandler(async (req: Request, res: Response) => {
  const utilization = await financeService.getBudgetUtilization(req.params.id);
  res.json(utilization);
});

export const getDepartmentBudgetSummary = asyncHandler(async (req: Request, res: Response) => {
  const { department, fiscalYear } = req.params;
  const summary = await financeService.getDepartmentBudgetSummary(
    department,
    parseInt(fiscalYear)
  );
  res.json(summary);
});

export const generateFinancialReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const report = await financeService.generateFinancialReport(
    new Date(startDate as string),
    new Date(endDate as string)
  );
  res.json(report);
});
