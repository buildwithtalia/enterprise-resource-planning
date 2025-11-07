import { PrismaClient, Employee, Prisma, Department } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export type EmployeeWithDepartment = Employee & {
  department: Department | null;
};

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  departmentId?: string;
  socialSecurityNumber?: string;
  bankAccountNumber?: string;
}

export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  salary?: number;
  departmentId?: string;
}

export interface TerminateEmployeeDTO {
  terminationDate: string;
  reason: string;
}

export interface ListEmployeesQuery {
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export class EmployeeService {
  async createEmployee(
    data: CreateEmployeeDTO,
    userId: string
  ): Promise<EmployeeWithDepartment> {
    try {
      // Check if department exists
      if (data.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new AppError(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
        }
      }

      // Create employee
      const employee = await prisma.employee.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          jobTitle: data.jobTitle,
          salary: new Prisma.Decimal(data.salary),
          hireDate: new Date(data.hireDate),
          departmentId: data.departmentId,
          socialSecurityNumber: data.socialSecurityNumber,
          bankAccountNumber: data.bankAccountNumber,
          status: 'active',
        },
        include: {
          department: true,
        },
      });

      // Create history record
      await prisma.employeeHistory.create({
        data: {
          employeeId: employee.id,
          changeType: 'created',
          changedBy: userId,
          changedFields: data as any,
        },
      });

      logger.info('Employee created', { employeeId: employee.id });
      return employee;
    } catch (error) {
      logger.error('Error creating employee', error as Error);
      throw error;
    }
  }

  async getEmployeeById(id: string): Promise<EmployeeWithDepartment> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          department: true,
        },
      });

      if (!employee) {
        throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');
      }

      return employee;
    } catch (error) {
      logger.error('Error getting employee', error as Error);
      throw error;
    }
  }

  async listEmployees(query: ListEmployeesQuery): Promise<{
    data: EmployeeWithDepartment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.EmployeeWhereInput = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.department) {
        where.department = {
          code: query.department,
        };
      }

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          include: {
            department: true,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.employee.count({ where }),
      ]);

      return {
        data: employees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error listing employees', error as Error);
      throw error;
    }
  }

  async updateEmployee(
    id: string,
    data: UpdateEmployeeDTO,
    userId: string
  ): Promise<EmployeeWithDepartment> {
    try {
      // Get current employee data
      const currentEmployee = await this.getEmployeeById(id);

      // Check if department exists
      if (data.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new AppError(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
        }
      }

      // Track changes
      const changes: Record<string, { oldValue: any; newValue: any }> = {};
      Object.keys(data).forEach((key) => {
        const oldValue = (currentEmployee as any)[key];
        const newValue = (data as any)[key];
        if (oldValue !== newValue) {
          changes[key] = { oldValue, newValue };
        }
      });

      // Update employee
      const updateData: any = { ...data };
      if (data.salary) {
        updateData.salary = new Prisma.Decimal(data.salary);
      }

      const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
        },
      });

      // Create history record
      if (Object.keys(changes).length > 0) {
        await prisma.employeeHistory.create({
          data: {
            employeeId: id,
            changeType: 'updated',
            changedBy: userId,
            changedFields: changes,
          },
        });
      }

      logger.info('Employee updated', { employeeId: id });
      return employee;
    } catch (error) {
      logger.error('Error updating employee', error as Error);
      throw error;
    }
  }

  async terminateEmployee(
    id: string,
    data: TerminateEmployeeDTO,
    userId: string
  ): Promise<EmployeeWithDepartment> {
    try {
      const employee = await prisma.employee.update({
        where: { id },
        data: {
          status: 'terminated',
          terminationDate: new Date(data.terminationDate),
        },
        include: {
          department: true,
        },
      });

      // Create history record
      await prisma.employeeHistory.create({
        data: {
          employeeId: id,
          changeType: 'terminated',
          changedBy: userId,
          changedFields: {
            terminationDate: data.terminationDate,
            reason: data.reason,
          },
        },
      });

      logger.info('Employee terminated', { employeeId: id });
      return employee;
    } catch (error) {
      logger.error('Error terminating employee', error as Error);
      throw error;
    }
  }

  async getEmployeeHistory(id: string): Promise<any[]> {
    try {
      const history = await prisma.employeeHistory.findMany({
        where: { employeeId: id },
        orderBy: { changedAt: 'desc' },
      });

      return history;
    } catch (error) {
      logger.error('Error getting employee history', error as Error);
      throw error;
    }
  }
}
