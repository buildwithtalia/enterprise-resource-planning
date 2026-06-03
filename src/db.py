"""Database wiring: SQLAlchemy + Flask-Migrate.

Neon is a serverless Postgres provider. Connections must use SSL (sslmode=require).
Set DATABASE_URL to a Neon connection string, e.g.:
    postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/erp_database?sslmode=require
"""
from __future__ import annotations

import os
from urllib.parse import urlparse, urlunparse, urlencode, parse_qs

from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()


def get_database_url() -> str:
    """Return the database URL.

    Neon provides a single DATABASE_URL. When that is set it is used directly,
    with sslmode=require appended if not already present.

    Falls back to assembling a URL from the individual DB_* variables for local
    development with a standard Postgres instance.
    """
    url = os.environ.get("DATABASE_URL", "")
    if url:
        return _ensure_ssl(url)

    # Legacy fallback: build URL from individual variables.
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    name = os.environ.get("DB_NAME", "erp_database")
    user = os.environ.get("DB_USER", "erp_user")
    password = os.environ.get("DB_PASSWORD", "")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


def _ensure_ssl(url: str) -> str:
    """Add sslmode=require to a Postgres URL if it is not already set.

    Neon requires SSL; this makes the requirement explicit so connections
    never silently fall back to plaintext.
    """
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    if "sslmode" not in params:
        params["sslmode"] = ["require"]
    new_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=new_query))


def init_db(app: Flask) -> None:
    app.config["SQLALCHEMY_DATABASE_URI"] = get_database_url()
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    # Neon's serverless instances may go idle; recycle connections every 5 min.
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    db.init_app(app)
    migrate.init_app(app, db)
