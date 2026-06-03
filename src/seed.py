"""Seed sample data into every module's table.

Idempotent-ish: deletes existing rows first so re-running gives a clean slate.
Run inside the container:
    docker compose exec erp-api python src/seed.py
"""
from __future__ import annotations

from datetime import date

from app import create_app
from db import db
from models import (
    Budget,
    Customer,
    Department,
    Employee,
    InventoryItem,
    Invoice,
    PayrollRecord,
    PurchaseOrder,
    Shipment,
    Transaction,
    Vendor,
)


def seed() -> None:
    app = create_app()
    with app.app_context():
        # Clear in FK-safe order
        for model in (
            PayrollRecord,
            Invoice,
            PurchaseOrder,
            Budget,
            Employee,
            Department,
            Customer,
            Vendor,
            Transaction,
            InventoryItem,
            Shipment,
        ):
            db.session.query(model).delete()

        # Departments
        eng = Department(id="dept-001", name="Engineering", description="Product engineering", budget=2_000_000, location="Remote")
        sales = Department(id="dept-002", name="Sales", description="Revenue", budget=1_200_000, location="NYC")
        ops = Department(id="dept-003", name="Operations", description="Logistics", budget=800_000, location="Chicago")
        db.session.add_all([eng, sales, ops])
        db.session.flush()

        # Employees
        employees = [
            Employee(id="emp-001", first_name="Ada", last_name="Lovelace", email="ada@example.com",
                     department_id="dept-001", position="Principal Engineer", salary=185_000,
                     hire_date=date(2021, 3, 15), status="active"),
            Employee(id="emp-002", first_name="Grace", last_name="Hopper", email="grace@example.com",
                     department_id="dept-001", position="Engineering Manager", salary=210_000,
                     hire_date=date(2019, 7, 1), status="active"),
            Employee(id="emp-003", first_name="Alan", last_name="Turing", email="alan@example.com",
                     department_id="dept-001", position="Senior Engineer", salary=160_000,
                     hire_date=date(2022, 1, 10), status="active"),
            Employee(id="emp-004", first_name="Margaret", last_name="Hamilton", email="margaret@example.com",
                     department_id="dept-002", position="Account Executive", salary=120_000,
                     hire_date=date(2020, 9, 5), status="active"),
            Employee(id="emp-005", first_name="Katherine", last_name="Johnson", email="katherine@example.com",
                     department_id="dept-003", position="Logistics Lead", salary=110_000,
                     hire_date=date(2018, 4, 20), status="active"),
        ]
        db.session.add_all(employees)
        db.session.flush()

        # Payroll
        db.session.add_all([
            PayrollRecord(id="pay-001", employee_id="emp-001",
                          pay_period_start=date(2026, 5, 1), pay_period_end=date(2026, 5, 31),
                          gross_pay=15_417, deductions=1_200, tax_withheld=3_083, net_pay=11_134, status="paid"),
            PayrollRecord(id="pay-002", employee_id="emp-002",
                          pay_period_start=date(2026, 5, 1), pay_period_end=date(2026, 5, 31),
                          gross_pay=17_500, deductions=1_400, tax_withheld=3_500, net_pay=12_600, status="paid"),
            PayrollRecord(id="pay-003", employee_id="emp-003",
                          pay_period_start=date(2026, 5, 1), pay_period_end=date(2026, 5, 31),
                          gross_pay=13_333, deductions=1_100, tax_withheld=2_666, net_pay=9_567, status="pending"),
        ])

        # Accounting transactions
        db.session.add_all([
            Transaction(id="txn-001", date=date(2026, 5, 31), description="May payroll", amount=33_301, type="debit"),
            Transaction(id="txn-002", date=date(2026, 5, 15), description="AWS infrastructure", amount=12_400, type="debit"),
            Transaction(id="txn-003", date=date(2026, 5, 20), description="Customer invoice INV-0001", amount=48_000, type="credit"),
            Transaction(id="txn-004", date=date(2026, 5, 22), description="Office lease", amount=18_000, type="debit"),
        ])

        # Budgets
        db.session.add_all([
            Budget(id="bud-001", department_id="dept-001", fiscal_year=2026, quarter=2,
                   allocated_amount=500_000, spent_amount=312_000, status="active"),
            Budget(id="bud-002", department_id="dept-002", fiscal_year=2026, quarter=2,
                   allocated_amount=300_000, spent_amount=145_000, status="active"),
            Budget(id="bud-003", department_id="dept-003", fiscal_year=2026, quarter=2,
                   allocated_amount=200_000, spent_amount=80_000, status="active"),
        ])

        # Customers
        db.session.add_all([
            Customer(id="cust-001", name="Globex Corp", email="ap@globex.com", phone="+1-555-0100",
                     address="123 Globex Way", credit_limit=100_000, current_balance=24_000, status="active"),
            Customer(id="cust-002", name="Initech", email="ap@initech.com", phone="+1-555-0101",
                     address="456 Initech Plaza", credit_limit=75_000, current_balance=12_500, status="active"),
            Customer(id="cust-003", name="Hooli", email="finance@hooli.com", phone="+1-555-0102",
                     address="1 Hooli Campus", credit_limit=250_000, current_balance=58_000, status="active"),
        ])
        db.session.flush()

        # Invoices
        db.session.add_all([
            Invoice(id="inv-001", invoice_number="INV-0001", customer_id="cust-001",
                    issue_date=date(2026, 5, 1), due_date=date(2026, 5, 31),
                    subtotal=22_222, tax_amount=1_778, total_amount=24_000, status="paid"),
            Invoice(id="inv-002", invoice_number="INV-0002", customer_id="cust-002",
                    issue_date=date(2026, 5, 10), due_date=date(2026, 6, 9),
                    subtotal=11_574, tax_amount=926, total_amount=12_500, status="sent"),
            Invoice(id="inv-003", invoice_number="INV-0003", customer_id="cust-003",
                    issue_date=date(2026, 5, 20), due_date=date(2026, 6, 19),
                    subtotal=53_704, tax_amount=4_296, total_amount=58_000, status="sent"),
        ])

        # Vendors
        db.session.add_all([
            Vendor(id="vend-001", name="Acme Supplies", email="sales@acme.example", phone="+1-555-0200",
                   address="789 Acme Rd", payment_terms="Net 30", status="active"),
            Vendor(id="vend-002", name="Stark Industries", email="orders@stark.example", phone="+1-555-0201",
                   address="200 Park Ave", payment_terms="Net 45", status="active"),
        ])
        db.session.flush()

        # Purchase orders
        db.session.add_all([
            PurchaseOrder(id="po-001", po_number="PO-0001", vendor_id="vend-001",
                          order_date=date(2026, 5, 5), expected_delivery_date=date(2026, 5, 19),
                          total_amount=18_500, status="received"),
            PurchaseOrder(id="po-002", po_number="PO-0002", vendor_id="vend-002",
                          order_date=date(2026, 5, 25), expected_delivery_date=date(2026, 6, 8),
                          total_amount=42_000, status="placed"),
        ])

        # Inventory
        db.session.add_all([
            InventoryItem(id="item-001", sku="SKU-1001", name="Widget A", category="Electronics",
                          unit_price=24.99, quantity_on_hand=420, reorder_point=50, reorder_quantity=200),
            InventoryItem(id="item-002", sku="SKU-1002", name="Widget B", category="Electronics",
                          unit_price=49.99, quantity_on_hand=18, reorder_point=25, reorder_quantity=100),
            InventoryItem(id="item-003", sku="SKU-2001", name="Office Chair", category="Furniture",
                          unit_price=189.00, quantity_on_hand=72, reorder_point=20, reorder_quantity=50),
            InventoryItem(id="item-004", sku="SKU-3001", name="Printer Paper", category="Office Supplies",
                          unit_price=39.50, quantity_on_hand=8, reorder_point=15, reorder_quantity=60),
        ])

        # Shipments
        db.session.add_all([
            Shipment(id="ship-001", tracking_number="TRK-0001", order_id="ord-001", carrier="FedEx",
                     origin="Chicago, IL", destination="Austin, TX",
                     ship_date=date(2026, 5, 28), estimated_delivery=date(2026, 6, 2), status="in_transit"),
            Shipment(id="ship-002", tracking_number="TRK-0002", order_id="ord-002", carrier="UPS",
                     origin="Chicago, IL", destination="Seattle, WA",
                     ship_date=date(2026, 5, 30), estimated_delivery=date(2026, 6, 5), status="in_transit"),
            Shipment(id="ship-003", tracking_number="TRK-0003", order_id="ord-003", carrier="FedEx",
                     origin="Chicago, IL", destination="Boston, MA",
                     ship_date=date(2026, 5, 20), estimated_delivery=date(2026, 5, 25), status="delivered"),
        ])

        db.session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    seed()
