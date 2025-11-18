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
