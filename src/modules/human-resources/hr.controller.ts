import { Request, Response } from 'express';
import { HRService } from './hr.service';
import { asyncHandler } from '../../middleware/errorHandler';

const hrService = new HRService();

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
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
