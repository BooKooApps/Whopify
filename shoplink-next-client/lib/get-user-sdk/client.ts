import { createWhopClient } from "../sdk/whop";

export function getClientWhopClient() {
  const baseUrl = process.env.NEXT_PUBLIC_WHOP_API_BASE_URL || undefined;
  return createWhopClient({ baseUrl });
}


