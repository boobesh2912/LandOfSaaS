"""Dodo Payments webhook -- the ONLY thing in this app allowed to mark land as claimed.

The frontend's "success" redirect after checkout is purely cosmetic: a user
can close the tab, spoof the redirect, or the browser can crash mid-flight.
None of that should ever grant ownership. Only a signature-verified
`payment.succeeded` event from Dodo does that, which is why every other
territory-mutating code path in this app goes through the atomic
available->pending transition in routers/territories.py, and only THIS
handler is allowed to move pending->claimed.

Dodo Payments signs webhooks per the Standard Webhooks spec (webhook-id /
webhook-signature / webhook-timestamp headers, HMAC-SHA256 over the raw
body). We hand verification off to the official SDK's `webhooks.unwrap()`
rather than re-implementing HMAC comparison ourselves.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dodo_client import get_dodo_client
from app.models import Territory, TerritoryStatus

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger("landofsaas.webhooks")


@router.post("/dodo")
async def dodo_webhook(
    request: Request,
    webhook_id: str = Header(None, alias="webhook-id"),
    webhook_signature: str = Header(None, alias="webhook-signature"),
    webhook_timestamp: str = Header(None, alias="webhook-timestamp"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    client = get_dodo_client()

    try:
        event = client.webhooks.unwrap(
            raw_body.decode("utf-8"),
            headers={
                "webhook-id": webhook_id,
                "webhook-signature": webhook_signature,
                "webhook-timestamp": webhook_timestamp,
            },
        )
    except Exception as exc:  # noqa: BLE001 - any failure here means "reject the request"
        logger.warning("Rejected webhook with invalid/unverifiable signature: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid webhook signature") from exc

    event_type = getattr(event, "type", None)
    if event_type != "payment.succeeded":
        return {"status": "ignored", "event_type": event_type}

    data = event.data
    payment_id = getattr(data, "payment_id", None)
    metadata = getattr(data, "metadata", None) or {}
    territory_id = metadata.get("territory_id") if isinstance(metadata, dict) else None

    if not payment_id:
        logger.error("payment.succeeded event with no payment_id: %r", data)
        raise HTTPException(status_code=422, detail="Malformed event payload")

    # Idempotency: Dodo (like most providers) can redeliver the same event.
    already_applied = db.query(Territory).filter(Territory.dodo_payment_id == payment_id).first()
    if already_applied:
        return {"status": "already_processed"}

    query = db.query(Territory).filter(Territory.status == TerritoryStatus.pending)
    territory = None
    if territory_id:
        territory = query.filter(Territory.id == territory_id).first()
    if territory is None:
        # Fallback: match by the checkout session id we stored when the session
        # was created, in case metadata didn't round-trip onto the payment object.
        checkout_session_id = getattr(data, "checkout_session_id", None)
        if checkout_session_id:
            territory = query.filter(
                Territory.dodo_checkout_session_id == checkout_session_id
            ).first()

    if territory is None:
        logger.error(
            "payment.succeeded (payment_id=%s) did not match any pending territory "
            "(metadata territory_id=%r, checkout_session_id=%r).",
            payment_id,
            territory_id,
            getattr(data, "checkout_session_id", None),
        )
        raise HTTPException(status_code=404, detail="No matching pending territory for this payment")

    territory.status = TerritoryStatus.claimed
    territory.dodo_payment_id = payment_id
    territory.claimed_at = datetime.utcnow()
    territory.hold_expires_at = None
    db.commit()

    return {"status": "ok", "territory_id": territory.id}
