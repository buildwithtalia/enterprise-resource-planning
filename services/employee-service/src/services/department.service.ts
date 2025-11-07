import { PrismaClient, Department } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateDepartmentDTO {
  name: string;
  code: string;
  managerId?: string;
  budgetCode?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  managerId?: string;
  budgetCode?: string;
}

export class DepartmentService {
  async createDepartment(data: CreateDepartmentDTO): Promise<Department> {
    try {
      // Check if manager exists
      if (data.managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: data.managerId },
        });

        if (!manager) {
          throw new AppError(404, 'MANAGER_NOT_FOUND', 'Manager not found');
        }
      }

      const department = await prisma.department.create({
        data: {
          name: data.name,
          code: data.code,
          managerId: data.managerId,
          budgetCode: data.budgetCode,
        },
      });

      logger.info('Department created', { departmentId: department.id });
      return department;
    } catch (error) {
      logger.error('Error creating department', error as Error);
      throw error;
    }
  }

  async getDepartmentById(id: string): Promise<Department> {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true,
              status: true,
            },
          },
        },
      });

      if (!department) {
        throw new AppError(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      return department;
    } catch (error) {
      logger.error('Error getting department', error as Error);
      throw error;
    }
  }

  async listDepartments(): Promise<Department[]> {
    try {
      const departments = await prisma.department.findMany({
        include: {
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return departments;
    } catch (error) {
      logger.error('Error listing departments', error as Error);
      throw error;
    }
  }

  async updateDepartment(
    id: string,
    data: UpdateDepartmentDTO
  ): Promise<Department> {
    try {
      // Check if manager exists
      if (data.managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: data.managerId },
        });

        if (!manager) {
          throw new AppError(404, 'MANAGER_NOT_FOUND', 'Manager not found');
        }
      }

      const department = await prisma.department.update({
        where: { id },
        data,
      });

      logger.info('Department updated', { departmentId: id });
      return department;
    } catch (error) {
      logger.error('Error updating department', error as Error);
      throw error;
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      // Check if department has employees
      const employeeCount = await prisma.employee.count({
        where: { departmentId: id },
      });

      if (employeeCount > 0) {
        throw new AppError(
          400,
          'DEPARTMENT_HAS_EMPLOYEES',
          'Cannot delete department with active employees'
        );
      }

      await prisma.department.delete({
        where: { id },
      });

      logger.info('Department deleted', { departmentId: id });
    } catch (error) {
      logger.error('Error deleting department', error as Error);
      throw error;
    }
  }
}
