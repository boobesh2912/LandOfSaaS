from functools import lru_cache

from dodopayments import DodoPayments

from app.config import get_settings


@lru_cache
def get_dodo_client() -> DodoPayments:
    settings = get_settings()
    return DodoPayments(
        bearer_token=settings.dodo_payments_api_key,
        environment=settings.dodo_payments_environment,
    )
