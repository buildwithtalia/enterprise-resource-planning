import { body, param, query, ValidationChain } from 'express-validator';

export const createEmployeeValidation: ValidationChain[] = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
  
  body('jobTitle')
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),
  
  body('salary')
    .notEmpty()
    .withMessage('Salary is required')
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  
  body('hireDate')
    .notEmpty()
    .withMessage('Hire date is required')
    .isISO8601()
    .withMessage('Invalid date format (use YYYY-MM-DD)'),
  
  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID format'),
  
  body('socialSecurityNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('SSN must not exceed 20 characters'),
  
  body('bankAccountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Bank account number must not exceed 50 characters'),
];

export const updateEmployeeValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid employee ID format'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
  
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must not exceed 100 characters'),
  
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number'),
  
  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID format'),
];

export const terminateEmployeeValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid employee ID format'),
  
  body('terminationDate')
    .notEmpty()
    .withMessage('Termination date is required')
    .isISO8601()
    .withMessage('Invalid date format (use YYYY-MM-DD)'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Termination reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

export const getEmployeeValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid employee ID format'),
];

export const listEmployeesValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(['active', 'on_leave', 'terminated'])
    .withMessage('Invalid status value'),
  
  query('department')
    .optional()
    .trim(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
