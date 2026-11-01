"""Wybrana okładka podróży: ``trips.cover_photo_id``.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-31 12:30:00.000000

``NULL`` = okładką jest pierwsze zdjęcie albumu, więc istniejące podróże nie wymagają zmian.
Usunięcie zdjęcia-okładki ustawia ``NULL`` (wymaga ``PRAGMA foreign_keys=ON``, włączanego
w ``app/db/session.py``).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("trips", schema=None) as batch_op:
        batch_op.add_column(sa.Column("cover_photo_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            op.f("fk_trips_cover_photo_id_photos"),
            "photos",
            ["cover_photo_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("trips", schema=None) as batch_op:
        batch_op.drop_constraint(op.f("fk_trips_cover_photo_id_photos"), type_="foreignkey")
        batch_op.drop_column("cover_photo_id")
