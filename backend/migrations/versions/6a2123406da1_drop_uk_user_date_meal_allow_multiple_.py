"""drop_uk_user_date_meal_allow_multiple_items_per_meal

Revision ID: 6a2123406da1
Revises: 68962491080c
Create Date: 2026-06-05 10:06:35.215041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a2123406da1'
down_revision: Union[str, None] = '68962491080c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL won't drop an index used by a FK — drop FK first
    op.drop_constraint('weekly_plans_ibfk_1', 'weekly_plans', type_='foreignkey')
    op.drop_constraint('weekly_plans_ibfk_2', 'weekly_plans', type_='foreignkey')
    op.drop_index('uk_user_date_meal', table_name='weekly_plans')
    # Create plain (non-unique) indexes for the FK columns
    op.create_index('idx_weekly_plans_user_id', 'weekly_plans', ['user_id'])
    op.create_index('idx_weekly_plans_recipe_id', 'weekly_plans', ['recipe_id'])
    # Re-create FKs
    op.create_foreign_key('weekly_plans_ibfk_1', 'weekly_plans', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('weekly_plans_ibfk_2', 'weekly_plans', 'recipes', ['recipe_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('weekly_plans_ibfk_1', 'weekly_plans', type_='foreignkey')
    op.drop_constraint('weekly_plans_ibfk_2', 'weekly_plans', type_='foreignkey')
    op.drop_index('idx_weekly_plans_recipe_id', table_name='weekly_plans')
    op.drop_index('idx_weekly_plans_user_id', table_name='weekly_plans')
    op.create_index('uk_user_date_meal', 'weekly_plans', ['user_id', 'plan_date', 'meal_type'], unique=True)
    op.create_foreign_key('weekly_plans_ibfk_1', 'weekly_plans', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('weekly_plans_ibfk_2', 'weekly_plans', 'recipes', ['recipe_id'], ['id'], ondelete='CASCADE')
