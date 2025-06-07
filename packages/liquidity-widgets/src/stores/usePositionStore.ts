import { create } from 'zustand';

import { Pool, PoolType, Position, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema';
import { getUniv2PositionInfo, getUniv3PositionInfo } from '@kyber/utils';

interface PositionState {
  positionError: string;
  positionId: string | undefined;
  position: 'loading' | Position | null;
  firstLoad: boolean;
  getPosition: (props: getPositionProps) => void;
  reset: () => void;
}

const initState: Omit<PositionState, 'getPosition' | 'reset'> = {
  position: 'loading',
  positionId: undefined,
  positionError: '',
  firstLoad: true,
};

interface getPositionProps {
  positionId: string | undefined;
  chainId: number;
  poolType: PoolType;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  pool: Pool;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  setPositionId: (positionId: string) => set({ positionId }),
  getPosition: async ({ pool, positionId, chainId, poolType, connectedAccount }: getPositionProps) => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: univ2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    const { firstLoad } = get();

    if (isUniV3) {
      if (!positionId) set({ position: null });
      else {
        const positionInfo = await getUniv3PositionInfo({
          poolType,
          positionId,
          chainId,
          tickCurrent: univ3PoolInfo.tick,
          sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
        });

        if (positionInfo.error) set({ positionError: positionInfo.error });
        else set({ position: positionInfo.position as Position });
      }

      return;
    }

    if (isUniV2) {
      if (positionId || (firstLoad && connectedAccount.address)) {
        const posId = positionId || connectedAccount.address || '';
        const positionInfo = await getUniv2PositionInfo({
          poolType,
          positionId: posId,
          chainId,
          poolAddress: univ2PoolInfo.address,
          reserve0: univ2PoolInfo.reserves[0],
          reserve1: univ2PoolInfo.reserves[1],
        });

        if (positionInfo.error) {
          set({ positionError: positionInfo.error });
          return;
        }

        set({ position: positionInfo.position as Position });
        if (!positionId && connectedAccount.address) set({ positionId: connectedAccount.address });
      }

      return;
    }

    set({ positionError: 'Invalid pool type' });
  },
}));
