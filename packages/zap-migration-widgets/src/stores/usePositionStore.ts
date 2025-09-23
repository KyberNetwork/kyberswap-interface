import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { Pool, Position, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema';
import { POOL_ERROR, getUniv2PositionInfo, getUniv3PositionInfo } from '@kyber/utils';

interface getPositionProps {
  chainId: number;
  positionId: string;
  pool: Pool;
}

interface PositionState {
  error: string;
  sourcePositionLoading: boolean;
  targetPositionLoading: boolean;
  sourcePositionId: string;
  targetPositionId?: string;
  sourcePosition: Position | null;
  targetPosition: Position | null;
  getSourcePositions: (props: getPositionProps) => void;
  getTargetPosition: (props: getPositionProps) => void;
  setSourcePositionId: (positionId: string) => void;
  setTargetPositionId: (positionId: string) => void;
  reset: () => void;
}

const initState: Omit<
  PositionState,
  'getSourcePositions' | 'getTargetPosition' | 'reset' | 'setSourcePositionId' | 'setTargetPositionId'
> = {
  error: '',
  sourcePositionLoading: false,
  targetPositionLoading: false,
  sourcePositionId: '',
  targetPositionId: undefined,
  sourcePosition: null,
  targetPosition: null,
};

export const usePositionRawStore = create<PositionState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  getSourcePositions: async ({ chainId, positionId, pool }: getPositionProps) => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: univ2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    set({ sourcePositionLoading: true });

    if (isUniV3) {
      const positionInfo = await getUniv3PositionInfo({
        poolType: pool.poolType,
        positionId,
        chainId,
        tickCurrent: univ3PoolInfo.tick,
        sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
      });

      if (positionInfo.error || !positionInfo.position) set({ error: positionInfo.error, sourcePosition: null });
      else set({ sourcePosition: positionInfo.position as Position });
      set({ sourcePositionLoading: false });

      return;
    }

    if (isUniV2) {
      const positionInfo = await getUniv2PositionInfo({
        poolType: pool.poolType,
        positionId,
        chainId,
        poolAddress: univ2PoolInfo.address,
        reserve0: univ2PoolInfo.reserves[0],
        reserve1: univ2PoolInfo.reserves[1],
      });

      if (positionInfo.error || !positionInfo.position) set({ error: positionInfo.error, sourcePosition: null });
      else set({ sourcePosition: positionInfo.position as Position });
      set({ sourcePositionLoading: false });

      return;
    }

    set({ error: POOL_ERROR.INVALID_POOL_TYPE, sourcePositionLoading: false });
  },
  getTargetPosition: async ({ chainId, positionId, pool }: getPositionProps) => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: univ2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    set({ targetPositionLoading: true });

    if (isUniV3) {
      const positionInfo = await getUniv3PositionInfo({
        poolType: pool.poolType,
        positionId,
        chainId,
        tickCurrent: univ3PoolInfo.tick,
        sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
      });

      if (positionInfo.error || !positionInfo.position) set({ error: positionInfo.error, targetPosition: null });
      else set({ targetPosition: positionInfo.position as Position });
      set({ targetPositionLoading: false });

      return;
    }

    if (isUniV2) {
      const positionInfo = await getUniv2PositionInfo({
        poolType: pool.poolType,
        positionId,
        chainId,
        poolAddress: univ2PoolInfo.address,
        reserve0: univ2PoolInfo.reserves[0],
        reserve1: univ2PoolInfo.reserves[1],
      });

      if (positionInfo.error || !positionInfo.position) set({ error: positionInfo.error, targetPosition: null });
      else set({ targetPosition: positionInfo.position as Position });
      set({ targetPositionLoading: false });

      return;
    }

    set({ error: POOL_ERROR.INVALID_POOL_TYPE, targetPositionLoading: false });
  },
  setSourcePositionId: (positionId: string) => set({ sourcePositionId: positionId }),
  setTargetPositionId: (positionId: string) => set({ targetPositionId: positionId }),
}));

type PositionStoreKeys = keyof ReturnType<typeof usePositionRawStore.getState>;

export const usePositionStore = <K extends PositionStoreKeys>(keys: K[]) => {
  return usePositionRawStore(
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
