import { AppDataSource } from '../../database/connection';
import { Employee } from '../../database/entities/Employee';
import { Department } from '../../database/entities/Department';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../middleware/logger';

/**
 * Human Resources Service
 * Manages employee records, departments, and organizational structure
 */
export class HRService {
  private employeeRepo = AppDataSource.getRepository(Employee);
  private departmentRepo = AppDataSource.getRepository(Department);

  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    jobTitle: string;
    salary: number;
    hireDate: Date;
    departmentId: string;
    socialSecurityNumber?: string;
    bankAccountNumber?: string;
  }): Promise<Employee> {
    logger.info('HR: Creating new employee', { email: data.email });

    const existingEmployee = await this.employeeRepo.findOne({
      where: { email: data.email },
    });

    if (existingEmployee) {
      throw new AppError(400, 'Employee with this email already exists');
    }

    const department = await this.departmentRepo.findOne({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    const employee = this.employeeRepo.create({
      ...data,
      department,
      status: 'active',
    });

    await this.employeeRepo.save(employee);
    logger.info('HR: Employee created successfully', { employeeId: employee.id });

    return employee;
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    return employee;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    return this.employeeRepo.findOne({
      where: { email },
      relations: ['department'],
    });
  }

  async getAllEmployees(status?: string): Promise<Employee[]> {
    const where = status ? { status } : {};
    return this.employeeRepo.find({
      where,
      relations: ['department'],
      order: { lastName: 'ASC' },
    });
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const employee = await this.getEmployeeById(id);

    Object.assign(employee, data);
    await this.employeeRepo.save(employee);

    logger.info('HR: Employee updated', { employeeId: id });
    return employee;
  }

  async terminateEmployee(id: string, terminationDate: Date): Promise<Employee> {
    const employee = await this.getEmployeeById(id);

    employee.status = 'terminated';
    employee.terminationDate = terminationDate;
    await this.employeeRepo.save(employee);

    logger.info('HR: Employee terminated', { employeeId: id });
    return employee;
  }

  async createDepartment(data: {
    name: string;
    description?: string;
    managerId?: string;
    budgetAllocated?: number;
  }): Promise<Department> {
    const department = this.departmentRepo.create(data);
    await this.departmentRepo.save(department);

    logger.info('HR: Department created', { departmentId: department.id });
    return department;
  }

  async getDepartmentById(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({
      where: { id },
      relations: ['employees'],
    });

    if (!department) {
      throw new AppError(404, 'Department not found');
    }

    return department;
  }

  async getAllDepartments(): Promise<Department[]> {
    return this.departmentRepo.find({
      relations: ['employees'],
      order: { name: 'ASC' },
    });
  }

  async getActiveEmployeeCount(): Promise<number> {
    return this.employeeRepo.count({ where: { status: 'active' } });
  }

  async getDepartmentHeadcount(departmentId: string): Promise<number> {
    return this.employeeRepo.count({
      where: {
        department: { id: departmentId },
        status: 'active',
      },
    });
  }
}
