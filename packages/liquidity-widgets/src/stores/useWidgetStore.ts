import { create } from 'zustand';

import { ChainId, PoolType, Theme, defaultTheme } from '@kyber/schema';

import { WidgetProps } from '@/types/index';

interface WidgetState extends WidgetProps {
  theme: Theme;
  reset: () => void;
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => void;
}

const initState = {
  theme: defaultTheme,
  poolAddress: '',
  positionId: undefined,
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
};

export const useWidgetStore = create<WidgetState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  setInitiaWidgetState: (props: WidgetProps, resetStore: () => void) => {
    const { reset: resetWidgetStore } = get();
    const { theme, onClose } = props;
    const themeToApply =
      theme && typeof theme === 'object'
        ? {
            ...defaultTheme,
            ...theme,
          }
        : defaultTheme;

    set({
      ...props,
      theme: themeToApply,
      onClose: () => {
        resetStore();
        resetWidgetStore();
        onClose();
      },
    });
  },
}));
