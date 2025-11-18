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
