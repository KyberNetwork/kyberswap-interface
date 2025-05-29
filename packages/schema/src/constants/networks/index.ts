import { ChainId } from "@/schema/chain";
import { Token } from "@/schema/token";

import ethereum from "@/constants/networks/ethereum";
import bsc from "@/constants/networks/bsc";
import avalanche from "@/constants/networks/avalanche";
import base from "@/constants/networks/base";
import blast from "@/constants/networks/blast";
import fantom from "@/constants/networks/fantom";
import linea from "@/constants/networks/linea";
import mantle from "@/constants/networks/mantle";
import optimism from "@/constants/networks/optimism";
import scroll from "@/constants/networks/scroll";
import zkSync from "@/constants/networks/zkSync";
import berachain from "@/constants/networks/berachain";
import sonic from "@/constants/networks/sonic";
import polygon from "@/constants/networks/polygon";
import arbitrum from "@/constants/networks/arbitrum";

interface NetworkInfo {
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

export const NETWORKS_INFO: Record<ChainId, NetworkInfo> = {
  [ChainId.Ethereum]: ethereum,
  [ChainId.Bsc]: bsc,
  [ChainId.PolygonPos]: polygon,
  [ChainId.Arbitrum]: arbitrum,
  [ChainId.Avalanche]: avalanche,
  [ChainId.Base]: base,
  [ChainId.Blast]: blast,
  [ChainId.Fantom]: fantom,
  [ChainId.Linea]: linea,
  [ChainId.Mantle]: mantle,
  [ChainId.Optimism]: optimism,
  [ChainId.Scroll]: scroll,
  [ChainId.ZkSync]: zkSync,
  [ChainId.Berachain]: berachain,
  [ChainId.Sonic]: sonic,
};
