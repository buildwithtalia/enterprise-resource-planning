import { Router } from 'express';
import * as hrController from './hr.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// Employee routes
router.post('/employees', authorize('hr_manager', 'admin'), hrController.createEmployee);
router.get('/employees', hrController.getAllEmployees);
router.get('/employees/:id', hrController.getEmployee);
router.put('/employees/:id', authorize('hr_manager', 'admin'), hrController.updateEmployee);
router.post('/employees/:id/terminate', authorize('hr_manager', 'admin'), hrController.terminateEmployee);
router.patch('/employees/:id/promote', authorize('hr_manager', 'admin'), hrController.promoteEmployee);

// Department routes
router.post('/departments', authorize('hr_manager', 'admin'), hrController.createDepartment);
router.get('/departments', hrController.getAllDepartments);
router.get('/departments/:id', hrController.getDepartment);

// Statistics
router.get('/statistics', hrController.getStatistics);

export default router;
