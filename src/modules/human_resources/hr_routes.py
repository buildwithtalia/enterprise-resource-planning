"""
Human Resources module routes
Handles employee and department management endpoints
"""

from flask import Blueprint, jsonify, request
from datetime import datetime

# Create Blueprint for HR routes
bp = Blueprint('hr', __name__)

# Mock data for demonstration
mock_employees = [
    {
        "id": 1,
        "employee_id": "EMP001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@company.com",
        "department": "Engineering",
        "position": "Senior Software Engineer",
        "hire_date": "2022-01-15",
        "salary": 95000,
        "status": "active"
    },
    {
        "id": 2,
        "employee_id": "EMP002",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@company.com",
        "department": "Marketing",
        "position": "Marketing Manager",
        "hire_date": "2021-03-10",
        "salary": 75000,
        "status": "active"
    },
    {
        "id": 3,
        "employee_id": "EMP003",
        "first_name": "Mike",
        "last_name": "Johnson",
        "email": "mike.johnson@company.com",
        "department": "Finance",
        "position": "Financial Analyst",
        "hire_date": "2023-06-01",
        "salary": 65000,
        "status": "active"
    }
]

mock_departments = [
    {
        "id": 1,
        "name": "Engineering",
        "description": "Software development and technical operations",
        "manager_id": 1,
        "employee_count": 15
    },
    {
        "id": 2,
        "name": "Marketing",
        "description": "Brand management and customer acquisition",
        "manager_id": 2,
        "employee_count": 8
    },
    {
        "id": 3,
        "name": "Finance",
        "description": "Financial planning and accounting",
        "manager_id": 3,
        "employee_count": 5
    }
]

@bp.route('/employees', methods=['GET'])
def get_employees():
    """Get all employees"""
    return jsonify({
        "success": True,
        "data": mock_employees,
        "total": len(mock_employees),
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })

@bp.route('/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    """Get employee by ID"""
    employee = next((emp for emp in mock_employees if emp['id'] == employee_id), None)

    if not employee:
        return jsonify({
            "success": False,
            "error": "Employee not found",
            "employee_id": employee_id
        }), 404

    return jsonify({
        "success": True,
        "data": employee,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })

@bp.route('/employees', methods=['POST'])
def create_employee():
    """Create a new employee"""
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No data provided"
        }), 400

    # Generate new ID
    new_id = max([emp['id'] for emp in mock_employees], default=0) + 1

    new_employee = {
        "id": new_id,
        "employee_id": data.get('employee_id', f"EMP{new_id:03d}"),
        "first_name": data.get('first_name'),
        "last_name": data.get('last_name'),
        "email": data.get('email'),
        "department": data.get('department'),
        "position": data.get('position'),
        "hire_date": data.get('hire_date', datetime.now().strftime('%Y-%m-%d')),
        "salary": data.get('salary'),
        "status": data.get('status', 'active')
    }

    mock_employees.append(new_employee)

    return jsonify({
        "success": True,
        "data": new_employee,
        "message": "Employee created successfully",
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }), 201

@bp.route('/departments', methods=['GET'])
def get_departments():
    """Get all departments"""
    return jsonify({
        "success": True,
        "data": mock_departments,
        "total": len(mock_departments),
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })

@bp.route('/departments/<int:department_id>', methods=['GET'])
def get_department(department_id):
    """Get department by ID"""
    department = next((dept for dept in mock_departments if dept['id'] == department_id), None)

    if not department:
        return jsonify({
            "success": False,
            "error": "Department not found",
            "department_id": department_id
        }), 404

    return jsonify({
        "success": True,
        "data": department,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })

@bp.route('/departments/<int:department_id>/employees', methods=['GET'])
def get_department_employees(department_id):
    """Get all employees in a specific department"""
    department = next((dept for dept in mock_departments if dept['id'] == department_id), None)

    if not department:
        return jsonify({
            "success": False,
            "error": "Department not found",
            "department_id": department_id
        }), 404

    department_employees = [emp for emp in mock_employees if emp['department'] == department['name']]

    return jsonify({
        "success": True,
        "data": department_employees,
        "department": department['name'],
        "total": len(department_employees),
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })

@bp.route('/stats', methods=['GET'])
def get_hr_stats():
    """Get HR statistics"""
    active_employees = len([emp for emp in mock_employees if emp['status'] == 'active'])

    return jsonify({
        "success": True,
        "data": {
            "total_employees": len(mock_employees),
            "active_employees": active_employees,
            "total_departments": len(mock_departments),
            "average_salary": sum([emp['salary'] for emp in mock_employees]) / len(mock_employees) if mock_employees else 0
        },
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    })