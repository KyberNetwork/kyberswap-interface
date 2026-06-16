import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema';
import { POOL_ERROR, getPoolInfo, getPoolPrice } from '@kyber/utils';

interface PoolState {
  loading: boolean;
  error: string;
  sourcePool: Pool | null;
  targetPool: Pool | null;
  targetPoolPrice: number | null;
  revertPrice: boolean;
  toggleRevertPrice: () => void;
  getPools: (props: getPoolsProps) => void;
  reset: () => void;
}

interface getPoolsProps {
  chainId: ChainId;
  rePositionMode?: boolean;
  initialRevertPrice?: boolean;
  source: {
    poolAddress: string;
    poolType: PoolType;
  };
  target?: {
    poolAddress: string;
    poolType: PoolType;
  };
}

const getDefaultRevertPrice = ({ pool, chainId }: { pool: Pool | null; chainId: ChainId }) => {
  if (!pool) return false;

  const token0Address = pool.token0.address.toLowerCase();
  const wrappedNativeAddress = NETWORKS_INFO[chainId]?.wrappedToken.address.toLowerCase();
  const isToken0Native = token0Address === wrappedNativeAddress || token0Address === NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isToken0Stable = pool.token0.isStable;
  const isToken1Stable = pool.token1.isStable;

  return Boolean(isToken0Stable || (isToken0Native && !isToken1Stable));
};

const initState: Omit<PoolState, 'getPools' | 'toggleRevertPrice' | 'reset'> = {
  loading: false,
  error: '',
  sourcePool: null,
  targetPool: null,
  targetPoolPrice: null,
  revertPrice: false,
};

export const usePoolRawStore = create<PoolState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  getPools: async ({ chainId, source, target, rePositionMode, initialRevertPrice }: getPoolsProps) => {
    if (!target && !rePositionMode) {
      set({ error: POOL_ERROR.MISSING_TARGET_POOL });
      return;
    }

    set({ loading: true });

    const sourcePoolInfo = await getPoolInfo({ poolAddress: source.poolAddress, poolType: source.poolType, chainId });
    if (
      (sourcePoolInfo.error && !sourcePoolInfo.error.includes(POOL_ERROR.CANT_GET_POOL_INFO)) ||
      !sourcePoolInfo.pool
    ) {
      set({ error: sourcePoolInfo.error });
      return;
    }
    set({ sourcePool: sourcePoolInfo.pool as Pool });

    let targetPool = null;
    if (rePositionMode) {
      targetPool = sourcePoolInfo.pool as Pool;
    } else if (target) {
      const targetPoolInfo = await getPoolInfo({ poolAddress: target.poolAddress, poolType: target.poolType, chainId });
      if (
        (targetPoolInfo.error && !targetPoolInfo.error.includes(POOL_ERROR.CANT_GET_POOL_INFO)) ||
        !targetPoolInfo.pool
      ) {
        set({ error: targetPoolInfo.error });
        return;
      }
      targetPool = targetPoolInfo.pool as Pool;
    }

    if (targetPool) {
      const currentState = get();
      const isSameTargetPool = currentState.targetPool?.address.toLowerCase() === targetPool.address.toLowerCase();
      const revertPrice = isSameTargetPool
        ? currentState.revertPrice
        : (initialRevertPrice ?? getDefaultRevertPrice({ pool: targetPool, chainId }));
      const price = getPoolPrice({ pool: targetPool, revertPrice });
      set({ targetPool, revertPrice, targetPoolPrice: price });
    }

    set({ loading: false });
  },
  toggleRevertPrice: () => {
    set(state => ({ revertPrice: !state.revertPrice }));

    const { targetPool, revertPrice } = get();
    if (!targetPool) return;
    const price = getPoolPrice({ pool: targetPool, revertPrice });
    if (price !== null) set({ targetPoolPrice: price });
  },
}));

type PoolStoreKeys = keyof ReturnType<typeof usePoolRawStore.getState>;

export const usePoolStore = <K extends PoolStoreKeys>(keys: K[]) => {
  return usePoolRawStore(
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
