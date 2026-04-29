import { NextRequest, NextResponse } from "next/server";

type BrokerId = "snaptrade" | "plaid" | "ibkr";

const PROVIDER_ENV: Record<BrokerId, string[]> = {
  snaptrade: ["SNAPTRADE_CLIENT_ID", "SNAPTRADE_CONSUMER_KEY"],
  plaid: ["PLAID_CLIENT_ID", "PLAID_SECRET"],
  ibkr: ["IBKR_GATEWAY_URL"],
};

function isBrokerId(value: string): value is BrokerId {
  return value === "snaptrade" || value === "plaid" || value === "ibkr";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const provider = String(body.provider ?? "");

  if (!isBrokerId(provider)) {
    return NextResponse.json({ error: "Unsupported broker provider" }, { status: 400 });
  }

  const missing = PROVIDER_ENV[provider].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        provider,
        configured: false,
        error: "Broker provider is not configured yet.",
        missing,
        nextStep:
          provider === "ibkr"
            ? "Configure IBKR_GATEWAY_URL after setting up IBKR Gateway/TWS access."
            : "Add provider credentials, then replace this endpoint with the provider's OAuth link-token/session flow.",
      },
      { status: 501 }
    );
  }

  return NextResponse.json(
    {
      provider,
      configured: true,
      error: "Provider credentials are present, but the OAuth/session exchange is not implemented in this build yet.",
      nextStep: "Install the provider SDK and create the user-specific connect URL/session here.",
    },
    { status: 501 }
  );
}
