import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  createEmployeeValidation,
  updateEmployeeValidation,
  terminateEmployeeValidation,
  getEmployeeValidation,
  listEmployeesValidation,
} from '../middleware/validation.middleware';

const router = Router();
const employeeController = new EmployeeController();

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - jobTitle
 *               - salary
 *               - hireDate
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               salary:
 *                 type: number
 *               hireDate:
 *                 type: string
 *                 format: date
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               socialSecurityNumber:
 *                 type: string
 *               bankAccountNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  requirePermission('employees:create', 'admin'),
  createEmployeeValidation,
  employeeController.createEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, on_leave, terminated]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of employees
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  requirePermission('employees:read'),
  listEmployeesValidation,
  employeeController.listEmployees.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('employees:read'),
  getEmployeeValidation,
  employeeController.getEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               salary:
 *                 type: number
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('employees:update', 'admin'),
  updateEmployeeValidation,
  employeeController.updateEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}/terminate:
 *   post:
 *     summary: Terminate employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - terminationDate
 *               - reason
 *             properties:
 *               terminationDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee terminated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/terminate',
  authenticate,
  requirePermission('employees:delete', 'admin'),
  terminateEmployeeValidation,
  employeeController.terminateEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}/history:
 *   get:
 *     summary: Get employee change history
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee history
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id/history',
  authenticate,
  requirePermission('employees:read', 'admin'),
  getEmployeeValidation,
  employeeController.getEmployeeHistory.bind(employeeController)
);

export default router;
