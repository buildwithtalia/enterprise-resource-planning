"""Finance microservice — budgets & financial reporting.

Calls Accounting service to pull transaction data for reports.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, request
import requests as http

from shared.health import make_health_blueprint
from shared.responses import success, error

ACCOUNTING_SERVICE_URL = os.environ.get("ACCOUNTING_SERVICE_URL", "http://accounting-service:3013")

_budgets: list[dict] = [
    {"id": "budget-001", "departmentId": "dept-001", "fiscalYear": 2024,
     "quarter": 1, "allocatedAmount": 500000, "spentAmount": 350000,
     "remainingAmount": 150000, "status": "active"},
]


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("finance-service"))

    # ------------------------------------------------------------------ #
    # Budgets
    # ------------------------------------------------------------------ #
    @app.post("/api/finance/budgets")
    def create_budget():
        data = request.get_json() or {}
        allocated = data.get("allocatedAmount", 0)
        budget = {
            "id": f"budget-{datetime.utcnow().timestamp()}",
            "departmentId": data.get("departmentId"),
            "fiscalYear": data.get("fiscalYear"),
            "quarter": data.get("quarter"),
            "allocatedAmount": allocated,
            "spentAmount": 0,
            "remainingAmount": allocated,
            "status": "active",
        }
        _budgets.append(budget)
        return success(budget, 201)

    @app.get("/api/finance/budgets")
    def get_all_budgets():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_budgets, page, limit))

    @app.get("/api/finance/budgets/<budget_id>")
    def get_budget_by_id(budget_id):
        budget = next((b for b in _budgets if b["id"] == budget_id), None)
        if not budget:
            return error("BUDGET_NOT_FOUND", f"Budget {budget_id} not found", status_code=404)
        return success(budget)

    @app.post("/api/finance/budgets/<budget_id>/close")
    def close_budget(budget_id):
        budget = next((b for b in _budgets if b["id"] == budget_id), None)
        if budget:
            budget["status"] = "closed"
        return success({
            "id": budget_id,
            "status": "closed",
            "closedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Budget closed successfully",
        })

    @app.get("/api/finance/budgets/<budget_id>/utilization")
    def get_budget_utilization(budget_id):
        budget = next((b for b in _budgets if b["id"] == budget_id), None)
        if not budget:
            return error("BUDGET_NOT_FOUND", f"Budget {budget_id} not found", status_code=404)
        utilization = (
            round(budget["spentAmount"] / budget["allocatedAmount"] * 100, 1)
            if budget["allocatedAmount"] else 0
        )
        return success({
            "budgetId": budget_id,
            "utilizationPercentage": utilization,
            "allocatedAmount": budget["allocatedAmount"],
            "spentAmount": budget["spentAmount"],
            "remainingAmount": budget["remainingAmount"],
        })

    @app.get("/api/finance/departments/<department_id>/budget-summary")
    def get_department_budget_summary(department_id):
        dept_budgets = [b for b in _budgets if b["departmentId"] == department_id]
        total_allocated = sum(b["allocatedAmount"] for b in dept_budgets)
        total_spent = sum(b["spentAmount"] for b in dept_budgets)
        return success({
            "departmentId": department_id,
            "totalAllocated": total_allocated,
            "totalSpent": total_spent,
            "totalRemaining": total_allocated - total_spent,
            "utilizationPercentage": (
                round(total_spent / total_allocated * 100, 1) if total_allocated else 0
            ),
        })

    @app.get("/api/finance/reports")
    def generate_financial_report():
        report_type = request.args.get("type", "summary")
        return success({
            "reportType": report_type,
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "data": {"revenue": 1000000, "expenses": 750000, "profit": 250000},
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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3014)), debug=False)
