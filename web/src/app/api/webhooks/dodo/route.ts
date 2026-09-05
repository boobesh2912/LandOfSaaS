/**
 * The only route in this app that can hand a building to somebody.
 *
 * The browser's return from checkout is cosmetic — it can be closed, spoofed,
 * or replayed. Ownership moves only on a signature-verified `payment.succeeded`
 * event from Dodo Payments, which is why every other route can do no more than
 * put a building on a temporary hold.
 */

import { NextResponse } from "next/server";
import { dodo } from "@/lib/dodo";
import { applyPayment, findByPaymentId, findPendingBySession, getBuilding } from "@/lib/store";
import type { BuildingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event;
  try {
    event = dodo().webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      },
    });
  } catch (err) {
    console.warn("Rejected webhook with an unverifiable signature", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ status: "ignored", type: event.type });
  }

  const data = event.data as { payment_id?: string; metadata?: Record<string, string>; checkout_session_id?: string };
  const paymentId = data.payment_id;
  if (!paymentId) {
    console.error("payment.succeeded arrived without a payment_id");
    return NextResponse.json({ error: "Malformed event" }, { status: 422 });
  }

  // Providers redeliver. Applying the same payment twice must be a no-op.
  if (await findByPaymentId(paymentId)) {
    return NextResponse.json({ status: "already_processed" });
  }

  let building: BuildingRow | null = null;
  const buildingId = data.metadata?.building_id;
  if (buildingId) {
    const candidate = await getBuilding(buildingId);
    if (candidate?.status === "pending") building = candidate;
  }
  if (!building && data.checkout_session_id) {
    building = await findPendingBySession(data.checkout_session_id);
  }

  if (!building) {
    console.error(
      `payment.succeeded (${paymentId}) matched no building on hold ` +
        `(metadata.building_id=${buildingId ?? "none"}, session=${data.checkout_session_id ?? "none"})`
    );
    return NextResponse.json({ error: "No building on hold for this payment" }, { status: 404 });
  }

  const updated = await applyPayment(building, paymentId);
  return NextResponse.json({ status: "ok", building: updated.slug });
}
