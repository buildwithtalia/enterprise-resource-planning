import 'reflect-metadata';
import express, { Express } from 'express';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import * as mockData from './services/mockData';

// Import all module routes - MONOLITHIC STRUCTURE
import hrRoutes from './modules/human-resources/hr.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import accountingRoutes from './modules/accounting/accounting.routes';
import financeRoutes from './modules/finance/finance.routes';
import billingRoutes from './modules/billing/billing.routes';
import procurementRoutes from './modules/procurement/procurement.routes';
import supplyChainRoutes from './modules/supply-chain/supply-chain.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';

/**
 * MONOLITHIC APPLICATION STRUCTURE
 * All modules are bundled together in a single Express application
 * Shared middleware, shared database, shared dependencies
 */
export const createApp = (): Express => {
  const app = express();

  // Global middleware (shared across all modules)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'ERP Monolith',
      timestamp: new Date().toISOString(),
    });
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      name: 'Enterprise Resource Planning - Monolithic API',
      version: '1.0.0',
      architecture: 'Monolithic',
      modules: [
        {
          name: 'Human Resources',
          path: '/api/hr',
          description: 'Employee and department management',
          calls: [],
          calledBy: ['Payroll'],
        },
        {
          name: 'Payroll',
          path: '/api/payroll',
          description: 'Salary processing and tax calculations',
          calls: ['HR', 'Accounting'],
          calledBy: [],
        },
        {
          name: 'Accounting',
          path: '/api/accounting',
          description: 'General ledger and financial transactions',
          calls: [],
          calledBy: ['Payroll', 'Billing', 'Procurement'],
        },
        {
          name: 'Finance',
          path: '/api/finance',
          description: 'Budgeting and financial reporting',
          calls: ['Accounting'],
          calledBy: [],
        },
        {
          name: 'Billing',
          path: '/api/billing',
          description: 'Invoicing and customer billing',
          calls: ['Accounting'],
          calledBy: [],
        },
        {
          name: 'Procurement',
          path: '/api/procurement',
          description: 'Purchase orders and vendor management',
          calls: ['Accounting'],
          calledBy: ['Inventory'],
        },
        {
          name: 'Supply Chain',
          path: '/api/supply-chain',
          description: 'Shipments and logistics',
          calls: [],
          calledBy: [],
        },
        {
          name: 'Inventory',
          path: '/api/inventory',
          description: 'Stock management and automatic reordering',
          calls: ['Procurement'],
          calledBy: [],
        },
      ],
      characteristics: {
        deploymentUnit: 'Single monolithic application',
        database: 'Shared PostgreSQL database',
        coupling: 'Tight coupling between modules (direct service calls)',
        middleware: 'Shared authentication, logging, and error handling',
      },
    });
  });

  // Mock/Demo Data Endpoints (for when database is not configured)
  app.get('/api/mock-stats', (req, res) => {
    res.json(mockData.getMockStats());
  });

  app.get('/api/demo/employees', (req, res) => {
    res.json(mockData.mockEmployees);
  });

  app.get('/api/demo/departments', (req, res) => {
    res.json(mockData.mockDepartments);
  });

  app.get('/api/demo/payroll', (req, res) => {
    res.json(mockData.mockPayrollRecords);
  });

  app.get('/api/demo/transactions', (req, res) => {
    res.json(mockData.mockTransactions);
  });

  app.get('/api/demo/budgets', (req, res) => {
    res.json(mockData.mockBudgets);
  });

  app.get('/api/demo/customers', (req, res) => {
    res.json(mockData.mockCustomers);
  });

  app.get('/api/demo/invoices', (req, res) => {
    res.json(mockData.mockInvoices);
  });

  app.get('/api/demo/vendors', (req, res) => {
    res.json(mockData.mockVendors);
  });

  app.get('/api/demo/purchase-orders', (req, res) => {
    res.json(mockData.mockPurchaseOrders);
  });

  app.get('/api/demo/inventory', (req, res) => {
    res.json(mockData.mockInventoryItems);
  });

  app.get('/api/demo/shipments', (req, res) => {
    res.json(mockData.mockShipments);
  });

  // Mount all module routes - ALL IN ONE APPLICATION
  app.use('/api/hr', hrRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/accounting', accountingRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/procurement', procurementRoutes);
  app.use('/api/supply-chain', supplyChainRoutes);
  app.use('/api/inventory', inventoryRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method,
    });
  });

  // Global error handler (shared across all modules)
  app.use(errorHandler);

  return app;
};
