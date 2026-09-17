import { create } from 'zustand';

import { ApprovalAdditionalInfo } from '@kyber/hooks';
import {
  ChainId,
  NATIVE_TOKEN_ADDRESS,
  NATIVE_TOKEN_DECIMALS,
  NETWORKS_INFO,
  PoolType,
  Theme,
  Token,
  defaultTheme,
  defaultToken,
} from '@kyber/schema';

import { WidgetProps } from '@/types/index';

interface WidgetState extends WidgetProps {
  theme: Theme;
  rpcUrl: string;
  nativeToken: Token;
  wrappedNativeToken: Token;
  reset: () => void;
  setPositionId: (positionId: string) => void;
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => void;
}

const initState = {
  theme: defaultTheme,
  poolAddress: '',
  positionId: '',
  poolType: PoolType.DEX_UNISWAPV3,
  dexId: undefined,
  chainId: ChainId.Ethereum,
  rpcUrl: NETWORKS_INFO[ChainId.Ethereum].defaultRpc,
  connectedAccount: {
    address: '',
    chainId: ChainId.Ethereum,
  },
  initDepositTokens: '',
  initAmounts: '',
  source: '',
  aggregatorOptions: undefined,
  feeConfig: undefined,
  referral: undefined,
  compoundType: undefined,
  onClose: () => {},
  onConnectWallet: () => {},
  onSwitchChain: () => {},
  onSubmitTx: (
    _txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    _additionalInfo?:
      | {
          type: 'zap';
          tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>;
          pool: string;
          dexLogo: string;
        }
      | ApprovalAdditionalInfo,
  ) => Promise.resolve(''),
  onOpenZapMigration: undefined,
  onViewPosition: undefined,
  onOpenPoolDetail: undefined,
  nativeToken: defaultToken,
  wrappedNativeToken: defaultToken,
};

export const useWidgetStore = create<WidgetState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => {
    const { onClose, chainId, rpcUrl, txHashMapping } = props;

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;

    set({
      ...props,
      rpcUrl: rpcUrl ?? NETWORKS_INFO[chainId].defaultRpc,
      txHashMapping,
      onClose: () => {
        resetStore();
        onClose();
      },
    });

    // Where the native asset is itself an ERC-20 token, the wrapped entry describes that same asset,
    // so its symbol and name already name the native form — dropping a leading "W" would mangle it.
    const nativeIsErc20 = NETWORKS_INFO[chainId].nativeIsErc20;

    set({
      nativeToken: {
        ...wrappedNativeToken,
        address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
        decimals: NATIVE_TOKEN_DECIMALS,
        symbol: nativeIsErc20 ? wrappedNativeToken.symbol : wrappedNativeToken.symbol.slice(1) || '',
        logo: NETWORKS_INFO[chainId].nativeLogo,
        name: nativeIsErc20 ? wrappedNativeToken.name : 'Ethereum',
      },
      wrappedNativeToken,
    });
  },
  setPositionId: (positionId: string) => set({ positionId }),
}));
