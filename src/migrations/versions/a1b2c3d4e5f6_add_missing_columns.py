"""add missing columns: departments.code, departments.created_at/updated_at, vendors.category

Revision ID: a1b2c3d4e5f6
Revises: 2e34b10b3cfb
Create Date: 2026-06-03 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '2e34b10b3cfb'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('departments', sa.Column('code', sa.String(), nullable=True))
    op.add_column('departments', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('departments', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('vendors', sa.Column('category', sa.String(), nullable=True))


def downgrade():
    op.drop_column('vendors', 'category')
    op.drop_column('departments', 'updated_at')
    op.drop_column('departments', 'created_at')
    op.drop_column('departments', 'code')
