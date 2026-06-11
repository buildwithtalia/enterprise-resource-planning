"""add columns required by OpenAPI v2 contract but missing from models

Adds every field present in the v2 OpenAPI spec response schemas that was
previously absent from the database: phoneNumber on employees,
bonus/overtime on payroll_records, location/status on inventory_items,
rating on vendors, actualDeliveryDate on purchase_orders, and
totalWeight/shippingCost on shipments.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('employees', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('employees', sa.Column('updated_at', sa.DateTime(), nullable=True))

    op.add_column('payroll_records', sa.Column('bonus', sa.Numeric(12, 2), nullable=True, server_default='0'))
    op.add_column('payroll_records', sa.Column('overtime', sa.Numeric(12, 2), nullable=True, server_default='0'))

    op.add_column('inventory_items', sa.Column('location', sa.String(), nullable=True))
    op.add_column('inventory_items', sa.Column('status', sa.String(), nullable=True, server_default='active'))

    op.add_column('vendors', sa.Column('rating', sa.Numeric(3, 2), nullable=True))

    op.add_column('purchase_orders', sa.Column('actual_delivery_date', sa.Date(), nullable=True))

    op.add_column('shipments', sa.Column('total_weight', sa.Numeric(10, 2), nullable=True))
    op.add_column('shipments', sa.Column('shipping_cost', sa.Numeric(10, 2), nullable=True))


def downgrade():
    op.drop_column('shipments', 'shipping_cost')
    op.drop_column('shipments', 'total_weight')
    op.drop_column('purchase_orders', 'actual_delivery_date')
    op.drop_column('vendors', 'rating')
    op.drop_column('inventory_items', 'status')
    op.drop_column('inventory_items', 'location')
    op.drop_column('payroll_records', 'overtime')
    op.drop_column('payroll_records', 'bonus')
    op.drop_column('employees', 'updated_at')
    op.drop_column('employees', 'created_at')
    op.drop_column('employees', 'phone_number')
