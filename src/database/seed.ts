import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from './connection';
import { Department } from './entities/Department';
import { Employee } from './entities/Employee';
import { PayrollRecord } from './entities/PayrollRecord';
import { AccountingTransaction } from './entities/AccountingTransaction';
import { Budget } from './entities/Budget';
import { Customer } from './entities/Customer';
import { Invoice } from './entities/Invoice';
import { Vendor } from './entities/Vendor';
import { PurchaseOrder } from './entities/PurchaseOrder';
import { InventoryItem } from './entities/InventoryItem';
import { Shipment } from './entities/Shipment';

dotenv.config();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await AppDataSource.getRepository(PayrollRecord).delete({});
    await AppDataSource.getRepository(AccountingTransaction).delete({});
    await AppDataSource.getRepository(Invoice).delete({});
    await AppDataSource.getRepository(PurchaseOrder).delete({});
    await AppDataSource.getRepository(Shipment).delete({});
    await AppDataSource.getRepository(InventoryItem).delete({});
    await AppDataSource.getRepository(Employee).delete({});
    await AppDataSource.getRepository(Department).delete({});
    await AppDataSource.getRepository(Budget).delete({});
    await AppDataSource.getRepository(Customer).delete({});
    await AppDataSource.getRepository(Vendor).delete({});
    console.log('✓ Data cleared');

    // Seed Departments
    console.log('\n👥 Seeding HR - Departments...');
    const deptRepo = AppDataSource.getRepository(Department);

    const engineering = deptRepo.create({
      name: 'Engineering',
      description: 'Software development and technical operations',
      budgetAllocated: 500000,
    });
    await deptRepo.save(engineering);

    const sales = deptRepo.create({
      name: 'Sales',
      description: 'Sales and business development',
      budgetAllocated: 300000,
    });
    await deptRepo.save(sales);

    const marketing = deptRepo.create({
      name: 'Marketing',
      description: 'Marketing and brand management',
      budgetAllocated: 200000,
    });
    await deptRepo.save(marketing);

    const finance = deptRepo.create({
      name: 'Finance',
      description: 'Financial planning and accounting',
      budgetAllocated: 150000,
    });
    await deptRepo.save(finance);

    const operations = deptRepo.create({
      name: 'Operations',
      description: 'Operations and logistics',
      budgetAllocated: 250000,
    });
    await deptRepo.save(operations);

    console.log('✓ Created 5 departments');

    // Seed Employees
    console.log('\n👨‍💼 Seeding HR - Employees...');
    const empRepo = AppDataSource.getRepository(Employee);

    const employees = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        phoneNumber: '555-0101',
        jobTitle: 'Software Engineer',
        salary: 95000,
        hireDate: new Date('2022-01-15'),
        status: 'active',
        department: engineering,
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com',
        phoneNumber: '555-0102',
        jobTitle: 'Senior Software Engineer',
        salary: 125000,
        hireDate: new Date('2021-03-10'),
        status: 'active',
        department: engineering,
      },
      {
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'michael.williams@company.com',
        phoneNumber: '555-0103',
        jobTitle: 'Sales Manager',
        salary: 85000,
        hireDate: new Date('2022-06-01'),
        status: 'active',
        department: sales,
      },
      {
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.brown@company.com',
        phoneNumber: '555-0104',
        jobTitle: 'Marketing Specialist',
        salary: 65000,
        hireDate: new Date('2023-02-15'),
        status: 'active',
        department: marketing,
      },
      {
        firstName: 'David',
        lastName: 'Davis',
        email: 'david.davis@company.com',
        phoneNumber: '555-0105',
        jobTitle: 'Accountant',
        salary: 70000,
        hireDate: new Date('2022-09-01'),
        status: 'active',
        department: finance,
      },
      {
        firstName: 'Jennifer',
        lastName: 'Miller',
        email: 'jennifer.miller@company.com',
        phoneNumber: '555-0106',
        jobTitle: 'Operations Manager',
        salary: 90000,
        hireDate: new Date('2021-11-15'),
        status: 'active',
        department: operations,
      },
      {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@company.com',
        phoneNumber: '555-0107',
        jobTitle: 'DevOps Engineer',
        salary: 105000,
        hireDate: new Date('2022-04-20'),
        status: 'active',
        department: engineering,
      },
      {
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@company.com',
        phoneNumber: '555-0108',
        jobTitle: 'Sales Representative',
        salary: 55000,
        hireDate: new Date('2023-01-10'),
        status: 'active',
        department: sales,
      },
    ];

    const savedEmployees = [];
    for (const empData of employees) {
      const emp = empRepo.create(empData);
      await empRepo.save(emp);
      savedEmployees.push(emp);
    }
    console.log(`✓ Created ${savedEmployees.length} employees`);

    // Seed Payroll Records
    console.log('\n💰 Seeding Payroll Records...');
    const payrollRepo = AppDataSource.getRepository(PayrollRecord);

    let payrollCount = 0;
    for (const employee of savedEmployees) {
      const grossPay = Number((employee.salary / 26).toFixed(2));
      const federalTax = Number((grossPay * 0.15).toFixed(2));
      const stateTax = Number((grossPay * 0.05).toFixed(2));
      const socialSecurityTax = Number((grossPay * 0.062).toFixed(2));
      const medicareTax = Number((grossPay * 0.0145).toFixed(2));
      const totalTaxes = federalTax + stateTax + socialSecurityTax + medicareTax;
      const netPay = Number((grossPay - totalTaxes).toFixed(2));

      const payroll = payrollRepo.create({
        employee,
        payPeriodStart: new Date('2024-01-01'),
        payPeriodEnd: new Date('2024-01-15'),
        grossPay,
        federalTax,
        stateTax,
        socialSecurityTax,
        medicareTax,
        deductions: 0,
        netPay,
        status: 'paid',
      });
      await payrollRepo.save(payroll);
      payrollCount++;
    }
    console.log(`✓ Created ${payrollCount} payroll records`);

    // Seed Accounting Transactions
    console.log('\n📚 Seeding Accounting Transactions...');
    const acctRepo = AppDataSource.getRepository(AccountingTransaction);

    const transactions = [
      // Revenue transactions
      {
        transactionDate: new Date('2024-01-15'),
        accountCode: '4000',
        accountName: 'Revenue',
        description: 'Product sales - January',
        debitAmount: 0,
        creditAmount: 50000,
        transactionType: 'sale',
        status: 'posted',
      },
      {
        transactionDate: new Date('2024-01-15'),
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        description: 'Product sales - January',
        debitAmount: 50000,
        creditAmount: 0,
        transactionType: 'sale',
        status: 'posted',
      },
      // Expense transactions
      {
        transactionDate: new Date('2024-01-20'),
        accountCode: '5000',
        accountName: 'Payroll Expense',
        description: 'Payroll - January 1-15',
        debitAmount: 30000,
        creditAmount: 0,
        transactionType: 'payroll',
        status: 'posted',
      },
      {
        transactionDate: new Date('2024-01-20'),
        accountCode: '2000',
        accountName: 'Cash',
        description: 'Payroll - January 1-15',
        debitAmount: 0,
        creditAmount: 30000,
        transactionType: 'payroll',
        status: 'posted',
      },
    ];

    for (const txn of transactions) {
      const transaction = acctRepo.create(txn);
      await acctRepo.save(transaction);
    }
    console.log(`✓ Created ${transactions.length} accounting transactions`);

    // Seed Budgets
    console.log('\n📈 Seeding Finance - Budgets...');
    const budgetRepo = AppDataSource.getRepository(Budget);

    const budgets = [
      {
        fiscalYear: 2024,
        department: 'Engineering',
        category: 'salaries',
        allocatedAmount: 400000,
        spentAmount: 125000,
        committedAmount: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
      },
      {
        fiscalYear: 2024,
        department: 'Sales',
        category: 'salaries',
        allocatedAmount: 200000,
        spentAmount: 50000,
        committedAmount: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
      },
      {
        fiscalYear: 2024,
        department: 'Marketing',
        category: 'advertising',
        allocatedAmount: 150000,
        spentAmount: 35000,
        committedAmount: 20000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
      },
    ];

    for (const budgetData of budgets) {
      const budget = budgetRepo.create(budgetData);
      await budgetRepo.save(budget);
    }
    console.log(`✓ Created ${budgets.length} budgets`);

    // Seed Customers
    console.log('\n🧾 Seeding Billing - Customers...');
    const customerRepo = AppDataSource.getRepository(Customer);

    const customers = [
      {
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '555-1001',
        address: '123 Business St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        creditLimit: 100000,
        status: 'active',
      },
      {
        name: 'TechStart Inc',
        email: 'accounts@techstart.com',
        phone: '555-1002',
        address: '456 Innovation Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        creditLimit: 75000,
        status: 'active',
      },
      {
        name: 'Global Enterprises',
        email: 'finance@globalent.com',
        phone: '555-1003',
        address: '789 Commerce Blvd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        creditLimit: 150000,
        status: 'active',
      },
    ];

    const savedCustomers = [];
    for (const custData of customers) {
      const customer = customerRepo.create(custData);
      await customerRepo.save(customer);
      savedCustomers.push(customer);
    }
    console.log(`✓ Created ${savedCustomers.length} customers`);

    // Seed Invoices
    console.log('\n📄 Seeding Billing - Invoices...');
    const invoiceRepo = AppDataSource.getRepository(Invoice);

    const invoices = [
      {
        invoiceNumber: 'INV-2024-001',
        customer: savedCustomers[0],
        invoiceDate: new Date('2024-01-10'),
        dueDate: new Date('2024-02-10'),
        subtotal: 25000,
        taxAmount: 2000,
        totalAmount: 27000,
        paidAmount: 27000,
        status: 'paid',
      },
      {
        invoiceNumber: 'INV-2024-002',
        customer: savedCustomers[1],
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        subtotal: 15000,
        taxAmount: 1200,
        totalAmount: 16200,
        paidAmount: 0,
        status: 'sent',
      },
      {
        invoiceNumber: 'INV-2024-003',
        customer: savedCustomers[2],
        invoiceDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        subtotal: 35000,
        taxAmount: 2800,
        totalAmount: 37800,
        paidAmount: 0,
        status: 'pending',
      },
    ];

    for (const invData of invoices) {
      const invoice = invoiceRepo.create(invData);
      await invoiceRepo.save(invoice);
    }
    console.log(`✓ Created ${invoices.length} invoices`);

    // Seed Vendors
    console.log('\n🛒 Seeding Procurement - Vendors...');
    const vendorRepo = AppDataSource.getRepository(Vendor);

    const vendors = [
      {
        name: 'Office Supplies Co',
        vendorCode: 'VEND-001',
        contactPerson: 'Tom Anderson',
        email: 'sales@officesupplies.com',
        phone: '555-2001',
        address: '100 Supply Lane',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
        paymentTerms: 'Net 30',
        discountRate: 0.05,
        status: 'active',
      },
      {
        name: 'Tech Hardware Inc',
        vendorCode: 'VEND-002',
        contactPerson: 'Alice Chen',
        email: 'orders@techhardware.com',
        phone: '555-2002',
        address: '200 Tech Park',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        country: 'USA',
        paymentTerms: 'Net 45',
        discountRate: 0.03,
        status: 'active',
      },
      {
        name: 'Furniture World',
        vendorCode: 'VEND-003',
        contactPerson: 'Bob Martinez',
        email: 'sales@furnitureworld.com',
        phone: '555-2003',
        address: '300 Furniture Row',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA',
        paymentTerms: 'Net 60',
        discountRate: 0.10,
        status: 'active',
      },
    ];

    const savedVendors = [];
    for (const vendorData of vendors) {
      const vendor = vendorRepo.create(vendorData);
      await vendorRepo.save(vendor);
      savedVendors.push(vendor);
    }
    console.log(`✓ Created ${savedVendors.length} vendors`);

    // Seed Purchase Orders
    console.log('\n📋 Seeding Procurement - Purchase Orders...');
    const poRepo = AppDataSource.getRepository(PurchaseOrder);

    const purchaseOrders = [
      {
        poNumber: 'PO-2024-001',
        vendor: savedVendors[0],
        orderDate: new Date('2024-01-05'),
        expectedDeliveryDate: new Date('2024-01-20'),
        actualDeliveryDate: new Date('2024-01-18'),
        totalAmount: 5000,
        items: JSON.stringify([
          { sku: 'PAPER-001', name: 'Copy Paper', quantity: 100, unitPrice: 25 },
          { sku: 'PEN-001', name: 'Ball Point Pens', quantity: 200, unitPrice: 12.50 },
        ]),
        status: 'received',
        approvedBy: 'manager@company.com',
      },
      {
        poNumber: 'PO-2024-002',
        vendor: savedVendors[1],
        orderDate: new Date('2024-01-10'),
        expectedDeliveryDate: new Date('2024-01-25'),
        totalAmount: 15000,
        items: JSON.stringify([
          { sku: 'LAPTOP-001', name: 'Laptop Computer', quantity: 10, unitPrice: 1500 },
        ]),
        status: 'ordered',
        approvedBy: 'manager@company.com',
      },
      {
        poNumber: 'PO-2024-003',
        vendor: savedVendors[2],
        orderDate: new Date('2024-01-15'),
        expectedDeliveryDate: new Date('2024-02-01'),
        totalAmount: 8000,
        items: JSON.stringify([
          { sku: 'DESK-001', name: 'Office Desk', quantity: 5, unitPrice: 800 },
          { sku: 'CHAIR-001', name: 'Office Chair', quantity: 10, unitPrice: 400 },
        ]),
        status: 'pending',
      },
    ];

    for (const poData of purchaseOrders) {
      const po = poRepo.create(poData);
      await poRepo.save(po);
    }
    console.log(`✓ Created ${purchaseOrders.length} purchase orders`);

    // Seed Inventory Items
    console.log('\n📦 Seeding Inventory Items...');
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);

    const inventoryItems = [
      {
        sku: 'PROD-001',
        name: 'Widget Pro',
        description: 'Premium widget for professional use',
        category: 'Products',
        quantityOnHand: 150,
        quantityReserved: 25,
        quantityOnOrder: 0,
        reorderPoint: 50,
        reorderQuantity: 100,
        unitCost: 25.00,
        unitPrice: 45.00,
        warehouseLocation: 'A1-B2',
        preferredVendorId: savedVendors[1].id,
        status: 'active',
      },
      {
        sku: 'PROD-002',
        name: 'Widget Basic',
        description: 'Standard widget for everyday use',
        category: 'Products',
        quantityOnHand: 45,
        quantityReserved: 10,
        quantityOnOrder: 100,
        reorderPoint: 50,
        reorderQuantity: 100,
        unitCost: 15.00,
        unitPrice: 25.00,
        warehouseLocation: 'A1-B3',
        preferredVendorId: savedVendors[1].id,
        status: 'active',
      },
      {
        sku: 'SUPPLY-001',
        name: 'Office Supplies Bundle',
        description: 'Assorted office supplies',
        category: 'Supplies',
        quantityOnHand: 200,
        quantityReserved: 0,
        quantityOnOrder: 0,
        reorderPoint: 100,
        reorderQuantity: 200,
        unitCost: 10.00,
        unitPrice: 18.00,
        warehouseLocation: 'B2-C1',
        preferredVendorId: savedVendors[0].id,
        status: 'active',
      },
      {
        sku: 'EQUIP-001',
        name: 'Computer Equipment',
        description: 'Various computer equipment',
        category: 'Equipment',
        quantityOnHand: 30,
        quantityReserved: 5,
        quantityOnOrder: 10,
        reorderPoint: 20,
        reorderQuantity: 25,
        unitCost: 500.00,
        unitPrice: 750.00,
        warehouseLocation: 'C1-D1',
        preferredVendorId: savedVendors[1].id,
        status: 'active',
      },
    ];

    for (const itemData of inventoryItems) {
      const item = inventoryRepo.create(itemData);
      await inventoryRepo.save(item);
    }
    console.log(`✓ Created ${inventoryItems.length} inventory items`);

    // Seed Shipments
    console.log('\n🚚 Seeding Supply Chain - Shipments...');
    const shipmentRepo = AppDataSource.getRepository(Shipment);

    const shipments = [
      {
        trackingNumber: 'TRK-2024-001',
        orderId: 'ORD-001',
        orderType: 'outbound' as const,
        carrier: 'FedEx',
        shipDate: new Date('2024-01-12'),
        estimatedDeliveryDate: new Date('2024-01-15'),
        actualDeliveryDate: new Date('2024-01-14'),
        originAddress: 'Warehouse A, 123 Storage St, Dallas, TX',
        destinationAddress: 'Acme Corp, 123 Business St, New York, NY',
        shippingCost: 125.50,
        items: JSON.stringify([
          { sku: 'PROD-001', name: 'Widget Pro', quantity: 50 },
        ]),
        status: 'delivered',
      },
      {
        trackingNumber: 'TRK-2024-002',
        orderId: 'ORD-002',
        orderType: 'outbound' as const,
        carrier: 'UPS',
        shipDate: new Date('2024-01-18'),
        estimatedDeliveryDate: new Date('2024-01-22'),
        originAddress: 'Warehouse A, 123 Storage St, Dallas, TX',
        destinationAddress: 'TechStart Inc, 456 Innovation Ave, San Francisco, CA',
        shippingCost: 185.00,
        items: JSON.stringify([
          { sku: 'PROD-001', name: 'Widget Pro', quantity: 30 },
          { sku: 'PROD-002', name: 'Widget Basic', quantity: 40 },
        ]),
        status: 'in_transit',
      },
      {
        trackingNumber: 'TRK-2024-003',
        orderId: 'PO-2024-002',
        orderType: 'inbound' as const,
        carrier: 'DHL',
        shipDate: new Date('2024-01-22'),
        estimatedDeliveryDate: new Date('2024-01-25'),
        originAddress: 'Tech Hardware Inc, 200 Tech Park, Austin, TX',
        destinationAddress: 'Warehouse A, 123 Storage St, Dallas, TX',
        shippingCost: 95.00,
        items: JSON.stringify([
          { sku: 'LAPTOP-001', name: 'Laptop Computer', quantity: 10 },
        ]),
        status: 'pending',
      },
    ];

    for (const shipmentData of shipments) {
      const shipment = shipmentRepo.create(shipmentData);
      await shipmentRepo.save(shipment);
    }
    console.log(`✓ Created ${shipments.length} shipments`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${await deptRepo.count()} departments`);
    console.log(`   • ${await empRepo.count()} employees`);
    console.log(`   • ${await payrollRepo.count()} payroll records`);
    console.log(`   • ${await acctRepo.count()} accounting transactions`);
    console.log(`   • ${await budgetRepo.count()} budgets`);
    console.log(`   • ${await customerRepo.count()} customers`);
    console.log(`   • ${await invoiceRepo.count()} invoices`);
    console.log(`   • ${await vendorRepo.count()} vendors`);
    console.log(`   • ${await poRepo.count()} purchase orders`);
    console.log(`   • ${await inventoryRepo.count()} inventory items`);
    console.log(`   • ${await shipmentRepo.count()} shipments`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
