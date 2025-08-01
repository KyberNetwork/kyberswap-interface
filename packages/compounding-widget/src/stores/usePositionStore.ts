import { create } from 'zustand';

import { Pool, PoolType, Position, univ3PoolNormalize } from '@kyber/schema';
import { getUniv3PositionInfo } from '@kyber/utils';

interface PositionState {
  positionError: string;
  position: 'loading' | Position | null;
  getPosition: (props: getPositionProps) => void;
  reset: () => void;
}

const initState: Omit<PositionState, 'getPosition' | 'reset'> = {
  position: 'loading',
  positionError: '',
};

interface getPositionProps {
  chainId: number;
  positionId: string;
  poolType: PoolType;
  pool: Pool;
}

export const usePositionStore = create<PositionState>((set, _get) => ({
  ...initState,
  reset: () => set(initState),
  getPosition: async ({ pool, positionId, chainId, poolType }: getPositionProps) => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);

    if (isUniV3) {
      const positionInfo = await getUniv3PositionInfo({
        poolType,
        positionId,
        chainId,
        tickCurrent: univ3PoolInfo.tick,
        sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
      });

      if (positionInfo.error) set({ positionError: positionInfo.error });
      else set({ position: positionInfo.position as Position });

      return;
    }

    set({ positionError: 'Invalid pool type' });
  },
}));
