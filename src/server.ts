import 'reflect-metadata';
import dotenv from 'dotenv';
import { createApp } from './app';
import { initializeDatabase } from './database/connection';
import { logger } from './middleware/logger';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * MONOLITHIC SERVER BOOTSTRAP
 * Single process that starts the entire ERP system
 */
const startServer = async () => {
  try {
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    logger.info('='.repeat(60));
    logger.info('Starting Monolithic ERP Application');
    logger.info('='.repeat(60));

    // Initialize shared database connection
    await initializeDatabase();

    // Create Express application with all modules
    const app = createApp();

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    app.listen(port, () => {
      logger.info('='.repeat(60));
      logger.info(`✓ Monolithic ERP Server running on port ${port}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('='.repeat(60));
      logger.info('Available Modules:');
      logger.info('  • Human Resources     - /api/hr');
      logger.info('  • Payroll            - /api/payroll');
      logger.info('  • Accounting         - /api/accounting');
      logger.info('  • Finance            - /api/finance');
      logger.info('  • Billing            - /api/billing');
      logger.info('  • Procurement        - /api/procurement');
      logger.info('  • Supply Chain       - /api/supply-chain');
      logger.info('  • Inventory          - /api/inventory');
      logger.info('='.repeat(60));
      logger.info('Cross-Module Dependencies:');
      logger.info('  • Payroll → HR (employee data)');
      logger.info('  • Payroll → Accounting (journal entries)');
      logger.info('  • Billing → Accounting (revenue recording)');
      logger.info('  • Procurement → Accounting (purchase recording)');
      logger.info('  • Inventory → Procurement (automatic reordering)');
      logger.info('  • Finance → Accounting (financial reporting)');
      logger.info('='.repeat(60));
      logger.info('API Documentation: http://localhost:' + port + '/api');
      logger.info('Health Check: http://localhost:' + port + '/health');
      logger.info('='.repeat(60));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the monolithic application
startServer();
