"""Payroll microservice.

Depends on:
  - HR service   (HR_SERVICE_URL)   to resolve employee data
  - Accounting service (ACCOUNTING_SERVICE_URL) to record payroll expenses
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, request
import requests as http

from shared.health import make_health_blueprint
from shared.responses import success, error

HR_SERVICE_URL = os.environ.get("HR_SERVICE_URL", "http://hr-service:3011")
ACCOUNTING_SERVICE_URL = os.environ.get("ACCOUNTING_SERVICE_URL", "http://accounting-service:3013")

_payroll_records: list[dict] = []


def _get_employee(employee_id: str) -> dict | None:
    """Fetch employee from HR service (gracefully degrades if unavailable)."""
    try:
        resp = http.get(f"{HR_SERVICE_URL}/api/hr/employees/{employee_id}", timeout=3)
        if resp.status_code == 200:
            return resp.json().get("data")
    except Exception:
        pass
    return None


def _record_expense(description: str, amount: float) -> None:
    """Post a journal entry to the Accounting service (fire-and-forget)."""
    try:
        http.post(
            f"{ACCOUNTING_SERVICE_URL}/api/accounting/journal-entries",
            json={
                "date": datetime.utcnow().isoformat() + "Z",
                "description": description,
                "totalDebit": amount,
                "totalCredit": amount,
                "entries": [],
            },
            timeout=3,
        )
    except Exception:
        pass


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("payroll-service"))

    @app.post("/api/payroll/process")
    def process_payroll():
        data = request.get_json() or {}
        employee_id = data.get("employeeId")
        gross_pay = float(data.get("grossPay", 6250))
        deductions = float(data.get("deductions", 1000))
        tax_withheld = round(gross_pay * 0.20, 2)
        net_pay = round(gross_pay - deductions - tax_withheld, 2)

        record = {
            "id": f"pay-{datetime.utcnow().timestamp()}",
            "employeeId": employee_id,
            "payPeriodStart": data.get("payPeriodStart"),
            "payPeriodEnd": data.get("payPeriodEnd"),
            "grossPay": gross_pay,
            "deductions": deductions,
            "taxWithheld": tax_withheld,
            "netPay": net_pay,
            "status": "pending",
            "processedAt": datetime.utcnow().isoformat() + "Z",
        }
        _payroll_records.append(record)

        # Cross-service call: record expense in Accounting
        _record_expense(f"Payroll expense for employee {employee_id}", gross_pay)

        return success(record, 201)

    @app.post("/api/payroll/process-batch")
    def process_batch_payroll():
        data = request.get_json() or {}
        employee_ids = data.get("employeeIds", [])
        results = []
        for eid in employee_ids:
            results.append({"employeeId": eid, "status": "processed", "netPay": 5000})
        batch = {
            "batchId": f"batch-{datetime.utcnow().timestamp()}",
            "totalProcessed": len(employee_ids),
            "results": results,
        }
        return success(batch, 202)

    @app.post("/api/payroll/<payroll_id>/approve")
    def approve_payroll(payroll_id):
        rec = next((r for r in _payroll_records if r["id"] == payroll_id), None)
        if rec:
            rec["status"] = "approved"
            rec["approvedAt"] = datetime.utcnow().isoformat() + "Z"
        return success({
            "id": payroll_id,
            "status": "approved",
            "approvedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Payroll approved successfully",
        })

    @app.get("/api/payroll")
    def get_all_payroll():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_payroll_records, page, limit))

    @app.get("/api/payroll/<payroll_id>")
    def get_payroll_by_id(payroll_id):
        rec = next((r for r in _payroll_records if r["id"] == payroll_id), None)
        if not rec:
            return error("PAYROLL_NOT_FOUND", f"Payroll record {payroll_id} not found", status_code=404)
        return success(rec)

    @app.get("/api/payroll/employee/<employee_id>")
    def get_employee_payroll_history(employee_id):
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        history = [r for r in _payroll_records if r.get("employeeId") == employee_id]
        return success(_paginate(history, page, limit))

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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3012)), debug=False)
