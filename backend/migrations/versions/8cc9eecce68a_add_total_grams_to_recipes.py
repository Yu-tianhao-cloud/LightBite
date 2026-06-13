"""add_total_grams_to_recipes

Revision ID: 8cc9eecce68a
Revises: 1467b56a0221
Create Date: 2026-06-09 15:42:58.338809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8cc9eecce68a'
down_revision: Union[str, None] = '1467b56a0221'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('total_grams', sa.DECIMAL(8, 2), nullable=True))
    # For ingredient-type entries, default_servings IS the gram weight per serving
    op.execute("""
        UPDATE recipes SET total_grams = default_servings
        WHERE category = 'ingredient' AND default_servings IS NOT NULL
    """)
    # For recipe-type entries, total_grams = sum of ingredient amounts
    op.execute("""
        UPDATE recipes r
        SET total_grams = (
            SELECT SUM(ri.amount_grams)
            FROM recipe_ingredients ri
            WHERE ri.recipe_id = r.id
        )
        WHERE r.category != 'ingredient'
          AND EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id)
    """)


def downgrade() -> None:
    op.drop_column('recipes', 'total_grams')
