import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';

const router = Router();
const departmentController = new DepartmentController();

// Validation middleware
const createDepartmentValidation = [
  body('name').notEmpty().isString().trim().isLength({ max: 100 }),
  body('code').notEmpty().isString().trim().isLength({ max: 20 }),
  body('managerId').optional().isUUID(),
  body('budgetCode').optional().isString().trim().isLength({ max: 50 }),
];

const updateDepartmentValidation = [
  param('id').isUUID(),
  body('name').optional().isString().trim().isLength({ max: 100 }),
  body('code').optional().isString().trim().isLength({ max: 20 }),
  body('managerId').optional().isUUID(),
  body('budgetCode').optional().isString().trim().isLength({ max: 50 }),
];

const getDepartmentValidation = [
  param('id').isUUID(),
];

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               budgetCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
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
  requirePermission('departments:create', 'admin'),
  createDepartmentValidation,
  departmentController.createDepartment.bind(departmentController)
);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: List all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  requirePermission('departments:read'),
  departmentController.listDepartments.bind(departmentController)
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
 *         description: Department details
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('departments:read'),
  getDepartmentValidation,
  departmentController.getDepartment.bind(departmentController)
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Departments]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               managerId:
 *                 type: string
 *                 format: uuid
 *               budgetCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('departments:update', 'admin'),
  updateDepartmentValidation,
  departmentController.updateDepartment.bind(departmentController)
);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Departments]
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
 *       204:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('departments:delete', 'admin'),
  getDepartmentValidation,
  departmentController.deleteDepartment.bind(departmentController)
);

export default router;
