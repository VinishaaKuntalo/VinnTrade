import { NextResponse } from "next/server";

export interface BrokerProviderStatus {
  id: "snaptrade" | "plaid" | "ibkr";
  name: string;
  configured: boolean;
  mode: "oauth" | "gateway" | "manual";
  description: string;
  requiredEnv: string[];
}

export interface BrokerStatusResponse {
  providers: BrokerProviderStatus[];
  note: string;
}

function hasAll(keys: string[]) {
  return keys.every((k) => Boolean(process.env[k]));
}

export async function GET() {
  const providers: BrokerProviderStatus[] = [
    {
      id: "snaptrade",
      name: "SnapTrade",
      configured: hasAll(["SNAPTRADE_CLIENT_ID", "SNAPTRADE_CONSUMER_KEY"]),
      mode: "oauth",
      description: "Brokerage account linking and holdings sync through SnapTrade.",
      requiredEnv: ["SNAPTRADE_CLIENT_ID", "SNAPTRADE_CONSUMER_KEY"],
    },
    {
      id: "plaid",
      name: "Plaid Investments",
      configured: hasAll(["PLAID_CLIENT_ID", "PLAID_SECRET"]),
      mode: "oauth",
      description: "Read-only investments linking through Plaid-supported brokerages.",
      requiredEnv: ["PLAID_CLIENT_ID", "PLAID_SECRET"],
    },
    {
      id: "ibkr",
      name: "Interactive Brokers",
      configured: hasAll(["IBKR_GATEWAY_URL"]),
      mode: "gateway",
      description: "IBKR Gateway/TWS style integration. Requires local or hosted gateway setup.",
      requiredEnv: ["IBKR_GATEWAY_URL"],
    },
  ];

  return NextResponse.json({
    providers,
    note: "CSV import is available now. Direct broker links require provider credentials and user OAuth/gateway setup.",
  } satisfies BrokerStatusResponse);
}
