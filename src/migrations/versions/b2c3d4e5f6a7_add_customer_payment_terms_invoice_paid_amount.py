"""add customers.payment_terms and invoices.paid_amount

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('customers', sa.Column('payment_terms', sa.String(), nullable=True, server_default='Net 30'))
    op.add_column('invoices', sa.Column('paid_amount', sa.Numeric(15, 2), nullable=True, server_default='0'))


def downgrade():
    op.drop_column('invoices', 'paid_amount')
    op.drop_column('customers', 'payment_terms')
