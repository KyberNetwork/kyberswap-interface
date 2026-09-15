import arbitrum from '@/constants/networks/arbitrum';
import arc from '@/constants/networks/arc';
import avalanche from '@/constants/networks/avalanche';
import base from '@/constants/networks/base';
import berachain from '@/constants/networks/berachain';
import blast from '@/constants/networks/blast';
import bsc from '@/constants/networks/bsc';
import ethereum from '@/constants/networks/ethereum';
import fantom from '@/constants/networks/fantom';
import linea from '@/constants/networks/linea';
import mantle from '@/constants/networks/mantle';
import monad from '@/constants/networks/monad';
import optimism from '@/constants/networks/optimism';
import polygon from '@/constants/networks/polygon';
import robinhood from '@/constants/networks/robinhood';
import scroll from '@/constants/networks/scroll';
import sonic from '@/constants/networks/sonic';
import zkSync from '@/constants/networks/zkSync';
import { ChainId } from '@/schema/chain';
import { Token } from '@/schema/token';

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
  /**
   * Set where the native asset is itself an ERC-20 token rather than a separate asset with a wrapper
   * (Arc, where USDC is native). `wrappedToken` is then the only representation there is, so nothing
   * should offer the native sentinel: pools, the zap router and the zap service all work in the
   * token's own units.
   */
  nativeIsErc20?: boolean;
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
  [ChainId.Monad]: monad,
  [ChainId.Robinhood]: robinhood,
  [ChainId.Arc]: arc,
};

export const CHAIN_ID_TO_CHAIN: { [chainId in ChainId]: string } = {
  [ChainId.Ethereum]: 'ethereum',
  [ChainId.PolygonPos]: 'polygon',
  [ChainId.Bsc]: 'bsc',
  [ChainId.Arbitrum]: 'arbitrum',
  [ChainId.Avalanche]: 'avalanche',
  [ChainId.Base]: 'base',
  [ChainId.Blast]: 'blast',
  [ChainId.Fantom]: 'fantom',
  [ChainId.Mantle]: 'mantle',
  [ChainId.Optimism]: 'optimism',
  [ChainId.Scroll]: 'scroll',
  [ChainId.Linea]: 'linea',
  [ChainId.ZkSync]: 'zksync',
  [ChainId.Berachain]: 'berachain',
  [ChainId.Sonic]: 'sonic',
  [ChainId.Monad]: 'monad',
  [ChainId.Robinhood]: 'robinhood',
  [ChainId.Arc]: 'arc',
};
