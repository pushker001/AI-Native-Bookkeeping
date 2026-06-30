"""add users table and transaction foreign key

Revision ID: 2c1d8f40f4c9
Revises: 09f77b6ff275
Create Date: 2026-06-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2c1d8f40f4c9"
down_revision: Union[str, Sequence[str], None] = "09f77b6ff275"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("organization_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_user_id"), "users", ["user_id"], unique=False)

    # Existing transaction rows predate the users table, so create matching
    # placeholder users before adding the foreign key constraint.
    op.execute(
        """
        INSERT INTO users (user_id, organization_name, email, created_at)
        SELECT DISTINCT
            transactions.user_id,
            'Unknown Organization',
            transactions.user_id || '@unknown.local',
            NOW()
        FROM transactions
        WHERE transactions.user_id IS NOT NULL
        ON CONFLICT (user_id) DO NOTHING
        """
    )

    op.alter_column("transactions", "user_id", server_default=None)
    op.create_foreign_key(
        "fk_transactions_user_id_users",
        "transactions",
        "users",
        ["user_id"],
        ["user_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_transactions_user_id_users", "transactions", type_="foreignkey")
    op.alter_column("transactions", "user_id", server_default="default_user")
    op.drop_index(op.f("ix_users_user_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
