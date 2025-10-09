import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { ChainId, NETWORKS_INFO, PoolType, Theme, defaultTheme } from '@kyber/schema';

interface WidgetProps {
  chainId: ChainId;
  rpcUrl?: string;
  theme: Theme;
  sourcePoolType?: PoolType;
  targetPoolType?: PoolType;
  rePositionMode?: boolean;
  client: string;
  referral?: string;
  connectedAccount: {
    address: string | undefined;
    chainId: number;
  };
}

interface WidgetState extends WidgetProps {
  rpcUrl: string;
  widgetError: string;
  setWidgetError: (error: string) => void;
  reset: () => void;
  setInitiaWidgetState: (props: WidgetProps) => void;
}

const initState = {
  theme: defaultTheme,
  chainId: ChainId.Ethereum,
  rpcUrl: NETWORKS_INFO[ChainId.Ethereum].defaultRpc,
  sourcePoolType: undefined,
  targetPoolType: undefined,
  rePositionMode: false,
  client: '',
  referral: undefined,
  connectedAccount: {
    address: undefined,
    chainId: ChainId.Ethereum,
  },
  widgetError: '',
};

const useWidgetRawStore = create<WidgetState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  setInitiaWidgetState: ({
    theme,
    chainId,
    rpcUrl,
    rePositionMode,
    sourcePoolType,
    targetPoolType,
    client,
    referral,
    connectedAccount,
  }: WidgetProps) => {
    const themeToApply =
      theme && typeof theme === 'object'
        ? {
            ...defaultTheme,
            ...theme,
          }
        : defaultTheme;

    set({
      theme: themeToApply,
      chainId,
      rpcUrl: rpcUrl ?? NETWORKS_INFO[chainId].defaultRpc,
      rePositionMode,
      sourcePoolType,
      targetPoolType,
      client,
      referral,
      connectedAccount,
    });
  },
  setWidgetError: (error: string) => set({ widgetError: error }),
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
