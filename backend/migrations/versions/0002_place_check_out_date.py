"""Nocleg od–do: data wymeldowania w ``places``.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-31 12:00:00.000000

Istniejące pozycje dostają ``NULL`` (= jedna noc), więc dane nie wymagają przeliczenia.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("places", schema=None) as batch_op:
        batch_op.add_column(sa.Column("check_out_date", sa.Date(), nullable=True))
        batch_op.create_check_constraint(
            op.f("ck_places_check_out_after_visit"),
            "check_out_date IS NULL OR check_out_date > visit_date",
        )


def downgrade() -> None:
    with op.batch_alter_table("places", schema=None) as batch_op:
        batch_op.drop_constraint(op.f("ck_places_check_out_after_visit"), type_="check")
        batch_op.drop_column("check_out_date")
