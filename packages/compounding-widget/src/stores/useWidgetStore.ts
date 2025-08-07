import { create } from 'zustand';

import {
  ChainId,
  NATIVE_TOKEN_ADDRESS,
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
  chainId: ChainId.Ethereum,
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
  onClose: () => {},
  onConnectWallet: () => {},
  onSwitchChain: () => {},
  onSubmitTx: (_txData: { from: string; to: string; value: string; data: string; gasLimit: string }) =>
    Promise.resolve(''),
  onOpenZapMigration: undefined,
  onViewPosition: undefined,
  nativeToken: defaultToken,
  wrappedNativeToken: defaultToken,
};

export const useWidgetStore = create<WidgetState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => {
    const { onClose, chainId } = props;

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;

    set({
      ...props,
      onClose: () => {
        resetStore();
        onClose();
      },
    });

    set({
      nativeToken: {
        ...wrappedNativeToken,
        address: NATIVE_TOKEN_ADDRESS.toLowerCase(),
        decimals: wrappedNativeToken.decimals,
        symbol: wrappedNativeToken.symbol.slice(1) || '',
        logo: NETWORKS_INFO[chainId].nativeLogo,
        name: 'Ethereum',
      },
      wrappedNativeToken,
    });
  },
  setPositionId: (positionId: string) => set({ positionId }),
}));
