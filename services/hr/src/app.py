"""Human Resources microservice."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, jsonify, request
from shared.health import make_health_blueprint
from shared.responses import success, error

# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------
_employees = [
    {"id": "emp-001", "firstName": "Alice", "lastName": "Johnson",
     "email": "alice.johnson@company.com", "departmentId": "dept-001",
     "position": "Senior Software Engineer", "salary": 95000,
     "hireDate": "2022-01-15", "status": "active"},
    {"id": "emp-002", "firstName": "Bob", "lastName": "Smith",
     "email": "bob.smith@company.com", "departmentId": "dept-002",
     "position": "Marketing Manager", "salary": 75000,
     "hireDate": "2021-03-10", "status": "active"},
    {"id": "emp-003", "firstName": "Carol", "lastName": "Davis",
     "email": "carol.davis@company.com", "departmentId": "dept-003",
     "position": "Financial Analyst", "salary": 65000,
     "hireDate": "2023-06-01", "status": "active"},
]

_departments = [
    {"id": "dept-001", "name": "Engineering",
     "description": "Software development", "managerId": "emp-001",
     "budget": 500000, "location": "HQ"},
    {"id": "dept-002", "name": "Marketing",
     "description": "Brand and customer acquisition", "managerId": "emp-002",
     "budget": 200000, "location": "HQ"},
    {"id": "dept-003", "name": "Finance",
     "description": "Financial planning", "managerId": "emp-003",
     "budget": 150000, "location": "HQ"},
]


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("hr-service"))

    # ------------------------------------------------------------------ #
    # Employees
    # ------------------------------------------------------------------ #
    @app.post("/api/hr/employees")
    def create_employee():
        data = request.get_json() or {}
        emp = {
            "id": f"emp-{datetime.utcnow().timestamp()}",
            "firstName": data.get("firstName"),
            "lastName": data.get("lastName"),
            "email": data.get("email"),
            "departmentId": data.get("departmentId"),
            "position": data.get("position"),
            "salary": data.get("salary"),
            "hireDate": data.get("hireDate"),
            "status": "active",
        }
        _employees.append(emp)
        return success(emp, 201)

    @app.get("/api/hr/employees")
    def get_all_employees():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_employees, page, limit))

    @app.get("/api/hr/employees/<employee_id>")
    def get_employee(employee_id):
        emp = next((e for e in _employees if e["id"] == employee_id), None)
        if not emp:
            return error("EMPLOYEE_NOT_FOUND", f"Employee {employee_id} not found", status_code=404)
        return success(emp)

    @app.put("/api/hr/employees/<employee_id>")
    def update_employee(employee_id):
        data = request.get_json() or {}
        emp = next((e for e in _employees if e["id"] == employee_id), None)
        if not emp:
            return error("EMPLOYEE_NOT_FOUND", f"Employee {employee_id} not found", status_code=404)
        emp.update({k: v for k, v in data.items() if k != "id"})
        return success(emp)

    @app.delete("/api/hr/employees/<employee_id>")
    def delete_employee(employee_id):
        global _employees
        _employees = [e for e in _employees if e["id"] != employee_id]
        return "", 204

    @app.patch("/api/hr/employees/<employee_id>/promote")
    def promote_employee(employee_id):
        data = request.get_json() or {}
        return success({
            "id": employee_id,
            "newPosition": data.get("newPosition"),
            "newSalary": data.get("newSalary"),
            "effectiveDate": data.get("effectiveDate"),
            "message": "Employee promoted successfully",
        })

    @app.post("/api/hr/employees/<employee_id>/terminate")
    def terminate_employee(employee_id):
        data = request.get_json() or {}
        return success({
            "id": employee_id,
            "terminationDate": data.get("terminationDate"),
            "reason": data.get("reason"),
            "status": "terminated",
            "message": "Employee terminated successfully",
        })

    # ------------------------------------------------------------------ #
    # Departments
    # ------------------------------------------------------------------ #
    @app.post("/api/hr/departments")
    def create_department():
        data = request.get_json() or {}
        dept = {
            "id": f"dept-{datetime.utcnow().timestamp()}",
            "name": data.get("name"),
            "description": data.get("description"),
            "managerId": data.get("managerId"),
            "budget": data.get("budget"),
            "location": data.get("location"),
        }
        _departments.append(dept)
        return success(dept, 201)

    @app.get("/api/hr/departments")
    def get_all_departments():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_departments, page, limit))

    @app.get("/api/hr/departments/<department_id>")
    def get_department(department_id):
        dept = next((d for d in _departments if d["id"] == department_id), None)
        if not dept:
            return error("DEPARTMENT_NOT_FOUND", f"Department {department_id} not found", status_code=404)
        return success(dept)

    # ------------------------------------------------------------------ #
    # Statistics
    # ------------------------------------------------------------------ #
    @app.get("/api/hr/statistics")
    def hr_statistics():
        active = [e for e in _employees if e.get("status") == "active"]
        avg_salary = (
            sum(e["salary"] for e in _employees) / len(_employees)
            if _employees else 0
        )
        return success({
            "totalEmployees": len(_employees),
            "activeEmployees": len(active),
            "totalDepartments": len(_departments),
            "averageSalary": round(avg_salary, 2),
            "newHiresThisMonth": 5,
        })

    @app.errorhandler(404)
    def not_found(_):
        return error("NOT_FOUND", "Endpoint not found", status_code=404)

    return app


def _paginate(items, page, limit):
    total = len(items)
    total_pages = max(1, (total + limit - 1) // limit)
    start = (page - 1) * limit
    return {
        "items": items[start:start + limit],
        "pagination": {
            "page": page, "limit": limit,
            "totalPages": total_pages, "totalItems": total,
            "hasNextPage": page < total_pages,
            "hasPreviousPage": page > 1,
        },
    }


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3011)), debug=False)
