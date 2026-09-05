import re

from pydantic import BaseModel, Field, field_validator

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class TerritoryOut(BaseModel):
    id: str
    name: str
    region: str
    path_svg: str
    centroid_x: float
    centroid_y: float
    area_km2: float
    price_cents: int
    status: str
    company_name: str | None = None
    tagline: str | None = None
    website_url: str | None = None
    bg_color: str | None = None
    has_logo: bool = False

    model_config = {"from_attributes": True}


class CheckoutRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=60)
    tagline: str = Field(default="", max_length=120)
    website_url: str = Field(default="", max_length=300)
    bg_color: str = Field(default="#4ADE80")
    buyer_email: str = Field(max_length=254)

    @field_validator("bg_color")
    @classmethod
    def validate_hex(cls, v: str) -> str:
        if not HEX_COLOR_RE.match(v):
            raise ValueError("bg_color must be a #rrggbb hex value")
        return v

    @field_validator("website_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("website_url must start with http:// or https://")
        return v

    @field_validator("buyer_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("buyer_email must be a valid email address")
        return v

    @field_validator("company_name", "tagline")
    @classmethod
    def strip_and_check(cls, v: str) -> str:
        v = v.strip()
        return v


class CheckoutResponse(BaseModel):
    checkout_url: str
    territory_id: str
    price_cents: int
    hold_expires_at: str
