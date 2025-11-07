import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DepartmentService } from '../services/department.service';

const departmentService = new DepartmentService();

export class DepartmentController {
  async createDepartment(
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

      const department = await departmentService.createDepartment(req.body);

      res.status(201).json({
        success: true,
        data: department,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentService.getDepartmentById(
        req.params.id
      );

      res.json({
        success: true,
        data: department,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async listDepartments(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const departments = await departmentService.listDepartments();

      res.json({
        success: true,
        data: departments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(
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

      const department = await departmentService.updateDepartment(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: department,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await departmentService.deleteDepartment(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
