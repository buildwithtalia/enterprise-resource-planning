"""fix spec drift: add missing fields for Employee, Customer, Invoice, Vendor

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Employee: add job_title and phone_number (spec fields jobTitle, phoneNumber)
    op.add_column('employees', sa.Column('job_title', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('phone_number', sa.String(), nullable=True))

    # Customer: add payment_terms (spec requires paymentTerms on CustomerInput)
    op.add_column('customers', sa.Column('payment_terms', sa.String(), nullable=True,
                                         server_default='Net 30'))

    # Invoice: add paid_amount and balance_due (spec fields paidAmount, balanceDue)
    op.add_column('invoices', sa.Column('paid_amount', sa.Numeric(15, 2), nullable=True,
                                        server_default='0'))
    op.add_column('invoices', sa.Column('balance_due', sa.Numeric(15, 2), nullable=True))

    # Vendor: add rating (spec Vendor schema field)
    op.add_column('vendors', sa.Column('rating', sa.Numeric(3, 2), nullable=True))


def downgrade():
    op.drop_column('vendors', 'rating')
    op.drop_column('invoices', 'balance_due')
    op.drop_column('invoices', 'paid_amount')
    op.drop_column('customers', 'payment_terms')
    op.drop_column('employees', 'phone_number')
    op.drop_column('employees', 'job_title')
