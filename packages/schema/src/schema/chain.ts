import { z } from "zod";
import { token } from "@/schema/token";

export enum ChainId {
  Ethereum = 1,
  Bsc = 56,
  PolygonPos = 137,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  Fantom = 250,
  Linea = 59144,
  Mantle = 5000,
  Optimism = 10,
  Scroll = 534352,
  ZkSync = 324,
  Berachain = 80094,
  Sonic = 146,
}

export const chainId = z.nativeEnum(ChainId);

export const chain = z.object({
  chainId,
  logo: z.string(),
  name: z.string(),
  scanLink: z.string(),
  multiCall: z.string(),
  nativeLogo: z.string(),
  wrappedToken: token,
  defaultRpc: z.string(),
  zapPath: z.string(),
});

export type Chain = z.infer<typeof chain>;
