from app.config import get_settings


def price_cents_for_area(area_km2: float) -> int:
    """Server-side source of truth for price. Never trust a client-supplied amount."""
    settings = get_settings()
    usd = area_km2 * settings.price_usd_per_km2
    return max(round(usd * 100), 100)  # floor at $1.00 so tiny slivers stay payable
