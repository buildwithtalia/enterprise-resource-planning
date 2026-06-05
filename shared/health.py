"""Reusable health-check blueprint."""
from datetime import datetime
from flask import Blueprint, jsonify

_bp = Blueprint("health", __name__)


def make_health_blueprint(service_name: str) -> Blueprint:
    bp = Blueprint("health", __name__)

    @bp.get("/health")
    def health():
        return jsonify({
            "status": "healthy",
            "service": service_name,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    return bp
