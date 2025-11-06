import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Employee } from './entities/Employee';
import { PayrollRecord } from './entities/PayrollRecord';
import { AccountingTransaction } from './entities/AccountingTransaction';
import { Budget } from './entities/Budget';
import { Invoice } from './entities/Invoice';
import { PurchaseOrder } from './entities/PurchaseOrder';
import { Shipment } from './entities/Shipment';
import { InventoryItem } from './entities/InventoryItem';
import { Vendor } from './entities/Vendor';
import { Customer } from './entities/Customer';
import { Department } from './entities/Department';

dotenv.config();

/**
 * Shared database connection for the entire monolithic application.
 * All modules access this single database instance.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_password',
  database: process.env.DB_DATABASE || 'erp_monolith',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Employee,
    PayrollRecord,
    AccountingTransaction,
    Budget,
    Invoice,
    PurchaseOrder,
    Shipment,
    InventoryItem,
    Vendor,
    Customer,
    Department
  ],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connection established (Monolithic shared instance)');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    console.warn('⚠ Starting in API-ONLY mode (database operations will fail)');
    console.warn('⚠ To enable full functionality, configure PostgreSQL in .env');
    // Don't throw - allow app to start without database for demo purposes
  }
};
