"""
MONOLITHIC APPLICATION STRUCTURE
All modules are bundled together in a single Flask application
Shared middleware, shared database, shared dependencies
"""

from flask import Flask, jsonify, request
from datetime import datetime
import logging
from typing import Dict, Any

# Import mock data service
try:
    from services import mock_data
except ImportError:
    # Fallback if mock_data module doesn't exist yet
    mock_data = None

# Import all module routes - MONOLITHIC STRUCTURE
try:
    from modules.human_resources import hr_routes
except ImportError:
    hr_routes = None

try:
    from modules.payroll import payroll_routes
except ImportError:
    payroll_routes = None

try:
    from modules.accounting import accounting_routes
except ImportError:
    accounting_routes = None

try:
    from modules.finance import finance_routes
except ImportError:
    finance_routes = None

try:
    from modules.billing import billing_routes
except ImportError:
    billing_routes = None

try:
    from modules.procurement import procurement_routes
except ImportError:
    procurement_routes = None

try:
    from modules.supply_chain import supply_chain_routes
except ImportError:
    supply_chain_routes = None

try:
    from modules.inventory import inventory_routes
except ImportError:
    inventory_routes = None


# In-memory storage for created shipments
created_shipments = []

# Configure logging for request logger middleware
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def request_logger_middleware():
    """Middleware equivalent for request logging"""
    logger.info(f"{request.method} {request.path} - {request.remote_addr}")


