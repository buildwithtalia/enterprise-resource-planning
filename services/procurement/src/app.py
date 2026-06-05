"""Procurement microservice — vendors & purchase orders.

Calls Accounting service to record purchases.
Called by Inventory service for automatic reorders.
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

_vendors: list[dict] = [
    {"id": "vendor-001", "name": "Global Supplies Inc.", "email": "orders@globalsupplies.com",
     "phone": "555-0200", "address": "5 Supply Lane", "paymentTerms": "Net 30", "status": "active"},
]

_purchase_orders: list[dict] = [
    {"id": "po-001", "poNumber": "PO-001", "vendorId": "vendor-001",
     "orderDate": "2024-01-10", "expectedDeliveryDate": "2024-01-20",
     "items": [], "totalAmount": 5000, "status": "received"},
]


def _record_purchase(description: str, amount: float) -> None:
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
    app.register_blueprint(make_health_blueprint("procurement-service"))

    # ------------------------------------------------------------------ #
    # Vendors
    # ------------------------------------------------------------------ #
    @app.post("/api/procurement/vendors")
    def create_vendor():
        data = request.get_json() or {}
        vendor = {
            "id": f"vendor-{datetime.utcnow().timestamp()}",
            "name": data.get("name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "address": data.get("address"),
            "paymentTerms": data.get("paymentTerms", "Net 30"),
            "status": "active",
        }
        _vendors.append(vendor)
        return success(vendor, 201)

    @app.get("/api/procurement/vendors")
    def get_all_vendors():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_vendors, page, limit))

    @app.get("/api/procurement/vendors/<vendor_id>")
    def get_vendor_by_id(vendor_id):
        vendor = next((v for v in _vendors if v["id"] == vendor_id), None)
        if not vendor:
            return error("VENDOR_NOT_FOUND", f"Vendor {vendor_id} not found", status_code=404)
        return success(vendor)

    @app.get("/api/procurement/vendors/<vendor_id>/performance")
    def get_vendor_performance(vendor_id):
        return success({
            "vendorId": vendor_id,
            "onTimeDeliveryRate": 95,
            "qualityScore": 4.5,
            "totalOrders": 50,
            "totalSpent": 250000,
        })

    # ------------------------------------------------------------------ #
    # Purchase Orders
    # ------------------------------------------------------------------ #
    @app.post("/api/procurement/purchase-orders")
    def create_purchase_order():
        data = request.get_json() or {}
        po = {
            "id": f"po-{datetime.utcnow().timestamp()}",
            "poNumber": f"PO-{int(datetime.utcnow().timestamp())}",
            "vendorId": data.get("vendorId"),
            "orderDate": data.get("orderDate"),
            "expectedDeliveryDate": data.get("expectedDeliveryDate"),
            "items": data.get("items", []),
            "totalAmount": data.get("totalAmount", 0),
            "status": "draft",
        }
        _purchase_orders.append(po)
        return success(po, 201)

    @app.get("/api/procurement/purchase-orders")
    def get_all_purchase_orders():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_purchase_orders, page, limit))

    @app.get("/api/procurement/purchase-orders/<po_id>")
    def get_purchase_order_by_id(po_id):
        po = next((p for p in _purchase_orders if p["id"] == po_id), None)
        if not po:
            return error("PO_NOT_FOUND", f"Purchase order {po_id} not found", status_code=404)
        return success(po)

    @app.post("/api/procurement/purchase-orders/<po_id>/approve")
    def approve_purchase_order(po_id):
        po = next((p for p in _purchase_orders if p["id"] == po_id), None)
        if po:
            po["status"] = "approved"
        return success({
            "id": po_id, "status": "approved",
            "approvedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Purchase order approved successfully",
        })

    @app.post("/api/procurement/purchase-orders/<po_id>/place")
    def place_purchase_order(po_id):
        po = next((p for p in _purchase_orders if p["id"] == po_id), None)
        if po:
            po["status"] = "placed"
            _record_purchase(f"Purchase order {po_id}", po["totalAmount"])
        return success({
            "id": po_id, "status": "placed",
            "placedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Purchase order placed with vendor",
        })

    @app.post("/api/procurement/purchase-orders/<po_id>/receive")
    def receive_purchase_order(po_id):
        po = next((p for p in _purchase_orders if p["id"] == po_id), None)
        if po:
            po["status"] = "received"
        return success({
            "id": po_id, "status": "received",
            "receivedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Purchase order received",
        })

    @app.post("/api/procurement/purchase-orders/<po_id>/cancel")
    def cancel_purchase_order(po_id):
        po = next((p for p in _purchase_orders if p["id"] == po_id), None)
        if po:
            po["status"] = "cancelled"
        return success({
            "id": po_id, "status": "cancelled",
            "cancelledAt": datetime.utcnow().isoformat() + "Z",
            "message": "Purchase order cancelled",
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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3016)), debug=False)
