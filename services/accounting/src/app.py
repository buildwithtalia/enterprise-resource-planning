"""Accounting microservice — general ledger & journal entries."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, request

from shared.health import make_health_blueprint
from shared.responses import success, error

_transactions: list[dict] = [
    {"id": "txn-001", "date": "2024-01-15", "description": "Initial capital",
     "amount": 500000, "type": "credit", "account": "Cash"},
    {"id": "txn-002", "date": "2024-01-20", "description": "Office rent",
     "amount": 5000, "type": "debit", "account": "Rent Expense"},
]

_journal_entries: list[dict] = []


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("accounting-service"))

    @app.post("/api/accounting/journal-entries")
    def create_journal_entry():
        data = request.get_json() or {}
        entry = {
            "id": f"je-{datetime.utcnow().timestamp()}",
            "date": data.get("date"),
            "description": data.get("description"),
            "entries": data.get("entries", []),
            "totalDebit": data.get("totalDebit", 0),
            "totalCredit": data.get("totalCredit", 0),
            "status": "posted",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }
        _journal_entries.append(entry)
        return success(entry, 201)

    @app.get("/api/accounting/transactions")
    def get_all_transactions():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_transactions, page, limit))

    @app.get("/api/accounting/transactions/<transaction_id>")
    def get_transaction_by_id(transaction_id):
        txn = next((t for t in _transactions if t["id"] == transaction_id), None)
        if not txn:
            return error("TRANSACTION_NOT_FOUND", f"Transaction {transaction_id} not found", status_code=404)
        return success(txn)

    @app.get("/api/accounting/general-ledger")
    def get_general_ledger():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        accounts = [
            {"code": "1000", "name": "Cash", "balance": 495000},
            {"code": "6000", "name": "Rent Expense", "balance": 5000},
            {"code": "2000", "name": "Accounts Payable", "balance": 25000},
            {"code": "4000", "name": "Revenue", "balance": 1000000},
        ]
        return success(_paginate(accounts, page, limit))

    @app.get("/api/accounting/trial-balance")
    def get_trial_balance():
        return success({
            "date": datetime.utcnow().isoformat() + "Z",
            "totalDebits": 100000,
            "totalCredits": 100000,
            "balanced": True,
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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3013)), debug=False)
