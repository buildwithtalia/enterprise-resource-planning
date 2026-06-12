"""SQLAlchemy models for every ERP module.

One file so Flask-Migrate's autogenerate sees everything in a single import.
Foreign keys are intentionally minimal — enough to demonstrate persistence,
not enforce business rules.
"""
from __future__ import annotations

from datetime import datetime

from db import db


class Department(db.Model):
    __tablename__ = "departments"
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String)
    description = db.Column(db.String)
    manager_id = db.Column(db.String)
    budget = db.Column(db.Numeric(15, 2))
    location = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Employee(db.Model):
    __tablename__ = "employees"
    id = db.Column(db.String, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    department_id = db.Column(db.String, db.ForeignKey("departments.id"))
    position = db.Column(db.String)
    salary = db.Column(db.Numeric(12, 2))
    hire_date = db.Column(db.Date)
    status = db.Column(db.String, default="active")


class PayrollRecord(db.Model):
    __tablename__ = "payroll_records"
    id = db.Column(db.String, primary_key=True)
    employee_id = db.Column(db.String, db.ForeignKey("employees.id"))
    pay_period_start = db.Column(db.Date)
    pay_period_end = db.Column(db.Date)
    gross_pay = db.Column(db.Numeric(12, 2))
    deductions = db.Column(db.Numeric(12, 2))
    tax_withheld = db.Column(db.Numeric(12, 2))
    net_pay = db.Column(db.Numeric(12, 2))
    status = db.Column(db.String, default="pending")


class Transaction(db.Model):
    __tablename__ = "transactions"
    id = db.Column(db.String, primary_key=True)
    date = db.Column(db.Date)
    description = db.Column(db.String)
    amount = db.Column(db.Numeric(15, 2))
    type = db.Column(db.String)


class Budget(db.Model):
    __tablename__ = "budgets"
    id = db.Column(db.String, primary_key=True)
    department_id = db.Column(db.String, db.ForeignKey("departments.id"))
    fiscal_year = db.Column(db.Integer)
    quarter = db.Column(db.Integer)
    allocated_amount = db.Column(db.Numeric(15, 2))
    spent_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String, default="active")


class Customer(db.Model):
    __tablename__ = "customers"
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String)
    phone = db.Column(db.String)
    address = db.Column(db.String)
    credit_limit = db.Column(db.Numeric(15, 2), default=50000)
    current_balance = db.Column(db.Numeric(15, 2), default=0)
    payment_terms = db.Column(db.String, default="Net 30")
    status = db.Column(db.String, default="active")


class Invoice(db.Model):
    __tablename__ = "invoices"
    id = db.Column(db.String, primary_key=True)
    invoice_number = db.Column(db.String)
    customer_id = db.Column(db.String, db.ForeignKey("customers.id"))
    issue_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    subtotal = db.Column(db.Numeric(15, 2))
    tax_amount = db.Column(db.Numeric(15, 2))
    total_amount = db.Column(db.Numeric(15, 2))
    paid_amount = db.Column(db.Numeric(15, 2), default=0)
    status = db.Column(db.String, default="draft")


class Vendor(db.Model):
    __tablename__ = "vendors"
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String)
    phone = db.Column(db.String)
    address = db.Column(db.String)
    payment_terms = db.Column(db.String, default="Net 30")
    # category is required by the API contract
    category = db.Column(db.String)
    status = db.Column(db.String, default="active")


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"
    id = db.Column(db.String, primary_key=True)
    po_number = db.Column(db.String)
    vendor_id = db.Column(db.String, db.ForeignKey("vendors.id"))
    order_date = db.Column(db.Date)
    expected_delivery_date = db.Column(db.Date)
    total_amount = db.Column(db.Numeric(15, 2))
    status = db.Column(db.String, default="draft")


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"
    id = db.Column(db.String, primary_key=True)
    sku = db.Column(db.String, unique=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    category = db.Column(db.String)
    unit_price = db.Column(db.Numeric(12, 2))
    quantity_on_hand = db.Column(db.Integer, default=0)
    reorder_point = db.Column(db.Integer, default=10)
    reorder_quantity = db.Column(db.Integer, default=50)


class Shipment(db.Model):
    __tablename__ = "shipments"
    id = db.Column(db.String, primary_key=True)
    tracking_number = db.Column(db.String, unique=True)
    order_id = db.Column(db.String)
    carrier = db.Column(db.String)
    origin = db.Column(db.String)
    destination = db.Column(db.String)
    ship_date = db.Column(db.Date)
    estimated_delivery = db.Column(db.Date)
    status = db.Column(db.String, default="pending")
