"""make_recipe_id_nullable_add_override_fields

Revision ID: 7b3f2a1c8d9e
Revises: 6a2123406da1
Create Date: 2026-06-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b3f2a1c8d9e'
down_revision: Union[str, None] = '6a2123406da1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop FK that points to recipes (CASCADE → SET NULL)
    op.drop_constraint('weekly_plans_ibfk_2', 'weekly_plans', type_='foreignkey')

    # 2. Make recipe_id nullable
    op.alter_column('weekly_plans', 'recipe_id',
                    existing_type=sa.Integer(),
                    nullable=True)

    # 3. Add override columns for custom foods
    op.add_column('weekly_plans', sa.Column('recipe_name_override', sa.String(200), nullable=True))
    op.add_column('weekly_plans', sa.Column('calories_override', sa.DECIMAL(7, 2), nullable=True))
    op.add_column('weekly_plans', sa.Column('protein_override', sa.DECIMAL(7, 2), nullable=True))
    op.add_column('weekly_plans', sa.Column('carbs_override', sa.DECIMAL(7, 2), nullable=True))
    op.add_column('weekly_plans', sa.Column('fat_override', sa.DECIMAL(7, 2), nullable=True))

    # 4. Re-create FK with SET NULL on delete
    op.create_foreign_key('weekly_plans_ibfk_2', 'weekly_plans', 'recipes',
                          ['recipe_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # 1. Drop FK
    op.drop_constraint('weekly_plans_ibfk_2', 'weekly_plans', type_='foreignkey')

    # 2. Remove override columns
    op.drop_column('weekly_plans', 'fat_override')
    op.drop_column('weekly_plans', 'carbs_override')
    op.drop_column('weekly_plans', 'protein_override')
    op.drop_column('weekly_plans', 'calories_override')
    op.drop_column('weekly_plans', 'recipe_name_override')

    # 3. Make recipe_id NOT NULL again
    op.alter_column('weekly_plans', 'recipe_id',
                    existing_type=sa.Integer(),
                    nullable=False)

    # 4. Re-create FK with CASCADE
    op.create_foreign_key('weekly_plans_ibfk_2', 'weekly_plans', 'recipes',
                          ['recipe_id'], ['id'], ondelete='CASCADE')
