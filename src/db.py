"""Database wiring: SQLAlchemy ORM models + Flask-Migrate.

Neon is a serverless Postgres provider. Connections must use SSL (sslmode=require).
Set DATABASE_URL to a Neon connection string, e.g.:
    postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/erp_database?sslmode=require
"""
from __future__ import annotations

import os
from datetime import datetime
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


# ---------------------------------------------------------------------------
# ORM Models — one table per core ERP entity.
# These are the single source of truth for schema migrations.
# ---------------------------------------------------------------------------

class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    description = db.Column(db.Text)
    manager_id = db.Column(db.String(64))
    budget = db.Column(db.Numeric(15, 2))
    location = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = db.relationship("Employee", back_populates="dept", lazy="dynamic")


class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.String(64), primary_key=True)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(256), nullable=False, unique=True)
    phone_number = db.Column(db.String(32))
    department_id = db.Column(db.String(64), db.ForeignKey("departments.id"))
    position = db.Column(db.String(128), nullable=False)
    salary = db.Column(db.Numeric(12, 2), nullable=False)
    hire_date = db.Column(db.Date, nullable=False)
    termination_date = db.Column(db.Date)
    status = db.Column(
        db.Enum("active", "inactive", "on_leave", "terminated", name="employee_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dept = db.relationship("Department", back_populates="employees")
    payroll_records = db.relationship("PayrollRecord", back_populates="employee", lazy="dynamic")


class PayrollRecord(db.Model):
    __tablename__ = "payroll_records"

    id = db.Column(db.String(64), primary_key=True)
    employee_id = db.Column(db.String(64), db.ForeignKey("employees.id"), nullable=False)
    pay_period_start = db.Column(db.Date, nullable=False)
    pay_period_end = db.Column(db.Date, nullable=False)
    gross_pay = db.Column(db.Numeric(12, 2), nullable=False)
    deductions = db.Column(db.Numeric(12, 2), default=0)
    tax_withheld = db.Column(db.Numeric(12, 2), default=0)
    net_pay = db.Column(db.Numeric(12, 2), nullable=False)
    bonus = db.Column(db.Numeric(12, 2), default=0)
    overtime = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(
        db.Enum("pending", "approved", "paid", name="payroll_status"),
        nullable=False,
        default="pending",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = db.relationship("Employee", back_populates="payroll_records")


class AccountingTransaction(db.Model):
    __tablename__ = "accounting_transactions"

    id = db.Column(db.String(64), primary_key=True)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    type = db.Column(db.Enum("debit", "credit", name="transaction_type"), nullable=False)
    account_code = db.Column(db.String(32))
    reference = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.String(64), primary_key=True)
    department_id = db.Column(db.String(64), db.ForeignKey("departments.id"))
    fiscal_year = db.Column(db.Integer, nullable=False)
    quarter = db.Column(db.Integer)
    allocated_amount = db.Column(db.Numeric(15, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(
        db.Enum("active", "closed", name="budget_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(256), nullable=False, unique=True)
    phone = db.Column(db.String(32))
    address = db.Column(db.Text)
    credit_limit = db.Column(db.Numeric(12, 2), default=0)
    current_balance = db.Column(db.Numeric(12, 2), default=0)
    payment_terms = db.Column(db.String(64))
    status = db.Column(
        db.Enum("active", "inactive", "suspended", name="customer_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = db.relationship("Invoice", back_populates="customer", lazy="dynamic")


class Invoice(db.Model):
    __tablename__ = "invoices"

    id = db.Column(db.String(64), primary_key=True)
    invoice_number = db.Column(db.String(64), nullable=False, unique=True)
    customer_id = db.Column(db.String(64), db.ForeignKey("customers.id"), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(12, 2), default=0)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    paid_amount = db.Column(db.Numeric(12, 2), default=0)
    balance_due = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(
        db.Enum("draft", "pending", "paid", "overdue", "cancelled", name="invoice_status"),
        nullable=False,
        default="draft",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", back_populates="invoices")


class Vendor(db.Model):
    __tablename__ = "vendors"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(256), nullable=False, unique=True)
    phone = db.Column(db.String(32))
    address = db.Column(db.Text)
    payment_terms = db.Column(db.String(64))
    category = db.Column(db.String(128))
    rating = db.Column(db.Numeric(3, 2))
    status = db.Column(
        db.Enum("active", "inactive", "suspended", name="vendor_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    purchase_orders = db.relationship("PurchaseOrder", back_populates="vendor", lazy="dynamic")


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"

    id = db.Column(db.String(64), primary_key=True)
    po_number = db.Column(db.String(64), nullable=False, unique=True)
    vendor_id = db.Column(db.String(64), db.ForeignKey("vendors.id"), nullable=False)
    order_date = db.Column(db.Date, nullable=False)
    expected_delivery_date = db.Column(db.Date)
    actual_delivery_date = db.Column(db.Date)
    subtotal = db.Column(db.Numeric(12, 2), default=0)
    tax = db.Column(db.Numeric(12, 2), default=0)
    total = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(
        db.Enum(
            "draft", "pending_approval", "approved", "placed", "received", "cancelled",
            name="po_status",
        ),
        nullable=False,
        default="draft",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = db.relationship("Vendor", back_populates="purchase_orders")


class Shipment(db.Model):
    __tablename__ = "shipments"

    id = db.Column(db.String(64), primary_key=True)
    tracking_number = db.Column(db.String(128), unique=True)
    order_id = db.Column(db.String(64))
    carrier = db.Column(db.String(128))
    origin = db.Column(db.Text)
    destination = db.Column(db.Text)
    ship_date = db.Column(db.Date)
    estimated_delivery = db.Column(db.Date)
    actual_delivery = db.Column(db.Date)
    shipping_cost = db.Column(db.Numeric(10, 2))
    total_weight = db.Column(db.Numeric(10, 2))
    status = db.Column(
        db.Enum("pending", "dispatched", "in_transit", "delivered", "cancelled", name="shipment_status"),
        nullable=False,
        default="pending",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(db.String(64), primary_key=True)
    sku = db.Column(db.String(128), nullable=False, unique=True)
    name = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(128))
    quantity_on_hand = db.Column(db.Integer, nullable=False, default=0)
    reorder_point = db.Column(db.Integer, default=10)
    reorder_quantity = db.Column(db.Integer, default=50)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    location = db.Column(db.String(256))
    status = db.Column(
        db.Enum("active", "discontinued", "out_of_stock", name="inventory_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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
