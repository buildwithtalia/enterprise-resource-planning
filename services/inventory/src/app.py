"""Inventory microservice — stock management.

Calls Procurement service to create reorder purchase orders when stock
drops below the reorder point.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, request
import requests as http

from shared.health import make_health_blueprint
from shared.responses import success, error

PROCUREMENT_SERVICE_URL = os.environ.get("PROCUREMENT_SERVICE_URL", "http://procurement-service:3016")

_items: list[dict] = [
    {"id": "item-001", "sku": "ELEC-001", "name": "Laptop",
     "description": "Business laptop", "category": "Electronics",
     "unitPrice": 1200.00, "quantityOnHand": 50,
     "reorderPoint": 10, "reorderQuantity": 25},
    {"id": "item-002", "sku": "OFF-001", "name": "Office Chair",
     "description": "Ergonomic office chair", "category": "Furniture",
     "unitPrice": 350.00, "quantityOnHand": 8,
     "reorderPoint": 5, "reorderQuantity": 20},
]


def _create_reorder_po(item: dict) -> None:
    """Ask Procurement to create a reorder PO (fire-and-forget)."""
    try:
        http.post(
            f"{PROCUREMENT_SERVICE_URL}/api/procurement/purchase-orders",
            json={
                "vendorId": "vendor-001",
                "orderDate": datetime.utcnow().isoformat() + "Z",
                "items": [{"sku": item["sku"], "quantity": item["reorderQuantity"]}],
                "totalAmount": item["unitPrice"] * item["reorderQuantity"],
                "notes": f"Auto-reorder for {item['name']} (stock below reorder point)",
            },
            timeout=3,
        )
    except Exception:
        pass


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("inventory-service"))

    # ------------------------------------------------------------------ #
    # Items
    # ------------------------------------------------------------------ #
    @app.post("/api/inventory/items")
    def create_inventory_item():
        data = request.get_json() or {}
        item = {
            "id": f"item-{datetime.utcnow().timestamp()}",
            "sku": data.get("sku"),
            "name": data.get("name"),
            "description": data.get("description"),
            "category": data.get("category"),
            "unitPrice": data.get("unitPrice"),
            "quantityOnHand": data.get("quantityOnHand", 0),
            "reorderPoint": data.get("reorderPoint", 10),
            "reorderQuantity": data.get("reorderQuantity", 50),
        }
        _items.append(item)
        return success(item, 201)

    @app.get("/api/inventory/items")
    def get_all_inventory_items():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_items, page, limit))

    @app.get("/api/inventory/items/sku/<sku>")
    def get_item_by_sku(sku):
        item = next((i for i in _items if i["sku"] == sku), None)
        if not item:
            return error("ITEM_NOT_FOUND", f"Item with SKU {sku} not found", status_code=404)
        return success(item)

    @app.get("/api/inventory/items/<item_id>")
    def get_inventory_item_by_id(item_id):
        item = next((i for i in _items if i["id"] == item_id), None)
        if not item:
            return error("ITEM_NOT_FOUND", f"Item {item_id} not found", status_code=404)
        return success(item)

    @app.put("/api/inventory/items/<item_id>")
    def update_inventory_item(item_id):
        data = request.get_json() or {}
        item = next((i for i in _items if i["id"] == item_id), None)
        if not item:
            return error("ITEM_NOT_FOUND", f"Item {item_id} not found", status_code=404)
        item.update({k: v for k, v in data.items() if k not in ("id", "sku")})
        return success(item)

    # ------------------------------------------------------------------ #
    # Stock operations
    # ------------------------------------------------------------------ #
    @app.post("/api/inventory/stock/adjust")
    def adjust_stock():
        data = request.get_json() or {}
        item_id = data.get("itemId")
        item = next((i for i in _items if i["id"] == item_id), None)
        qty = int(data.get("quantity", 0))
        adj_type = data.get("adjustmentType", "add")
        new_qty = item["quantityOnHand"] if item else 0
        if item:
            if adj_type == "add":
                new_qty = item["quantityOnHand"] + qty
            elif adj_type == "subtract":
                new_qty = max(0, item["quantityOnHand"] - qty)
            else:
                new_qty = qty
            item["quantityOnHand"] = new_qty
            if new_qty <= item["reorderPoint"]:
                _create_reorder_po(item)
        return success({
            "itemId": item_id,
            "adjustmentType": adj_type,
            "quantity": qty,
            "newQuantity": new_qty,
            "reason": data.get("reason"),
            "adjustedAt": datetime.utcnow().isoformat() + "Z",
        })

    @app.post("/api/inventory/stock/reserve")
    def reserve_stock():
        data = request.get_json() or {}
        return success({
            "reservationId": f"res-{datetime.utcnow().timestamp()}",
            "itemId": data.get("itemId"),
            "quantity": data.get("quantity"),
            "orderId": data.get("orderId"),
            "reservedAt": datetime.utcnow().isoformat() + "Z",
        })

    @app.post("/api/inventory/stock/release")
    def release_reserved_stock():
        data = request.get_json() or {}
        return success({
            "reservationId": data.get("reservationId"),
            "itemId": data.get("itemId"),
            "quantity": data.get("quantity"),
            "releasedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Stock reservation released",
        })

    @app.post("/api/inventory/stock/fulfill")
    def fulfill_reservation():
        data = request.get_json() or {}
        return success({
            "reservationId": data.get("reservationId"),
            "itemId": data.get("itemId"),
            "quantity": data.get("quantity"),
            "fulfilledAt": datetime.utcnow().isoformat() + "Z",
            "message": "Reservation fulfilled",
        })

    @app.post("/api/inventory/stock/receive")
    def receive_stock():
        data = request.get_json() or {}
        item_id = data.get("itemId")
        qty = int(data.get("quantity", 0))
        item = next((i for i in _items if i["id"] == item_id), None)
        if item:
            item["quantityOnHand"] += qty
        return success({
            "itemId": item_id,
            "quantity": qty,
            "purchaseOrderId": data.get("purchaseOrderId"),
            "receivedAt": datetime.utcnow().isoformat() + "Z",
            "message": "Stock received successfully",
        })

    # ------------------------------------------------------------------ #
    # Analytics
    # ------------------------------------------------------------------ #
    @app.get("/api/inventory/low-stock")
    def get_low_stock_items():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        low = [i for i in _items if i["quantityOnHand"] <= i["reorderPoint"]]
        return success({
            "lowStockCount": len(low),
            "items": _paginate(low, page, limit),
        })

    @app.get("/api/inventory/valuation")
    def get_inventory_valuation():
        total_value = sum(i["unitPrice"] * i["quantityOnHand"] for i in _items)
        total_items = sum(i["quantityOnHand"] for i in _items)
        return success({
            "totalValue": round(total_value, 2),
            "totalItems": total_items,
            "averageValue": round(total_value / len(_items), 2) if _items else 0,
            "valuationDate": datetime.utcnow().isoformat() + "Z",
        })

    @app.get("/api/inventory/categories")
    def get_category_breakdown():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        cats: dict[str, dict] = {}
        for item in _items:
            cat = item.get("category", "Uncategorised")
            if cat not in cats:
                cats[cat] = {"name": cat, "itemCount": 0, "totalValue": 0}
            cats[cat]["itemCount"] += item["quantityOnHand"]
            cats[cat]["totalValue"] += round(item["unitPrice"] * item["quantityOnHand"], 2)
        return success(_paginate(list(cats.values()), page, limit))

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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3018)), debug=False)
