import DodoPayments from "dodopayments";

let client: DodoPayments | null = null;

export function dodo(): DodoPayments {
  if (!client) {
    const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
    if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not set");
    client = new DodoPayments({
      bearerToken,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
      environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ?? "test_mode",
    });
  }
  return client;
}

export function dodoProductId(): string {
  const id = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!id) throw new Error("DODO_PAYMENTS_PRODUCT_ID is not set");
  return id;
}
