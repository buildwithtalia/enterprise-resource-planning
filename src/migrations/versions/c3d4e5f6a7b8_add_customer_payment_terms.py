"""add customers.payment_terms — required by API v2 contract (CustomerInput)

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('customers', sa.Column('payment_terms', sa.String(), nullable=True))


def downgrade():
    op.drop_column('customers', 'payment_terms')
