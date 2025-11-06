import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { asyncHandler } from '../../middleware/errorHandler';

const billingService = new BillingService();

// Customer endpoints
export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await billingService.createCustomer(req.body);
  res.status(201).json(customer);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await billingService.getCustomerById(req.params.id);
  res.json(customer);
});

export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const customers = await billingService.getAllCustomers(status);
  res.json(customers);
});

export const getCustomerBalance = asyncHandler(async (req: Request, res: Response) => {
  const balance = await billingService.getCustomerBalance(req.params.id);
  res.json(balance);
});

// Invoice endpoints
export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await billingService.createInvoice(req.body);
  res.status(201).json(invoice);
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await billingService.getInvoiceById(req.params.id);
  res.json(invoice);
});

export const getAllInvoices = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    customerId: req.query.customerId as string | undefined,
  };
  const invoices = await billingService.getAllInvoices(filters);
  res.json(invoices);
});

export const sendInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await billingService.sendInvoice(req.params.id);
  res.json(invoice);
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const invoice = await billingService.recordPayment(req.params.id, amount);
  res.json(invoice);
});

export const cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await billingService.cancelInvoice(req.params.id);
  res.json(invoice);
});

export const checkOverdueInvoices = asyncHandler(async (req: Request, res: Response) => {
  const overdueInvoices = await billingService.checkOverdueInvoices();
  res.json({
    count: overdueInvoices.length,
    invoices: overdueInvoices,
  });
});
