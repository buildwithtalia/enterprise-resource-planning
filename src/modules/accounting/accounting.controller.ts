import { Request, Response } from 'express';
import { AccountingService } from './accounting.service';
import { asyncHandler } from '../../middleware/errorHandler';

const accountingService = new AccountingService();

export const createJournalEntry = asyncHandler(async (req: Request, res: Response) => {
  const transactions = await accountingService.createJournalEntry(req.body);
  res.status(201).json(transactions);
});

export const getTransaction = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await accountingService.getTransactionById(req.params.id);
  res.json(transaction);
});

export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    accountCode: req.query.accountCode as string | undefined,
    transactionType: req.query.transactionType as string | undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  };

  const transactions = await accountingService.getAllTransactions(filters);
  res.json(transactions);
});

export const getGeneralLedger = asyncHandler(async (req: Request, res: Response) => {
  const accountCode = req.params.accountCode;
  const ledger = await accountingService.getGeneralLedger(accountCode);
  res.json(ledger);
});

export const getTrialBalance = asyncHandler(async (req: Request, res: Response) => {
  const trialBalance = await accountingService.getTrialBalance();
  res.json(trialBalance);
});
