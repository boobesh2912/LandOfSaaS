from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dodo_client import get_dodo_client
from app.models import Territory, TerritoryStatus
from app.schemas import CheckoutRequest, CheckoutResponse, TerritoryOut
from app.services.images import load_and_sanitize_logo
from app.services.pricing import price_cents_for_area

router = APIRouter(prefix="/api/territories", tags=["territories"])


def _release_expired_holds(db: Session) -> None:
    now = datetime.utcnow()
    expired = (
        db.query(Territory)
        .filter(Territory.status == TerritoryStatus.pending, Territory.hold_expires_at < now)
        .all()
    )
    for t in expired:
        t.status = TerritoryStatus.available
        t.company_name = None
        t.tagline = None
        t.website_url = None
        t.bg_color = None
        t.logo_image = None
        t.dodo_checkout_session_id = None
        t.hold_expires_at = None
    if expired:
        db.commit()


def _to_public(t: Territory) -> TerritoryOut:
    # Customization is only ever shown to the world once payment is confirmed --
    # a "pending" hold (someone mid-checkout) must not leak a company's branding
    # before they've actually paid for the land.
    reveal = t.status == TerritoryStatus.claimed
    return TerritoryOut(
        id=t.id,
        name=t.name,
        region=t.region,
        path_svg=t.path_svg,
        centroid_x=t.centroid_x,
        centroid_y=t.centroid_y,
        area_km2=t.area_km2,
        price_cents=t.price_cents,
        status=t.status.value,
        company_name=t.company_name if reveal else None,
        tagline=t.tagline if reveal else None,
        website_url=t.website_url if reveal else None,
        bg_color=t.bg_color if reveal else None,
        has_logo=reveal and t.logo_image is not None,
    )


@router.get("", response_model=list[TerritoryOut])
def list_territories(db: Session = Depends(get_db)):
    _release_expired_holds(db)
    return [_to_public(t) for t in db.query(Territory).all()]


@router.get("/{territory_id}", response_model=TerritoryOut)
def get_territory(territory_id: str, db: Session = Depends(get_db)):
    _release_expired_holds(db)
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t:
        raise HTTPException(404, "Territory not found")
    return _to_public(t)


@router.get("/{territory_id}/logo")
def get_logo(territory_id: str, db: Session = Depends(get_db)):
    t = db.query(Territory).filter(Territory.id == territory_id).first()
    if not t or t.status != TerritoryStatus.claimed or not t.logo_image:
        raise HTTPException(404, "No logo for this territory")
    return Response(content=t.logo_image, media_type="image/png")


@router.post("/{territory_id}/checkout", response_model=CheckoutResponse)
async def create_checkout(
    territory_id: str,
    company_name: str = Form(...),
    tagline: str = Form(""),
    website_url: str = Form(""),
    bg_color: str = Form("#4ADE80"),
    buyer_email: str = Form(...),
    logo: UploadFile | None = None,
    db: Session = Depends(get_db),
):
    settings = get_settings()
    _release_expired_holds(db)

    try:
        payload = CheckoutRequest(
            company_name=company_name,
            tagline=tagline,
            website_url=website_url,
            bg_color=bg_color,
            buyer_email=buyer_email,
        )
    except ValidationError as exc:
        raise HTTPException(422, exc.errors())

    territory = db.query(Territory).filter(Territory.id == territory_id).first()
    if not territory:
        raise HTTPException(404, "Territory not found")

    # Price is always recomputed from the territory's fixed area server-side --
    # the client never gets to say how much it costs.
    price_cents = price_cents_for_area(territory.area_km2)

    logo_bytes = await load_and_sanitize_logo(logo) if logo is not None and logo.filename else None

    hold_expires_at = datetime.utcnow() + timedelta(minutes=settings.checkout_hold_minutes)

    # Atomic claim of the hold: only succeeds if nobody beat us to this territory.
    claimed_rows = (
        db.query(Territory)
        .filter(Territory.id == territory_id, Territory.status == TerritoryStatus.available)
        .update(
            {
                Territory.status: TerritoryStatus.pending,
                Territory.company_name: payload.company_name,
                Territory.tagline: payload.tagline,
                Territory.website_url: payload.website_url,
                Territory.bg_color: payload.bg_color,
                Territory.logo_image: logo_bytes,
                Territory.hold_expires_at: hold_expires_at,
                Territory.price_cents: price_cents,
            }
        )
    )
    db.commit()
    if claimed_rows == 0:
        raise HTTPException(409, "This territory was just claimed by someone else — pick another one")

    client = get_dodo_client()
    try:
        session = client.checkout_sessions.create(
            product_cart=[
                {
                    "product_id": settings.dodo_payments_product_id,
                    "quantity": 1,
                    "amount": price_cents,
                }
            ],
            customer={"email": payload.buyer_email},
            metadata={"territory_id": territory_id},
            return_url=f"{settings.frontend_success_url}?territory_id={territory_id}",
        )
    except Exception as exc:  # noqa: BLE001 - roll back the hold on any payment-provider failure
        db.query(Territory).filter(Territory.id == territory_id).update(
            {
                Territory.status: TerritoryStatus.available,
                Territory.company_name: None,
                Territory.tagline: None,
                Territory.website_url: None,
                Territory.bg_color: None,
                Territory.logo_image: None,
                Territory.hold_expires_at: None,
            }
        )
        db.commit()
        raise HTTPException(502, "Could not start checkout with Dodo Payments") from exc

    checkout_url = getattr(session, "checkout_url", None) or getattr(session, "url", None)
    session_id = getattr(session, "session_id", None) or getattr(session, "id", None)
    if not checkout_url:
        raise HTTPException(502, "Dodo Payments did not return a checkout URL")

    db.query(Territory).filter(Territory.id == territory_id).update(
        {Territory.dodo_checkout_session_id: session_id}
    )
    db.commit()

    return CheckoutResponse(
        checkout_url=checkout_url,
        territory_id=territory_id,
        price_cents=price_cents,
        hold_expires_at=hold_expires_at.isoformat(),
    )
