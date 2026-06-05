"""API Gateway — reverse-proxy / composition layer.

Routing table (all configurable via env vars):
  /api/hr/*            → HR_SERVICE_URL
  /api/payroll/*       → PAYROLL_SERVICE_URL
  /api/accounting/*    → ACCOUNTING_SERVICE_URL
  /api/finance/*       → FINANCE_SERVICE_URL
  /api/billing/*       → BILLING_SERVICE_URL
  /api/procurement/*   → PROCUREMENT_SERVICE_URL
  /api/supply-chain/*  → SUPPLY_CHAIN_SERVICE_URL
  /api/inventory/*     → INVENTORY_SERVICE_URL
  /api/v2/*            → same mapping by second segment
  /health              → aggregate health check
  /api                 → service catalogue
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from datetime import datetime

import requests as http
from flask import Flask, jsonify, request, Response

from shared.responses import error

# ── Service URLs ──────────────────────────────────────────────────────────────
_SERVICES: dict[str, str] = {
    "hr":            os.environ.get("HR_SERVICE_URL",            "http://hr-service:3011"),
    "payroll":       os.environ.get("PAYROLL_SERVICE_URL",       "http://payroll-service:3012"),
    "accounting":    os.environ.get("ACCOUNTING_SERVICE_URL",    "http://accounting-service:3013"),
    "finance":       os.environ.get("FINANCE_SERVICE_URL",       "http://finance-service:3014"),
    "billing":       os.environ.get("BILLING_SERVICE_URL",       "http://billing-service:3015"),
    "procurement":   os.environ.get("PROCUREMENT_SERVICE_URL",   "http://procurement-service:3016"),
    "supply-chain":  os.environ.get("SUPPLY_CHAIN_SERVICE_URL",  "http://supply-chain-service:3017"),
    "inventory":     os.environ.get("INVENTORY_SERVICE_URL",     "http://inventory-service:3018"),
}

_SERVICE_META = {
    "hr":           {"port": 3011, "description": "Employee and department management"},
    "payroll":      {"port": 3012, "description": "Salary processing and tax calculations"},
    "accounting":   {"port": 3013, "description": "General ledger and financial transactions"},
    "finance":      {"port": 3014, "description": "Budgeting and financial reporting"},
    "billing":      {"port": 3015, "description": "Invoicing and customer billing"},
    "procurement":  {"port": 3016, "description": "Purchase orders and vendor management"},
    "supply-chain": {"port": 3017, "description": "Shipments and logistics"},
    "inventory":    {"port": 3018, "description": "Stock management and automatic reordering"},
}


def _proxy(service_key: str, path: str) -> Response:
    """Forward the current request to the target microservice."""
    base_url = _SERVICES.get(service_key)
    if not base_url:
        return error("SERVICE_NOT_FOUND", f"No service registered for key '{service_key}'", status_code=404)[0]

    target = base_url.rstrip("/") + path
    if request.query_string:
        target += "?" + request.query_string.decode()

    try:
        resp = http.request(
            method=request.method,
            url=target,
            headers={k: v for k, v in request.headers if k.lower() not in ("host", "content-length")},
            data=request.get_data(),
            timeout=10,
            allow_redirects=False,
        )
        excluded = {"transfer-encoding", "content-encoding"}
        headers = [(k, v) for k, v in resp.headers.items() if k.lower() not in excluded]
        return Response(resp.content, status=resp.status_code, headers=headers)
    except http.exceptions.ConnectionError:
        return error("SERVICE_UNAVAILABLE", f"Service '{service_key}' is unavailable", status_code=503)[0]
    except http.exceptions.Timeout:
        return error("SERVICE_TIMEOUT", f"Service '{service_key}' timed out", status_code=504)[0]
    except Exception as exc:
        return error("GATEWAY_ERROR", str(exc), status_code=502)[0]


def create_app() -> Flask:
    app = Flask(__name__)

    # ── Health ----------------------------------------------------------------
    @app.get("/health")
    def health():
        statuses = {}
        for name, base in _SERVICES.items():
            try:
                r = http.get(f"{base}/health", timeout=2)
                statuses[name] = "healthy" if r.status_code == 200 else "degraded"
            except Exception:
                statuses[name] = "unreachable"
        overall = "healthy" if all(v == "healthy" for v in statuses.values()) else "degraded"
        return jsonify({
            "status": overall,
            "service": "api-gateway",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "services": statuses,
        }), 200 if overall == "healthy" else 207

    # ── Service catalogue -------------------------------------------------------
    @app.get("/api")
    def api_info():
        return jsonify({
            "name": "Enterprise Resource Planning — Microservices API",
            "version": "2.0.0",
            "architecture": "Microservices",
            "gateway": "http://localhost:3010",
            "services": [
                {
                    "name": k,
                    "path": f"/api/{k}",
                    "port": meta["port"],
                    "description": meta["description"],
                }
                for k, meta in _SERVICE_META.items()
            ],
            "characteristics": {
                "deploymentUnit": "Independent microservices — one process per domain",
                "database": "Per-service data store (currently in-memory; replace with dedicated DB per service)",
                "coupling": "Loose coupling via HTTP APIs; async-ready",
                "middleware": "Per-service health checks; gateway-level routing",
            },
        })

    # ── Wildcard proxy routes --------------------------------------------------
    # v1 paths
    @app.route("/api/hr/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/hr", methods=["GET", "POST"])
    def proxy_hr(path=""):
        return _proxy("hr", f"/api/hr/{path}" if path else "/api/hr")

    @app.route("/api/payroll/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/payroll", methods=["GET", "POST"])
    def proxy_payroll(path=""):
        return _proxy("payroll", f"/api/payroll/{path}" if path else "/api/payroll")

    @app.route("/api/accounting/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/accounting", methods=["GET", "POST"])
    def proxy_accounting(path=""):
        return _proxy("accounting", f"/api/accounting/{path}" if path else "/api/accounting")

    @app.route("/api/finance/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/finance", methods=["GET", "POST"])
    def proxy_finance(path=""):
        return _proxy("finance", f"/api/finance/{path}" if path else "/api/finance")

    @app.route("/api/billing/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/billing", methods=["GET", "POST"])
    def proxy_billing(path=""):
        return _proxy("billing", f"/api/billing/{path}" if path else "/api/billing")

    @app.route("/api/procurement/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/procurement", methods=["GET", "POST"])
    def proxy_procurement(path=""):
        return _proxy("procurement", f"/api/procurement/{path}" if path else "/api/procurement")

    @app.route("/api/supply-chain/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/supply-chain", methods=["GET", "POST"])
    def proxy_supply_chain(path=""):
        return _proxy("supply-chain", f"/api/supply-chain/{path}" if path else "/api/supply-chain")

    @app.route("/api/inventory/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/inventory", methods=["GET", "POST"])
    def proxy_inventory(path=""):
        return _proxy("inventory", f"/api/inventory/{path}" if path else "/api/inventory")

    # v2 paths — strip /v2 prefix then forward to the same services
    @app.route("/api/v2/hr/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/hr", methods=["GET", "POST"])
    def proxy_v2_hr(path=""):
        return _proxy("hr", f"/api/hr/{path}" if path else "/api/hr")

    @app.route("/api/v2/payroll/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/payroll", methods=["GET", "POST"])
    def proxy_v2_payroll(path=""):
        return _proxy("payroll", f"/api/payroll/{path}" if path else "/api/payroll")

    @app.route("/api/v2/accounting/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/accounting", methods=["GET", "POST"])
    def proxy_v2_accounting(path=""):
        return _proxy("accounting", f"/api/accounting/{path}" if path else "/api/accounting")

    @app.route("/api/v2/finance/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/finance", methods=["GET", "POST"])
    def proxy_v2_finance(path=""):
        return _proxy("finance", f"/api/finance/{path}" if path else "/api/finance")

    @app.route("/api/v2/billing/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/billing", methods=["GET", "POST"])
    def proxy_v2_billing(path=""):
        return _proxy("billing", f"/api/billing/{path}" if path else "/api/billing")

    @app.route("/api/v2/procurement/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/procurement", methods=["GET", "POST"])
    def proxy_v2_procurement(path=""):
        return _proxy("procurement", f"/api/procurement/{path}" if path else "/api/procurement")

    @app.route("/api/v2/supply-chain/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/supply-chain", methods=["GET", "POST"])
    def proxy_v2_supply_chain(path=""):
        return _proxy("supply-chain", f"/api/supply-chain/{path}" if path else "/api/supply-chain")

    @app.route("/api/v2/inventory/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    @app.route("/api/v2/inventory", methods=["GET", "POST"])
    def proxy_v2_inventory(path=""):
        return _proxy("inventory", f"/api/inventory/{path}" if path else "/api/inventory")

    @app.errorhandler(404)
    def not_found(_):
        return error("NOT_FOUND", "Route not found", status_code=404)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3010)), debug=False)
