import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { EmployeeService } from '../services/employee.service';
import { eventPublisher } from '../server';

const employeeService = new EmployeeService();

export class EmployeeController {
  async createEmployee(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
          },
        });
        return;
      }

      const employee = await employeeService.createEmployee(
        req.body,
        req.user!.id
      );

      // Publish EmployeeCreated event
      await eventPublisher.publishEmployeeCreated(
        {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          jobTitle: employee.jobTitle,
          salary: Number(employee.salary),
          hireDate: employee.hireDate.toISOString().split('T')[0],
          status: employee.status,
          department: employee.department
            ? {
                id: employee.department.id,
                name: employee.department.name,
                code: employee.department.code,
              }
            : null,
          bankAccountNumber: employee.bankAccountNumber
            ? '****' + employee.bankAccountNumber.slice(-4)
            : null,
          createdAt: employee.createdAt.toISOString(),
        },
        req.user!.id,
        req.user!.email
      );

      res.status(201).json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployee(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
          },
        });
        return;
      }

      const employee = await employeeService.getEmployeeById(req.params.id);

      res.json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async listEmployees(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
          },
        });
        return;
      }

      const result = await employeeService.listEmployees({
        status: req.query.status as string,
        department: req.query.department as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
          },
        });
        return;
      }

      const employee = await employeeService.updateEmployee(
        req.params.id,
        req.body,
        req.user!.id
      );

      // Publish EmployeeUpdated event
      await eventPublisher.publishEmployeeUpdated(
        {
          employeeId: employee.id,
          changes: req.body,
          updatedAt: employee.updatedAt.toISOString(),
        },
        req.user!.id,
        req.user!.email
      );

      res.json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async terminateEmployee(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
          },
        });
        return;
      }

      const employee = await employeeService.terminateEmployee(
        req.params.id,
        req.body,
        req.user!.id
      );

      // Publish EmployeeTerminated event
      await eventPublisher.publishEmployeeTerminated(
        {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          terminationDate: employee.terminationDate!.toISOString().split('T')[0],
          reason: req.body.reason,
          finalSalary: Number(employee.salary),
          department: employee.department
            ? {
                id: employee.department.id,
                name: employee.department.name,
              }
            : null,
          terminatedAt: employee.updatedAt.toISOString(),
        },
        req.user!.id,
        req.user!.email
      );

      res.json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const history = await employeeService.getEmployeeHistory(req.params.id);

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
