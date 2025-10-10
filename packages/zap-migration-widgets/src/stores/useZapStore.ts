import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId, UniV3Position, ZapRouteDetail, univ3Types } from '@kyber/schema';

import { usePoolRawStore } from '@/stores/usePoolStore';
import { usePositionRawStore } from '@/stores/usePositionStore';
import { BuildRouteData } from '@/utils';

interface BuildDataWithGas extends BuildRouteData {
  gasUsd: number;
}

interface ZapState {
  slippage?: number;
  setSlippage: (value: number) => void;

  liquidityOut: bigint;
  setLiquidityOut: (liquidity: bigint) => void;

  tickLower: number | null;
  tickUpper: number | null;
  setTickLower: (tickLower: number) => void;
  setTickUpper: (tickUpper: number) => void;

  route: ZapRouteDetail | null;
  fetchingRoute: boolean;
  fetchZapRoute: (chainId: ChainId, client: string, account: string) => Promise<void>;

  buildData: BuildDataWithGas | undefined;
  setBuildData: (buildData: BuildDataWithGas | undefined) => void;

  highlightDegenMode: boolean;
  degenMode: boolean;
  toggleDegenMode: () => void;

  showSetting: boolean;
  toggleSetting: (highlightDegenMode?: boolean) => void;

  ttl: number;
  setTtl: (value: number) => void;

  reset: () => void;
}

const initState = {
  showSetting: false,
  ttl: 20,
  degenMode: false,
  slippage: undefined,
  buildData: undefined,
  liquidityOut: 0n,
  tickLower: null,
  tickUpper: null,
  fetchingRoute: false,
  route: null,
  highlightDegenMode: false,
};

const useZapRawStore = create<ZapState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  setTtl: (value: number) => set({ ttl: value }),
  toggleSetting: (highlightDegenMode?: boolean) => {
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
  setBuildData: (buildData: BuildDataWithGas | undefined) => set({ buildData }),
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),
  setTickLower: (tickLower: number) => set({ tickLower }),
  setTickUpper: (tickUpper: number) => set({ tickUpper }),
  fetchZapRoute: async (chainId: ChainId, client: string, account: string) => {
    const { liquidityOut, tickLower: lower, tickUpper: upper, slippage } = get();
    const { sourcePool, targetPool } = usePoolRawStore.getState();
    const { sourcePosition, targetPosition, sourcePositionId, targetPositionId } = usePositionRawStore.getState();

    const isToUniV3 = targetPool && univ3Types.includes(targetPool.poolType as any);

    let tickLower = lower,
      tickUpper = upper;
    if (targetPosition && isToUniV3) {
      tickLower = (targetPosition as UniV3Position).tickLower;
      tickUpper = (targetPosition as UniV3Position).tickUpper;
    }

    if (
      !sourcePool ||
      !targetPool ||
      !sourcePosition ||
      (!targetPosition && targetPositionId) ||
      liquidityOut === 0n ||
      (isToUniV3 ? tickLower === null || tickUpper === null || tickLower >= tickUpper : false)
    ) {
      set({ route: null });
      return;
    }

    set({ fetchingRoute: true });

    const params: {
      [key: string]: string | number | boolean | undefined | null;
    } = {
      slippage,
      dexFrom: sourcePool.poolType,
      'poolFrom.id': sourcePool.address,
      'positionFrom.id': sourcePositionId,
      liquidityOut: liquidityOut.toString(),
      dexTo: targetPool.poolType,
      'poolTo.id': targetPool.address,

      ...(!isToUniV3 ? { 'positionTo.id': account } : {}),

      ...(targetPositionId
        ? {
            'positionTo.id': targetPositionId,
          }
        : isToUniV3
          ? {
              'positionTo.tickLower': tickLower,
              'positionTo.tickUpper': tickUpper,
            }
          : {}),
    };
    let tmp = '';
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) tmp = `${tmp}&${key}=${params[key]}`;
    });

    try {
      const res = await fetch(
        `${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/migrate/route?${tmp.slice(1)}`,
        {
          headers: {
            'x-client-id': client,
          },
        },
      ).then(res => res.json());

      set({ route: res.data, fetchingRoute: false });
    } catch (e) {
      console.log(e);
      set({ fetchingRoute: false, route: null });
    }
  },
}));

type ZapStoreKeys = keyof ReturnType<typeof useZapRawStore.getState>;

export const useZapStore = <K extends ZapStoreKeys>(keys: K[]) => {
  return useZapRawStore(
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
