"""add_grams_to_weekly_plans

Revision ID: 1467b56a0221
Revises: 7b3f2a1c8d9e
Create Date: 2026-06-09 15:33:24.862471

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1467b56a0221'
down_revision: Union[str, None] = '7b3f2a1c8d9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('weekly_plans', sa.Column('grams', sa.DECIMAL(8, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('weekly_plans', 'grams')
