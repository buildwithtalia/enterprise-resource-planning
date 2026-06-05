"""Supply-chain microservice — shipments & logistics."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime
from flask import Flask, request

from shared.health import make_health_blueprint
from shared.responses import success, error

_shipments: list[dict] = []

_VALID_STATUSES = {"pending", "in_transit", "delivered", "cancelled", "delayed", "dispatched"}


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(make_health_blueprint("supply-chain-service"))

    @app.post("/api/supply-chain/shipments")
    def create_shipment():
        if not request.is_json:
            return error("INVALID_CONTENT_TYPE", "Request must have Content-Type: application/json")
        data = request.get_json()
        if data is None:
            return error("MISSING_JSON_DATA", "Request body must contain valid JSON data")
        shipment = {
            "id": f"ship-{datetime.utcnow().timestamp()}",
            "trackingNumber": f"TRK-{int(datetime.utcnow().timestamp())}",
            "orderId": data.get("orderId"),
            "carrier": data.get("carrier"),
            "origin": data.get("origin"),
            "destination": data.get("destination"),
            "shipDate": data.get("shipDate"),
            "estimatedDelivery": data.get("estimatedDelivery"),
            "status": "pending",
        }
        _shipments.append(shipment)
        return success(shipment, 201)

    @app.get("/api/supply-chain/shipments")
    def get_all_shipments():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        return success(_paginate(_shipments, page, limit))

    @app.get("/api/supply-chain/shipments/tracking/<tracking_number>")
    def get_by_tracking(tracking_number):
        ship = next((s for s in _shipments if s["trackingNumber"] == tracking_number), None)
        if not ship:
            return error("SHIPMENT_NOT_FOUND", f"No shipment with tracking {tracking_number}", status_code=404)
        return success(ship)

    @app.get("/api/supply-chain/shipments/order/<order_id>")
    def get_by_order(order_id):
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        order_ships = [s for s in _shipments if s.get("orderId") == order_id]
        return success(_paginate(order_ships, page, limit))

    @app.get("/api/supply-chain/shipments/<shipment_id>")
    def get_shipment_by_id(shipment_id):
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if not ship:
            return error("SHIPMENT_NOT_FOUND", f"Shipment {shipment_id} not found", status_code=404)
        return success(ship)

    @app.put("/api/supply-chain/shipments/<shipment_id>")
    def update_shipment(shipment_id):
        if not request.is_json:
            return error("INVALID_CONTENT_TYPE", "Request must have Content-Type: application/json")
        data = request.get_json()
        if not data:
            return error("MISSING_JSON_DATA", "Request body must contain valid JSON data")
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if not ship:
            return error("SHIPMENT_NOT_FOUND", f"Shipment {shipment_id} not found", status_code=404)
        if "status" in data and data["status"] not in _VALID_STATUSES:
            return error("VALIDATION_ERROR", f"Invalid status. Must be one of: {', '.join(sorted(_VALID_STATUSES))}")
        for field in ("carrier", "trackingNumber", "status", "estimatedDelivery"):
            if field in data:
                ship[field] = data[field]
        ship["updatedAt"] = datetime.utcnow().isoformat() + "Z"
        return success(ship)

    @app.patch("/api/supply-chain/shipments/<shipment_id>")
    def patch_shipment(shipment_id):
        data = request.get_json() or {}
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if not ship:
            return error("SHIPMENT_NOT_FOUND", f"Shipment {shipment_id} not found", status_code=404)
        updatable = {"status", "trackingNumber", "orderId", "origin", "destination", "estimatedDelivery", "location"}
        updated = []
        for field in updatable:
            if field in data:
                ship[field] = data[field]
                updated.append(field)
        ship["updatedAt"] = datetime.utcnow().isoformat() + "Z"
        return success({**ship, "updatedFields": updated})

    @app.put("/api/supply-chain/shipments/<shipment_id>/status")
    def update_shipment_status(shipment_id):
        data = request.get_json() or {}
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if ship:
            ship["status"] = data.get("status", ship["status"])
        return success({"id": shipment_id, "status": data.get("status"), "updatedAt": datetime.utcnow().isoformat() + "Z"})

    @app.post("/api/supply-chain/shipments/<shipment_id>/dispatch")
    def dispatch_shipment(shipment_id):
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if ship:
            ship["status"] = "dispatched"
        return success({"id": shipment_id, "status": "dispatched",
                        "dispatchedAt": datetime.utcnow().isoformat() + "Z",
                        "message": "Shipment dispatched successfully"})

    @app.post("/api/supply-chain/shipments/<shipment_id>/deliver")
    def mark_delivered(shipment_id):
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if ship:
            ship["status"] = "delivered"
        return success({"id": shipment_id, "status": "delivered",
                        "deliveredAt": datetime.utcnow().isoformat() + "Z",
                        "message": "Shipment marked as delivered"})

    @app.post("/api/supply-chain/shipments/<shipment_id>/cancel")
    def cancel_shipment(shipment_id):
        ship = next((s for s in _shipments if s["id"] == shipment_id), None)
        if ship:
            ship["status"] = "cancelled"
        return success({"id": shipment_id, "status": "cancelled",
                        "cancelledAt": datetime.utcnow().isoformat() + "Z",
                        "message": "Shipment cancelled"})

    @app.get("/api/supply-chain/carriers/performance")
    def carrier_performance():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        carriers = [
            {"name": "FedEx", "onTimeRate": 95, "avgDeliveryTime": 2.5},
            {"name": "UPS", "onTimeRate": 93, "avgDeliveryTime": 2.8},
            {"name": "DHL", "onTimeRate": 91, "avgDeliveryTime": 3.1},
        ]
        return success(_paginate(carriers, page, limit))

    @app.get("/api/supply-chain/inbound/summary")
    def inbound_summary():
        return success({"totalInbound": 25, "inTransit": 15, "arrived": 10, "expectedToday": 5})

    @app.get("/api/supply-chain/outbound/summary")
    def outbound_summary():
        return success({"totalOutbound": 30, "pending": 5, "dispatched": 20, "delivered": 5})

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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3017)), debug=False)
