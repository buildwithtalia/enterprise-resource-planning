"""Standardised JSON response helpers (v2 envelope)."""
from datetime import datetime
from flask import jsonify


def success(data, status_code: int = 200):
    return jsonify({
        "success": True,
        "data": data,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }), status_code


def error(code: str, message: str, details=None, status_code: int = 400):
    body = {
        "success": False,
        "error": {"code": code, "message": message},
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    if details:
        body["error"]["details"] = details
    return jsonify(body), status_code
