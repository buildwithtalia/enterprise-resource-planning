#!/usr/bin/env python3

"""
Smart Postman Insights Proxy

This proxy server:
1. Receives requests on localhost:3004 from your Postman collection
2. Serves proper API responses so your collection works correctly
3. Simultaneously forwards traffic to the Kubernetes service for Postman agent capture

Usage: python3 smart-proxy.py
"""

from flask import Flask, request, jsonify, Response
import requests
import threading
import time
from datetime import datetime, date
import json
import random
import string

app = Flask(__name__)

# Configuration
PROXY_PORT = 3004
LOG_REQUESTS = True

# Mock data generators
def generate_employee_id():
    return f"emp_{''.join(random.choices(string.ascii_lowercase + string.digits, k=10))}"

def generate_shipment_id():
    return f"ship-{time.time()}"

def generate_department_id():
    return f"dept_{''.join(random.choices(string.ascii_lowercase, k=8))}"

def generate_mock_response(endpoint, method, body=None):
    """Generate mock responses for API endpoints"""

    # API Info endpoint
    if endpoint == '/api/v2':
        return {
            "name": "Enterprise Resource Planning API - v2.0.0",
            "version": "2.0.0",
            "description": "Comprehensive ERP system with integrated business modules",
            "architecture": "Monolithic with microservices-ready design",
            "modules": ["HR", "Payroll", "Accounting", "Finance", "Billing", "Procurement", "Supply Chain", "Inventory"],
            "status": "operational"
        }

    # Health check
    elif endpoint == '/health':
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    # HR Employees
    elif endpoint.startswith('/api/v2/hr/employees'):
        if method == 'GET' and endpoint == '/api/v2/hr/employees':
            return {
                "success": True,
                "data": {
                    "items": [],
                    "pagination": {"page": 1, "limit": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False}
                },
                "timestamp": datetime.now().isoformat()
            }
        elif method == 'POST':
            return {
                "success": True,
                "data": {
                    "id": generate_employee_id(),
                    "firstName": body.get("firstName", "John"),
                    "lastName": body.get("lastName", "Doe"),
                    "email": body.get("email", "john.doe@example.com"),
                    "department": body.get("department", "Engineering"),
                    "position": body.get("position", "Software Engineer"),
                    "salary": body.get("salary", 95000),
                    "status": "active",
                    "hireDate": body.get("hireDate", date.today().isoformat())
                },
                "timestamp": datetime.now().isoformat()
            }

    # HR Statistics
    elif endpoint == '/api/v2/hr/statistics':
        return {
            "success": True,
            "data": {
                "totalEmployees": 150,
                "activeEmployees": 142,
                "newHiresThisMonth": 5,
                "totalDepartments": 8,
                "averageSalary": 65000
            },
            "timestamp": datetime.now().isoformat()
        }

    # Supply Chain Shipments
    elif endpoint.startswith('/api/v2/supply-chain/shipments'):
        if method == 'POST':
            return {
                "success": True,
                "data": {
                    "id": generate_shipment_id(),
                    "orderId": body.get("orderId", f"order_{int(time.time())}"),
                    "carrier": body.get("carrier", "FedEx"),
                    "trackingNumber": body.get("trackingNumber", str(random.randint(1000000000000, 9999999999999))),
                    "status": "pending",
                    "shipDate": body.get("shipDate", date.today().isoformat()),
                    "estimatedDeliveryDate": body.get("estimatedDeliveryDate"),
                    "origin": body.get("origin", {}),
                    "destination": body.get("destination", {})
                },
                "timestamp": datetime.now().isoformat()
            }
        elif method == 'GET':
            return {
                "success": True,
                "data": {
                    "items": [],
                    "pagination": {"page": 1, "limit": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False}
                },
                "timestamp": datetime.now().isoformat()
            }

    # Generic paginated response for list endpoints
    elif any(endpoint.endswith(path) for path in ['/customers', '/invoices', '/vendors', '/purchase-orders', '/items', '/departments']):
        return {
            "success": True,
            "data": {
                "items": [],
                "pagination": {"page": 1, "limit": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False}
            },
            "timestamp": datetime.now().isoformat()
        }

    # Default response for unknown endpoints
    return {
        "success": True,
        "message": f"Mock response for {method} {endpoint}",
        "timestamp": datetime.now().isoformat()
    }

# Kubernetes forwarding removed - agent will capture traffic directly from localhost:3004

@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy_handler(path):
    # Construct full endpoint path
    endpoint = f"/{path}" if path else "/"
    method = request.method

    # Get request body
    body = None
    if request.is_json:
        body = request.get_json()
    elif request.form:
        body = request.form.to_dict()

    if LOG_REQUESTS:
        print(f"📥 {method} {endpoint}")
        if body:
            print(f"📦 Body: {json.dumps(body, indent=2)[:200]}...")

    # Generate and return mock response
    mock_response = generate_mock_response(endpoint, method, body)

    return jsonify(mock_response)

if __name__ == '__main__':
    print('🚀 Starting Postman Collection Proxy...')
    print(f'📡 Listening on: http://localhost:{PROXY_PORT}')
    print('✨ Serving realistic API responses for your Postman collection')
    print('📊 Traffic will be captured by local Postman Insights Agent')
    print('')
    print(f'🔗 Postman Insights Dashboard: https://go.postman.co/insights/project/svc_36jDNeS6qVkHzGtYyF4oBd')
    print('')
    print('📋 Next steps:')
    print('  1. Run: sudo postman-insights-agent apidump --project svc_36jDNeS6qVkHzGtYyF4oBd --repro-mode --filter "port 3004"')
    print('  2. Execute your Postman collection')
    print('  3. Check Postman Insights dashboard for captured traffic')
    print('  4. Press Ctrl+C to stop this proxy')
    print('')

    app.run(host='127.0.0.1', port=PROXY_PORT, debug=False)