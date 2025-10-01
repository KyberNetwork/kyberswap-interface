import { create } from 'zustand';

import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId, PoolType, Token, ZapRouteDetail } from '@kyber/schema';

interface ZapOutUserState {
  ttl: number;
  setTtl: (value: number) => void;

  showSetting: boolean;
  toggleSetting: (highlightDegenMode?: boolean) => void;

  degenMode: boolean;
  toggleDegenMode: () => void;

  slippage: number | undefined;
  setSlippage: (value: number) => void;

  liquidityOut: bigint;
  setLiquidityOut: (liquidity: bigint) => void;

  tokenOut: Token | null;
  setTokenOut: (token: Token) => void;

  showPreview: boolean;
  togglePreview: () => void;

  fetchingRoute: boolean;
  route: ZapRouteDetail | null;
  fetchZapOutRoute: (params: {
    chainId: ChainId;
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
    signal?: AbortSignal;
  }) => Promise<void>;
  highlightDegenMode: boolean;
  resetState: () => void;
  mode: 'zapOut' | 'withdrawOnly';
  setMode: (mode: 'zapOut' | 'withdrawOnly') => void;
}

const initState = {
  ttl: 20,
  tokenOut: null,
  showSetting: false,
  highlightDegenMode: false,
  degenMode: false,
  slippage: undefined,
  liquidityOut: 0n,
  showPreview: false,
  fetchingRoute: false,
  route: null,
  mode: 'zapOut' as const,
};

export const useZapOutUserState = create<ZapOutUserState>((set, get) => ({
  ...initState,
  resetState: () => set({ ...initState }),
  setTtl: (value: number) => set({ ttl: value }),
  setTokenOut: token => set({ tokenOut: token }),
  toggleSetting: highlightDegenMode => {
    set(state => ({
      showSetting: !state.showSetting,
      highlightDegenMode: Boolean(highlightDegenMode),
    }));
    if (highlightDegenMode) {
      setTimeout(() => {
        set({ highlightDegenMode: false });
      }, 4000);
    }
  },

  toggleDegenMode: () => set(state => ({ degenMode: !state.degenMode })),

  setSlippage: (value: number) => set({ slippage: value }),

  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),

  setMode: (mode: 'zapOut' | 'withdrawOnly') => set({ mode }),

  togglePreview: () => set(state => ({ showPreview: !state.showPreview })),

  fetchZapOutRoute: async ({ chainId, poolType, positionId, poolAddress, signal }) => {
    const { tokenOut, liquidityOut, slippage, mode } = get();

    if ((mode === 'zapOut' && !tokenOut?.address) || liquidityOut === 0n || !slippage) {
      set({ fetchingRoute: false, route: null });
      return;
    }

    set({ fetchingRoute: true });
    const params: { [key: string]: string | number | boolean } = {
      dexFrom: poolType,
      'poolFrom.id': poolAddress,
      'positionFrom.id': positionId,
      liquidityOut: liquidityOut.toString(),
      slippage,
      ...(mode === 'zapOut' &&
        tokenOut?.address && {
          tokenOut: tokenOut.address,
        }),
    };

    let search = '';
    Object.keys(params).forEach(key => {
      search = `${search}&${key}=${params[key]}`;
    });

    try {
      const res = await fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/out/route?${search.slice(1)}`, {
        signal,
      }).then(res => res.json());

      if (!res.data) {
        set({ route: null, fetchingRoute: false });
        return;
      }
      set({ route: res.data as ZapRouteDetail, fetchingRoute: false });
    } catch (e) {
      if (signal?.aborted || (e as any)?.name === 'AbortError') {
        return;
      }
      console.log(e);
      set({ fetchingRoute: false, route: null });
    }
  },
}));
