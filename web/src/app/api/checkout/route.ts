import { NextResponse } from "next/server";
import { MAX_BID_CENTS, priceForCents } from "@/lib/pricing";
import { dodo, dodoProductId } from "@/lib/dodo";
import { attachSession, getBuilding, placeHold, releaseHold } from "@/lib/store";
import { parseClaim } from "@/lib/validate";

export const dynamic = "force-dynamic";

const HOLD_MINUTES = Number(process.env.CHECKOUT_HOLD_MINUTES ?? 15);

export async function POST(request: Request) {
  const parsed = parseClaim(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
  const claim = parsed.value;

  const building = await getBuilding(claim.buildingId);
  if (!building) return NextResponse.json({ error: "That building doesn't exist" }, { status: 404 });
  if (building.status === "pending") {
    return NextResponse.json(
      { error: "Someone is checking out on this building right now. Try again in a few minutes." },
      { status: 409 }
    );
  }
  if (building.status === "locked") {
    return NextResponse.json({ error: "That plot hasn't been released yet" }, { status: 409 });
  }

  // The floor price is always recomputed here from stored state. A bid from the
  // browser can only ever raise it, never lower it.
  const required = priceForCents(building, claim.size);
  if (claim.bidCents < required) {
    return NextResponse.json(
      { error: `This building needs at least $${(required / 100).toFixed(0)}`, requiredCents: required },
      { status: 422 }
    );
  }
  if (claim.bidCents > MAX_BID_CENTS) {
    return NextResponse.json(
      { error: `The most you can offer in one go is $${(MAX_BID_CENTS / 100).toLocaleString()}` },
      { status: 422 }
    );
  }

  const held = await placeHold(
    claim.buildingId,
    building.status,
    {
      name: claim.companyName,
      url: claim.websiteUrl,
      color: claim.brandColor,
      email: claim.email,
      logoUrl: claim.logoUrl,
      priceCents: claim.bidCents,
      size: claim.size,
    },
    HOLD_MINUTES
  );
  if (!held) {
    return NextResponse.json({ error: "Somebody just claimed this building — pick another" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const session = await dodo().checkoutSessions.create({
      product_cart: [{ product_id: dodoProductId(), quantity: 1, amount: claim.bidCents }],
      customer: { email: claim.email, name: claim.companyName },
      metadata: { building_id: claim.buildingId },
      return_url: `${appUrl}/claimed?building=${claim.buildingId}`,
    });

    if (!session.checkout_url) throw new Error("Dodo Payments returned no checkout_url");
    await attachSession(claim.buildingId, session.session_id);

    return NextResponse.json({ checkoutUrl: session.checkout_url, amountCents: claim.bidCents });
  } catch (err) {
    // Never leave a building stuck on hold because the payment provider failed.
    await releaseHold(claim.buildingId);
    console.error("Dodo checkout session failed", err);
    return NextResponse.json({ error: "Could not start checkout with Dodo Payments" }, { status: 502 });
  }
}
