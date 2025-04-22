import { Token } from "@/schema";

export enum PositionStatus {
  IN_RANGE = "IN_RANGE",
  OUT_RANGE = "OUT_RANGE",
}

export interface NetworkInfo {
  name: string;
  logo: string;
  scanLink: string;
  multiCall: string;
  defaultRpc: string;
  wrappedToken: Token;
  nativeLogo: string;
  coingeckoNetworkId: string | null;
  coingeckoNativeTokenId: string | null;
}