def create_app() -> Flask:
    """
    Create and configure the Flask application
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Global middleware (shared across all modules)
    @app.before_request
    def before_request():
        """Execute before each request - equivalent to Express middleware"""
        request_logger_middleware()
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint to verify service status"""
        return jsonify({
            'status': 'healthy',
            'service': 'ERP Monolith',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    
    # API info endpoint
    @app.route('/api', methods=['GET'])
    def api_info():
        """API information endpoint with module details"""
        return jsonify({
            'name': 'Enterprise Resource Planning - Monolithic API',
            'version': '1.0.0',
            'architecture': 'Monolithic',
            'modules': [
                {
                    'name': 'Human Resources',
                    'path': '/api/hr',
                    'description': 'Employee and department management',
                    'calls': [],
                    'calledBy': ['Payroll']
                },
                {
                    'name': 'Payroll',
                    'path': '/api/payroll',
                    'description': 'Salary processing and tax calculations',
                    'calls': ['HR', 'Accounting'],
                    'calledBy': []
                },
                {
                    'name': 'Accounting',
                    'path': '/api/accounting',
                    'description': 'General ledger and financial transactions',
                    'calls': [],
                    'calledBy': ['Payroll', 'Billing', 'Procurement']
                },
                {
                    'name': 'Finance',
                    'path': '/api/finance',
                    'description': 'Budgeting and financial reporting',
                    'calls': ['Accounting'],
                    'calledBy': []
                },
                {
                    'name': 'Billing',
                    'path': '/api/billing',
                    'description': 'Invoicing and customer billing',
                    'calls': ['Accounting'],
                    'calledBy': []
                },
                {
                    'name': 'Procurement',
                    'path': '/api/procurement',
                    'description': 'Purchase orders and vendor management',
                    'calls': ['Accounting'],
                    'calledBy': ['Inventory']
                },
                {
                    'name': 'Supply Chain',
                    'path': '/api/supply-chain',
                    'description': 'Shipments and logistics',
                    'calls': [],
                    'calledBy': []
                },
                {
                    'name': 'Inventory',
                    'path': '/api/inventory',
                    'description': 'Stock management and automatic reordering',
                    'calls': ['Procurement'],
                    'calledBy': []
                }
            ],
            'characteristics': {
                'deploymentUnit': 'Single monolithic application',
                'database': 'Shared PostgreSQL database',
                'coupling': 'Tight coupling between modules (direct service calls)',
                'middleware': 'Shared authentication, logging, and error handling'
            }
        })
    
    # Mock/Demo Data Endpoints (for when database is not configured)
    @app.route('/api/mock-stats', methods=['GET'])
    def mock_stats():
        """Get mock statistics data"""
        if mock_data and hasattr(mock_data, 'get_mock_stats'):
            return jsonify(mock_data.get_mock_stats())
        return jsonify({
            'message': 'Mock data service not available',
            'employees': 0,
            'departments': 0,
            'transactions': 0
        })
    
    @app.route('/api/demo/employees', methods=['GET'])
    def demo_employees():
        """Get demo employee data"""
        if mock_data and hasattr(mock_data, 'mock_employees'):
            return jsonify(mock_data.mock_employees)
        return jsonify([])
    
    @app.route('/api/demo/departments', methods=['GET'])
    def demo_departments():
        """Get demo department data"""
        if mock_data and hasattr(mock_data, 'mock_departments'):
            return jsonify(mock_data.mock_departments)
        return jsonify([])
    
    @app.route('/api/demo/payroll', methods=['GET'])
    def demo_payroll():
        """Get demo payroll records"""
        if mock_data and hasattr(mock_data, 'mock_payroll_records'):
            return jsonify(mock_data.mock_payroll_records)
        return jsonify([])
    
    @app.route('/api/demo/transactions', methods=['GET'])
    def demo_transactions():
        """Get demo transaction data"""
        if mock_data and hasattr(mock_data, 'mock_transactions'):
            return jsonify(mock_data.mock_transactions)
        return jsonify([])
    
    @app.route('/api/demo/budgets', methods=['GET'])
    def demo_budgets():
        """Get demo budget data"""
        if mock_data and hasattr(mock_data, 'mock_budgets'):
            return jsonify(mock_data.mock_budgets)
        return jsonify([])
    
    @app.route('/api/demo/customers', methods=['GET'])
    def demo_customers():
        """Get demo customer data"""
        if mock_data and hasattr(mock_data, 'mock_customers'):
            return jsonify(mock_data.mock_customers)
        return jsonify([])
    
    @app.route('/api/demo/invoices', methods=['GET'])
    def demo_invoices():
        """Get demo invoice data"""
        if mock_data and hasattr(mock_data, 'mock_invoices'):
            return jsonify(mock_data.mock_invoices)
        return jsonify([])
    
    @app.route('/api/demo/vendors', methods=['GET'])
    def demo_vendors():
        """Get demo vendor data"""
        if mock_data and hasattr(mock_data, 'mock_vendors'):
            return jsonify(mock_data.mock_vendors)
        return jsonify([])
    
    @app.route('/api/demo/purchase-orders', methods=['GET'])
    def demo_purchase_orders():
        """Get demo purchase order data"""
        if mock_data and hasattr(mock_data, 'mock_purchase_orders'):
            return jsonify(mock_data.mock_purchase_orders)
        return jsonify([])
    
    @app.route('/api/demo/inventory', methods=['GET'])
    def demo_inventory():
        """Get demo inventory items"""
        if mock_data and hasattr(mock_data, 'mock_inventory_items'):
            return jsonify(mock_data.mock_inventory_items)
        return jsonify([])
    
    @app.route('/api/demo/shipments', methods=['GET'])
    def demo_shipments():
        """Get demo shipment data"""
        if mock_data and hasattr(mock_data, 'mock_shipments'):
            return jsonify(mock_data.mock_shipments)
        return jsonify([])
    
    # ========================================
    # HUMAN RESOURCES ROUTES
    # ========================================
    
    # Employee Management
    @app.route('/api/hr/employees', methods=['POST'])
    def create_employee():
        """Create a new employee"""
        data = request.get_json()
        return jsonify({
            'id': 'emp-' + str(datetime.utcnow().timestamp()),
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'email': data.get('email'),
            'departmentId': data.get('departmentId'),
            'position': data.get('position'),
            'salary': data.get('salary'),
            'hireDate': data.get('hireDate'),
            'status': 'active'
        }), 201
    
    @app.route('/api/hr/employees', methods=['GET'])
    def get_all_employees():
        """Get all employees"""
        if mock_data and hasattr(mock_data, 'mock_employees'):
            return jsonify(mock_data.mock_employees)
        return jsonify([])
    
    @app.route('/api/hr/employees/<employee_id>', methods=['GET'])
    def get_employee_by_id(employee_id):
        """Get employee by ID"""
        if mock_data and hasattr(mock_data, 'mock_employees'):
            for emp in mock_data.mock_employees:
                if emp.get('id') == employee_id:
                    return jsonify(emp)
        return jsonify({'error': 'Employee not found'}), 404
    
    @app.route('/api/hr/employees/<employee_id>', methods=['PUT'])
    def update_employee(employee_id):
        """Update employee information"""
        data = request.get_json()
        return jsonify({
            'id': employee_id,
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'email': data.get('email'),
            'departmentId': data.get('departmentId'),
            'position': data.get('position'),
            'salary': data.get('salary'),
            'status': data.get('status', 'active')
        })
    
    @app.route('/api/hr/employees/<employee_id>/promote', methods=['PATCH'])
    def promote_employee(employee_id):
        """Promote an employee"""
        data = request.get_json()
        return jsonify({
            'id': employee_id,
            'newPosition': data.get('newPosition'),
            'newSalary': data.get('newSalary'),
            'effectiveDate': data.get('effectiveDate'),
            'message': 'Employee promoted successfully'
        })
    
    @app.route('/api/hr/employees/<employee_id>/terminate', methods=['POST'])
    def terminate_employee(employee_id):
        """Terminate an employee"""
        data = request.get_json()
        return jsonify({
            'id': employee_id,
            'terminationDate': data.get('terminationDate'),
            'reason': data.get('reason'),
            'status': 'terminated',
            'message': 'Employee terminated successfully'
        })
    
    # Department Management
    @app.route('/api/hr/departments', methods=['POST'])
    def create_department():
        """Create a new department"""
        data = request.get_json()
        return jsonify({
            'id': 'dept-' + str(datetime.utcnow().timestamp()),
            'name': data.get('name'),
            'description': data.get('description'),
            'managerId': data.get('managerId'),
            'budget': data.get('budget'),
            'location': data.get('location')
        }), 201
    
    @app.route('/api/hr/departments', methods=['GET'])
    def get_all_departments():
        """Get all departments"""
        if mock_data and hasattr(mock_data, 'mock_departments'):
            return jsonify(mock_data.mock_departments)
        return jsonify([])
    
    @app.route('/api/hr/departments/<department_id>', methods=['GET'])
    def get_department_by_id(department_id):
        """Get department by ID"""
        if mock_data and hasattr(mock_data, 'mock_departments'):
            for dept in mock_data.mock_departments:
                if dept.get('id') == department_id:
                    return jsonify(dept)
        return jsonify({'error': 'Department not found'}), 404
    
    @app.route('/api/hr/statistics', methods=['GET'])
    def get_hr_statistics():
        """Get HR statistics"""
        return jsonify({
            'totalEmployees': 150,
            'activeEmployees': 142,
            'totalDepartments': 8,
            'averageSalary': 65000,
            'newHiresThisMonth': 5
        })
    
    # ========================================
    # PAYROLL ROUTES
    # ========================================
    
    @app.route('/api/payroll/process', methods=['POST'])
    def process_payroll():
        """Process payroll for a single employee"""
        data = request.get_json()
        employee_id = data.get('employeeId')
        gross_pay = data.get('grossPay', 6250)
        deductions = data.get('deductions', 1000)
        tax_withheld = gross_pay * 0.2
        net_pay = gross_pay - deductions - tax_withheld
        
        return jsonify({
            'id': 'pay-' + str(datetime.utcnow().timestamp()),
            'employeeId': employee_id,
            'payPeriodStart': data.get('payPeriodStart'),
            'payPeriodEnd': data.get('payPeriodEnd'),
            'grossPay': gross_pay,
            'deductions': deductions,
            'taxWithheld': tax_withheld,
            'netPay': net_pay,
            'status': 'pending',
            'processedAt': datetime.utcnow().isoformat() + 'Z'
        }), 201
    
    @app.route('/api/payroll/process-batch', methods=['POST'])
    def process_batch_payroll():
        """Process payroll for multiple employees"""
        data = request.get_json()
        employee_ids = data.get('employeeIds', [])
        
        results = []
        for emp_id in employee_ids:
            results.append({
                'employeeId': emp_id,
                'status': 'processed',
                'netPay': 5000
            })
        
        return jsonify({
            'batchId': 'batch-' + str(datetime.utcnow().timestamp()),
            'totalProcessed': len(employee_ids),
            'results': results
        }), 201
    
    @app.route('/api/payroll/<payroll_id>/approve', methods=['POST'])
    def approve_payroll(payroll_id):
        """Approve a payroll record"""
        return jsonify({
            'id': payroll_id,
            'status': 'approved',
            'approvedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Payroll approved successfully'
        })
    
    @app.route('/api/payroll', methods=['GET'])
    def get_all_payroll():
        """Get all payroll records"""
        if mock_data and hasattr(mock_data, 'mock_payroll_records'):
            return jsonify(mock_data.mock_payroll_records)
        return jsonify([])
    
    @app.route('/api/payroll/<payroll_id>', methods=['GET'])
    def get_payroll_by_id(payroll_id):
        """Get payroll record by ID"""
        return jsonify({
            'id': payroll_id,
            'employeeId': 'emp-001',
            'grossPay': 6250,
            'netPay': 5000,
            'status': 'approved'
        })
    
    @app.route('/api/payroll/employee/<employee_id>', methods=['GET'])
    def get_employee_payroll_history(employee_id):
        """Get payroll history for an employee"""
        return jsonify([
            {
                'id': 'pay-001',
                'employeeId': employee_id,
                'payPeriodStart': '2024-01-01',
                'payPeriodEnd': '2024-01-31',
                'netPay': 5000
            }
        ])
    
    # ========================================
    # ACCOUNTING ROUTES
    # ========================================
    
    @app.route('/api/accounting/journal-entries', methods=['POST'])
    def create_journal_entry():
        """Create a journal entry"""
        data = request.get_json()
        return jsonify({
            'id': 'je-' + str(datetime.utcnow().timestamp()),
            'date': data.get('date'),
            'description': data.get('description'),
            'entries': data.get('entries', []),
            'totalDebit': data.get('totalDebit', 0),
            'totalCredit': data.get('totalCredit', 0),
            'status': 'posted'
        }), 201
    
    @app.route('/api/accounting/transactions', methods=['GET'])
    def get_all_transactions():
        """Get all accounting transactions"""
        if mock_data and hasattr(mock_data, 'mock_transactions'):
            return jsonify(mock_data.mock_transactions)
        return jsonify([])
    
    @app.route('/api/accounting/transactions/<transaction_id>', methods=['GET'])
    def get_transaction_by_id(transaction_id):
        """Get transaction by ID"""
        return jsonify({
            'id': transaction_id,
            'date': '2024-01-15',
            'description': 'Sample transaction',
            'amount': 1000,
            'type': 'debit'
        })
    
    @app.route('/api/accounting/general-ledger', methods=['GET'])
    def get_general_ledger():
        """Get general ledger"""
        return jsonify({
            'accounts': [
                {'code': '1000', 'name': 'Cash', 'balance': 50000},
                {'code': '2000', 'name': 'Accounts Payable', 'balance': 25000}
            ]
        })
    
    @app.route('/api/accounting/trial-balance', methods=['GET'])
    def get_trial_balance():
        """Get trial balance"""
        return jsonify({
            'date': datetime.utcnow().isoformat() + 'Z',
            'totalDebits': 100000,
            'totalCredits': 100000,
            'balanced': True
        })
    
    # ========================================
    # FINANCE ROUTES
    # ========================================
    
    # Budget Management
    @app.route('/api/finance/budgets', methods=['POST'])
    def create_budget():
        """Create a new budget"""
        data = request.get_json()
        return jsonify({
            'id': 'budget-' + str(datetime.utcnow().timestamp()),
            'departmentId': data.get('departmentId'),
            'fiscalYear': data.get('fiscalYear'),
            'quarter': data.get('quarter'),
            'allocatedAmount': data.get('allocatedAmount'),
            'spentAmount': 0,
            'remainingAmount': data.get('allocatedAmount'),
            'status': 'active'
        }), 201
    
    @app.route('/api/finance/budgets', methods=['GET'])
    def get_all_budgets():
        """Get all budgets"""
        if mock_data and hasattr(mock_data, 'mock_budgets'):
            return jsonify(mock_data.mock_budgets)
        return jsonify([])
    
    @app.route('/api/finance/budgets/<budget_id>', methods=['GET'])
    def get_budget_by_id(budget_id):
        """Get budget by ID"""
        return jsonify({
            'id': budget_id,
            'departmentId': 'dept-001',
            'allocatedAmount': 100000,
            'spentAmount': 50000,
            'remainingAmount': 50000
        })
    
    @app.route('/api/finance/budgets/<budget_id>/close', methods=['POST'])
    def close_budget(budget_id):
        """Close a budget"""
        return jsonify({
            'id': budget_id,
            'status': 'closed',
            'closedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Budget closed successfully'
        })
    
    @app.route('/api/finance/budgets/<budget_id>/utilization', methods=['GET'])
    def get_budget_utilization(budget_id):
        """Get budget utilization"""
        return jsonify({
            'budgetId': budget_id,
            'utilizationPercentage': 75,
            'allocatedAmount': 100000,
            'spentAmount': 75000,
            'remainingAmount': 25000
        })
    
    @app.route('/api/finance/departments/<department_id>/budget-summary', methods=['GET'])
    def get_department_budget_summary(department_id):
        """Get department budget summary"""
        return jsonify({
            'departmentId': department_id,
            'totalAllocated': 500000,
            'totalSpent': 350000,
            'totalRemaining': 150000,
            'utilizationPercentage': 70
        })
    
    @app.route('/api/finance/reports', methods=['GET'])
    def generate_financial_report():
        """Generate financial report"""
        report_type = request.args.get('type', 'summary')
        return jsonify({
            'reportType': report_type,
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
            'data': {
                'revenue': 1000000,
                'expenses': 750000,
                'profit': 250000
            }
        })
    
    # ========================================
    # BILLING ROUTES
    # ========================================
    
    # Customer Management
    @app.route('/api/billing/customers', methods=['POST'])
    def create_customer():
        """Create a new customer"""
        data = request.get_json()
        return jsonify({
            'id': 'cust-' + str(datetime.utcnow().timestamp()),
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'address': data.get('address'),
            'creditLimit': data.get('creditLimit', 50000),
            'currentBalance': 0,
            'status': 'active'
        }), 201
    
    @app.route('/api/billing/customers', methods=['GET'])
    def get_all_customers():
        """Get all customers"""
        if mock_data and hasattr(mock_data, 'mock_customers'):
            return jsonify(mock_data.mock_customers)
        return jsonify([])
    
    @app.route('/api/billing/customers/<customer_id>', methods=['GET'])
    def get_customer_by_id(customer_id):
        """Get customer by ID"""
        return jsonify({
            'id': customer_id,
            'name': 'Sample Customer',
            'email': 'customer@example.com',
            'currentBalance': 5000
        })
    
    @app.route('/api/billing/customers/<customer_id>/balance', methods=['GET'])
    def get_customer_balance(customer_id):
        """Get customer balance"""
        return jsonify({
            'customerId': customer_id,
            'currentBalance': 5000,
            'creditLimit': 50000,
            'availableCredit': 45000
        })
    
    # Invoice Management
    @app.route('/api/billing/invoices', methods=['POST'])
    def create_invoice():
        """Create a new invoice"""
        data = request.get_json()
        subtotal = data.get('subtotal', 0)
        tax_rate = 0.08
        tax_amount = subtotal * tax_rate
        total = subtotal + tax_amount
        
        return jsonify({
            'id': 'inv-' + str(datetime.utcnow().timestamp()),
            'invoiceNumber': 'INV-' + str(int(datetime.utcnow().timestamp())),
            'customerId': data.get('customerId'),
            'issueDate': data.get('issueDate'),
            'dueDate': data.get('dueDate'),
            'subtotal': subtotal,
            'taxAmount': tax_amount,
            'totalAmount': total,
            'balanceDue': total,
            'status': 'draft',
            'items': data.get('items', [])
        }), 201
    
    @app.route('/api/billing/invoices', methods=['GET'])
    def get_all_invoices():
        """Get all invoices"""
        if mock_data and hasattr(mock_data, 'mock_invoices'):
            return jsonify(mock_data.mock_invoices)
        return jsonify([])
    
    @app.route('/api/billing/invoices/<invoice_id>', methods=['GET'])
    def get_invoice_by_id(invoice_id):
        """Get invoice by ID"""
        return jsonify({
            'id': invoice_id,
            'invoiceNumber': 'INV-001',
            'customerId': 'cust-001',
            'totalAmount': 10000,
            'status': 'pending'
        })
    
    @app.route('/api/billing/invoices/<invoice_id>/send', methods=['POST'])
    def send_invoice(invoice_id):
        """Send invoice to customer"""
        return jsonify({
            'id': invoice_id,
            'status': 'sent',
            'sentAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Invoice sent successfully'
        })
    
    @app.route('/api/billing/invoices/<invoice_id>/payments', methods=['POST'])
    def record_payment(invoice_id):
        """Record a payment for an invoice"""
        data = request.get_json()
        return jsonify({
            'invoiceId': invoice_id,
            'paymentId': 'pmt-' + str(datetime.utcnow().timestamp()),
            'amount': data.get('amount'),
            'paymentDate': data.get('paymentDate'),
            'paymentMethod': data.get('paymentMethod'),
            'message': 'Payment recorded successfully'
        }), 201
    
    @app.route('/api/billing/invoices/<invoice_id>/cancel', methods=['POST'])
    def cancel_invoice(invoice_id):
        """Cancel an invoice"""
        return jsonify({
            'id': invoice_id,
            'status': 'cancelled',
            'cancelledAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Invoice cancelled successfully'
        })
    
    @app.route('/api/billing/invoices/overdue', methods=['GET'])
    def check_overdue_invoices():
        """Check for overdue invoices"""
        return jsonify({
            'overdueCount': 5,
            'totalOverdueAmount': 25000,
            'invoices': []
        })
    
    # ========================================
    # PROCUREMENT ROUTES
    # ========================================
    
    # Vendor Management
    @app.route('/api/procurement/vendors', methods=['POST'])
    def create_vendor():
        """Create a new vendor"""
        data = request.get_json()
        return jsonify({
            'id': 'vendor-' + str(datetime.utcnow().timestamp()),
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'address': data.get('address'),
            'paymentTerms': data.get('paymentTerms', 'Net 30'),
            'status': 'active'
        }), 201
    
    @app.route('/api/procurement/vendors', methods=['GET'])
    def get_all_vendors():
        """Get all vendors"""
        if mock_data and hasattr(mock_data, 'mock_vendors'):
            return jsonify(mock_data.mock_vendors)
        return jsonify([])
    
    @app.route('/api/procurement/vendors/<vendor_id>', methods=['GET'])
    def get_vendor_by_id(vendor_id):
        """Get vendor by ID"""
        return jsonify({
            'id': vendor_id,
            'name': 'Sample Vendor',
            'email': 'vendor@example.com',
            'status': 'active'
        })
    
    @app.route('/api/procurement/vendors/<vendor_id>/performance', methods=['GET'])
    def get_vendor_performance(vendor_id):
        """Get vendor performance metrics"""
        return jsonify({
            'vendorId': vendor_id,
            'onTimeDeliveryRate': 95,
            'qualityScore': 4.5,
            'totalOrders': 50,
            'totalSpent': 250000
        })
    
    # Purchase Order Management
    @app.route('/api/procurement/purchase-orders', methods=['POST'])
    def create_purchase_order():
        """Create a new purchase order"""
        data = request.get_json()
        return jsonify({
            'id': 'po-' + str(datetime.utcnow().timestamp()),
            'poNumber': 'PO-' + str(int(datetime.utcnow().timestamp())),
            'vendorId': data.get('vendorId'),
            'orderDate': data.get('orderDate'),
            'expectedDeliveryDate': data.get('expectedDeliveryDate'),
            'items': data.get('items', []),
            'totalAmount': data.get('totalAmount', 0),
            'status': 'draft'
        }), 201
    
    @app.route('/api/procurement/purchase-orders', methods=['GET'])
    def get_all_purchase_orders():
        """Get all purchase orders"""
        if mock_data and hasattr(mock_data, 'mock_purchase_orders'):
            return jsonify(mock_data.mock_purchase_orders)
        return jsonify([])
    
    @app.route('/api/procurement/purchase-orders/<po_id>', methods=['GET'])
    def get_purchase_order_by_id(po_id):
        """Get purchase order by ID"""
        return jsonify({
            'id': po_id,
            'poNumber': 'PO-001',
            'vendorId': 'vendor-001',
            'totalAmount': 10000,
            'status': 'pending'
        })
    
    @app.route('/api/procurement/purchase-orders/<po_id>/approve', methods=['POST'])
    def approve_purchase_order(po_id):
        """Approve a purchase order"""
        return jsonify({
            'id': po_id,
            'status': 'approved',
            'approvedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Purchase order approved successfully'
        })
    
    @app.route('/api/procurement/purchase-orders/<po_id>/place', methods=['POST'])
    def place_purchase_order(po_id):
        """Place a purchase order with vendor"""
        return jsonify({
            'id': po_id,
            'status': 'placed',
            'placedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Purchase order placed with vendor'
        })
    
    @app.route('/api/procurement/purchase-orders/<po_id>/receive', methods=['POST'])
    def receive_purchase_order(po_id):
        """Mark purchase order as received"""
        return jsonify({
            'id': po_id,
            'status': 'received',
            'receivedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Purchase order received'
        })
    
    @app.route('/api/procurement/purchase-orders/<po_id>/cancel', methods=['POST'])
    def cancel_purchase_order(po_id):
        """Cancel a purchase order"""
        return jsonify({
            'id': po_id,
            'status': 'cancelled',
            'cancelledAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Purchase order cancelled'
        })
    
    # ========================================
    # SUPPLY CHAIN ROUTES
    # ========================================
    
    # Shipment Management
    @app.route('/api/supply-chain/shipments', methods=['POST'])
    def create_shipment():
        """Create a new shipment"""
        data = request.get_json()
        return jsonify({
            'id': 'ship-' + str(datetime.utcnow().timestamp()),
            'trackingNumber': 'TRK-' + str(int(datetime.utcnow().timestamp())),
            'orderId': data.get('orderId'),
            'carrier': data.get('carrier'),
            'origin': data.get('origin'),
            'destination': data.get('destination'),
            'shipDate': data.get('shipDate'),
            'estimatedDelivery': data.get('estimatedDelivery'),
            'status': 'pending'
        }), 201
    
    @app.route('/api/supply-chain/shipments', methods=['GET'])
    def get_all_shipments():
        """Get all shipments"""
        if mock_data and hasattr(mock_data, 'mock_shipments'):
            return jsonify(mock_data.mock_shipments)
        return jsonify([])
    
    @app.route('/api/supply-chain/shipments/<shipment_id>', methods=['GET'])
    def get_shipment_by_id(shipment_id):
        """Get shipment by ID"""
        return jsonify({
            'id': shipment_id,
            'trackingNumber': 'TRK-001',
            'status': 'in_transit',
            'estimatedDelivery': '2024-02-01'
        })
    
    @app.route('/api/supply-chain/shipments/tracking/<tracking_number>', methods=['GET'])
    def get_shipment_by_tracking(tracking_number):
        """Get shipment by tracking number"""
        return jsonify({
            'trackingNumber': tracking_number,
            'status': 'in_transit',
            'currentLocation': 'Distribution Center',
            'estimatedDelivery': '2024-02-01'
        })
    
    @app.route('/api/supply-chain/shipments/order/<order_id>', methods=['GET'])
    def get_shipments_by_order(order_id):
        """Get shipments for an order"""
        return jsonify([
            {
                'id': 'ship-001',
                'orderId': order_id,
                'trackingNumber': 'TRK-001',
                'status': 'delivered'
            }
        ])
    
    @app.route('/api/supply-chain/shipments/<shipment_id>/dispatch', methods=['POST'])
    def dispatch_shipment(shipment_id):
        """Dispatch a shipment"""
        return jsonify({
            'id': shipment_id,
            'status': 'dispatched',
            'dispatchedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Shipment dispatched successfully'
        })
    
    @app.route('/api/supply-chain/shipments/<shipment_id>/status', methods=['PUT'])
    def update_shipment_status(shipment_id):
        """Update shipment status"""
        data = request.get_json()
        return jsonify({
            'id': shipment_id,
            'status': data.get('status'),
            'location': data.get('location'),
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        })
    
    @app.route('/api/supply-chain/shipments/<shipment_id>/deliver', methods=['POST'])
    def mark_delivered(shipment_id):
        """Mark shipment as delivered"""
        return jsonify({
            'id': shipment_id,
            'status': 'delivered',
            'deliveredAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Shipment marked as delivered'
        })
    
    @app.route('/api/supply-chain/shipments/<shipment_id>/cancel', methods=['POST'])
    def cancel_shipment(shipment_id):
        """Cancel a shipment"""
        return jsonify({
            'id': shipment_id,
            'status': 'cancelled',
            'cancelledAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Shipment cancelled'
        })
    
    @app.route('/api/supply-chain/carriers/performance', methods=['GET'])
    def get_carrier_performance():
        """Get carrier performance metrics"""
        return jsonify({
            'carriers': [
                {'name': 'FedEx', 'onTimeRate': 95, 'avgDeliveryTime': 2.5},
                {'name': 'UPS', 'onTimeRate': 93, 'avgDeliveryTime': 2.8}
            ]
        })
    
    @app.route('/api/supply-chain/inbound/summary', methods=['GET'])
    def get_inbound_summary():
        """Get inbound shipment summary"""
        return jsonify({
            'totalInbound': 25,
            'inTransit': 15,
            'arrived': 10,
            'expectedToday': 5
        })
    
    @app.route('/api/supply-chain/outbound/summary', methods=['GET'])
    def get_outbound_summary():
        """Get outbound shipment summary"""
        return jsonify({
            'totalOutbound': 30,
            'pending': 5,
            'dispatched': 20,
            'delivered': 5
        })
    
    # ========================================
    # INVENTORY ROUTES
    # ========================================
    
    # Inventory Item Management
    @app.route('/api/inventory/items', methods=['POST'])
    def create_inventory_item():
        """Create a new inventory item"""
        data = request.get_json()
        return jsonify({
            'id': 'item-' + str(datetime.utcnow().timestamp()),
            'sku': data.get('sku'),
            'name': data.get('name'),
            'description': data.get('description'),
            'category': data.get('category'),
            'unitPrice': data.get('unitPrice'),
            'quantityOnHand': data.get('quantityOnHand', 0),
            'reorderPoint': data.get('reorderPoint', 10),
            'reorderQuantity': data.get('reorderQuantity', 50)
        }), 201
    
    @app.route('/api/inventory/items', methods=['GET'])
    def get_all_inventory_items():
        """Get all inventory items"""
        if mock_data and hasattr(mock_data, 'mock_inventory_items'):
            return jsonify(mock_data.mock_inventory_items)
        return jsonify([])
    
    @app.route('/api/inventory/items/<item_id>', methods=['GET'])
    def get_inventory_item_by_id(item_id):
        """Get inventory item by ID"""
        return jsonify({
            'id': item_id,
            'sku': 'SKU-001',
            'name': 'Sample Item',
            'quantityOnHand': 100,
            'unitPrice': 25.00
        })
    
    @app.route('/api/inventory/items/sku/<sku>', methods=['GET'])
    def get_inventory_item_by_sku(sku):
        """Get inventory item by SKU"""
        return jsonify({
            'sku': sku,
            'name': 'Sample Item',
            'quantityOnHand': 100,
            'unitPrice': 25.00
        })
    
    @app.route('/api/inventory/items/<item_id>', methods=['PUT'])
    def update_inventory_item(item_id):
        """Update inventory item"""
        data = request.get_json()
        return jsonify({
            'id': item_id,
            'name': data.get('name'),
            'unitPrice': data.get('unitPrice'),
            'reorderPoint': data.get('reorderPoint'),
            'message': 'Inventory item updated successfully'
        })
    
    # Stock Operations
    @app.route('/api/inventory/stock/adjust', methods=['POST'])
    def adjust_stock():
        """Adjust stock quantity"""
        data = request.get_json()
        return jsonify({
            'itemId': data.get('itemId'),
            'adjustmentType': data.get('adjustmentType'),
            'quantity': data.get('quantity'),
            'newQuantity': data.get('newQuantity', 0),
            'reason': data.get('reason'),
            'adjustedAt': datetime.utcnow().isoformat() + 'Z'
        })
    
    @app.route('/api/inventory/stock/reserve', methods=['POST'])
    def reserve_stock():
        """Reserve stock for an order"""
        data = request.get_json()
        return jsonify({
            'reservationId': 'res-' + str(datetime.utcnow().timestamp()),
            'itemId': data.get('itemId'),
            'quantity': data.get('quantity'),
            'orderId': data.get('orderId'),
            'reservedAt': datetime.utcnow().isoformat() + 'Z'
        })
    
    @app.route('/api/inventory/stock/release', methods=['POST'])
    def release_reserved_stock():
        """Release reserved stock"""
        data = request.get_json()
        return jsonify({
            'reservationId': data.get('reservationId'),
            'itemId': data.get('itemId'),
            'quantity': data.get('quantity'),
            'releasedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Stock reservation released'
        })
    
    @app.route('/api/inventory/stock/fulfill', methods=['POST'])
    def fulfill_reservation():
        """Fulfill a stock reservation"""
        data = request.get_json()
        return jsonify({
            'reservationId': data.get('reservationId'),
            'itemId': data.get('itemId'),
            'quantity': data.get('quantity'),
            'fulfilledAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Reservation fulfilled'
        })
    
    @app.route('/api/inventory/stock/receive', methods=['POST'])
    def receive_stock():
        """Receive stock from purchase order"""
        data = request.get_json()
        return jsonify({
            'itemId': data.get('itemId'),
            'quantity': data.get('quantity'),
            'purchaseOrderId': data.get('purchaseOrderId'),
            'receivedAt': datetime.utcnow().isoformat() + 'Z',
            'message': 'Stock received successfully'
        })
    
    @app.route('/api/inventory/low-stock', methods=['GET'])
    def get_low_stock_items():
        """Get items with low stock"""
        return jsonify({
            'lowStockCount': 5,
            'items': [
                {'id': 'item-001', 'sku': 'SKU-001', 'quantityOnHand': 5, 'reorderPoint': 10}
            ]
        })
    
    @app.route('/api/inventory/valuation', methods=['GET'])
    def get_inventory_valuation():
        """Get total inventory valuation"""
        return jsonify({
            'totalValue': 250000,
            'totalItems': 450,
            'averageValue': 555.56,
            'valuationDate': datetime.utcnow().isoformat() + 'Z'
        })
    
    @app.route('/api/inventory/categories', methods=['GET'])
    def get_category_breakdown():
        """Get inventory breakdown by category"""
        return jsonify({
            'categories': [
                {'name': 'Electronics', 'itemCount': 150, 'totalValue': 100000},
                {'name': 'Office Supplies', 'itemCount': 200, 'totalValue': 50000}
            ]
        })
    
    # ========================================
    # V2 API HELPER FUNCTIONS
    # ========================================

    def v2_success_response(data, status_code=200):
        """Create standardized V2 success response"""
        response = {
            'success': True,
            'data': data,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        return jsonify(response), status_code

    def v2_error_response(code, message, details=None, status_code=400):
        """Create standardized V2 error response"""
        error_response = {
            'success': False,
            'error': {
                'code': code,
                'message': message
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        if details:
            error_response['error']['details'] = details
        return jsonify(error_response), status_code

    def convert_to_camel_case(data):
        """Convert snake_case keys to camelCase"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                # Convert snake_case to camelCase
                camel_key = key
                if '_' in key:
                    parts = key.split('_')
                    camel_key = parts[0] + ''.join(word.capitalize() for word in parts[1:])
                result[camel_key] = convert_to_camel_case(value) if isinstance(value, (dict, list)) else value
            return result
        elif isinstance(data, list):
            return [convert_to_camel_case(item) for item in data]
        else:
            return data

    def paginate_list(items, page, limit):
        """Paginate a list and return data with pagination metadata"""
        total_items = len(items)
        total_pages = (total_items + limit - 1) // limit if limit > 0 else 1
        start_index = (page - 1) * limit
        end_index = start_index + limit

        paginated_items = items[start_index:end_index]

        return {
            'items': paginated_items,
            'pagination': {
                'page': page,
                'limit': limit,
                'totalPages': total_pages,
                'totalItems': total_items,
                'hasNextPage': page < total_pages,
                'hasPreviousPage': page > 1
            }
        }

    # ========================================
    # V2 API ROUTES - BREAKING CHANGES
    # ========================================
    # All v2 routes use /api/v2/ prefix
    # - Consistent response envelope: {success, data, timestamp}
    # - camelCase property names instead of snake_case
    # - Pagination on all list endpoints
    # - New error response structure
    # - DELETE endpoint for employees (204 No Content)
    # - Batch operations return 202 Accepted
    # - No demo endpoints in v2

    # ========================================
    # V2 HUMAN RESOURCES ROUTES
    # ========================================
    
    @app.route('/api/v2/hr/employees', methods=['POST'])
    def v2_create_employee():
        """V2: Create a new employee"""
        try:
            data = request.get_json()
            employee = {
                'id': 'emp-' + str(datetime.utcnow().timestamp()),
                'firstName': data.get('firstName'),
                'lastName': data.get('lastName'),
                'email': data.get('email'),
                'departmentId': data.get('departmentId'),
                'position': data.get('position'),
                'salary': data.get('salary'),
                'hireDate': data.get('hireDate'),
                'status': 'active'
            }
            return v2_success_response(employee, 201)
        except Exception as e:
            return v2_error_response('EMPLOYEE_CREATE_ERROR', 'Failed to create employee', str(e), 400)
    
    @app.route('/api/v2/hr/employees', methods=['GET'])
    def v2_get_all_employees():
        """V2: Get all employees with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            employees = []
            if mock_data and hasattr(mock_data, 'mock_employees'):
                employees = [convert_to_camel_case(emp) for emp in mock_data.mock_employees]
            
            paginated = paginate_list(employees, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('EMPLOYEES_FETCH_ERROR', 'Failed to fetch employees', str(e), 500)
    
    @app.route('/api/v2/hr/employees/<employee_id>', methods=['GET'])
    def v2_get_employee_by_id(employee_id):
        """V2: Get employee by ID"""
        try:
            if mock_data and hasattr(mock_data, 'mock_employees'):
                for emp in mock_data.mock_employees:
                    if emp.get('id') == employee_id:
                        return v2_success_response(convert_to_camel_case(emp))
            return v2_error_response('EMPLOYEE_NOT_FOUND', f'Employee with ID {employee_id} not found', None, 404)
        except Exception as e:
            return v2_error_response('EMPLOYEE_FETCH_ERROR', 'Failed to fetch employee', str(e), 500)
    
    @app.route('/api/v2/hr/employees/<employee_id>', methods=['PUT'])
    def v2_update_employee(employee_id):
        """V2: Update employee information"""
        try:
            data = request.get_json()
            employee = {
                'id': employee_id,
                'firstName': data.get('firstName'),
                'lastName': data.get('lastName'),
                'email': data.get('email'),
                'departmentId': data.get('departmentId'),
                'position': data.get('position'),
                'salary': data.get('salary'),
                'status': data.get('status', 'active')
            }
            return v2_success_response(employee)
        except Exception as e:
            return v2_error_response('EMPLOYEE_UPDATE_ERROR', 'Failed to update employee', str(e), 400)
    
    @app.route('/api/v2/hr/employees/<employee_id>', methods=['DELETE'])
    def v2_delete_employee(employee_id):
        """V2: Delete an employee (returns 204 No Content)"""
        try:
            # In a real implementation, this would delete from database
            return '', 204
        except Exception as e:
            return v2_error_response('EMPLOYEE_DELETE_ERROR', 'Failed to delete employee', str(e), 500)
    
    @app.route('/api/v2/hr/employees/<employee_id>/promote', methods=['PATCH'])
    def v2_promote_employee(employee_id):
        """V2: Promote an employee"""
        try:
            data = request.get_json()
            result = {
                'id': employee_id,
                'newPosition': data.get('newPosition'),
                'newSalary': data.get('newSalary'),
                'effectiveDate': data.get('effectiveDate'),
                'message': 'Employee promoted successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('EMPLOYEE_PROMOTE_ERROR', 'Failed to promote employee', str(e), 400)
    
    @app.route('/api/v2/hr/employees/<employee_id>/terminate', methods=['POST'])
    def v2_terminate_employee(employee_id):
        """V2: Terminate an employee"""
        try:
            data = request.get_json()
            result = {
                'id': employee_id,
                'terminationDate': data.get('terminationDate'),
                'reason': data.get('reason'),
                'status': 'terminated',
                'message': 'Employee terminated successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('EMPLOYEE_TERMINATE_ERROR', 'Failed to terminate employee', str(e), 400)
    
    @app.route('/api/v2/hr/departments', methods=['POST'])
    def v2_create_department():
        """V2: Create a new department"""
        try:
            data = request.get_json()
            department = {
                'id': 'dept-' + str(datetime.utcnow().timestamp()),
                'name': data.get('name'),
                'description': data.get('description'),
                'managerId': data.get('managerId'),
                'budget': data.get('budget'),
                'location': data.get('location')
            }
            return v2_success_response(department, 201)
        except Exception as e:
            return v2_error_response('DEPARTMENT_CREATE_ERROR', 'Failed to create department', str(e), 400)
    
    @app.route('/api/v2/hr/departments', methods=['GET'])
    def v2_get_all_departments():
        """V2: Get all departments with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            departments = []
            if mock_data and hasattr(mock_data, 'mock_departments'):
                departments = [convert_to_camel_case(dept) for dept in mock_data.mock_departments]
            
            paginated = paginate_list(departments, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('DEPARTMENTS_FETCH_ERROR', 'Failed to fetch departments', str(e), 500)
    
    @app.route('/api/v2/hr/departments/<department_id>', methods=['GET'])
    def v2_get_department_by_id(department_id):
        """V2: Get department by ID"""
        try:
            if mock_data and hasattr(mock_data, 'mock_departments'):
                for dept in mock_data.mock_departments:
                    if dept.get('id') == department_id:
                        return v2_success_response(convert_to_camel_case(dept))
            return v2_error_response('DEPARTMENT_NOT_FOUND', f'Department with ID {department_id} not found', None, 404)
        except Exception as e:
            return v2_error_response('DEPARTMENT_FETCH_ERROR', 'Failed to fetch department', str(e), 500)
    
    @app.route('/api/v2/hr/statistics', methods=['GET'])
    def v2_get_hr_statistics():
        """V2: Get HR statistics"""
        try:
            stats = {
                'totalEmployees': 150,
                'activeEmployees': 142,
                'totalDepartments': 8,
                'averageSalary': 65000,
                'newHiresThisMonth': 5
            }
            return v2_success_response(stats)
        except Exception as e:
            return v2_error_response('STATISTICS_FETCH_ERROR', 'Failed to fetch statistics', str(e), 500)
    
    # ========================================
    # V2 PAYROLL ROUTES
    # ========================================
    
    @app.route('/api/v2/payroll/process', methods=['POST'])
    def v2_process_payroll():
        """V2: Process payroll for a single employee"""
        try:
            data = request.get_json()
            employee_id = data.get('employeeId')
            gross_pay = data.get('grossPay', 6250)
            deductions = data.get('deductions', 1000)
            tax_withheld = gross_pay * 0.2
            net_pay = gross_pay - deductions - tax_withheld
            
            result = {
                'id': 'pay-' + str(datetime.utcnow().timestamp()),
                'employeeId': employee_id,
                'payPeriodStart': data.get('payPeriodStart'),
                'payPeriodEnd': data.get('payPeriodEnd'),
                'grossPay': gross_pay,
                'deductions': deductions,
                'taxWithheld': tax_withheld,
                'netPay': net_pay,
                'status': 'pending',
                'processedAt': datetime.utcnow().isoformat() + 'Z'
            }
            return v2_success_response(result, 201)
        except Exception as e:
            return v2_error_response('PAYROLL_PROCESS_ERROR', 'Failed to process payroll', str(e), 400)
    
    @app.route('/api/v2/payroll/process-batch', methods=['POST'])
    def v2_process_batch_payroll():
        """V2: Process payroll for multiple employees (returns 202 Accepted)"""
        try:
            data = request.get_json()
            employee_ids = data.get('employeeIds', [])
            
            results = []
            for emp_id in employee_ids:
                results.append({
                    'employeeId': emp_id,
                    'status': 'processed',
                    'netPay': 5000
                })
            
            batch_result = {
                'batchId': 'batch-' + str(datetime.utcnow().timestamp()),
                'totalProcessed': len(employee_ids),
                'results': results
            }
            return v2_success_response(batch_result, 202)
        except Exception as e:
            return v2_error_response('BATCH_PAYROLL_ERROR', 'Failed to process batch payroll', str(e), 400)
    
    @app.route('/api/v2/payroll/<payroll_id>/approve', methods=['POST'])
    def v2_approve_payroll(payroll_id):
        """V2: Approve a payroll record"""
        try:
            result = {
                'id': payroll_id,
                'status': 'approved',
                'approvedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Payroll approved successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PAYROLL_APPROVE_ERROR', 'Failed to approve payroll', str(e), 400)
    
    @app.route('/api/v2/payroll', methods=['GET'])
    def v2_get_all_payroll():
        """V2: Get all payroll records with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            payroll_records = []
            if mock_data and hasattr(mock_data, 'mock_payroll_records'):
                payroll_records = [convert_to_camel_case(rec) for rec in mock_data.mock_payroll_records]
            
            paginated = paginate_list(payroll_records, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('PAYROLL_FETCH_ERROR', 'Failed to fetch payroll records', str(e), 500)
    
    @app.route('/api/v2/payroll/<payroll_id>', methods=['GET'])
    def v2_get_payroll_by_id(payroll_id):
        """V2: Get payroll record by ID"""
        try:
            result = {
                'id': payroll_id,
                'employeeId': 'emp-001',
                'grossPay': 6250,
                'netPay': 5000,
                'status': 'approved'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PAYROLL_FETCH_ERROR', 'Failed to fetch payroll record', str(e), 500)
    
    @app.route('/api/v2/payroll/employee/<employee_id>', methods=['GET'])
    def v2_get_employee_payroll_history(employee_id):
        """V2: Get payroll history for an employee with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            history = [
                {
                    'id': 'pay-001',
                    'employeeId': employee_id,
                    'payPeriodStart': '2024-01-01',
                    'payPeriodEnd': '2024-01-31',
                    'netPay': 5000
                }
            ]
            
            paginated = paginate_list(history, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('PAYROLL_HISTORY_ERROR', 'Failed to fetch payroll history', str(e), 500)
    
    # ========================================
    # V2 ACCOUNTING ROUTES
    # ========================================
    
    @app.route('/api/v2/accounting/journal-entries', methods=['POST'])
    def v2_create_journal_entry():
        """V2: Create a journal entry"""
        try:
            data = request.get_json()
            entry = {
                'id': 'je-' + str(datetime.utcnow().timestamp()),
                'date': data.get('date'),
                'description': data.get('description'),
                'entries': data.get('entries', []),
                'totalDebit': data.get('totalDebit', 0),
                'totalCredit': data.get('totalCredit', 0),
                'status': 'posted'
            }
            return v2_success_response(entry, 201)
        except Exception as e:
            return v2_error_response('JOURNAL_ENTRY_ERROR', 'Failed to create journal entry', str(e), 400)
    
    @app.route('/api/v2/accounting/transactions', methods=['GET'])
    def v2_get_all_transactions():
        """V2: Get all accounting transactions with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            transactions = []
            if mock_data and hasattr(mock_data, 'mock_transactions'):
                transactions = [convert_to_camel_case(txn) for txn in mock_data.mock_transactions]
            
            paginated = paginate_list(transactions, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('TRANSACTIONS_FETCH_ERROR', 'Failed to fetch transactions', str(e), 500)
    
    @app.route('/api/v2/accounting/transactions/<transaction_id>', methods=['GET'])
    def v2_get_transaction_by_id(transaction_id):
        """V2: Get transaction by ID"""
        try:
            result = {
                'id': transaction_id,
                'date': '2024-01-15',
                'description': 'Sample transaction',
                'amount': 1000,
                'type': 'debit'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('TRANSACTION_FETCH_ERROR', 'Failed to fetch transaction', str(e), 500)
    
    @app.route('/api/v2/accounting/general-ledger', methods=['GET'])
    def v2_get_general_ledger():
        """V2: Get general ledger with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            accounts = [
                {'code': '1000', 'name': 'Cash', 'balance': 50000},
                {'code': '2000', 'name': 'Accounts Payable', 'balance': 25000}
            ]
            
            paginated = paginate_list(accounts, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('LEDGER_FETCH_ERROR', 'Failed to fetch general ledger', str(e), 500)
    
    @app.route('/api/v2/accounting/trial-balance', methods=['GET'])
    def v2_get_trial_balance():
        """V2: Get trial balance"""
        try:
            result = {
                'date': datetime.utcnow().isoformat() + 'Z',
                'totalDebits': 100000,
                'totalCredits': 100000,
                'balanced': True
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('TRIAL_BALANCE_ERROR', 'Failed to fetch trial balance', str(e), 500)
    
    # ========================================
    # V2 FINANCE ROUTES
    # ========================================
    
    @app.route('/api/v2/finance/budgets', methods=['POST'])
    def v2_create_budget():
        """V2: Create a new budget"""
        try:
            data = request.get_json()
            budget = {
                'id': 'budget-' + str(datetime.utcnow().timestamp()),
                'departmentId': data.get('departmentId'),
                'fiscalYear': data.get('fiscalYear'),
                'quarter': data.get('quarter'),
                'allocatedAmount': data.get('allocatedAmount'),
                'spentAmount': 0,
                'remainingAmount': data.get('allocatedAmount'),
                'status': 'active'
            }
            return v2_success_response(budget, 201)
        except Exception as e:
            return v2_error_response('BUDGET_CREATE_ERROR', 'Failed to create budget', str(e), 400)
    
    @app.route('/api/v2/finance/budgets', methods=['GET'])
    def v2_get_all_budgets():
        """V2: Get all budgets with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            budgets = []
            if mock_data and hasattr(mock_data, 'mock_budgets'):
                budgets = [convert_to_camel_case(b) for b in mock_data.mock_budgets]
            
            paginated = paginate_list(budgets, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('BUDGETS_FETCH_ERROR', 'Failed to fetch budgets', str(e), 500)
    
    @app.route('/api/v2/finance/budgets/<budget_id>', methods=['GET'])
    def v2_get_budget_by_id(budget_id):
        """V2: Get budget by ID"""
        try:
            result = {
                'id': budget_id,
                'departmentId': 'dept-001',
                'allocatedAmount': 100000,
                'spentAmount': 50000,
                'remainingAmount': 50000
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('BUDGET_FETCH_ERROR', 'Failed to fetch budget', str(e), 500)
    
    @app.route('/api/v2/finance/budgets/<budget_id>/close', methods=['POST'])
    def v2_close_budget(budget_id):
        """V2: Close a budget"""
        try:
            result = {
                'id': budget_id,
                'status': 'closed',
                'closedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Budget closed successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('BUDGET_CLOSE_ERROR', 'Failed to close budget', str(e), 400)
    
    @app.route('/api/v2/finance/budgets/<budget_id>/utilization', methods=['GET'])
    def v2_get_budget_utilization(budget_id):
        """V2: Get budget utilization"""
        try:
            result = {
                'budgetId': budget_id,
                'utilizationPercentage': 75,
                'allocatedAmount': 100000,
                'spentAmount': 75000,
                'remainingAmount': 25000
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('UTILIZATION_FETCH_ERROR', 'Failed to fetch budget utilization', str(e), 500)
    
    @app.route('/api/v2/finance/departments/<department_id>/budget-summary', methods=['GET'])
    def v2_get_department_budget_summary(department_id):
        """V2: Get department budget summary"""
        try:
            result = {
                'departmentId': department_id,
                'totalAllocated': 500000,
                'totalSpent': 350000,
                'totalRemaining': 150000,
                'utilizationPercentage': 70
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('BUDGET_SUMMARY_ERROR', 'Failed to fetch budget summary', str(e), 500)
    
    @app.route('/api/v2/finance/reports', methods=['GET'])
    def v2_generate_financial_report():
        """V2: Generate financial report"""
        try:
            report_type = request.args.get('type', 'summary')
            result = {
                'reportType': report_type,
                'generatedAt': datetime.utcnow().isoformat() + 'Z',
                'data': {
                    'revenue': 1000000,
                    'expenses': 750000,
                    'profit': 250000
                }
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('REPORT_GENERATE_ERROR', 'Failed to generate report', str(e), 500)
    
    # ========================================
    # V2 BILLING ROUTES
    # ========================================
    
    @app.route('/api/v2/billing/customers', methods=['POST'])
    def v2_create_customer():
        """V2: Create a new customer"""
        try:
            data = request.get_json()
            customer = {
                'id': 'cust-' + str(datetime.utcnow().timestamp()),
                'name': data.get('name'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'address': data.get('address'),
                'creditLimit': data.get('creditLimit', 50000),
                'currentBalance': 0,
                'status': 'active'
            }
            return v2_success_response(customer, 201)
        except Exception as e:
            return v2_error_response('CUSTOMER_CREATE_ERROR', 'Failed to create customer', str(e), 400)
    
    @app.route('/api/v2/billing/customers', methods=['GET'])
    def v2_get_all_customers():
        """V2: Get all customers with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            customers = []
            if mock_data and hasattr(mock_data, 'mock_customers'):
                customers = [convert_to_camel_case(c) for c in mock_data.mock_customers]
            
            paginated = paginate_list(customers, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('CUSTOMERS_FETCH_ERROR', 'Failed to fetch customers', str(e), 500)
    
    @app.route('/api/v2/billing/customers/<customer_id>', methods=['GET'])
    def v2_get_customer_by_id(customer_id):
        """V2: Get customer by ID"""
        try:
            result = {
                'id': customer_id,
                'name': 'Sample Customer',
                'email': 'customer@example.com',
                'currentBalance': 5000
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('CUSTOMER_FETCH_ERROR', 'Failed to fetch customer', str(e), 500)
    
    @app.route('/api/v2/billing/customers/<customer_id>/balance', methods=['GET'])
    def v2_get_customer_balance(customer_id):
        """V2: Get customer balance"""
        try:
            result = {
                'customerId': customer_id,
                'currentBalance': 5000,
                'creditLimit': 50000,
                'availableCredit': 45000
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('BALANCE_FETCH_ERROR', 'Failed to fetch customer balance', str(e), 500)
    
    @app.route('/api/v2/billing/invoices', methods=['POST'])
    def v2_create_invoice():
        """V2: Create a new invoice"""
        try:
            data = request.get_json()
            subtotal = data.get('subtotal', 0)
            tax_rate = 0.08
            tax_amount = subtotal * tax_rate
            total = subtotal + tax_amount
            
            invoice = {
                'id': 'inv-' + str(datetime.utcnow().timestamp()),
                'invoiceNumber': 'INV-' + str(int(datetime.utcnow().timestamp())),
                'customerId': data.get('customerId'),
                'issueDate': data.get('issueDate'),
                'dueDate': data.get('dueDate'),
                'subtotal': subtotal,
                'taxAmount': tax_amount,
                'totalAmount': total,
                'balanceDue': total,
                'status': 'draft',
                'items': data.get('items', [])
            }
            return v2_success_response(invoice, 201)
        except Exception as e:
            return v2_error_response('INVOICE_CREATE_ERROR', 'Failed to create invoice', str(e), 400)
    
    @app.route('/api/v2/billing/invoices', methods=['GET'])
    def v2_get_all_invoices():
        """V2: Get all invoices with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            invoices = []
            if mock_data and hasattr(mock_data, 'mock_invoices'):
                invoices = [convert_to_camel_case(inv) for inv in mock_data.mock_invoices]
            
            paginated = paginate_list(invoices, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('INVOICES_FETCH_ERROR', 'Failed to fetch invoices', str(e), 500)
    
    @app.route('/api/v2/billing/invoices/<invoice_id>', methods=['GET'])
    def v2_get_invoice_by_id(invoice_id):
        """V2: Get invoice by ID"""
        try:
            result = {
                'id': invoice_id,
                'invoiceNumber': 'INV-001',
                'customerId': 'cust-001',
                'totalAmount': 10000,
                'status': 'pending'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('INVOICE_FETCH_ERROR', 'Failed to fetch invoice', str(e), 500)
    
    @app.route('/api/v2/billing/invoices/<invoice_id>/send', methods=['POST'])
    def v2_send_invoice(invoice_id):
        """V2: Send invoice to customer"""
        try:
            result = {
                'id': invoice_id,
                'status': 'sent',
                'sentAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Invoice sent successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('INVOICE_SEND_ERROR', 'Failed to send invoice', str(e), 400)
    
    @app.route('/api/v2/billing/invoices/<invoice_id>/payments', methods=['POST'])
    def v2_record_payment(invoice_id):
        """V2: Record a payment for an invoice"""
        try:
            data = request.get_json()
            result = {
                'invoiceId': invoice_id,
                'paymentId': 'pmt-' + str(datetime.utcnow().timestamp()),
                'amount': data.get('amount'),
                'paymentDate': data.get('paymentDate'),
                'paymentMethod': data.get('paymentMethod'),
                'message': 'Payment recorded successfully'
            }
            return v2_success_response(result, 201)
        except Exception as e:
            return v2_error_response('PAYMENT_RECORD_ERROR', 'Failed to record payment', str(e), 400)
    
    @app.route('/api/v2/billing/invoices/<invoice_id>/cancel', methods=['POST'])
    def v2_cancel_invoice(invoice_id):
        """V2: Cancel an invoice"""
        try:
            result = {
                'id': invoice_id,
                'status': 'cancelled',
                'cancelledAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Invoice cancelled successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('INVOICE_CANCEL_ERROR', 'Failed to cancel invoice', str(e), 400)
    
    @app.route('/api/v2/billing/invoices/overdue', methods=['GET'])
    def v2_check_overdue_invoices():
        """V2: Check for overdue invoices with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            overdue_invoices = []
            result = {
                'overdueCount': 5,
                'totalOverdueAmount': 25000,
                'invoices': paginate_list(overdue_invoices, page, limit)
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('OVERDUE_CHECK_ERROR', 'Failed to check overdue invoices', str(e), 500)
    
    # ========================================
    # V2 PROCUREMENT ROUTES
    # ========================================
    
    @app.route('/api/v2/procurement/vendors', methods=['POST'])
    def v2_create_vendor():
        """V2: Create a new vendor"""
        try:
            data = request.get_json()
            vendor = {
                'id': 'vendor-' + str(datetime.utcnow().timestamp()),
                'name': data.get('name'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'address': data.get('address'),
                'paymentTerms': data.get('paymentTerms', 'Net 30'),
                'status': 'active'
            }
            return v2_success_response(vendor, 201)
        except Exception as e:
            return v2_error_response('VENDOR_CREATE_ERROR', 'Failed to create vendor', str(e), 400)
    
    @app.route('/api/v2/procurement/vendors', methods=['GET'])
    def v2_get_all_vendors():
        """V2: Get all vendors with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            vendors = []
            if mock_data and hasattr(mock_data, 'mock_vendors'):
                vendors = [convert_to_camel_case(v) for v in mock_data.mock_vendors]
            
            paginated = paginate_list(vendors, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('VENDORS_FETCH_ERROR', 'Failed to fetch vendors', str(e), 500)
    
    @app.route('/api/v2/procurement/vendors/<vendor_id>', methods=['GET'])
    def v2_get_vendor_by_id(vendor_id):
        """V2: Get vendor by ID"""
        try:
            result = {
                'id': vendor_id,
                'name': 'Sample Vendor',
                'email': 'vendor@example.com',
                'status': 'active'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('VENDOR_FETCH_ERROR', 'Failed to fetch vendor', str(e), 500)
    
    @app.route('/api/v2/procurement/vendors/<vendor_id>/performance', methods=['GET'])
    def v2_get_vendor_performance(vendor_id):
        """V2: Get vendor performance metrics"""
        try:
            result = {
                'vendorId': vendor_id,
                'onTimeDeliveryRate': 95,
                'qualityScore': 4.5,
                'totalOrders': 50,
                'totalSpent': 250000
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PERFORMANCE_FETCH_ERROR', 'Failed to fetch vendor performance', str(e), 500)
    
    @app.route('/api/v2/procurement/purchase-orders', methods=['POST'])
    def v2_create_purchase_order():
        """V2: Create a new purchase order"""
        try:
            data = request.get_json()
            po = {
                'id': 'po-' + str(datetime.utcnow().timestamp()),
                'poNumber': 'PO-' + str(int(datetime.utcnow().timestamp())),
                'vendorId': data.get('vendorId'),
                'orderDate': data.get('orderDate'),
                'expectedDeliveryDate': data.get('expectedDeliveryDate'),
                'items': data.get('items', []),
                'totalAmount': data.get('totalAmount', 0),
                'status': 'draft'
            }
            return v2_success_response(po, 201)
        except Exception as e:
            return v2_error_response('PO_CREATE_ERROR', 'Failed to create purchase order', str(e), 400)
    
    @app.route('/api/v2/procurement/purchase-orders', methods=['GET'])
    def v2_get_all_purchase_orders():
        """V2: Get all purchase orders with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            pos = []
            if mock_data and hasattr(mock_data, 'mock_purchase_orders'):
                pos = [convert_to_camel_case(po) for po in mock_data.mock_purchase_orders]
            
            paginated = paginate_list(pos, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('PO_FETCH_ERROR', 'Failed to fetch purchase orders', str(e), 500)
    
    @app.route('/api/v2/procurement/purchase-orders/<po_id>', methods=['GET'])
    def v2_get_purchase_order_by_id(po_id):
        """V2: Get purchase order by ID"""
        try:
            result = {
                'id': po_id,
                'poNumber': 'PO-001',
                'vendorId': 'vendor-001',
                'totalAmount': 10000,
                'status': 'pending'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PO_FETCH_ERROR', 'Failed to fetch purchase order', str(e), 500)
    
    @app.route('/api/v2/procurement/purchase-orders/<po_id>/approve', methods=['POST'])
    def v2_approve_purchase_order(po_id):
        """V2: Approve a purchase order"""
        try:
            result = {
                'id': po_id,
                'status': 'approved',
                'approvedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Purchase order approved successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PO_APPROVE_ERROR', 'Failed to approve purchase order', str(e), 400)
    
    @app.route('/api/v2/procurement/purchase-orders/<po_id>/place', methods=['POST'])
    def v2_place_purchase_order(po_id):
        """V2: Place a purchase order with vendor"""
        try:
            result = {
                'id': po_id,
                'status': 'placed',
                'placedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Purchase order placed with vendor'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PO_PLACE_ERROR', 'Failed to place purchase order', str(e), 400)
    
    @app.route('/api/v2/procurement/purchase-orders/<po_id>/receive', methods=['POST'])
    def v2_receive_purchase_order(po_id):
        """V2: Mark purchase order as received"""
        try:
            result = {
                'id': po_id,
                'status': 'received',
                'receivedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Purchase order received'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PO_RECEIVE_ERROR', 'Failed to receive purchase order', str(e), 400)
    
    @app.route('/api/v2/procurement/purchase-orders/<po_id>/cancel', methods=['POST'])
    def v2_cancel_purchase_order(po_id):
        """V2: Cancel a purchase order"""
        try:
            result = {
                'id': po_id,
                'status': 'cancelled',
                'cancelledAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Purchase order cancelled'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('PO_CANCEL_ERROR', 'Failed to cancel purchase order', str(e), 400)
    
    # ========================================
    # V2 SUPPLY CHAIN ROUTES
    # ========================================
    
    @app.route('/api/v2/supply-chain/shipments', methods=['POST'])
    def v2_create_shipment():
        """V2: Create a new shipment"""
        try:
            # Check if request has JSON content type
            if not request.is_json:
                return v2_error_response(
                    'INVALID_CONTENT_TYPE',
                    'Request must have Content-Type: application/json',
                    None,
                    400
                )

            # Get JSON data
            data = request.get_json()

            # Check if JSON data was provided
            if data is None:
                return v2_error_response(
                    'MISSING_JSON_DATA',
                    'Request body must contain valid JSON data',
                    None,
                    400
                )

            # Create shipment with provided data
            shipment = {
                'id': 'ship-' + str(datetime.utcnow().timestamp()),
                'trackingNumber': 'TRK-' + str(int(datetime.utcnow().timestamp())),
                'orderId': data.get('orderId'),
                'carrier': data.get('carrier'),
                'origin': data.get('origin'),
                'destination': data.get('destination'),
                'shipDate': data.get('shipDate'),
                'estimatedDelivery': data.get('estimatedDelivery'),
                'status': 'pending'
            }

            # Store the created shipment in the in-memory list
            created_shipments.append(shipment)
            return v2_success_response(shipment, 201)

        except Exception as e:
            return v2_error_response('SHIPMENT_CREATE_ERROR', 'Failed to create shipment', str(e), 400)
    
    @app.route('/api/v2/supply-chain/shipments', methods=['GET'])
    def v2_get_all_shipments():
        """V2: Get all shipments with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))

            # Return shipments from the in-memory storage
            paginated = paginate_list(created_shipments, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('SHIPMENTS_FETCH_ERROR', 'Failed to fetch shipments', str(e), 500)
    
    @app.route('/api/v2/supply-chain/shipments/<shipment_id>', methods=['GET'])
    def v2_get_shipment_by_id(shipment_id):
        """V2: Get shipment by ID"""
        try:
            result = {
                'id': shipment_id,
                'trackingNumber': 'TRK-001',
                'status': 'in_transit',
                'estimatedDelivery': '2024-02-01'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('SHIPMENT_FETCH_ERROR', 'Failed to fetch shipment', str(e), 500)

    @app.route('/api/v2/supply-chain/shipments/<shipment_id>', methods=['PUT'])
    def v2_update_shipment(shipment_id):
        """V2: Update a shipment by ID"""
        try:
            # Check if request has JSON content type
            if not request.is_json:
                return v2_error_response(
                    'INVALID_CONTENT_TYPE',
                    'Request must have Content-Type: application/json',
                    None,
                    400
                )

            # Get JSON data
            data = request.get_json()

            # Check if JSON data was provided
            if data is None:
                return v2_error_response(
                    'MISSING_JSON_DATA',
                    'Request body must contain valid JSON data',
                    None,
                    400
                )

            # Find the shipment in created_shipments list
            shipment = None
            shipment_index = None
            for idx, ship in enumerate(created_shipments):
                if ship['id'] == shipment_id:
                    shipment = ship
                    shipment_index = idx
                    break

            # Return 404 if shipment not found
            if not shipment:
                return v2_error_response(
                    'SHIPMENT_NOT_FOUND',
                    f'Shipment with ID {shipment_id} not found',
                    None,
                    404
                )

            # Validate required fields if provided
            if 'carrier' in data and not data['carrier']:
                return v2_error_response(
                    'VALIDATION_ERROR',
                    'Carrier cannot be empty',
                    None,
                    400
                )

            if 'trackingNumber' in data and not data['trackingNumber']:
                return v2_error_response(
                    'VALIDATION_ERROR',
                    'Tracking number cannot be empty',
                    None,
                    400
                )

            if 'status' in data:
                valid_statuses = ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']
                if data['status'] not in valid_statuses:
                    return v2_error_response(
                        'VALIDATION_ERROR',
                        f'Invalid status. Must be one of: {", ".join(valid_statuses)}',
                        None,
                        400
                    )

            # Update the shipment with provided data
            if 'carrier' in data:
                shipment['carrier'] = data['carrier']
            if 'trackingNumber' in data:
                shipment['trackingNumber'] = data['trackingNumber']
            if 'status' in data:
                shipment['status'] = data['status']
            if 'estimatedDeliveryDate' in data:
                shipment['estimatedDelivery'] = data['estimatedDeliveryDate']

            # Update the timestamp
            shipment['updatedAt'] = datetime.utcnow().isoformat() + 'Z'

            # Update the shipment in the list
            created_shipments[shipment_index] = shipment

            # Return the updated shipment
            return v2_success_response(shipment)

        except Exception as e:
            return v2_error_response('SHIPMENT_UPDATE_ERROR', 'Failed to update shipment', str(e), 500)

    @app.route('/api/v2/supply-chain/shipments/<shipment_id>', methods=['PATCH'])
    def v2_patch_shipment(shipment_id):
        """V2: Partially update shipment"""
        try:
            data = request.get_json()

            if not data:
                return v2_error_response('INVALID_DATA', 'No data provided for update', None, 400)

            # Find the shipment in created_shipments list
            shipment = None
            for ship in created_shipments:
                if ship['id'] == shipment_id:
                    shipment = ship
                    break

            if not shipment:
                return v2_error_response('SHIPMENT_NOT_FOUND', 'Shipment not found', None, 404)

            # Update only the provided fields (partial update)
            updateable_fields = ['status', 'trackingNumber', 'orderId', 'items', 'origin', 'destination', 'estimatedDelivery', 'location']
            updated_fields = []

            for field in updateable_fields:
                if field in data:
                    shipment[field] = data[field]
                    updated_fields.append(field)

            # Update the timestamp
            shipment['updatedAt'] = datetime.utcnow().isoformat() + 'Z'

            # Return the updated shipment
            result = shipment.copy()
            result['updatedFields'] = updated_fields

            return v2_success_response(result)

        except Exception as e:
            return v2_error_response('SHIPMENT_UPDATE_ERROR', 'Failed to update shipment', str(e), 500)

    @app.route('/api/v2/supply-chain/shipments/tracking/<tracking_number>', methods=['GET'])
    def v2_get_shipment_by_tracking(tracking_number):
        """V2: Get shipment by tracking number"""
        try:
            result = {
                'trackingNumber': tracking_number,
                'status': 'in_transit',
                'currentLocation': 'Distribution Center',
                'estimatedDelivery': '2024-02-01'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('TRACKING_FETCH_ERROR', 'Failed to fetch tracking info', str(e), 500)
    
    @app.route('/api/v2/supply-chain/shipments/order/<order_id>', methods=['GET'])
    def v2_get_shipments_by_order(order_id):
        """V2: Get shipments for an order with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            shipments = [
                {
                    'id': 'ship-001',
                    'orderId': order_id,
                    'trackingNumber': 'TRK-001',
                    'status': 'delivered'
                }
            ]
            
            paginated = paginate_list(shipments, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('ORDER_SHIPMENTS_ERROR', 'Failed to fetch order shipments', str(e), 500)
    
    @app.route('/api/v2/supply-chain/shipments/<shipment_id>/dispatch', methods=['POST'])
    def v2_dispatch_shipment(shipment_id):
        """V2: Dispatch a shipment"""
        try:
            result = {
                'id': shipment_id,
                'status': 'dispatched',
                'dispatchedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Shipment dispatched successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('SHIPMENT_DISPATCH_ERROR', 'Failed to dispatch shipment', str(e), 400)
    
    @app.route('/api/v2/supply-chain/shipments/<shipment_id>/status', methods=['PUT'])
    def v2_update_shipment_status(shipment_id):
        """V2: Update shipment status"""
        try:
            data = request.get_json()
            result = {
                'id': shipment_id,
                'status': data.get('status'),
                'location': data.get('location'),
                'updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('STATUS_UPDATE_ERROR', 'Failed to update shipment status', str(e), 400)
    
    @app.route('/api/v2/supply-chain/shipments/<shipment_id>/deliver', methods=['POST'])
    def v2_mark_delivered(shipment_id):
        """V2: Mark shipment as delivered"""
        try:
            result = {
                'id': shipment_id,
                'status': 'delivered',
                'deliveredAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Shipment marked as delivered'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('DELIVERY_ERROR', 'Failed to mark shipment as delivered', str(e), 400)
    
    @app.route('/api/v2/supply-chain/shipments/<shipment_id>/cancel', methods=['POST'])
    def v2_cancel_shipment(shipment_id):
        """V2: Cancel a shipment"""
        try:
            result = {
                'id': shipment_id,
                'status': 'cancelled',
                'cancelledAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Shipment cancelled'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('SHIPMENT_CANCEL_ERROR', 'Failed to cancel shipment', str(e), 400)
    
    @app.route('/api/v2/supply-chain/carriers/performance', methods=['GET'])
    def v2_get_carrier_performance():
        """V2: Get carrier performance metrics with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            carriers = [
                {'name': 'FedEx', 'onTimeRate': 95, 'avgDeliveryTime': 2.5},
                {'name': 'UPS', 'onTimeRate': 93, 'avgDeliveryTime': 2.8}
            ]
            
            paginated = paginate_list(carriers, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('CARRIER_PERFORMANCE_ERROR', 'Failed to fetch carrier performance', str(e), 500)
    
    @app.route('/api/v2/supply-chain/inbound/summary', methods=['GET'])
    def v2_get_inbound_summary():
        """V2: Get inbound shipment summary"""
        try:
            result = {
                'totalInbound': 25,
                'inTransit': 15,
                'arrived': 10,
                'expectedToday': 5
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('INBOUND_SUMMARY_ERROR', 'Failed to fetch inbound summary', str(e), 500)
    
    @app.route('/api/v2/supply-chain/outbound/summary', methods=['GET'])
    def v2_get_outbound_summary():
        """V2: Get outbound shipment summary"""
        try:
            result = {
                'totalOutbound': 30,
                'pending': 5,
                'dispatched': 20,
                'delivered': 5
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('OUTBOUND_SUMMARY_ERROR', 'Failed to fetch outbound summary', str(e), 500)
    
    # ========================================
    # V2 INVENTORY ROUTES
    # ========================================
    
    @app.route('/api/v2/inventory/items', methods=['POST'])
    def v2_create_inventory_item():
        """V2: Create a new inventory item"""
        try:
            data = request.get_json()
            item = {
                'id': 'item-' + str(datetime.utcnow().timestamp()),
                'sku': data.get('sku'),
                'name': data.get('name'),
                'description': data.get('description'),
                'category': data.get('category'),
                'unitPrice': data.get('unitPrice'),
                'quantityOnHand': data.get('quantityOnHand', 0),
                'reorderPoint': data.get('reorderPoint', 10),
                'reorderQuantity': data.get('reorderQuantity', 50)
            }
            return v2_success_response(item, 201)
        except Exception as e:
            return v2_error_response('ITEM_CREATE_ERROR', 'Failed to create inventory item', str(e), 400)
    
    @app.route('/api/v2/inventory/items', methods=['GET'])
    def v2_get_all_inventory_items():
        """V2: Get all inventory items with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            items = []
            if mock_data and hasattr(mock_data, 'mock_inventory_items'):
                items = [convert_to_camel_case(item) for item in mock_data.mock_inventory_items]
            
            paginated = paginate_list(items, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('ITEMS_FETCH_ERROR', 'Failed to fetch inventory items', str(e), 500)
    
    @app.route('/api/v2/inventory/items/<item_id>', methods=['GET'])
    def v2_get_inventory_item_by_id(item_id):
        """V2: Get inventory item by ID"""
        try:
            result = {
                'id': item_id,
                'sku': 'SKU-001',
                'name': 'Sample Item',
                'quantityOnHand': 100,
                'unitPrice': 25.00
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('ITEM_FETCH_ERROR', 'Failed to fetch inventory item', str(e), 500)
    
    @app.route('/api/v2/inventory/items/sku/<sku>', methods=['GET'])
    def v2_get_inventory_item_by_sku(sku):
        """V2: Get inventory item by SKU"""
        try:
            result = {
                'sku': sku,
                'name': 'Sample Item',
                'quantityOnHand': 100,
                'unitPrice': 25.00
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('ITEM_FETCH_ERROR', 'Failed to fetch inventory item by SKU', str(e), 500)
    
    @app.route('/api/v2/inventory/items/<item_id>', methods=['PUT'])
    def v2_update_inventory_item(item_id):
        """V2: Update inventory item"""
        try:
            data = request.get_json()
            result = {
                'id': item_id,
                'name': data.get('name'),
                'unitPrice': data.get('unitPrice'),
                'reorderPoint': data.get('reorderPoint'),
                'message': 'Inventory item updated successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('ITEM_UPDATE_ERROR', 'Failed to update inventory item', str(e), 400)
    
    @app.route('/api/v2/inventory/stock/adjust', methods=['POST'])
    def v2_adjust_stock():
        """V2: Adjust stock quantity"""
        try:
            data = request.get_json()
            result = {
                'itemId': data.get('itemId'),
                'adjustmentType': data.get('adjustmentType'),
                'quantity': data.get('quantity'),
                'newQuantity': data.get('newQuantity', 0),
                'reason': data.get('reason'),
                'adjustedAt': datetime.utcnow().isoformat() + 'Z'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('STOCK_ADJUST_ERROR', 'Failed to adjust stock', str(e), 400)
    
    @app.route('/api/v2/inventory/stock/reserve', methods=['POST'])
    def v2_reserve_stock():
        """V2: Reserve stock for an order"""
        try:
            data = request.get_json()
            result = {
                'reservationId': 'res-' + str(datetime.utcnow().timestamp()),
                'itemId': data.get('itemId'),
                'quantity': data.get('quantity'),
                'orderId': data.get('orderId'),
                'reservedAt': datetime.utcnow().isoformat() + 'Z'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('STOCK_RESERVE_ERROR', 'Failed to reserve stock', str(e), 400)
    
    @app.route('/api/v2/inventory/stock/release', methods=['POST'])
    def v2_release_reserved_stock():
        """V2: Release reserved stock"""
        try:
            data = request.get_json()
            result = {
                'reservationId': data.get('reservationId'),
                'itemId': data.get('itemId'),
                'quantity': data.get('quantity'),
                'releasedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Stock reservation released'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('STOCK_RELEASE_ERROR', 'Failed to release stock', str(e), 400)
    
    @app.route('/api/v2/inventory/stock/fulfill', methods=['POST'])
    def v2_fulfill_reservation():
        """V2: Fulfill a stock reservation"""
        try:
            data = request.get_json()
            result = {
                'reservationId': data.get('reservationId'),
                'itemId': data.get('itemId'),
                'quantity': data.get('quantity'),
                'fulfilledAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Reservation fulfilled'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('FULFILL_ERROR', 'Failed to fulfill reservation', str(e), 400)
    
    @app.route('/api/v2/inventory/stock/receive', methods=['POST'])
    def v2_receive_stock():
        """V2: Receive stock from purchase order"""
        try:
            data = request.get_json()
            result = {
                'itemId': data.get('itemId'),
                'quantity': data.get('quantity'),
                'purchaseOrderId': data.get('purchaseOrderId'),
                'receivedAt': datetime.utcnow().isoformat() + 'Z',
                'message': 'Stock received successfully'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('STOCK_RECEIVE_ERROR', 'Failed to receive stock', str(e), 400)
    
    @app.route('/api/v2/inventory/low-stock', methods=['GET'])
    def v2_get_low_stock_items():
        """V2: Get items with low stock with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            low_stock_items = [
                {'id': 'item-001', 'sku': 'SKU-001', 'quantityOnHand': 5, 'reorderPoint': 10}
            ]
            
            result = {
                'lowStockCount': 5,
                'items': paginate_list(low_stock_items, page, limit)
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('LOW_STOCK_ERROR', 'Failed to fetch low stock items', str(e), 500)
    
    @app.route('/api/v2/inventory/valuation', methods=['GET'])
    def v2_get_inventory_valuation():
        """V2: Get total inventory valuation"""
        try:
            result = {
                'totalValue': 250000,
                'totalItems': 450,
                'averageValue': 555.56,
                'valuationDate': datetime.utcnow().isoformat() + 'Z'
            }
            return v2_success_response(result)
        except Exception as e:
            return v2_error_response('VALUATION_ERROR', 'Failed to fetch inventory valuation', str(e), 500)
    
    @app.route('/api/v2/inventory/categories', methods=['GET'])
    def v2_get_category_breakdown():
        """V2: Get inventory breakdown by category with pagination"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            
            categories = [
                {'name': 'Electronics', 'itemCount': 150, 'totalValue': 100000},
                {'name': 'Office Supplies', 'itemCount': 200, 'totalValue': 50000}
            ]
            
            paginated = paginate_list(categories, page, limit)
            return v2_success_response(paginated)
        except Exception as e:
            return v2_error_response('CATEGORIES_ERROR', 'Failed to fetch category breakdown', str(e), 500)
    
    # ========================================
    # END OF V2 API ROUTES
    # ========================================

    # Mount all module routes - ALL IN ONE APPLICATION
    # Using Flask blueprints for modular route organization
    if hr_routes:
        app.register_blueprint(hr_routes.bp, url_prefix='/api/hr')
    
    if payroll_routes:
        app.register_blueprint(payroll_routes.bp, url_prefix='/api/payroll')
    
    if accounting_routes:
        app.register_blueprint(accounting_routes.bp, url_prefix='/api/accounting')
    
    if finance_routes:
        app.register_blueprint(finance_routes.bp, url_prefix='/api/finance')
    
    if billing_routes:
        app.register_blueprint(billing_routes.bp, url_prefix='/api/billing')
    
    if procurement_routes:
        app.register_blueprint(procurement_routes.bp, url_prefix='/api/procurement')
    
    if supply_chain_routes:
        app.register_blueprint(supply_chain_routes.bp, url_prefix='/api/supply-chain')
    
    if inventory_routes:
        app.register_blueprint(inventory_routes.bp, url_prefix='/api/inventory')
    
    # 404 handler
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'error': 'Endpoint not found',
            'path': request.path,
            'method': request.method
        }), 404
    
    # Global error handler (shared across all modules)
    @app.errorhandler(Exception)
    def handle_error(error):
        """Global error handler for all unhandled exceptions"""
        logger.error(f"Unhandled error: {str(error)}", exc_info=True)
        
        # Check if it's an HTTP exception
        if hasattr(error, 'code'):
            return jsonify({
                'error': str(error),
                'message': getattr(error, 'description', 'An error occurred')
            }), error.code
        
        # Generic 500 error for unexpected exceptions
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(error)
        }), 500
    
    return app


# Application entry point
if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=3001,
        debug=True
    )
