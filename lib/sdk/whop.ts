import { WhopSDK } from "@whop-sdk/core";

type WhopClientOptions = {
  token?: string | null;
  baseUrl?: string | null;
};

export function createWhopClient(options: WhopClientOptions = {}) {
  const { token, baseUrl } = options;
  return new WhopSDK({
    TOKEN: token || undefined,
    BASE: baseUrl || undefined,
  });
}


