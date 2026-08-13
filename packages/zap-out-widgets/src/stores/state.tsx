import { create } from 'zustand';

import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId, PoolType, Token, ZapRouteDetail } from '@kyber/schema';

import { BuildRouteData } from '@/utils';

interface BuildDataWithGas extends BuildRouteData {
  gasUsd: number;
}

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

  buildData: BuildDataWithGas | undefined;
  setBuildData: (buildData: BuildDataWithGas | undefined) => void;

  fetchingRoute: boolean;
  route: ZapRouteDetail | null;
  fetchZapOutRoute: (params: {
    chainId: ChainId;
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
    force?: boolean;
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
  buildData: undefined,
  fetchingRoute: false,
  route: null,
  mode: 'zapOut' as const,
};

let abortController: AbortController | null = null;
let latestRequestId = 0;
// Query of the most recently issued route request, so callers re-running on unrelated state
// changes don't re-ask for a quote the store already has. Cleared whenever the answer it
// stands for stops being reusable.
let lastQuery = '';

export const useZapOutUserState = create<ZapOutUserState>((set, get) => ({
  ...initState,
  resetState: () => {
    abortController?.abort();
    abortController = null;
    latestRequestId++;
    lastQuery = '';
    set({ ...initState });
  },
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

  setBuildData: (buildData: BuildDataWithGas | undefined) => {
    // Leaving the preview goes back to a quote that has been sitting untouched — drop the cached
    // query so the next fetch re-prices it instead of being deduped away
    if (!buildData) lastQuery = '';
    set({ buildData });
  },

  setSlippage: (value: number) => set({ slippage: value }),

  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),

  setMode: (mode: 'zapOut' | 'withdrawOnly') => set({ mode }),

  fetchZapOutRoute: async ({ chainId, poolType, positionId, poolAddress, force }) => {
    const { tokenOut, liquidityOut, slippage, mode } = get();

    if ((mode === 'zapOut' && !tokenOut?.address) || liquidityOut === 0n || !slippage) {
      // Invalid input → clear info and abort any in-flight request
      abortController?.abort();
      abortController = null;
      lastQuery = '';
      set({ fetchingRoute: false, route: null });
      return;
    }

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

    const query = `${chainId}${search}`;
    // Nothing that feeds the quote has moved, so the in-flight (or last) request already answers
    // this call — re-issuing it would only cancel a request that was about to resolve
    if (!force && query === lastQuery) return;
    lastQuery = query;

    // Abort previous request and prepare a new controller
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    const requestId = ++latestRequestId;

    set({ fetchingRoute: true });

    try {
      const res = await fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/out/route?${search.slice(1)}`, {
        signal: controller.signal,
      }).then(res => res.json());

      // Only update state if this is the latest request
      if (requestId !== latestRequestId) return;

      if (!res.data) {
        // Nothing to reuse — let the same params be asked again
        lastQuery = '';
        set({ route: null, fetchingRoute: false });
        return;
      }
      set({ route: res.data as ZapRouteDetail, fetchingRoute: false });
    } catch (e) {
      // Ignore abort errors and stale requests
      if (requestId !== latestRequestId) return;
      if ((e as any)?.name === 'AbortError') return;
      console.log(e);
      lastQuery = '';
      set({ fetchingRoute: false, route: null });
    }
  },
}));
