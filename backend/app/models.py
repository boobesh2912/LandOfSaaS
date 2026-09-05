import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TerritoryStatus(str, enum.Enum):
    available = "available"
    pending = "pending"  # checkout session opened, held briefly, not yet paid
    claimed = "claimed"  # payment confirmed by webhook


class Territory(Base):
    __tablename__ = "territories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(64))
    region: Mapped[str] = mapped_column(String(32))  # AI / Dev / Marketing / Design / Growth / Community
    path_svg: Mapped[str] = mapped_column(String)
    centroid_x: Mapped[float] = mapped_column(Float)
    centroid_y: Mapped[float] = mapped_column(Float)
    area_km2: Mapped[float] = mapped_column(Float)
    price_cents: Mapped[int] = mapped_column(Integer)

    status: Mapped[TerritoryStatus] = mapped_column(
        Enum(TerritoryStatus), default=TerritoryStatus.available, index=True
    )

    # Claim + customization (only meaningful once status != available)
    company_name: Mapped[str | None] = mapped_column(String(60), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(120), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    bg_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # #rrggbb
    logo_image: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)  # re-encoded PNG bytes

    # Payment tracking (idempotency + anti-tamper)
    dodo_checkout_session_id: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)
    dodo_payment_id: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
