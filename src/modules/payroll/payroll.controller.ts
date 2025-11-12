import { Request, Response } from 'express';
import { PayrollService } from './payroll.service';
import { asyncHandler, AppError } from '../../middleware/errorHandler';

const payrollService = new PayrollService();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const processPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, payPeriodStart, payPeriodEnd, deductions } = req.body;

  // Validate required fields
  if (!employeeId) {
    throw new AppError(400, 'employeeId is required');
  }

  if (!payPeriodStart) {
    throw new AppError(400, 'payPeriodStart is required');
  }

  if (!payPeriodEnd) {
    throw new AppError(400, 'payPeriodEnd is required');
  }

  // Validate UUID format
  if (!UUID_REGEX.test(employeeId)) {
    throw new AppError(400, 'employeeId must be a valid UUID format');
  }

  const payroll = await payrollService.processPayroll({
    employeeId,
    payPeriodStart: new Date(payPeriodStart),
    payPeriodEnd: new Date(payPeriodEnd),
    deductions,
  });
  res.status(201).json(payroll);
});

export const approvePayroll = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await payrollService.approvePayroll(req.params.id);
  res.json(payroll);
});

export const getPayroll = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await payrollService.getPayrollById(req.params.id);
  res.json(payroll);
});

export const getAllPayroll = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const payrolls = await payrollService.getAllPayrollRecords(status);
  res.json(payrolls);
});

export const getEmployeePayrollHistory = asyncHandler(async (req: Request, res: Response) => {
  const payrolls = await payrollService.getEmployeePayrollHistory(req.params.employeeId);
  res.json(payrolls);
});

export const processBatchPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { payPeriodStart, payPeriodEnd } = req.body;
  const payrolls = await payrollService.processPayrollForAllEmployees(
    new Date(payPeriodStart),
    new Date(payPeriodEnd)
  );
  res.status(201).json({
    message: 'Batch payroll processed',
    recordsCreated: payrolls.length,
    payrolls,
  });
});
