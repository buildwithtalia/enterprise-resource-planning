"""Billing microservice — customers & invoices.

Calls Accounting service to record revenue on invoice send.
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

_customers: list[dict] = [
    {"id": "cust-001", "name": "Acme Corp", "email": "billing@acme.com",
     "phone": "555-0100", "address": "1 Acme Way", "creditLimit": 100000,
     "currentBalance": 15000, "status": "active"},
]

_invoices: list[dict] = [
    {"id": "inv-001", "invoiceNumber": "INV-001", "customerId": "cust-001",
     "issueDate": "2024-01-01", "dueDate": "2024-01-31", "subtotal": 9259.26,
     "taxAmount": 740.74, "totalAmount": 10000, "balanceDue": 10000, "status": "sent", "items": []},
]


def _record_revenue(description: str, amount: float) -> None:
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
    app.register_blueprint(make_health_blueprint("billing-service"))

    # ------------------------------------------------------------------ #
    # Customers
    # ------------------------------------------------------------------ #
    @app.post("/api/billing/customers")
    def create_customer():
        data = request.get_json() or {}
        customer = {
            "id": f"cust-{datetime.utcnow().timestamp()}",
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "address": data.get("address"),
            "creditLimit": data.get("creditLimit", 50000),
            "currentBalance": 0,
            "status": "active",
        }
        _customers.append(customer)
        return success(customer, 201)

    @app.get("/api/billing/customers")
    def get_all_customers():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_customers, page, limit))

    @app.get("/api/billing/customers/<customer_id>")
    def get_customer_by_id(customer_id):
        cust = next((c for c in _customers if c["id"] == customer_id), None)
        if not cust:
            return error("CUSTOMER_NOT_FOUND", f"Customer {customer_id} not found", status_code=404)
        return success(cust)

    @app.get("/api/billing/customers/<customer_id>/balance")
    def get_customer_balance(customer_id):
        cust = next((c for c in _customers if c["id"] == customer_id), None)
        if not cust:
            return error("CUSTOMER_NOT_FOUND", f"Customer {customer_id} not found", status_code=404)
        return success({
            "customerId": customer_id,
            "currentBalance": cust["currentBalance"],
            "creditLimit": cust["creditLimit"],
            "availableCredit": cust["creditLimit"] - cust["currentBalance"],
        })

    # ------------------------------------------------------------------ #
    # Invoices
    # ------------------------------------------------------------------ #
    @app.post("/api/billing/invoices")
    def create_invoice():
        data = request.get_json() or {}
        subtotal = float(data.get("subtotal", 0))
        tax_amount = round(subtotal * 0.08, 2)
        total = round(subtotal + tax_amount, 2)
        invoice = {
            "id": f"inv-{datetime.utcnow().timestamp()}",
            "invoiceNumber": f"INV-{int(datetime.utcnow().timestamp())}",
            "customerId": data.get("customerId"),
            "issueDate": data.get("issueDate"),
            "dueDate": data.get("dueDate"),
            "subtotal": subtotal,
            "taxAmount": tax_amount,
            "totalAmount": total,
            "balanceDue": total,
            "status": "draft",
            "items": data.get("items", []),
        }
        _invoices.append(invoice)
        return success(invoice, 201)

    @app.get("/api/billing/invoices")
    def get_all_invoices():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_invoices, page, limit))

    @app.get("/api/billing/invoices/overdue")
    def check_overdue_invoices():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        overdue = [i for i in _invoices if i.get("status") == "overdue"]
        return success({
            "overdueCount": len(overdue),
            "totalOverdueAmount": sum(i["balanceDue"] for i in overdue),
            "invoices": _paginate(overdue, page, limit),
        })

    @app.get("/api/billing/invoices/<invoice_id>")
    def get_invoice_by_id(invoice_id):
        inv = next((i for i in _invoices if i["id"] == invoice_id), None)
        if not inv:
            return error("INVOICE_NOT_FOUND", f"Invoice {invoice_id} not found", status_code=404)
        return success(inv)

    @app.post("/api/billing/invoices/<invoice_id>/send")
    def send_invoice(invoice_id):
        inv = next((i for i in _invoices if i["id"] == invoice_id), None)
        if inv:
            inv["status"] = "sent"
            # Cross-service: record revenue in Accounting
            _record_revenue(f"Revenue for invoice {invoice_id}", inv["totalAmount"])
        return success({
            "id": invoice_id,
            "status": "sent",
            "sentAt": datetime.utcnow().isoformat() + "Z",
            "message": "Invoice sent successfully",
        })

    @app.post("/api/billing/invoices/<invoice_id>/payments")
    def record_payment(invoice_id):
        data = request.get_json() or {}
        inv = next((i for i in _invoices if i["id"] == invoice_id), None)
        if inv:
            paid = float(data.get("amount", 0))
            inv["balanceDue"] = max(0, inv["balanceDue"] - paid)
            if inv["balanceDue"] == 0:
                inv["status"] = "paid"
        return success({
            "invoiceId": invoice_id,
            "paymentId": f"pmt-{datetime.utcnow().timestamp()}",
            "amount": data.get("amount"),
            "paymentDate": data.get("paymentDate"),
            "paymentMethod": data.get("paymentMethod"),
            "message": "Payment recorded successfully",
        }, 201)

    @app.post("/api/billing/invoices/<invoice_id>/cancel")
    def cancel_invoice(invoice_id):
        inv = next((i for i in _invoices if i["id"] == invoice_id), None)
        if inv:
            inv["status"] = "cancelled"
        return success({
            "id": invoice_id,
            "status": "cancelled",
            "cancelledAt": datetime.utcnow().isoformat() + "Z",
            "message": "Invoice cancelled successfully",
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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3015)), debug=False)
