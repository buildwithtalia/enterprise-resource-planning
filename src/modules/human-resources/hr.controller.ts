import { Request, Response } from 'express';
import { HRService } from './hr.service';
import { asyncHandler, AppError } from '../../middleware/errorHandler';

const hrService = new HRService();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, departmentId, jobTitle, salary, hireDate, phoneNumber } = req.body;

  // Validate required fields
  if (!firstName) {
    throw new AppError(400, 'firstName is required');
  }

  if (!lastName) {
    throw new AppError(400, 'lastName is required');
  }

  if (!email) {
    throw new AppError(400, 'email is required');
  }

  if (!departmentId) {
    throw new AppError(400, 'departmentId is required');
  }

  if (!jobTitle) {
    throw new AppError(400, 'jobTitle is required');
  }

  if (!salary) {
    throw new AppError(400, 'salary is required');
  }

  if (!hireDate) {
    throw new AppError(400, 'hireDate is required');
  }

  if (!phoneNumber) {
    throw new AppError(400, 'phoneNumber is required');
  }

  // Validate UUID format for departmentId
  if (!UUID_REGEX.test(departmentId)) {
    throw new AppError(400, 'departmentId must be a valid UUID format');
  }

  const employee = await hrService.createEmployee(req.body);
  res.status(201).json(employee);
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await hrService.getEmployeeById(req.params.id);
  res.json(employee);
});

export const getAllEmployees = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const employees = await hrService.getAllEmployees(status);
  res.json(employees);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await hrService.updateEmployee(req.params.id, req.body);
  res.json(employee);
});

export const terminateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { terminationDate } = req.body;
  const employee = await hrService.terminateEmployee(req.params.id, new Date(terminationDate));
  res.json(employee);
});

export const promoteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { title, salaryIncrease } = req.body;

  // Validate required fields
  if (!title) {
    throw new AppError(400, 'title is required');
  }

  if (!title.trim()) {
    throw new AppError(400, 'title cannot be empty');
  }

  if (salaryIncrease === undefined || salaryIncrease === null) {
    throw new AppError(400, 'salaryIncrease is required');
  }

  // Validate salaryIncrease is a number
  if (typeof salaryIncrease !== 'number' || isNaN(salaryIncrease)) {
    throw new AppError(400, 'salaryIncrease must be a valid number');
  }

  // Validate salaryIncrease is positive
  if (salaryIncrease <= 0) {
    throw new AppError(400, 'salaryIncrease must be a positive number');
  }

  const employee = await hrService.promoteEmployee(req.params.id, title, salaryIncrease);
  res.json(employee);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await hrService.createDepartment(req.body);
  res.status(201).json(department);
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await hrService.getDepartmentById(req.params.id);
  res.json(department);
});

export const getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
  const departments = await hrService.getAllDepartments();
  res.json(departments);
});

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const activeEmployeeCount = await hrService.getActiveEmployeeCount();
  const departments = await hrService.getAllDepartments();

  res.json({
    activeEmployees: activeEmployeeCount,
    totalDepartments: departments.length,
  });
});
