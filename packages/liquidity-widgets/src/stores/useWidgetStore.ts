import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

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
  rpcUrl: string;
  error: string | undefined;
  reset: () => void;
  setPositionId: (positionId: string) => void;
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => void;
  setError: (error: string | undefined) => void;
}

const initState = {
  theme: defaultTheme,
  chainId: ChainId.Ethereum,
  rpcUrl: NETWORKS_INFO[ChainId.Ethereum].defaultRpc,
  poolAddress: '',
  positionId: undefined,
  poolType: PoolType.DEX_UNISWAPV3,
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
  initialTick: undefined,
  signTypedData: undefined,
  onClose: undefined,
  onOpenZapMigration: undefined,
  onSuccess: undefined,
  onViewPosition: undefined,
  nativeToken: defaultToken,
  wrappedNativeToken: defaultToken,
  error: undefined,
  setError: () => {},
  onConnectWallet: () => {},
  onSwitchChain: () => {},
  onSubmitTx: (_txData: { from: string; to: string; value: string; data: string; gasLimit: string }) =>
    Promise.resolve(''),
};

const useWidgetRawStore = create<WidgetState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => {
    const { theme, onClose, chainId, rpcUrl } = props;
    const themeToApply =
      theme && typeof theme === 'object'
        ? {
            ...defaultTheme,
            ...theme,
          }
        : defaultTheme;

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;

    set({
      ...props,
      rpcUrl: rpcUrl ?? NETWORKS_INFO[chainId].defaultRpc,
      theme: themeToApply,
      onClose: onClose
        ? () => {
            resetStore();
            onClose();
          }
        : undefined,
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
  setError: (error: string | undefined) => set({ error }),
}));

type WidgetStoreKeys = keyof ReturnType<typeof useWidgetRawStore.getState>;

export const useWidgetStore = <K extends WidgetStoreKeys>(keys: K[]) => {
  return useWidgetRawStore(
    useShallow(s =>
      keys.reduce(
        (acc, key) => {
          acc[key] = s[key];
          return acc;
        },
        {} as Pick<typeof s, K>,
      ),
    ),
  );
};
