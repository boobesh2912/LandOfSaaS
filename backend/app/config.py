from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    dodo_payments_api_key: str
    dodo_payments_environment: str = "test_mode"
    dodo_payments_product_id: str
    dodo_payments_webhook_key: str

    cors_origins: str = "http://localhost:5173"
    frontend_success_url: str = "http://localhost:5173/claimed"
    frontend_cancel_url: str = "http://localhost:5173"

    price_usd_per_km2: float = 2.0
    checkout_hold_minutes: int = 15

    database_url: str = "sqlite:///./landofsaas.db"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
